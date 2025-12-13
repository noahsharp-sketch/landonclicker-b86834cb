import { useState, useEffect, useRef, useCallback } from 'react';
import {
  initialUpgrades,
  initialSkillTree,
  initialAscensionTree,
  createInitialAchievements
} from '../data/gameData';
import {
  createInitialQuestState,
  createDailyChallenges,
  createWeeklyChallenges
} from '../data/questData';
import {
  calculateClickPower,
  calculateCPS,
  calculatePrestigeGain,
  calculateAscensionGain
} from '../utils/calculations';
import { buyUpgrade as buyUpgradeAction } from '../utils/actions';
import { GameState, LeaderboardEntry } from '../types/types';

const STORAGE_KEY = 'landon-clicker-save';

/* ---------------- Merge helpers ---------------- */
function mergeArrayById<T extends { id: string }>(saved: T[], fresh: T[]) {
  const map = new Map<string, T>();
  saved.forEach(i => map.set(i.id, i));
  fresh.forEach(i => { if (!map.has(i.id)) map.set(i.id, i); });
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

  /* ---------------- Update Quest Progress ---------------- */
  const updateQuestProgress = useCallback((state: GameState, type: string, delta: number): GameState => {
    const totalUpgrades = state.upgrades.reduce((sum, u) => sum + u.owned, 0);

    const newQuests = state.questState.quests.map(quest => {
      if (quest.completed) return quest;
      const newSteps = quest.steps.map((step, idx) => {
        let current = step.current;
        switch (step.type) {
          case 'clicks': current = state.clicks; break;
          case 'lifetimeClicks': current = state.lifetimeClicks; break;
          case 'cps': current = state.cps; break;
          case 'upgrades': current = totalUpgrades; break;
          case 'prestiges': current = state.totalPrestiges; break;
          case 'clickPower': current = state.clickPower; break;
        }
        return { ...step, current };
      });

      let currentStep = 0;
      while (currentStep < newSteps.length && newSteps[currentStep].current >= newSteps[currentStep].target) {
        currentStep++;
      }

      return {
        ...quest,
        steps: newSteps,
        currentStep,
        completed: currentStep >= newSteps.length
      };
    });

    const newChallenges = state.questState.challenges.map(challenge => {
      if (challenge.completed) return challenge;
      let current = 0;
      switch (challenge.conditionType) {
        case 'clicks': current = state.clicks; break;
        case 'lifetimeClicks': current = state.lifetimeClicks; break;
        case 'cps': current = state.cps; break;
        case 'upgrades': current = totalUpgrades; break;
        case 'prestiges': current = state.totalPrestiges; break;
      }
      return { ...challenge, current, completed: current >= challenge.target };
    });

    return { ...state, questState: { ...state.questState, quests: newQuests, challenges: newChallenges } };
  }, []);

  /* ---------------- Load saved state ---------------- */
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

      // Recalculate quest progress on load
      loadedState = updateQuestProgress(loadedState, 'clicks', 0);

      return loadedState;
    } catch {
      return getInitialState();
    }
  });

  /* ---------------- Offline Earnings ---------------- */
  const [offlineEarnings, setOfflineEarnings] = useState<number | null>(null);
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return;
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
  }, []);

  /* ---------------- Core Actions ---------------- */
  const handleClick = useCallback(() => {
    setGameState(prev => {
      let newState = {
        ...prev,
        clicks: prev.clicks + prev.clickPower,
        lifetimeClicks: prev.lifetimeClicks + prev.clickPower,
        stats: { ...prev.stats, totalClicks: prev.stats.totalClicks + 1 },
      };
      newState = updateQuestProgress(newState, 'clicks', prev.clickPower);
      return newState;
    });
  }, [updateQuestProgress]);

  const buyUpgrade = useCallback((id: string) => {
    setGameState(prev => {
      const newState = buyUpgradeAction(prev, id);
      return updateQuestProgress(newState, 'upgrades', 0);
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
        const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, owned));
        if (clicks < cost) break;
        clicks -= cost;
        owned++;
        bought++;
      }

      if (bought === 0) return prev;

      let newState: GameState = { ...prev, upgrades: prev.upgrades.map(u => u.id === id ? { ...u, owned } : u), clicks };
      newState.clickPower = calculateClickPower(newState);
      newState.cps = calculateCPS(newState);

      // ✅ Update quest progress for bulk upgrade
      newState = updateQuestProgress(newState, 'upgrades', bought);

      return newState;
    });
  }, [updateQuestProgress]);

  const prestige = useCallback(() => {
    setGameState(prev => {
      const gain = calculatePrestigeGain(prev);
      if (gain <= 0) return prev;
      let newState = { ...getInitialState(), prestigePoints: prev.prestigePoints + gain, totalPrestigePoints: prev.totalPrestigePoints + gain, totalPrestiges: prev.totalPrestiges + 1, skillTree: prev.skillTree, ascensionTree: prev.ascensionTree };
      newState = updateQuestProgress(newState, 'prestiges', gain);
      return newState;
    });
  }, [updateQuestProgress]);

  const ascend = useCallback(() => {
    setGameState(prev => {
      const gain = calculateAscensionGain(prev);
      if (gain <= 0) return prev;
      let newState = { ...getInitialState(), ascensionPoints: prev.ascensionPoints + gain, totalAscensionPoints: prev.totalAscensionPoints + gain };
      return newState;
    });
  }, []);

  /* ---------------- Claim Rewards ---------------- */
  const claimQuestReward = useCallback((questId: string) => {
    setGameState(prev => {
      const quest = prev.questState.quests.find(q => q.id === questId);
      if (!quest || !quest.completed || quest.claimed) return prev;
      const newQuests = prev.questState.quests.map(q => q.id === questId ? { ...q, claimed: true } : q);
      return { ...prev, clicks: prev.clicks + (quest.rewards.clicks || 0), prestigePoints: prev.prestigePoints + (quest.rewards.prestigePoints || 0), ascensionPoints: prev.ascensionPoints + (quest.rewards.ascensionPoints || 0), questState: { ...prev.questState, quests: newQuests } };
    });
  }, []);

  const claimChallengeReward = useCallback((challengeId: string) => {
    setGameState(prev => {
      const challenge = prev.questState.challenges.find(c => c.id === challengeId);
      if (!challenge || !challenge.completed || challenge.claimed) return prev;
      const newChallenges = prev.questState.challenges.map(c => c.id === challengeId ? { ...c, claimed: true } : c);
      return { ...prev, clicks: prev.clicks + (challenge.rewards.clicks || 0), prestigePoints: prev.prestigePoints + (challenge.rewards.prestigePoints || 0), questState: { ...prev.questState, challenges: newChallenges } };
    });
  }, []);

  const addLeaderboardScore = useCallback((name: string, type: LeaderboardEntry['type']) => {
    setGameState(prev => {
      const score = type === 'lifetime' ? prev.lifetimeClicks : type === 'cps' ? prev.cps : prev.totalPrestiges;
      const newEntry: LeaderboardEntry = { id: `${Date.now()}-${Math.random().toString(36).substr(2,9)}`, name, score, date: Date.now(), type };
      const newLeaderboard = [...prev.questState.leaderboard, newEntry].sort((a,b) => b.score - a.score).slice(0,50);
      return { ...prev, questState: { ...prev.questState, leaderboard: newLeaderboard } };
    });
  }, []);

  /* ---------------- Auto Clicker + Stats ---------------- */
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      setGameState(prev => {
        let newState = { ...prev };
        newState.clicks += prev.cps * delta;
        newState.lifetimeClicks += prev.cps * delta;
        newState.stats.totalPlaytime += delta;
        newState.stats.bestCPS = Math.max(prev.stats.bestCPS, prev.cps);

        // ✅ Update quest progress from auto-click
        newState = updateQuestProgress(newState, 'clicks', prev.cps * delta);
        newState = updateQuestProgress(newState, 'lifetimeClicks', prev.cps * delta);

        return newState;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [updateQuestProgress]);

  /* ---------------- Auto-save ---------------- */
  useEffect(() => {
    const interval = setInterval(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...gameState, stats: { ...gameState.stats, lastOnlineTime: Date.now() } }));
    }, 30000);
    return () => clearInterval(interval);
  }, [gameState]);

  return {
    gameState,
    handleClick,
    buyUpgrade,
    buyUpgradeBulk,
    prestige,
    ascend,
    claimQuestReward,
    claimChallengeReward,
    addLeaderboardScore,
    offlineEarnings,
  };
}
