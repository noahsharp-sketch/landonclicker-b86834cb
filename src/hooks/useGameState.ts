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

function mergeArrayById<T extends { id: string }>(saved: T[], fresh: T[]) {
  const map = new Map<string, T>();
  saved.forEach(item => map.set(item.id, item));
  fresh.forEach(item => {
    if (!map.has(item.id)) map.set(item.id, item);
  });
  return Array.from(map.values());
}

const STORAGE_KEY = 'landon-clicker-save';

export function useGameState() {
  const lastTickRef = useRef(Date.now());
  const tickCounterRef = useRef(0);
  const [offlineEarnings, setOfflineEarnings] = useState<number | null>(null);

  function getInitialState(): GameState {
    return {
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
          quests: parsed.questState?.quests || fresh.questState.quests,
          challenges: parsed.questState?.challenges || fresh.questState.challenges,
          events: generateSpecialEvents(),
          leaderboard: parsed.questState?.leaderboard || [],
        },
        stats: { ...fresh.stats, ...parsed.stats, lastOnlineTime: Date.now() },
      };
    } catch {
      return getInitialState();
    }
  });

  // -----------------------------
  // Calculation functions
  // -----------------------------
  const calculateClickPower = useCallback((state: GameState) => {
    let power = 1;
    state.upgrades.filter(u => u.type === 'clickPower').forEach(u => power += u.effect * u.owned);
    state.skillTree.filter(s => s.owned && s.type === 'clickMulti').forEach(s => power *= s.effect);
    state.transcendenceTree.filter(t => t.owned && (t.type === 'infinitePower' || t.type === 'globalMulti')).forEach(t => power *= t.effect);
    state.eternityTree.filter(e => e.owned && e.type === 'omnipotent').forEach(e => power *= e.effect);
    return power;
  }, []);

  const calculateCPS = useCallback((state: GameState) => {
    let cps = 0;
    state.upgrades.filter(u => u.type === 'autoClicker').forEach(u => cps += u.effect * u.owned * state.clickPower);
    state.skillTree.filter(s => s.owned && ['cpsBoost','cpsMulti'].includes(s.type)).forEach(s => cps *= s.effect);
    state.ascensionTree.filter(a => a.owned && ['allMulti','ultimateCPS'].includes(a.type)).forEach(a => cps *= a.effect);
    state.transcendenceTree.filter(t => t.owned && ['eternityBoost','globalMulti'].includes(t.type)).forEach(t => cps *= t.effect);
    state.eternityTree.filter(e => e.owned && ['infiniteAuto','omnipotent'].includes(e.type)).forEach(e => cps *= e.effect);
    return cps;
  }, []);

  const getUpgradeCost = useCallback((upgrade: { baseCost: number; costMultiplier: number; owned: number }) => {
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.owned));
  }, []);

  // -----------------------------
  // Quest Tracking
  // -----------------------------
  const updateQuestList = useCallback((state: GameState) => {
    const safeQuests = state.questState.quests || [];
    const safeChallenges = state.questState.challenges || [];
    const safeEvents = state.questState.events || [];

    const getStat = (type: string) => {
      switch(type) {
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

    const updatedQuests = safeQuests.map(q => {
      const steps = q.steps.map(s => ({ ...s, current: getStat(s.type) }));
      const completed = steps.every(s => s.current >= s.target);
      const currentStep = steps.findIndex(s => s.current < s.target);
      return { ...q, steps, completed, currentStep: currentStep === -1 ? steps.length - 1 : currentStep };
    });

    const updatedChallenges = safeChallenges.map(c => {
      const current = getStat(c.conditionType || c.type);
      return { ...c, current, completed: current >= c.target };
    });

    const updatedEvents = safeEvents.map(e => {
      const current = getStat(e.conditionType || e.type);
      return { ...e, current, completed: current >= e.target };
    });

    return { ...state, questState: { ...state.questState, quests: updatedQuests, challenges: updatedChallenges, events: updatedEvents } };
  }, []);

  // -----------------------------
  // Core Actions
  // -----------------------------
  const handleClick = useCallback(() => {
    setGameState(prev => {
      const newState = { ...prev, clicks: prev.clicks + prev.clickPower, lifetimeClicks: prev.lifetimeClicks + prev.clickPower };
      return updateQuestList(newState);
    });
  }, [updateQuestList]);

  const buyUpgrade = useCallback((id: string) => {
    setGameState(prev => {
      const upgrade = prev.upgrades.find(u => u.id === id);
      if (!upgrade) return prev;
      const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.owned));
      if (prev.clicks < cost) return prev;

      const newState = { 
        ...prev,
        upgrades: prev.upgrades.map(u => u.id === id ? { ...u, owned: u.owned + 1 } : u),
        clicks: prev.clicks - cost
      };
      return { ...newState, clickPower: calculateClickPower(newState), cps: calculateCPS(newState) };
    });
  }, [calculateClickPower, calculateCPS]);

  const buyUpgradeBulk = useCallback((id: string, amount: number | "MAX") => {
    setGameState(prev => {
      const upgrade = prev.upgrades.find(u => u.id === id);
      if (!upgrade) return prev;

      let clicks = prev.clicks;
      let owned = upgrade.owned;
      let bought = 0;
      let toBuy = amount === "MAX" ? Infinity : amount;

      while (bought < toBuy) {
        const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, owned));
        if (clicks < cost) break;
        clicks -= cost;
        owned++;
        bought++;
      }

      if (bought === 0) return prev;

      const newState = { ...prev, upgrades: prev.upgrades.map(u => u.id === id ? { ...u, owned } : u), clicks };
      return { ...newState, clickPower: calculateClickPower(newState), cps: calculateCPS(newState) };
    });
  }, [calculateClickPower, calculateCPS]);

  // -----------------------------
  // Main loop
  // -----------------------------
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      setGameState(prev => {
        let newState = { ...prev, clicks: prev.clicks + prev.cps * delta, lifetimeClicks: prev.lifetimeClicks + prev.cps * delta };
        return updateQuestList(newState);
      });
    }, 100);

    return () => clearInterval(interval);
  }, [updateQuestList]);

  // -----------------------------
  // Auto-save
  // -----------------------------
  useEffect(() => {
    const interval = setInterval(() => localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...gameState, stats: { ...gameState.stats, lastOnlineTime: Date.now() } })), 30000);
    return () => clearInterval(interval);
  }, [gameState]);

  return {
    gameState,
    handleClick,
    buyUpgrade,
    buyUpgradeBulk,
    saveGame: () => localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...gameState, stats: { ...gameState.stats, lastOnlineTime: Date.now() } })),
    getUpgradeCost,
    offlineEarnings,
  };
}
