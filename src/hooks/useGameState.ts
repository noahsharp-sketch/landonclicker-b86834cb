import { useState, useEffect, useRef } from 'react';
import { GameState } from './types';
import { initialUpgrades, initialSkillTree, initialAscensionTree, createInitialAchievements } from './gameData';
import { calculateClickPower, calculateCPS } from './calculations';

const STORAGE_KEY = 'landon-clicker-save';

function mergeArrayById<T extends { id: string }>(saved: T[], fresh: T[]) {
  const map = new Map<string, T>();
  saved.forEach(i => map.set(i.id, i));
  fresh.forEach(i => { if (!map.has(i.id)) map.set(i.id, i); });
  return Array.from(map.values());
}

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
    stats: { startTime: Date.now(), totalPlaytime: 0, bestCPS: 0, totalClicks: 0, cpsHistory: [], clicksHistory: [] },
  });

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

  // Auto-clicker + stats
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

  // Auto-save
  useEffect(() => {
    const interval = setInterval(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState)), 30000);
    return () => clearInterval(interval);
  }, [gameState]);

  return { gameState, setGameState };
}
