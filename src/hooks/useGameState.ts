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
      // Merge owned or relevant fields
      map.set(item.id, { ...map.get(item.id)!, ...item });
    } else {
      map.set(item.id, item);
    }
  });
  return Array.from(map.values());
}

export function useGameState() {
  const lastTickRef = useRef(Date.now());
  const tickCounterRef = useRef(0);
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
   * Quest / Achievement Helpers
   * --------------------------- */
  const updateQuestProgress = useCallback((state: GameState, type: string, amount: number) => {
    const newQuests = state.questState.quests.map(q => {
      if (q.completed) return q;
      const newSteps = q.steps.map((s, idx) => {
        if (idx !== q.currentStep) return s;
        if (s.type === type) return { ...s, current: Math.min(s.target, s.current + amount) };
        return s;
      });
      const completed = newSteps.every(s => s.current >= s.target);
      const currentStep = newSteps.findIndex(s => s.current < s.target);
      return { ...q, steps: newSteps, completed, currentStep: currentStep === -1 ? newSteps.length - 1 : currentStep };
    });
    return { ...state, questState: { ...state.questState, quests: newQuests } };
  }, []);

  /** ---------------------------
   * Core Actions
   * --------------------------- */
  const handleClick = useCallback(() => {
    setGameState(prev => {
      let s = { ...prev, clicks: prev.clicks + prev.clickPower, lifetimeClicks: prev.lifetimeClicks + prev.clickPower };
      s = updateQuestProgress(s, 'clicks', s.clickPower);
      return s;
    });
  }, [updateQuestProgress]);

  const buyUpgrade = useCallback((id: string) => {
    setGameState(prev => {
      const upgrade = prev.upgrades.find(u => u.id === id);
      if (!upgrade) return prev;
      const cost = getUpgradeCost(upgrade);
      if (prev.clicks < cost) return prev;

      const newUpgrades = prev.upgrades.map(u => u.id === id ? { ...u, owned: u.owned + 1 } : u);
      let s = { ...prev, upgrades: newUpgrades, clicks: prev.clicks - cost };
      s = { ...s, clickPower: calculateClickPower(s), cps: calculateCPS(s) };
      if (upgrade.type === 'autoClicker') s = updateQuestProgress(s, 'autoClicker', 1);
      return s;
    });
  }, [calculateClickPower, calculateCPS, updateQuestProgress, getUpgradeCost]);

  const buyUpgradeBulk = useCallback((id: string, amount: number | 'MAX') => {
    setGameState(prev => {
      const upgrade = prev.upgrades.find(u => u.id === id);
      if (!upgrade) return prev;

      let clicks = prev.clicks;
      let owned = upgrade.owned;
      let bought = 0;
      const toBuy = amount === 'MAX' ? Infinity : amount;

      while (bought < toBuy) {
        const nextCost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, owned));
        if (clicks < nextCost) break;
        clicks -= nextCost;
        owned++;
        bought++;
      }
      if (bought === 0) return prev;

      const newUpgrades = prev.upgrades.map(u => u.id === id ? { ...u, owned } : u);
      let s = { ...prev, upgrades: newUpgrades, clicks };
      s = { ...s, clickPower: calculateClickPower(s), cps: calculateCPS(s) };
      if (upgrade.type === 'autoClicker') s = updateQuestProgress(s, 'autoClicker', bought);
      return s;
    });
  }, [calculateClickPower, calculateCPS, updateQuestProgress]);

  /** ---------------------------
   * Prestige / Ascend / Transcend / Eternity
   * --------------------------- */
  const calculatePrestigeGain = useCallback((s: GameState) => Math.floor(s.lifetimeClicks / 10_000_000), []);
  const calculateAscensionGain = useCallback((s: GameState) => Math.floor(Math.sqrt(s.totalPrestigePoints / 500)), []);
  const calculateTranscendenceGain = useCallback((s: GameState) => Math.floor(Math.sqrt(s.totalAscensionPoints / 250)), []);
  const calculateEternityGain = useCallback((s: GameState) => Math.floor(Math.sqrt(s.totalTranscendencePoints / 100)), []);

  const prestige = useCallback(() => {
    setGameState(prev => {
      const gain = calculatePrestigeGain(prev);
      if (gain <= 0) return prev;
      let s = getInitialState();
      s = { ...s, clicks: prev.clicks, skillTree: prev.skillTree, ascensionTree: prev.ascensionTree, upgrades: prev.upgrades, achievements: prev.achievements };
      s = { ...s, prestigePoints: prev.prestigePoints + gain, totalPrestigePoints: prev.totalPrestigePoints + gain, totalPrestiges: prev.totalPrestiges + 1 };
      s = updateQuestProgress(s, 'prestige', gain);
      return s;
    });
  }, [calculatePrestigeGain, updateQuestProgress, getInitialState]);

  const ascend = useCallback(() => {
    setGameState(prev => {
      const gain = calculateAscensionGain(prev);
      if (gain <= 0) return prev;
      let s = getInitialState();
      s = { ...s, clicks: prev.clicks, skillTree: prev.skillTree, ascensionTree: prev.ascensionTree, upgrades: prev.upgrades, achievements: prev.achievements };
      s = { ...s, ascensionPoints: prev.ascensionPoints + gain, totalAscensionPoints: prev.totalAscensionPoints + gain, totalAscensions: prev.totalAscensions + 1 };
      s = updateQuestProgress(s, 'ascension', gain);
      return s;
    });
  }, [calculateAscensionGain, updateQuestProgress, getInitialState]);

  const transcend = useCallback(() => {
    setGameState(prev => {
      const gain = calculateTranscendenceGain(prev);
      if (gain <= 0) return prev;
      let s = getInitialState();
      s = { ...s, clicks: prev.clicks, skillTree: prev.skillTree, ascensionTree: prev.ascensionTree, transcendenceTree: prev.transcendenceTree, upgrades: prev.upgrades, achievements: prev.achievements };
      s = { ...s, transcendencePoints: prev.transcendencePoints + gain, totalTranscendencePoints: prev.totalTranscendencePoints + gain, totalTranscendences: prev.totalTranscendences + 1 };
      s = updateQuestProgress(s, 'transcendence', gain);
      return s;
    });
  }, [calculateTranscendenceGain, updateQuestProgress, getInitialState]);

  const enterEternity = useCallback(() => {
    setGameState(prev => {
      const gain = calculateEternityGain(prev);
      if (gain <= 0) return prev;
      let s = getInitialState();
      s = { ...s, clicks: prev.clicks, skillTree: prev.skillTree, ascensionTree: prev.ascensionTree, transcendenceTree: prev.transcendenceTree, eternityTree: prev.eternityTree, upgrades: prev.upgrades, achievements: prev.achievements };
      s = { ...s, eternityPoints: prev.eternityPoints + gain, totalEternityPoints: prev.totalEternityPoints + gain, totalEternities: prev.totalEternities + 1 };
      s = updateQuestProgress(s, 'eternity', gain);
      return s;
    });
  }, [calculateEternityGain, updateQuestProgress, getInitialState]);

  /** ---------------------------
   * Save / Reset
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

  /** ---------------------------
   * Main Loop
   * --------------------------- */
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      setGameState(prev => {
        let s = { ...prev, clicks: prev.clicks + prev.cps * delta, lifetimeClicks: prev.lifetimeClicks + prev.cps * delta };
        s = updateQuestProgress(s, 'clicks', prev.cps * delta);

        tickCounterRef.current++;
        if (tickCounterRef.current >= 10) {
          tickCounterRef.current = 0;
        }

        return s;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [updateQuestProgress]);

  useEffect(() => {
    const interval = setInterval(() => saveGame(), 30000);
    return () => clearInterval(interval);
  }, [saveGame]);

  return {
    gameState,
    handleClick,
    buyUpgrade,
    buyUpgradeBulk,
    prestige,
    ascend,
    transcend,
    enterEternity,
    resetGame,
    saveGame,
    getUpgradeCost,
    calculatePrestigeGain,
    calculateAscensionGain,
    calculateTranscendenceGain,
    calculateEternityGain,
    offlineEarnings,
  };
}
