import { useState, useEffect, useRef, useCallback } from 'react';
import { initialUpgrades, initialSkillTree, initialAscensionTree, createInitialAchievements } from '../data/gameData';
import { calculateClickPower, calculateCPS } from '../utils/calculations';
import { buyUpgrade as buyUpgradeAction } from '../utils/actions';
import { GameState } from '../types/types';

const STORAGE_KEY = 'landon-clicker-save';

/* ---------------- Merge helper ---------------- */
function mergeArrayById<T extends { id: string }>(saved: T[], fresh: T[]) {
  const map = new Map<string, T>();
  saved.forEach(i => map.set(i.id, i));
  fresh.forEach(i => { if (!map.has(i.id)) map.set(i.id, i); });
  return Array.from(map.values());
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
    },
  });

  /* ---------- Load saved state ---------- */
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return getInitialState();
    try {
      const parsed = JSON.parse(saved);
      const fresh = getInitialState();
      return {
        ...fresh,
        ...parsed,
        upgrades: mergeArrayById(parsed.upgrades || [], fresh.upgrades),
        skillTree: mergeArrayById(parsed.skillTree || [], fresh.skillTree),
        ascensionTree: mergeArrayById(parsed.ascensionTree || [], fresh.ascensionTree),
        achievements: mergeArrayById(parsed.achievements || [], fresh.achievements),
      };
    } catch {
      return getInitialState();
    }
  });

  /* ---------- Game Actions ---------- */

  const handleClick = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      clicks: prev.clicks + prev.clickPower,
      lifetimeClicks: prev.lifetimeClicks + prev.clickPower,
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
      return { ...prev, ascensionTree: newAscensionTree, ascensionPoints: prev.ascensionPoints - node.cost };
    });
  }, []);

  const resetGame = useCallback(() => {
    if (confirm('Are you sure you want to reset all progress?')) {
      localStorage.removeItem(STORAGE_KEY);
      setGameState(getInitialState());
    }
  }, []);

  const saveGame = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
  }, [gameState]);

  /* ---------- Auto Clicker + Stats ---------- */
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
        },
      }));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  /* ---------- Auto Save ---------- */
  useEffect(() => {
    const interval = setInterval(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
    }, 30000);
    return () => clearInterval(interval);
  }, [gameState]);

  return {
    gameState,
    handleClick,
    buyUpgrade,
    buySkillNode,
    buyAscensionNode,
    saveGame,
    resetGame,
  };
}
