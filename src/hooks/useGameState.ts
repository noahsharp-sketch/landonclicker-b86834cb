import { useState, useEffect, useRef, useCallback } from 'react';
import { initialUpgrades, initialSkillTree, initialAscensionTree, createInitialAchievements } from '../data/gameData';
import { calculateClickPower, calculateCPS, calculatePrestigeGain, calculateAscensionGain } from '../utils/calculations';
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
      lastOnlineTime: Date.now(),
    },
  });

  /* ---------- Calculate offline progress ---------- */
  const calculateOfflineProgress = (state: GameState): GameState => {
    const now = Date.now();
    const lastOnline = state.stats.lastOnlineTime || now;
    const offlineSeconds = Math.min((now - lastOnline) / 1000, 86400); // Cap at 24 hours
    
    if (offlineSeconds < 10 || state.cps <= 0) {
      return { ...state, stats: { ...state.stats, lastOnlineTime: now } };
    }
    
    // Apply 50% efficiency for offline progress
    const offlineGain = state.cps * offlineSeconds * 0.5;
    
    return {
      ...state,
      clicks: state.clicks + offlineGain,
      lifetimeClicks: state.lifetimeClicks + offlineGain,
      stats: { ...state.stats, lastOnlineTime: now },
    };
  };

  /* ---------- Load saved state ---------- */
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
        achievements: mergeArrayById(parsed.achievements || [], fresh.achievements),
        stats: { ...fresh.stats, ...parsed.stats },
      };
      
      // Calculate offline progress
      loadedState = calculateOfflineProgress(loadedState);
      
      return loadedState;
    } catch {
      return getInitialState();
    }
  });
  
  /* ---------- Show offline earnings notification ---------- */
  const [offlineEarnings, setOfflineEarnings] = useState<number | null>(null);
  
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
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
    }
  }, []);

  /* ---------- Game Actions ---------- */

  const handleClick = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      clicks: prev.clicks + prev.clickPower,
      lifetimeClicks: prev.lifetimeClicks + prev.clickPower,
      stats: { ...prev.stats, totalClicks: prev.stats.totalClicks + 1 },
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
      const newState = { ...prev, ascensionTree: newAscensionTree, ascensionPoints: prev.ascensionPoints - node.cost };
      return { ...newState, clickPower: calculateClickPower(newState), cps: calculateCPS(newState) };
    });
  }, []);

  const getStartingClicks = useCallback((state: GameState): number => {
    let starting = 0;
    state.skillTree.filter(n => n.owned && n.type === 'startingClicks').forEach(n => starting += n.effect);
    state.ascensionTree.filter(n => n.owned && n.type === 'megaStart').forEach(n => starting += n.effect);
    return starting;
  }, []);

  const prestige = useCallback(() => {
    setGameState(prev => {
      const gain = calculatePrestigeGain(prev);
      if (gain <= 0) return prev;
      
      const startingClicks = getStartingClicks(prev);
      const newState: GameState = {
        ...prev,
        clicks: startingClicks,
        lifetimeClicks: 0,
        clickPower: 1,
        cps: 0,
        prestigePoints: prev.prestigePoints + gain,
        totalPrestigePoints: prev.totalPrestigePoints + gain,
        totalPrestiges: prev.totalPrestiges + 1,
        upgrades: initialUpgrades,
      };
      return { ...newState, clickPower: calculateClickPower(newState), cps: calculateCPS(newState) };
    });
  }, [getStartingClicks]);

  const ascend = useCallback(() => {
    setGameState(prev => {
      const gain = calculateAscensionGain(prev);
      if (gain <= 0) return prev;
      
      const newState: GameState = {
        ...prev,
        clicks: 0,
        lifetimeClicks: 0,
        clickPower: 1,
        cps: 0,
        prestigePoints: 0,
        totalPrestigePoints: 0,
        totalPrestiges: 0,
        ascensionPoints: prev.ascensionPoints + gain,
        totalAscensionPoints: prev.totalAscensionPoints + gain,
        upgrades: initialUpgrades,
        skillTree: initialSkillTree,
      };
      return { ...newState, clickPower: calculateClickPower(newState), cps: calculateCPS(newState) };
    });
  }, []);

  const resetGame = useCallback(() => {
    if (confirm('Are you sure you want to reset all progress?')) {
      localStorage.removeItem(STORAGE_KEY);
      setGameState(getInitialState());
    }
  }, []);

  const saveGame = useCallback(() => {
    const stateToSave = { ...gameState, stats: { ...gameState.stats, lastOnlineTime: Date.now() } };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
  }, [gameState]);

  /* ---------- Check Achievements ---------- */
  useEffect(() => {
    setGameState(prev => {
      const newAchievements = prev.achievements.map(a => ({
        ...a,
        unlocked: a.unlocked || a.condition(prev),
      }));
      
      const hasChanges = newAchievements.some((a, i) => a.unlocked !== prev.achievements[i].unlocked);
      return hasChanges ? { ...prev, achievements: newAchievements } : prev;
    });
  }, [gameState.lifetimeClicks, gameState.totalPrestiges, gameState.cps, gameState.upgrades]);

  /* ---------- Auto Clicker + Stats ---------- */
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      setGameState(prev => {
        const newPlaytime = prev.stats.totalPlaytime + delta;
        const shouldRecordHistory = Math.floor(newPlaytime / 10) > Math.floor(prev.stats.totalPlaytime / 10);
        
        return {
          ...prev,
          clicks: prev.clicks + prev.cps * delta,
          lifetimeClicks: prev.lifetimeClicks + prev.cps * delta,
          stats: {
            ...prev.stats,
            totalPlaytime: newPlaytime,
            bestCPS: Math.max(prev.stats.bestCPS, prev.cps),
            lastOnlineTime: now,
            cpsHistory: shouldRecordHistory 
              ? [...prev.stats.cpsHistory.slice(-30), { time: now, cps: prev.cps }]
              : prev.stats.cpsHistory,
            clicksHistory: shouldRecordHistory
              ? [...prev.stats.clicksHistory.slice(-30), { time: now, clicks: prev.lifetimeClicks }]
              : prev.stats.clicksHistory,
          },
        };
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  /* ---------- Auto Save ---------- */
  useEffect(() => {
    const interval = setInterval(() => {
      const stateToSave = { ...gameState, stats: { ...gameState.stats, lastOnlineTime: Date.now() } };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }, 30000);
    return () => clearInterval(interval);
  }, [gameState]);

  /* ---------- Save on page unload ---------- */
  useEffect(() => {
    const handleUnload = () => {
      const stateToSave = { ...gameState, stats: { ...gameState.stats, lastOnlineTime: Date.now() } };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    };
    window.addEventListener('beforeunload', handleUnload);
    return () => window.removeEventListener('beforeunload', handleUnload);
  }, [gameState]);

  return {
    gameState,
    handleClick,
    buyUpgrade,
    buySkillNode,
    buyAscensionNode,
    prestige,
    ascend,
    saveGame,
    resetGame,
    offlineEarnings,
  };
}
