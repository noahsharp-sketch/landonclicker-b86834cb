import { useState, useEffect, useRef, useCallback } from 'react';
import {
  initialUpgrades,
  initialSkillTree,
  initialAscensionTree,
  initialTranscendenceTree,
  initialEternityTree,
  createInitialAchievements,
} from '../data/gameData';
import { createInitialQuestState, createDailyChallenges, createWeeklyChallenges } from '../data/questData';
import { calculateClickPower, calculateCPS, calculatePrestigeGain, calculateAscensionGain, calculateTranscendenceGain, calculateEternityGain } from '../utils/calculations';
import { buyUpgrade as buyUpgradeAction } from '../utils/actions';
import { GameState, LeaderboardEntry } from '../types/types';

const STORAGE_KEY = 'landon-clicker-save';

/* ---------------- Merge Helpers ---------------- */
function mergeArrayById<T extends { id: string }>(saved: T[], fresh: T[]) {
  const map = new Map<string, T>();
  saved.forEach(i => map.set(i.id, i));
  fresh.forEach(i => {
    if (!map.has(i.id)) map.set(i.id, i);
  });
  return Array.from(map.values());
}

function mergeAchievements(saved: any[], fresh: ReturnType<typeof createInitialAchievements>) {
  return fresh.map(freshAch => {
    const savedAch = saved.find(s => s.id === freshAch.id);
    return savedAch ? { ...freshAch, unlocked: savedAch.unlocked } : freshAch;
  });
}

/* ---------------- Hook ---------------- */
export function useGameState() {
  const lastTickRef = useRef(Date.now());

  const getInitialState = (): GameState => ({
    clicks: 0,
    lifetimeClicks: 0,
    clickPower: 1,
    cps: 0,
    prestigePoints: 0,
    totalPrestigePoints: 0,
    ascensionPoints: 0,
    totalAscensionPoints: 0,
    transcendencePoints: 0,
    totalTranscendencePoints: 0,
    eternityPoints: 0,
    totalEternityPoints: 0,
    totalPrestiges: 0,
    totalAscensions: 0,
    totalTranscendences: 0,
    totalEternities: 0,
    upgrades: initialUpgrades,
    skillTree: initialSkillTree,
    ascensionTree: initialAscensionTree,
    transcendenceTree: initialTranscendenceTree,
    eternityTree: initialEternityTree,
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

  /* ---------------- Update Quest Progress ---------------- */
  const updateQuestProgress = useCallback((state: GameState, type: string, amount: number) => {
    const totalUpgrades = state.upgrades.reduce((sum, u) => sum + u.owned, 0);

    const newQuests = state.questState.quests.map(quest => {
      if (quest.completed) return quest;

      const updatedSteps = quest.steps.map((step, idx) => {
        if (step.type === type || (step.type === 'upgrades' && type === 'upgrades')) {
          const newCurrent = step.current + amount;
          return { ...step, current: newCurrent };
        }
        return step;
      });

      let currentStep = quest.currentStep;
      while (currentStep < updatedSteps.length && updatedSteps[currentStep].current >= updatedSteps[currentStep].target) {
        currentStep++;
      }
      const completed = currentStep >= updatedSteps.length;

      return { ...quest, steps: updatedSteps, currentStep, completed };
    });

    const newChallenges = state.questState.challenges.map(challenge => {
      if (challenge.completed || challenge.claimed) return challenge;

      let current = 0;
      switch (challenge.conditionType) {
        case 'clicks': current = state.clicks; break;
        case 'lifetimeClicks': current = state.lifetimeClicks; break;
        case 'cps': current = state.cps; break;
        case 'upgrades': current = totalUpgrades; break;
        case 'prestiges': current = state.totalPrestiges; break;
      }

      const completed = current >= challenge.target;
      return { ...challenge, current, completed };
    });

    return { ...state, questState: { ...state.questState, quests: newQuests, challenges: newChallenges } };
  }, []);

  /* ---------------- Load Game State ---------------- */
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
        transcendenceTree: mergeArrayById(parsed.transcendenceTree || [], fresh.transcendenceTree),
        eternityTree: mergeArrayById(parsed.eternityTree || [], fresh.eternityTree),
        achievements: mergeAchievements(parsed.achievements || [], fresh.achievements),
        questState: {
          ...fresh.questState,
          ...parsed.questState,
          quests: mergeArrayById(parsed.questState?.quests || [], fresh.questState.quests),
          challenges: parsed.questState?.challenges || fresh.questState.challenges,
          leaderboard: parsed.questState?.leaderboard || [],
        },
        stats: { ...fresh.stats, ...parsed.stats },
      };

      // Offline progress
      const now = Date.now();
      const offlineSeconds = Math.min((now - loadedState.stats.lastOnlineTime) / 1000, 86400);
      if (offlineSeconds > 10 && loadedState.cps > 0) {
        const offlineGain = loadedState.cps * offlineSeconds * 0.5;
        loadedState.clicks += offlineGain;
        loadedState.lifetimeClicks += offlineGain;
      }

      return loadedState;
    } catch {
      return getInitialState();
    }
  });

  const [offlineEarnings, setOfflineEarnings] = useState<number | null>(null);

  /* ---------------- Core Actions ---------------- */
  const handleClick = useCallback(() => {
    setGameState(prev => {
      let newState = {
        ...prev,
        clicks: prev.clicks + prev.clickPower,
        lifetimeClicks: prev.lifetimeClicks + prev.clickPower,
        stats: { ...prev.stats, totalClicks: prev.stats.totalClicks + 1 },
      };
      newState = updateQuestProgress(newState, 'clicks', newState.clickPower);
      return newState;
    });
  }, [updateQuestProgress]);

  const buyUpgrade = useCallback((id: string) => {
    setGameState(prev => {
      let newState = buyUpgradeAction(prev, id);
      newState = updateQuestProgress(newState, 'upgrades', 1);
      return newState;
    });
  }, [updateQuestProgress]);

  const buyUpgradeBulk = useCallback((id: string, amount: number | "MAX") => {
    setGameState(prev => {
      const upgrade = prev.upgrades.find(u => u.id === id);
      if (!upgrade) return prev;

      let clicks = prev.clicks;
      let owned = upgrade.owned;
      let toBuy = amount === "MAX" ? Infinity : amount;
      let bought = 0;

      while (bought < toBuy) {
        const nextCost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, owned));
        if (clicks < nextCost) break;
        clicks -= nextCost;
        owned++;
        bought++;
      }

      if (bought === 0) return prev;

      let newState: GameState = {
        ...prev,
        upgrades: prev.upgrades.map(u => u.id === id ? { ...u, owned } : u),
        clicks,
      };
      newState.clickPower = calculateClickPower(newState);
      newState.cps = calculateCPS(newState);
      newState = updateQuestProgress(newState, 'upgrades', bought);
      return newState;
    });
  }, [updateQuestProgress]);

  const buySkillNode = useCallback((id: string) => {
    setGameState(prev => {
      const node = prev.skillTree.find(n => n.id === id);
      if (!node || node.owned || prev.prestigePoints < node.cost) return prev;

      const newSkillTree = prev.skillTree.map(n => n.id === id ? { ...n, owned: true } : n);
      let newState: GameState = { ...prev, skillTree: newSkillTree, prestigePoints: prev.prestigePoints - node.cost };
      newState.clickPower = calculateClickPower(newState);
      newState.cps = calculateCPS(newState);
      return updateQuestProgress(newState, 'skillNode', 1);
    });
  }, [updateQuestProgress]);

  const buyAscensionNode = useCallback((id: string) => {
    setGameState(prev => {
      const node = prev.ascensionTree.find(n => n.id === id);
      if (!node || node.owned || prev.ascensionPoints < node.cost) return prev;

      const newAscTree = prev.ascensionTree.map(n => n.id === id ? { ...n, owned: true } : n);
      let newState: GameState = { ...prev, ascensionTree: newAscTree, ascensionPoints: prev.ascensionPoints - node.cost };
      newState.clickPower = calculateClickPower(newState);
      newState.cps = calculateCPS(newState);
      return updateQuestProgress(newState, 'ascensionNode', 1);
    });
  }, [updateQuestProgress]);

  const buyTranscendenceNode = useCallback((id: string) => {
    setGameState(prev => {
      const node = prev.transcendenceTree.find(n => n.id === id);
      if (!node || node.owned || prev.transcendencePoints < node.cost) return prev;

      const newTree = prev.transcendenceTree.map(n => n.id === id ? { ...n, owned: true } : n);
      let newState: GameState = { ...prev, transcendenceTree: newTree, transcendencePoints: prev.transcendencePoints - node.cost };
      newState.clickPower = calculateClickPower(newState);
      newState.cps = calculateCPS(newState);
      return updateQuestProgress(newState, 'transcendenceNode', 1);
    });
  }, [updateQuestProgress]);

  const buyEternityNode = useCallback((id: string) => {
    setGameState(prev => {
      const node = prev.eternityTree.find(n => n.id === id);
      if (!node || node.owned || prev.eternityPoints < node.cost) return prev;

      const newTree = prev.eternityTree.map(n => n.id === id ? { ...n, owned: true } : n);
      let newState: GameState = { ...prev, eternityTree: newTree, eternityPoints: prev.eternityPoints - node.cost };
      newState.clickPower = calculateClickPower(newState);
      newState.cps = calculateCPS(newState);
      return updateQuestProgress(newState, 'eternityNode', 1);
    });
  }, [updateQuestProgress]);

  const prestige = useCallback(() => {
    setGameState(prev => {
      const gain = calculatePrestigeGain(prev);
      if (gain <= 0) return prev;

      const newState: GameState = {
        ...getInitialState(),
        clicks: 0,
        prestigePoints: prev.prestigePoints + gain,
        totalPrestigePoints: prev.totalPrestigePoints + gain,
        totalPrestiges: prev.totalPrestiges + 1,
        skillTree: prev.skillTree,
        ascensionTree: prev.ascensionTree,
        transcendenceTree: prev.transcendenceTree,
        eternityTree: prev.eternityTree,
        achievements: prev.achievements,
        questState: prev.questState,
      };

      newState.clickPower = calculateClickPower(newState);
      newState.cps = calculateCPS(newState);
      return updateQuestProgress(newState, 'prestiges', gain);
    });
  }, [updateQuestProgress]);

  const ascend = useCallback(() => {
    setGameState(prev => {
      const gain = calculateAscensionGain(prev);
      if (gain <= 0) return prev;

      const newState: GameState = {
        ...getInitialState(),
        ascensionPoints: prev.ascensionPoints + gain,
        totalAscensionPoints: prev.totalAscensionPoints + gain,
        totalAscensions: prev.totalAscensions + 1,
        skillTree: prev.skillTree,
        ascensionTree: prev.ascensionTree,
        transcendenceTree: prev.transcendenceTree,
        eternityTree: prev.eternityTree,
        achievements: prev.achievements,
        questState: prev.questState,
      };

      newState.clickPower = calculateClickPower(newState);
      newState.cps = calculateCPS(newState);
      return updateQuestProgress(newState, 'ascensions', gain);
    });
  }, [updateQuestProgress]);

  const transcend = useCallback(() => {
    setGameState(prev => {
      const gain = calculateTranscendenceGain(prev);
      if (gain <= 0) return prev;

      const newState: GameState = {
        ...getInitialState(),
        transcendencePoints: prev.transcendencePoints + gain,
        totalTranscendencePoints: prev.totalTranscendencePoints + gain,
        totalTranscendences: prev.totalTranscendences + 1,
        skillTree: prev.skillTree,
        ascensionTree: prev.ascensionTree,
        transcendenceTree: prev.transcendenceTree,
        eternityTree: prev.eternityTree,
        achievements: prev.achievements,
        questState: prev.questState,
      };

      newState.clickPower = calculateClickPower(newState);
      newState.cps = calculateCPS(newState);
      return updateQuestProgress(newState, 'transcendences', gain);
    });
  }, [updateQuestProgress]);

  const enterEternity = useCallback(() => {
    setGameState(prev => {
      const gain = calculateEternityGain(prev);
      if (gain <= 0) return prev;

      const newState: GameState = {
        ...getInitialState(),
        eternityPoints: prev.eternityPoints + gain,
        totalEternityPoints: prev.totalEternityPoints + gain,
        totalEternities: prev.totalEternities + 1,
        skillTree: prev.skillTree,
        ascensionTree: prev.ascensionTree,
        transcendenceTree: prev.transcendenceTree,
        eternityTree: prev.eternityTree,
        achievements: prev.achievements,
        questState: prev.questState,
      };

      newState.clickPower = calculateClickPower(newState);
      newState.cps = calculateCPS(newState);
      return updateQuestProgress(newState, 'eternities', gain);
    });
  }, [updateQuestProgress]);

  /* ---------- Quest / Challenge Rewards ---------- */
  const claimQuestReward = useCallback((questId: string) => {
    setGameState(prev => {
      const quest = prev.questState.quests.find(q => q.id === questId);
      if (!quest || !quest.completed || quest.claimed) return prev;
      return {
        ...prev,
        clicks: prev.clicks + (quest.rewards.clicks || 0),
        prestigePoints: prev.prestigePoints + (quest.rewards.prestigePoints || 0),
        ascensionPoints: prev.ascensionPoints + (quest.rewards.ascensionPoints || 0),
        questState: {
          ...prev.questState,
          quests: prev.questState.quests.map(q => q.id === questId ? { ...q, claimed: true } : q),
        },
      };
    });
  }, []);

  const claimChallengeReward = useCallback((challengeId: string) => {
    setGameState(prev => {
      const challenge = prev.questState.challenges.find(c => c.id === challengeId);
      if (!challenge || !challenge.completed || challenge.claimed) return prev;
      return {
        ...prev,
        clicks: prev.clicks + (challenge.rewards.clicks || 0),
        prestigePoints: prev.prestigePoints + (challenge.rewards.prestigePoints || 0),
        questState: {
          ...prev.questState,
          challenges: prev.questState.challenges.map(c => c.id === challengeId ? { ...c, claimed: true } : c),
        },
      };
    });
  }, []);

  const addLeaderboardScore = useCallback((name: string, type: LeaderboardEntry['type']) => {
    setGameState(prev => {
      const score = type === 'lifetime' ? prev.lifetimeClicks : type === 'cps' ? prev.cps : prev.totalPrestiges;
      const newEntry: LeaderboardEntry = { id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`, name, score, date: Date.now(), type };
      const newLeaderboard = [...prev.questState.leaderboard, newEntry].sort((a, b) => b.score - a.score).slice(0, 50);
      return { ...prev, questState: { ...prev.questState, leaderboard: newLeaderboard } };
    });
  }, []);

  const resetGame = useCallback(() => {
    if (confirm('Are you sure you want to reset all progress?')) {
      localStorage.removeItem(STORAGE_KEY);
      setGameState(getInitialState());
    }
  }, []);

  const saveGame = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...gameState, stats: { ...gameState.stats, lastOnlineTime: Date.now() } }));
  }, [gameState]);

  /* ---------- Auto Clicker & Stats Loop ---------- */
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      setGameState(prev => {
        let newState = {
          ...prev,
          clicks: prev.clicks + prev.cps * delta,
          lifetimeClicks: prev.lifetimeClicks + prev.cps * delta,
          stats: { ...prev.stats, totalPlaytime: prev.stats.totalPlaytime + delta, lastOnlineTime: now, bestCPS: Math.max(prev.stats.bestCPS, prev.cps) },
        };
        newState = updateQuestProgress(newState, 'cps', 0);
        return newState;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [updateQuestProgress]);

  /* ---------- Auto Save ---------- */
  useEffect(() => {
    const interval = setInterval(() => saveGame(), 30000);
    return () => clearInterval(interval);
  }, [saveGame]);

  useEffect(() => {
    const handleUnload = () => saveGame();
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [saveGame]);

  return {
    gameState,
    handleClick,
    buyUpgrade,
    buyUpgradeBulk,
    buySkillNode,
    buyAscensionNode,
    buyTranscendenceNode,
    buyEternityNode,
    prestige,
    ascend,
    transcend,
    enterEternity,
    claimQuestReward,
    claimChallengeReward,
    addLeaderboardScore,
    resetGame,
    saveGame,
    offlineEarnings,
  };
}
