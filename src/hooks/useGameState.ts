import { useState, useEffect, useRef, useCallback } from 'react';
import { initialUpgrades, initialSkillTree, initialAscensionTree, createInitialAchievements } from '../data/gameData';
import { createInitialQuestState, createDailyChallenges, createWeeklyChallenges } from '../data/questData';
import { calculateClickPower, calculateCPS, calculatePrestigeGain, calculateAscensionGain } from '../utils/calculations';
import { buyUpgrade as buyUpgradeAction } from '../utils/actions';
import { GameState, LeaderboardEntry } from '../types/types';

const STORAGE_KEY = 'landon-clicker-save';

/* ---------------- Merge helper ---------------- */
function mergeArrayById<T extends { id: string }>(saved: T[], fresh: T[]) {
  const map = new Map<string, T>();
  saved.forEach(i => map.set(i.id, i));
  fresh.forEach(i => { if (!map.has(i.id)) map.set(i.id, i); });
  return Array.from(map.values());
}

/* Merge achievements while restoring condition functions */
function mergeAchievements(saved: any[], fresh: ReturnType<typeof createInitialAchievements>) {
  return fresh.map(freshAch => {
    const savedAch = saved.find(s => s.id === freshAch.id);
    return savedAch ? { ...freshAch, unlocked: savedAch.unlocked } : freshAch;
  });
}

/* ---------------- Hook ---------------- */
export function useGameState() {
  const lastTickRef = useRef(Date.now());

  /* ---------- Initial State ---------- */
  const getInitialState = (): GameState => ({
    clicks: 0,
    lifetimeClicks: 0,
    clickPower: 1,
    cps: 0,
    prestigePoints: 0,
    totalPrestigePoints: 0,
    ascensionPoints: 0,
    totalAscensionPoints: 0,
    totalPrestiges: 0,
    upgrades: initialUpgrades,
    skillTree: initialSkillTree,
    ascensionTree: initialAscensionTree,
    achievements: createInitialAchievements(),
    stats: {
      startTime: Date.now(),
      totalPlaytime: 0,
      bestCPS: 0,
      totalClicks: 0,
      cpsHistory: [],
      clicksHistory: [],
      lastOnlineTime: Date.now(),
    },
    questState: createInitialQuestState(),
  });

  /* ---------- Calculate offline progress ---------- */
  const calculateOfflineProgress = (state: GameState): GameState => {
    const now = Date.now();
    const lastOnline = state.stats.lastOnlineTime || now;
    const offlineSeconds = Math.min((now - lastOnline) / 1000, 86400);
    
    if (offlineSeconds < 10 || state.cps <= 0) {
      return { ...state, stats: { ...state.stats, lastOnlineTime: now } };
    }
    
    const offlineGain = state.cps * offlineSeconds * 0.5;
    
    return {
      ...state,
      clicks: state.clicks + offlineGain,
      lifetimeClicks: state.lifetimeClicks + offlineGain,
      stats: { ...state.stats, lastOnlineTime: now },
    };
  };

  /* ---------- Check and reset expired challenges ---------- */
  const resetExpiredChallenges = (state: GameState): GameState => {
    const now = Date.now();
    let needsReset = false;
    
    const challenges = state.questState.challenges.map(c => {
      if (now > c.expiresAt) {
        needsReset = true;
        return c;
      }
      return c;
    });

    if (!needsReset) return state;

    // Check if daily reset needed
    const dailyExpired = challenges.some(c => c.type === 'daily' && now > c.expiresAt);
    const weeklyExpired = challenges.some(c => c.type === 'weekly' && now > c.expiresAt);

    let newChallenges = [...challenges];
    
    if (dailyExpired) {
      const freshDaily = createDailyChallenges();
      newChallenges = newChallenges.filter(c => c.type !== 'daily').concat(freshDaily);
    }
    
    if (weeklyExpired) {
      const freshWeekly = createWeeklyChallenges();
      newChallenges = newChallenges.filter(c => c.type !== 'weekly').concat(freshWeekly);
    }

    return {
      ...state,
      questState: {
        ...state.questState,
        challenges: newChallenges,
        lastDailyReset: dailyExpired ? now : state.questState.lastDailyReset,
        lastWeeklyReset: weeklyExpired ? now : state.questState.lastWeeklyReset,
      },
    };
  };

  /* ---------- Load saved state ---------- */
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return getInitialState();
    try {
      const parsed = JSON.parse(saved);
      const fresh = getInitialState();
      let loadedState: GameState = {
        ...fresh,
        ...parsed,
        upgrades: mergeArrayById(parsed.upgrades || [], fresh.upgrades),
        skillTree: mergeArrayById(parsed.skillTree || [], fresh.skillTree),
        ascensionTree: mergeArrayById(parsed.ascensionTree || [], fresh.ascensionTree),
        achievements: mergeAchievements(parsed.achievements || [], fresh.achievements),
        stats: { ...fresh.stats, ...parsed.stats },
        questState: {
          ...fresh.questState,
          ...parsed.questState,
          quests: mergeArrayById(parsed.questState?.quests || [], fresh.questState.quests),
          challenges: parsed.questState?.challenges || fresh.questState.challenges,
          leaderboard: parsed.questState?.leaderboard || [],
        },
      };
      
      loadedState = calculateOfflineProgress(loadedState);
      loadedState = resetExpiredChallenges(loadedState);
      
      return loadedState;
    } catch {
      return getInitialState();
    }
  });
  
  /* ---------- Show offline earnings notification ---------- */
  const [offlineEarnings, setOfflineEarnings] = useState<number | null>(null);
  
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const lastOnline = parsed.stats?.lastOnlineTime || Date.now();
        const offlineSeconds = (Date.now() - lastOnline) / 1000;
        const cps = parsed.cps || 0;
        
        if (offlineSeconds >= 10 && cps > 0) {
          const earnings = Math.min(offlineSeconds, 86400) * cps * 0.5;
          if (earnings > 0) {
            setOfflineEarnings(earnings);
            setTimeout(() => setOfflineEarnings(null), 5000);
          }
        }
      } catch {}
    }
  }, []);

  /* ---------- Game Actions ---------- */

  const handleClick = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      clicks: prev.clicks + prev.clickPower,
      lifetimeClicks: prev.lifetimeClicks + prev.clickPower,
      stats: { ...prev.stats, totalClicks: prev.stats.totalClicks + 1 },
    }));
  }, []);

  const buyUpgrade = useCallback((id: string) => {
    setGameState(prev => buyUpgradeAction(prev, id));
  }, []);

  const buySkillNode = useCallback((id: string) => {
    setGameState(prev => {
      const node = prev.skillTree.find(n => n.id === id);
      if (!node || node.owned || prev.prestigePoints < node.cost) return prev;
      const newSkillTree = prev.skillTree.map(n => n.id === id ? { ...n, owned: true } : n);
      const newState = { ...prev, skillTree: newSkillTree, prestigePoints: prev.prestigePoints - node.cost };
      return { ...newState, clickPower: calculateClickPower(newState), cps: calculateCPS(newState) };
    });
  }, []);

  const buyAscensionNode = useCallback((id: string) => {
    setGameState(prev => {
      const node = prev.ascensionTree.find(n => n.id === id);
      if (!node || node.owned || prev.ascensionPoints < node.cost) return prev;
      const newAscensionTree = prev.ascensionTree.map(n => n.id === id ? { ...n, owned: true } : n);
      const newState = { ...prev, ascensionTree: newAscensionTree, ascensionPoints: prev.ascensionPoints - node.cost };
      return { ...newState, clickPower: calculateClickPower(newState), cps: calculateCPS(newState) };
    });
  }, []);

  const getStartingClicks = useCallback((state: GameState): number => {
    let starting = 0;
    state.skillTree.filter(n => n.owned && n.type === 'startingClicks').forEach(n => starting += n.effect);
    state.ascensionTree.filter(n => n.owned && n.type === 'megaStart').forEach(n => starting += n.effect);
    return starting;
  }, []);

  const prestige = useCallback(() => {
    setGameState(prev => {
      const gain = calculatePrestigeGain(prev);
      if (gain <= 0) return prev;
      
      const startingClicks = getStartingClicks(prev);
      const newState: GameState = {
        ...prev,
        clicks: startingClicks,
        lifetimeClicks: 0,
        clickPower: 1,
        cps: 0,
        prestigePoints: prev.prestigePoints + gain,
        totalPrestigePoints: prev.totalPrestigePoints + gain,
        totalPrestiges: prev.totalPrestiges + 1,
        upgrades: initialUpgrades,
      };
      return { ...newState, clickPower: calculateClickPower(newState), cps: calculateCPS(newState) };
    });
  }, [getStartingClicks]);

  const ascend = useCallback(() => {
    setGameState(prev => {
      const gain = calculateAscensionGain(prev);
      if (gain <= 0) return prev;
      
      const newState: GameState = {
        ...prev,
        clicks: 0,
        lifetimeClicks: 0,
        clickPower: 1,
        cps: 0,
        prestigePoints: 0,
        totalPrestigePoints: 0,
        totalPrestiges: 0,
        ascensionPoints: prev.ascensionPoints + gain,
        totalAscensionPoints: prev.totalAscensionPoints + gain,
        upgrades: initialUpgrades,
        skillTree: initialSkillTree,
      };
      return { ...newState, clickPower: calculateClickPower(newState), cps: calculateCPS(newState) };
    });
  }, []);

  /* ---------- Quest & Challenge Actions ---------- */

  const claimQuestReward = useCallback((questId: string) => {
    setGameState(prev => {
      const quest = prev.questState.quests.find(q => q.id === questId);
      if (!quest || !quest.completed || quest.claimed) return prev;

      const newQuests = prev.questState.quests.map(q => 
        q.id === questId ? { ...q, claimed: true } : q
      );

      return {
        ...prev,
        clicks: prev.clicks + (quest.rewards.clicks || 0),
        prestigePoints: prev.prestigePoints + (quest.rewards.prestigePoints || 0),
        ascensionPoints: prev.ascensionPoints + (quest.rewards.ascensionPoints || 0),
        questState: { ...prev.questState, quests: newQuests },
      };
    });
  }, []);

  const claimChallengeReward = useCallback((challengeId: string) => {
    setGameState(prev => {
      const challenge = prev.questState.challenges.find(c => c.id === challengeId);
      if (!challenge || !challenge.completed || challenge.claimed) return prev;

      const newChallenges = prev.questState.challenges.map(c => 
        c.id === challengeId ? { ...c, claimed: true } : c
      );

      return {
        ...prev,
        clicks: prev.clicks + (challenge.rewards.clicks || 0),
        prestigePoints: prev.prestigePoints + (challenge.rewards.prestigePoints || 0),
        questState: { ...prev.questState, challenges: newChallenges },
      };
    });
  }, []);

  const addLeaderboardScore = useCallback((name: string, type: LeaderboardEntry['type']) => {
    setGameState(prev => {
      const score = type === 'lifetime' ? prev.lifetimeClicks :
                    type === 'cps' ? prev.cps :
                    prev.totalPrestiges;

      const newEntry: LeaderboardEntry = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name,
        score,
        date: Date.now(),
        type,
      };

      const newLeaderboard = [...prev.questState.leaderboard, newEntry]
        .sort((a, b) => b.score - a.score)
        .slice(0, 50);

      return {
        ...prev,
        questState: { ...prev.questState, leaderboard: newLeaderboard },
      };
    });
  }, []);

  const resetGame = useCallback(() => {
    if (confirm('Are you sure you want to reset all progress?')) {
      localStorage.removeItem(STORAGE_KEY);
      setGameState(getInitialState());
    }
  }, []);

  const saveGame = useCallback(() => {
    const stateToSave = { ...gameState, stats: { ...gameState.stats, lastOnlineTime: Date.now() } };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [gameState]);

  /* ---------- Update Quest & Challenge Progress ---------- */
  useEffect(() => {
    setGameState(prev => {
      const totalUpgrades = prev.upgrades.reduce((sum, u) => sum + u.owned, 0);
      
      // Update quests
      const newQuests = prev.questState.quests.map(quest => {
        if (quest.completed) return quest;

        const updatedSteps = quest.steps.map(step => {
          let current = 0;
          switch (step.type) {
            case 'clicks': current = prev.clicks; break;
            case 'lifetimeClicks': current = prev.lifetimeClicks; break;
            case 'cps': current = prev.cps; break;
            case 'upgrades': current = totalUpgrades; break;
            case 'prestiges': current = prev.totalPrestiges; break;
            case 'clickPower': current = prev.clickPower; break;
          }
          return { ...step, current };
        });

        let currentStep = quest.currentStep;
        while (currentStep < updatedSteps.length && updatedSteps[currentStep].current >= updatedSteps[currentStep].target) {
          currentStep++;
        }

        const completed = currentStep >= updatedSteps.length;

        return { ...quest, steps: updatedSteps, currentStep, completed };
      });

      // Update challenges
      const newChallenges = prev.questState.challenges.map(challenge => {
        if (challenge.completed || challenge.claimed) return challenge;

        let current = 0;
        switch (challenge.conditionType) {
          case 'clicks': current = prev.clicks; break;
          case 'lifetimeClicks': current = prev.lifetimeClicks; break;
          case 'cps': current = prev.cps; break;
          case 'upgrades': current = totalUpgrades; break;
          case 'prestiges': current = prev.totalPrestiges; break;
        }

        const completed = current >= challenge.target;
        return { ...challenge, current, completed };
      });

      const questsChanged = JSON.stringify(newQuests) !== JSON.stringify(prev.questState.quests);
      const challengesChanged = JSON.stringify(newChallenges) !== JSON.stringify(prev.questState.challenges);

      if (!questsChanged && !challengesChanged) return prev;

      return {
        ...prev,
        questState: { ...prev.questState, quests: newQuests, challenges: newChallenges },
      };
    });
  }, [gameState.clicks, gameState.lifetimeClicks, gameState.cps, gameState.totalPrestiges, gameState.clickPower, gameState.upgrades]);

  /* ---------- Check Achievements ---------- */
  useEffect(() => {
    setGameState(prev => {
      const newAchievements = prev.achievements.map(a => ({
        ...a,
        unlocked: a.unlocked || a.condition(prev),
      }));
      
      const hasChanges = newAchievements.some((a, i) => a.unlocked !== prev.achievements[i].unlocked);
      return hasChanges ? { ...prev, achievements: newAchievements } : prev;
    });
  }, [gameState.lifetimeClicks, gameState.totalPrestiges, gameState.cps, gameState.upgrades]);

  /* ---------- Auto Clicker + Stats ---------- */
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      setGameState(prev => {
        const newPlaytime = prev.stats.totalPlaytime + delta;
        const shouldRecordHistory = Math.floor(newPlaytime / 10) > Math.floor(prev.stats.totalPlaytime / 10);
        
        return {
          ...prev,
          clicks: prev.clicks + prev.cps * delta,
          lifetimeClicks: prev.lifetimeClicks + prev.cps * delta,
          stats: {
            ...prev.stats,
            totalPlaytime: newPlaytime,
            bestCPS: Math.max(prev.stats.bestCPS, prev.cps),
            lastOnlineTime: now,
            cpsHistory: shouldRecordHistory 
              ? [...prev.stats.cpsHistory.slice(-30), { time: now, cps: prev.cps }]
              : prev.stats.cpsHistory,
            clicksHistory: shouldRecordHistory
              ? [...prev.stats.clicksHistory.slice(-30), { time: now, clicks: prev.lifetimeClicks }]
              : prev.stats.clicksHistory,
          },
        };
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  /* ---------- Auto Save ---------- */
  useEffect(() => {
    const interval = setInterval(() => {
      const stateToSave = { ...gameState, stats: { ...gameState.stats, lastOnlineTime: Date.now() } };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }, 30000);
    return () => clearInterval(interval);
  }, [gameState]);

  /* ---------- Save on page unload ---------- */
  useEffect(() => {
    const handleUnload = () => {
      const stateToSave = { ...gameState, stats: { ...gameState.stats, lastOnlineTime: Date.now() } };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [gameState]);

  return {
    gameState,
    handleClick,
    buyUpgrade,
    buySkillNode,
    buyAscensionNode,
    prestige,
    ascend,
    saveGame,
    resetGame,
    offlineEarnings,
    claimQuestReward,
    claimChallengeReward,
    addLeaderboardScore,
  };
}
