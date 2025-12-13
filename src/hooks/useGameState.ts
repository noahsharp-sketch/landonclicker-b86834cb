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

function mergeAchievements(saved: any[], fresh: ReturnType<typeof createInitialAchievements>) {
  return fresh.map(freshAch => {
    const savedAch = saved.find(s => s.id === freshAch.id);
    return { ...freshAch, unlocked: savedAch?.unlocked || false };
  });
}

export function useGameState() {
  const lastTickRef = useRef(Date.now());
  const tickCounterRef = useRef(0);
  const [offlineEarnings, setOfflineEarnings] = useState<number | null>(null);

  /** --------------------------
   * Initial state
   * -------------------------- */
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

  /** --------------------------
   * Load saved game
   * -------------------------- */
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return getInitialState();
    try {
      const parsed = JSON.parse(saved);
      const fresh = getInitialState();

      // Versioned save migration
      if (!parsed.version || parsed.version < SAVE_VERSION) {
        // Example: you can add migration logic here
        parsed.version = SAVE_VERSION;
      }

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
        achievements: mergeAchievements(parsed.achievements || [], fresh.achievements),
        questState: {
          ...fresh.questState,
          ...parsed.questState,
          events: generateSpecialEvents(),
        },
        stats: {
          ...fresh.stats,
          lastOnlineTime: Date.now(),
        },
      };
    } catch {
      return getInitialState();
    }
  });

  /** --------------------------
   * Utility calculations
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
   * Quest / achievement tracking
   * -------------------------- */
  const updateQuests = useCallback((state: GameState) => {
    const newQuests = state.questState.quests.map(q => {
      const newSteps = q.steps.map(step => {
        let current = 0;
        switch(step.type) {
          case 'clicks': current = state.clicks; break;
          case 'lifetimeClicks': current = state.lifetimeClicks; break;
          case 'cps': current = state.cps; break;
          case 'clickPower': current = state.clickPower; break;
          case 'upgrades': current = state.upgrades.reduce((sum,u)=>sum+u.owned,0); break;
          case 'prestiges': current = state.totalPrestiges; break;
          case 'ascensions': current = state.totalAscensions; break;
          case 'transcendences': current = state.totalTranscendences; break;
          case 'eternities': current = state.totalEternities; break;
          default: current = step.current; break;
        }
        return { ...step, current };
      });
      const completed = newSteps.every(s => s.current >= s.target);
      const currentStep = newSteps.findIndex(s => s.current < s.target);
      return { ...q, steps: newSteps, completed, currentStep: currentStep === -1 ? newSteps.length - 1 : currentStep };
    });
    return { ...state, questState: { ...state.questState, quests: newQuests } };
  }, []);

  /** --------------------------
   * Core Actions
   * -------------------------- */
  const handleClick = useCallback(() => {
    setGameState(prev => {
      const newClicks = prev.clicks + prev.clickPower;
      const newLifetime = prev.lifetimeClicks + prev.clickPower;
      let state = { ...prev, clicks: newClicks, lifetimeClicks: newLifetime };
      state = updateQuests(state);
      return state;
    });
  }, [updateQuests]);

  const buyUpgrade = useCallback((id: string) => {
    setGameState(prev => {
      const upgrade = prev.upgrades.find(u => u.id === id);
      if (!upgrade) return prev;
      const cost = getUpgradeCost(upgrade);
      if (prev.clicks < cost) return prev;

      let newState = {
        ...prev,
        upgrades: prev.upgrades.map(u => u.id === id ? { ...u, owned: u.owned + 1 } : u),
        clicks: prev.clicks - cost,
      };
      newState = { ...newState, clickPower: calculateClickPower(newState), cps: calculateCPS(newState) };
      newState = updateQuests(newState);
      return newState;
    });
  }, [calculateClickPower, calculateCPS, getUpgradeCost, updateQuests]);

  const buyUpgradeBulk = useCallback((id: string, amount: number | "MAX") => {
    setGameState(prev => {
      const upgrade = prev.upgrades.find(u => u.id === id);
      if (!upgrade) return prev;

      let clicks = prev.clicks;
      let owned = upgrade.owned;
      const toBuy = amount === "MAX" ? Infinity : amount;
      let bought = 0;

      while (bought < toBuy) {
        const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, owned));
        if (clicks < cost) break;
        clicks -= cost;
        owned++;
        bought++;
      }
      if (bought === 0) return prev;

      let newState = { ...prev, upgrades: prev.upgrades.map(u => u.id === id ? { ...u, owned } : u), clicks };
      newState = { ...newState, clickPower: calculateClickPower(newState), cps: calculateCPS(newState) };
      newState = updateQuests(newState);
      return newState;
    });
  }, [calculateClickPower, calculateCPS, updateQuests]);

  /** --------------------------
   * Achievements unlock
   * -------------------------- */
  useEffect(() => {
    setGameState(prev => {
      const newAchievements = prev.achievements.map(a => ({
        ...a,
        unlocked: a.unlocked || a.condition(prev),
      }));
      const changed = newAchievements.some((a,i)=>a.unlocked !== prev.achievements[i].unlocked);
      return changed ? { ...prev, achievements: newAchievements } : prev;
    });
  }, [gameState.clicks, gameState.lifetimeClicks, gameState.cps, gameState.totalPrestiges, gameState.totalAscensions, gameState.totalTranscendences, gameState.totalEternities, gameState.upgrades]);

  /** --------------------------
   * Main loop for CPS
   * -------------------------- */
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      setGameState(prev => {
        let newClicks = prev.clicks + prev.cps * delta;
        let newLifetime = prev.lifetimeClicks + prev.cps * delta;
        let state = { ...prev, clicks: newClicks, lifetimeClicks: newLifetime };

        // Update quests every tick
        tickCounterRef.current++;
        if (tickCounterRef.current >= 10) {
          state = updateQuests(state);
          tickCounterRef.current = 0;
        }

        // Update stats
        state.stats = { ...state.stats, totalPlaytime: state.stats.totalPlaytime + delta, bestCPS: Math.max(state.stats.bestCPS, state.cps) };
        return state;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [updateQuests]);

  /** --------------------------
   * Auto-save
   * -------------------------- */
  useEffect(() => {
    const interval = setInterval(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState)), 30000);
    return () => clearInterval(interval);
  }, [gameState]);

  return {
    gameState,
    handleClick,
    buyUpgrade,
    buyUpgradeBulk,
  };
}
