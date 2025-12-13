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

function mergeArrayById<T extends { id: string }>(saved: T[], fresh: T[]) {
  const map = new Map<string, T>();
  fresh.forEach(item => map.set(item.id, item));
  saved.forEach(item => {
    if (map.has(item.id)) {
      map.set(item.id, { ...map.get(item.id)!, ...item });
    } else {
      map.set(item.id, item);
    }
  });
  return Array.from(map.values());
}

export function useGameState() {
  const lastTickRef = useRef(Date.now());
  const [offlineEarnings, setOfflineEarnings] = useState<number | null>(null);

  const getInitialState = useCallback((): GameState => ({
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
  }), []);

  const [gameState, setGameState] = useState<GameState>(() => {
    const savedRaw = localStorage.getItem(STORAGE_KEY);
    if (!savedRaw) return getInitialState();
    try {
      const saved = JSON.parse(savedRaw);
      const fresh = getInitialState();

      const lastOnline = saved.stats?.lastOnlineTime || Date.now();
      const offlineSeconds = Math.min((Date.now() - lastOnline) / 1000, 86400);
      const offlineClicks = Math.floor((saved.cps || 0) * offlineSeconds * 0.5);
      if (offlineClicks > 0) {
        setOfflineEarnings(offlineClicks);
        setTimeout(() => setOfflineEarnings(null), 5000);
      }

      return {
        ...fresh,
        ...saved,
        clicks: (saved.clicks || 0) + offlineClicks,
        lifetimeClicks: (saved.lifetimeClicks || 0) + offlineClicks,
        upgrades: mergeArrayById(saved.upgrades || [], fresh.upgrades),
        skillTree: mergeArrayById(saved.skillTree || [], fresh.skillTree),
        ascensionTree: mergeArrayById(saved.ascensionTree || [], fresh.ascensionTree),
        transcendenceTree: mergeArrayById(saved.transcendenceTree || [], fresh.transcendenceTree),
        eternityTree: mergeArrayById(saved.eternityTree || [], fresh.eternityTree),
        achievements: mergeArrayById(saved.achievements || [], fresh.achievements),
        questState: {
          ...fresh.questState,
          ...saved.questState,
          events: generateSpecialEvents(),
        },
        stats: {
          ...fresh.stats,
          ...saved.stats,
          lastOnlineTime: Date.now(),
        },
      };
    } catch {
      return getInitialState();
    }
  });

  /** ---------------------------
   * Calculations
   * --------------------------- */
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

  const getUpgradeCost = useCallback((u: { baseCost: number; costMultiplier: number; owned: number }) =>
    Math.floor(u.baseCost * Math.pow(u.costMultiplier, u.owned))
  , []);

  /** ---------------------------
   * Unified Progress Tracking
   * --------------------------- */
  const getStat = useCallback((state: GameState, type: string) => {
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
  }, []);

  const updateGameProgress = useCallback((state: GameState): GameState => {
    // Update quests
    const updatedQuests = state.questState.quests.map(q => {
      const steps = q.steps.map(s => ({ ...s, current: getStat(state, s.type) }));
      const completed = steps.every(s => s.current >= s.target);
      const currentStep = steps.findIndex(s => s.current < s.target);
      return { ...q, steps, completed, currentStep: currentStep === -1 ? steps.length - 1 : currentStep };
    });

    // Update challenges
    const updatedChallenges = state.questState.challenges.map(c => {
      const current = getStat(state, c.conditionType || c.type);
      return { ...c, current, completed: current >= c.target };
    });

    // Update events
    const updatedEvents = state.questState.events.map(e => {
      const current = getStat(state, e.type || e.id);
      return { ...e, current, completed: current >= (e.target || 1) };
    });

    // Update achievements
    const updatedAchievements = state.achievements.map(a => {
      if (a.completed) return a;
      const current = getStat(state, a.type || '');
      return { ...a, current, completed: current >= a.target };
    });

    return {
      ...state,
      questState: { ...state.questState, quests: updatedQuests, challenges: updatedChallenges, events: updatedEvents },
      achievements: updatedAchievements,
    };
  }, [getStat]);

  /** ---------------------------
   * Core Actions
   * --------------------------- */
  const handleClick = useCallback(() => {
    setGameState(prev => {
      const next = { ...prev, clicks: prev.clicks + prev.clickPower, lifetimeClicks: prev.lifetimeClicks + prev.clickPower };
      return updateGameProgress(next);
    });
  }, [updateGameProgress]);

  const buyUpgrade = useCallback((id: string) => {
    setGameState(prev => {
      const upgrade = prev.upgrades.find(u => u.id === id);
      if (!upgrade) return prev;
      const cost = getUpgradeCost(upgrade);
      if (prev.clicks < cost) return prev;
      const newUpgrades = prev.upgrades.map(u => u.id === id ? { ...u, owned: u.owned + 1 } : u);
      const next = { ...prev, upgrades: newUpgrades, clicks: prev.clicks - cost };
      next.clickPower = calculateClickPower(next);
      next.cps = calculateCPS(next);
      return updateGameProgress(next);
    });
  }, [calculateClickPower, calculateCPS, getUpgradeCost, updateGameProgress]);

  const buyUpgradeBulk = useCallback((id: string, amount: number | 'MAX') => {
    setGameState(prev => {
      const upgrade = prev.upgrades.find(u => u.id === id);
      if (!upgrade) return prev;
      let clicks = prev.clicks;
      let owned = upgrade.owned;
      let bought = 0;
      const toBuy = amount === 'MAX' ? Infinity : amount;

      while (bought < toBuy) {
        const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, owned));
        if (clicks < cost) break;
        clicks -= cost;
        owned++;
        bought++;
      }

      if (bought === 0) return prev;

      const newUpgrades = prev.upgrades.map(u => u.id === id ? { ...u, owned } : u);
      const next = { ...prev, upgrades: newUpgrades, clicks };
      next.clickPower = calculateClickPower(next);
      next.cps = calculateCPS(next);
      return updateGameProgress(next);
    });
  }, [calculateClickPower, calculateCPS, updateGameProgress]);

  // Generic tree upgrade function
  const buyTreeUpgrade = useCallback((
    tree: 'ascensionTree' | 'transcendenceTree' | 'eternityTree',
    pointsKey: 'prestigePoints' | 'ascensionPoints' | 'transcendencePoints' | 'eternityPoints',
    upgradeId: string
  ) => {
    setGameState(prev => {
      const upgrade = prev[tree].find(u => u.id === upgradeId);
      if (!upgrade) return prev;
      const cost = getUpgradeCost(upgrade);
      if ((prev as any)[pointsKey] < cost) return prev;
      const newTree = prev[tree].map(u => u.id === upgradeId ? { ...u, owned: u.owned + 1 } : u);
      return { ...prev, [tree]: newTree, [pointsKey]: (prev as any)[pointsKey] - cost };
    });
  }, [getUpgradeCost]);

  const buyPrestigeUpgrade = useCallback((id: string) => buyTreeUpgrade('ascensionTree', 'prestigePoints', id), [buyTreeUpgrade]);
  const buyAscensionUpgrade = useCallback((id: string) => buyTreeUpgrade('transcendenceTree', 'ascensionPoints', id), [buyTreeUpgrade]);
  const buyTranscendenceUpgrade = useCallback((id: string) => buyTreeUpgrade('eternityTree', 'transcendencePoints', id), [buyTreeUpgrade]);
  const buyEternityUpgrade = useCallback((id: string) => buyTreeUpgrade('eternityTree', 'eternityPoints', id), [buyTreeUpgrade]);

  /** ---------------------------
   * Quest & Event Claiming
   * --------------------------- */
  const claimQuestReward = useCallback((questId: string) => {
    setGameState(prev => {
      const quest = prev.questState.quests.find(q => q.id === questId);
      if (!quest || quest.claimed || !quest.completed) return prev;
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

  const claimEventReward = useCallback((eventId: string) => {
    setGameState(prev => {
      const event = prev.questState.events.find(e => e.id === eventId);
      if (!event || event.claimed || !event.completed) return prev;
      return {
        ...prev,
        clicks: prev.clicks + (event.rewards.clicks || 0),
        prestigePoints: prev.prestigePoints + (event.rewards.prestigePoints || 0),
        ascensionPoints: prev.ascensionPoints + (event.rewards.ascensionPoints || 0),
        questState: {
          ...prev.questState,
          events: prev.questState.events.map(e => e.id === eventId ? { ...e, claimed: true } : e),
        },
      };
    });
  }, []);

  /** ---------------------------
   * Save / Reset / Tick Loop
   * --------------------------- */
  const saveGame = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...gameState, stats: { ...gameState.stats, lastOnlineTime: Date.now() } }));
  }, [gameState]);

  const resetGame = useCallback(() => {
    if (confirm('Are you sure you want to reset all progress?')) {
      localStorage.removeItem(STORAGE_KEY);
      setGameState(getInitialState());
    }
  }, [getInitialState]);

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      setGameState(prev => {
        const next = { ...prev, clicks: prev.clicks + prev.cps * delta, lifetimeClicks: prev.lifetimeClicks + prev.cps * delta };
        return updateGameProgress(next);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [updateGameProgress]);

  useEffect(() => {
    const interval = setInterval(() => saveGame(), 30000);
    return () => clearInterval(interval);
  }, [saveGame]);

  return {
    gameState,
    handleClick,
    buyUpgrade,
    buyUpgradeBulk,
    buyPrestigeUpgrade,
    buyAscensionUpgrade,
    buyTranscendenceUpgrade,
    buyEternityUpgrade,
    claimQuestReward,
    claimEventReward,
    resetGame,
    saveGame,
  };
}
