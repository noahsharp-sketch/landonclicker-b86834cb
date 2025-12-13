import { useState, useEffect, useRef, useCallback } from 'react';
import {
  initialUpgrades,
  initialSkillTree,
  initialAscensionTree,
  createInitialAchievements,
} from '../data/gameData';
import {
  createInitialQuestState,
  createDailyChallenges,
  createWeeklyChallenges,
} from '../data/questData';
import {
  calculateClickPower,
  calculateCPS,
  calculatePrestigeGain,
  calculateAscensionGain,
} from '../utils/calculations';
import { GameState } from '../types/types';

/* ================================
   Save Versioning
================================ */
const STORAGE_KEY = 'landon-clicker-save';
const SAVE_VERSION = 2;

/* ================================
   Helpers
================================ */
function mergeArrayById<T extends { id: string }>(saved: T[], fresh: T[]) {
  const map = new Map<string, T>();
  saved.forEach(i => map.set(i.id, i));
  fresh.forEach(i => { if (!map.has(i.id)) map.set(i.id, i); });
  return Array.from(map.values());
}

function migrateSave(raw: any): GameState {
  const fresh = getFreshState();

  if (!raw || typeof raw !== 'object') return fresh;

  // v1 → v2 migration example
  if (!raw.saveVersion || raw.saveVersion < 2) {
    raw.bulkBuyAmount = 1;
  }

  return {
    ...fresh,
    ...raw,
    saveVersion: SAVE_VERSION,
    upgrades: mergeArrayById(raw.upgrades || [], fresh.upgrades),
    skillTree: mergeArrayById(raw.skillTree || [], fresh.skillTree),
    ascensionTree: mergeArrayById(raw.ascensionTree || [], fresh.ascensionTree),
    achievements: mergeArrayById(raw.achievements || [], fresh.achievements),
    questState: {
      ...fresh.questState,
      ...raw.questState,
    },
    stats: { ...fresh.stats, ...raw.stats, lastOnlineTime: Date.now() },
  };
}

/* ================================
   Initial State
================================ */
function getFreshState(): GameState {
  return {
    saveVersion: SAVE_VERSION,

    clicks: 0,
    lifetimeClicks: 0,
    clickPower: 1,
    cps: 0,

    prestigePoints: 0,
    totalPrestigePoints: 0,
    ascensionPoints: 0,
    totalAscensionPoints: 0,

    totalPrestiges: 0,

    bulkBuyAmount: 1, // 1 | 10 | 100 | 'MAX'

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
  };
}

/* ================================
   Hook
================================ */
export function useGameState() {
  const lastTickRef = useRef(Date.now());

  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return getFreshState();
    try {
      return migrateSave(JSON.parse(saved));
    } catch {
      return getFreshState();
    }
  });

  /* ================================
     Bulk Buy Logic (FIXED)
  ================================ */
  const getUpgradeCost = (u: any, ownedOffset = 0) =>
    Math.floor(u.baseCost * Math.pow(u.costMultiplier, u.owned + ownedOffset));

  const buyUpgrade = useCallback((id: string) => {
    setGameState(prev => {
      const upgrade = prev.upgrades.find(u => u.id === id);
      if (!upgrade) return prev;

      const amount = prev.bulkBuyAmount;
      let owned = upgrade.owned;
      let cost = 0;
      let bought = 0;

      const maxLoop = amount === 'MAX' ? 9999 : amount;

      for (let i = 0; i < maxLoop; i++) {
        const nextCost = getUpgradeCost(upgrade, bought);
        if (prev.clicks - cost < nextCost) break;
        cost += nextCost;
        bought++;
      }

      if (bought === 0) return prev;

      const newUpgrades = prev.upgrades.map(u =>
        u.id === id ? { ...u, owned: u.owned + bought } : u
      );

      const nextState = {
        ...prev,
        clicks: prev.clicks - cost,
        upgrades: newUpgrades,
      };

      return {
        ...nextState,
        clickPower: calculateClickPower(nextState),
        cps: calculateCPS(nextState),
      };
    });
  }, []);

  /* ================================
     Extra Upgrades (SAFE ADD)
     → Add these in gameData.ts
  ================================ */
  // Example additions:
  // {
  //   id: 'auto_clicker_3',
  //   name: 'Quantum Clicker',
  //   type: 'autoClicker',
  //   baseCost: 1e6,
  //   costMultiplier: 1.25,
  //   effect: 500,
  //   owned: 0,
  // }

  /* ================================
     Core Actions
  ================================ */
  const handleClick = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      clicks: prev.clicks + prev.clickPower,
      lifetimeClicks: prev.lifetimeClicks + prev.clickPower,
      stats: { ...prev.stats, totalClicks: prev.stats.totalClicks + 1 },
    }));
  }, []);

  const prestige = useCallback(() => {
    setGameState(prev => {
      const gain = calculatePrestigeGain(prev);
      if (gain <= 0) return prev;

      const next = {
        ...prev,
        clicks: 0,
        lifetimeClicks: 0,
        clickPower: 1,
        cps: 0,
        prestigePoints: prev.prestigePoints + gain,
        totalPrestigePoints: prev.totalPrestigePoints + gain,
        totalPrestiges: prev.totalPrestiges + 1,
        upgrades: initialUpgrades,
      };

      return {
        ...next,
        clickPower: calculateClickPower(next),
        cps: calculateCPS(next),
      };
    });
  }, []);

  /* ================================
     Game Loop
  ================================ */
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      setGameState(prev => ({
        ...prev,
        clicks: prev.clicks + prev.cps * delta,
        lifetimeClicks: prev.lifetimeClicks + prev.cps * delta,
        stats: {
          ...prev.stats,
          totalPlaytime: prev.stats.totalPlaytime + delta,
          bestCPS: Math.max(prev.stats.bestCPS, prev.cps),
          lastOnlineTime: now,
        },
      }));
    }, 100);

    return () => clearInterval(interval);
  }, []);

  /* ================================
     Auto Save
  ================================ */
  useEffect(() => {
    const interval = setInterval(() => {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ ...gameState, saveVersion: SAVE_VERSION })
      );
    }, 30000);
    return () => clearInterval(interval);
  }, [gameState]);

  return {
    gameState,
    handleClick,
    buyUpgrade,
    prestige,
    setBulkBuyAmount: (amount: any) =>
      setGameState(prev => ({ ...prev, bulkBuyAmount: amount })),
  };
}
