import { useState, useEffect, useCallback, useRef } from 'react';
import {
  initialUpgrades,
  initialSkillTree,
  initialAscensionTree,
  initialTranscendenceTree,
  initialEternityTree,
  createInitialAchievements,
} from '../data/gameData';
import { createInitialQuestState, generateSpecialEvents } from '../data/questData';
import type { GameState } from '../types/types';

const STORAGE_KEY = 'landon-clicker-save';
const SAVE_VERSION = 1;

function mergeArrayById<T extends { id: string }>(saved: T[], fresh: T[]) {
  const map = new Map<string, T>();
  saved.forEach(item => map.set(item.id, item));
  fresh.forEach(item => {
    if (!map.has(item.id)) map.set(item.id, item);
  });
  return Array.from(map.values());
}

export function useGameState() {
  const lastTickRef = useRef(Date.now());
  const tickCounterRef = useRef(0);
  const [offlineEarnings, setOfflineEarnings] = useState<number | null>(null);

  function getInitialState(): GameState {
    return {
      version: SAVE_VERSION,
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
    };
  }

  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return getInitialState();
    try {
      const parsed = JSON.parse(saved);

      // Version migration: if old save, merge missing keys
      const fresh = getInitialState();
      const lastOnline = parsed.stats?.lastOnlineTime || Date.now();
      const offlineSeconds = Math.min((Date.now() - lastOnline) / 1000, 86400);
      const offlineClicks = Math.floor((parsed.cps || 0) * offlineSeconds * 0.5);

      if (offlineClicks > 0) {
        setOfflineEarnings(offlineClicks);
        setTimeout(() => setOfflineEarnings(null), 5000);
      }

      return {
        ...fresh,
        ...parsed,
        clicks: (parsed.clicks || 0) + offlineClicks,
        lifetimeClicks: (parsed.lifetimeClicks || 0) + offlineClicks,
        upgrades: mergeArrayById(parsed.upgrades || [], fresh.upgrades),
        skillTree: mergeArrayById(parsed.skillTree || [], fresh.skillTree),
        ascensionTree: mergeArrayById(parsed.ascensionTree || [], fresh.ascensionTree),
        transcendenceTree: mergeArrayById(parsed.transcendenceTree || [], fresh.transcendenceTree),
        eternityTree: mergeArrayById(parsed.eternityTree || [], fresh.eternityTree),
        achievements: mergeArrayById(parsed.achievements || [], fresh.achievements),
        questState: {
          ...fresh.questState,
          ...parsed.questState,
          events: generateSpecialEvents(),
        },
        stats: {
          ...fresh.stats,
          ...parsed.stats,
          lastOnlineTime: Date.now(),
        },
      };
    } catch {
      return getInitialState();
    }
  });

  /** --------------------------
   * Calculations
   * -------------------------- */
  const calculateClickPower = useCallback((state: GameState) => {
    let power = 1;
    state.upgrades.filter(u => u.type === 'clickPower').forEach(u => power += u.effect * u.owned);
    state.skillTree.filter(s => s.owned && s.type === 'clickMulti').forEach(s => power *= s.effect);
    state.transcendenceTree.filter(t => t.owned && t.type === 'infinitePower').forEach(t => power *= t.effect);
    state.transcendenceTree.filter(t => t.owned && t.type === 'globalMulti').forEach(t => power *= t.effect);
    state.eternityTree.filter(e => e.owned && e.type === 'omnipotent').forEach(e => power *= e.effect);
    return power;
  }, []);

  const calculateCPS = useCallback((state: GameState) => {
    let cps = 0;
    state.upgrades.filter(u => u.type === 'autoClicker').forEach(u => cps += u.effect * u.owned * state.clickPower);
    state.skillTree.filter(s => s.owned && (s.type === 'cpsBoost' || s.type === 'cpsMulti')).forEach(s => cps *= s.effect);
    state.ascensionTree.filter(a => a.owned && (a.type === 'allMulti' || a.type === 'ultimateCPS')).forEach(a => cps *= a.effect);
    state.transcendenceTree.filter(t => t.owned && (t.type === 'eternityBoost' || t.type === 'globalMulti')).forEach(t => cps *= t.effect);
    state.eternityTree.filter(e => e.owned && (e.type === 'infiniteAuto' || e.type === 'omnipotent')).forEach(e => cps *= e.effect);
    return cps;
  }, []);

  const getUpgradeCost = useCallback((upgrade: { baseCost: number; costMultiplier: number; owned: number }) => {
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.owned));
  }, []);

  /** --------------------------
   * Quest / Achievement Tracking
   * -------------------------- */
  const checkQuestProgress = useCallback((state: GameState): GameState => {
    const getStat = (type: string) => {
      switch (type) {
        case 'clicks': return state.clicks;
        case 'lifetimeClicks': return state.lifetimeClicks;
        case 'cps': return state.cps;
        case 'clickPower': return state.clickPower;
        case 'upgrades': return state.upgrades.reduce((sum, u) => sum + u.owned, 0);
        case 'prestiges': return state.totalPrestiges;
        case 'ascensions': return state.totalAscensions;
        case 'transcendences': return state.totalTranscendences;
        case 'eternities': return state.totalEternities;
        default: return 0;
      }
    };

    const updateSteps = (steps: any[]) =>
      steps.map(step => ({ ...step, current: getStat(step.type) }));

    const updateQuestList = (quests: any[]) =>
      quests.map(q => {
        const steps = updateSteps(q.steps);
        const completed = steps.every(s => s.current >= s.target);
        const currentStep = steps.findIndex(s => s.current < s.target);
        return { ...q, steps, completed, currentStep: currentStep === -1 ? steps.length - 1 : currentStep };
      });

    return {
      ...state,
      questState: {
        ...state.questState,
        quests: updateQuestList(state.questState.quests),
        dailyQuests: updateQuestList(state.questState.dailyQuests),
        weeklyQuests: updateQuestList(state.questState.weeklyQuests),
        events: updateQuestList(state.questState.events),
      },
    };
  }, []);

  /** --------------------------
   * Core Actions
   * -------------------------- */
  const handleClick = useCallback(() => {
    setGameState(prev => {
      let newState = { ...prev, clicks: prev.clicks + prev.clickPower, lifetimeClicks: prev.lifetimeClicks + prev.clickPower };
      newState = checkQuestProgress(newState);
      return newState;
    });
  }, [checkQuestProgress]);

  const buyUpgrade = useCallback((id: string) => {
    setGameState(prev => {
      const upgrade = prev.upgrades.find(u => u.id === id);
      if (!upgrade) return prev;
      const cost = getUpgradeCost(upgrade);
      if (prev.clicks < cost) return prev;
      const newState = { ...prev, upgrades: prev.upgrades.map(u => u.id === id ? { ...u, owned: u.owned + 1 } : u), clicks: prev.clicks - cost };
      return { ...newState, clickPower: calculateClickPower(newState), cps: calculateCPS(newState) };
    });
  }, [calculateClickPower, calculateCPS, getUpgradeCost]);

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

      const newState = { ...prev, upgrades: prev.upgrades.map(u => u.id === id ? { ...u, owned } : u), clicks };
      return { ...newState, clickPower: calculateClickPower(newState), cps: calculateCPS(newState) };
    });
  }, [calculateClickPower, calculateCPS]);

  /** --------------------------
   * Claim Functions
   * -------------------------- */
  const claimQuestReward = useCallback((questId: string) => {
    setGameState(prev => {
      const quest = prev.questState.quests.find(q => q.id === questId);
      if (!quest || quest.claimed || !quest.completed) return prev;
      const newState = {
        ...prev,
        clicks: prev.clicks + (quest.rewards.clicks || 0),
        prestigePoints: prev.prestigePoints + (quest.rewards.prestigePoints || 0),
        ascensionPoints: prev.ascensionPoints + (quest.rewards.ascensionPoints || 0),
        questState: {
          ...prev.questState,
          quests: prev.questState.quests.map(q => q.id === questId ? { ...q, claimed: true } : q),
        },
      };
      return checkQuestProgress(newState);
    });
  }, [checkQuestProgress]);

  const claimDailyQuestReward = useCallback((questId: string) => {
    setGameState(prev => {
      const quest = prev.questState.dailyQuests.find(q => q.id === questId);
      if (!quest || quest.claimed || !quest.completed) return prev;
      const newState = {
        ...prev,
        clicks: prev.clicks + (quest.rewards.clicks || 0),
        prestigePoints: prev.prestigePoints + (quest.rewards.prestigePoints || 0),
        questState: {
          ...prev.questState,
          dailyQuests: prev.questState.dailyQuests.map(q => q.id === questId ? { ...q, claimed: true } : q),
        },
      };
      return checkQuestProgress(newState);
    });
  }, [checkQuestProgress]);

  const claimWeeklyQuestReward = useCallback((questId: string) => {
    setGameState(prev => {
      const quest = prev.questState.weeklyQuests.find(q => q.id === questId);
      if (!quest || quest.claimed || !quest.completed) return prev;
      const newState = {
        ...prev,
        clicks: prev.clicks + (quest.rewards.clicks || 0),
        prestigePoints: prev.prestigePoints + (quest.rewards.prestigePoints || 0),
        questState: {
          ...prev.questState,
          weeklyQuests: prev.questState.weeklyQuests.map(q => q.id === questId ? { ...q, claimed: true } : q),
        },
      };
      return checkQuestProgress(newState);
    });
  }, [checkQuestProgress]);

  const claimEventReward = useCallback((eventId: string) => {
    setGameState(prev => {
      const event = prev.questState.events.find(e => e.id === eventId);
      if (!event || event.claimed || !event.completed) return prev;
      const newState = {
        ...prev,
        clicks: prev.clicks + (event.rewards.clicks || 0),
        prestigePoints: prev.prestigePoints + (event.rewards.prestigePoints || 0),
        ascensionPoints: prev.ascensionPoints + (event.rewards.ascensionPoints || 0),
        questState: {
          ...prev.questState,
          events: prev.questState.events.map(e => e.id === eventId ? { ...e, claimed: true } : e),
        },
      };
      return checkQuestProgress(newState);
    });
  }, [checkQuestProgress]);

  /** --------------------------
   * Save / Reset
   * -------------------------- */
  const saveGame = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...gameState, stats: { ...gameState.stats, lastOnlineTime: Date.now() } }));
  }, [gameState]);

  const resetGame = useCallback(() => {
    if (confirm('Are you sure you want to reset all progress?')) {
      localStorage.removeItem(STORAGE_KEY);
      setGameState(getInitialState());
    }
  }, []);

  /** --------------------------
   * Main Loop
   * -------------------------- */
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      setGameState(prev => {
        let nextState = {
          ...prev,
          clicks: prev.clicks + prev.cps * delta,
          lifetimeClicks: prev.lifetimeClicks + prev.cps * delta,
          stats: { ...prev.stats, totalPlaytime: prev.stats.totalPlaytime + delta, bestCPS: Math.max(prev.stats.bestCPS, prev.cps) },
        };

        tickCounterRef.current = (tickCounterRef.current || 0) + 1;
        if (tickCounterRef.current >= 10) {
          nextState = checkQuestProgress(nextState);
          tickCounterRef.current = 0;
        }

        return nextState;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [checkQuestProgress]);

  // Auto-save
  useEffect(() => {
    const interval = setInterval(() => saveGame(), 30000);
    return () => clearInterval(interval);
  }, [saveGame]);

  return {
    gameState,
    handleClick,
    buyUpgrade,
    buyUpgradeBulk,
    saveGame,
    resetGame,
    getUpgradeCost,
    offlineEarnings,
    claimQuestReward,
    claimDailyQuestReward,
    claimWeeklyQuestReward,
    claimEventReward,
  };
}
