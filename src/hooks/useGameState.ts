import { useState, useEffect, useCallback, useRef } from 'react';

export interface Upgrade {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  owned: number;
  effect: number;
  type: 'clickPower' | 'autoClicker';
}

export interface SkillNode {
  id: string;
  name: string;
  description: string;
  cost: number;
  owned: boolean;
  effect: number;
  type: 'clickMulti' | 'cpsMulti' | 'costReduction' | 'startingClicks' | 'cpsBoost';
}

export interface AscensionNode {
  id: string;
  name: string;
  description: string;
  cost: number;
  owned: boolean;
  effect: number;
  type: 'prestigeMulti' | 'allMulti' | 'superCost' | 'megaStart' | 'ultimateCPS';
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  condition: (state: GameState) => boolean;
}

export interface GameStats {
  startTime: number;
  totalPlaytime: number;
  bestCPS: number;
  totalClicks: number;
  cpsHistory: { time: number; cps: number }[];
  clicksHistory: { time: number; clicks: number }[];
}

export interface GameState {
  clicks: number;
  lifetimeClicks: number;
  clickPower: number;
  cps: number;
  prestigePoints: number;
  totalPrestigePoints: number;
  ascensionPoints: number;
  totalAscensionPoints: number;
  totalPrestiges: number;
  upgrades: Upgrade[];
  skillTree: SkillNode[];
  ascensionTree: AscensionNode[];
  achievements: Achievement[];
  stats: GameStats;
}

const STORAGE_KEY = 'landon-clicker-save';

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...getInitialState(), ...parsed };
      } catch {
        return getInitialState();
      }
    }
    return getInitialState();
  });

  const lastTickRef = useRef(Date.now());

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
    };
  }

  // ----------------- Calculation Functions -----------------
  const calculateClickPower = useCallback((state: GameState) => {
    let power = 1;
    state.upgrades.filter(u => u.type === 'clickPower').forEach(u => power += u.effect * u.owned);
    const clickMulti = state.skillTree.find(s => s.id === 'a' && s.owned);
    if (clickMulti) power *= clickMulti.effect;
    const clickOverdrive = state.skillTree.find(s => s.id === 'c' && s.owned);
    if (clickOverdrive) power *= clickOverdrive.effect;
    return power;
  }, []);

  const calculateCPS = useCallback((state: GameState) => {
    let cps = 0;
    state.upgrades.filter(u => u.type === 'autoClicker').forEach(u => {
      cps += u.effect * u.owned * state.clickPower;
    });
    const cpsBoost = state.skillTree.find(s => s.id === 'b' && s.owned);
    if (cpsBoost) cps *= cpsBoost.effect;
    const cpsSurge = state.skillTree.find(s => s.id === 'd' && s.owned);
    if (cpsSurge) cps *= cpsSurge.effect;
    const ultimateCPS = state.ascensionTree.find(a => a.id === 'asc5' && a.owned);
    if (ultimateCPS) cps *= ultimateCPS.effect;
    return cps;
  }, []);

  const calculatePrestigeGain = useCallback((state: GameState) => {
    let baseGain = Math.floor(state.lifetimeClicks / 1_000_000);
    const prestigeMulti = state.ascensionTree.find(a => a.owned && (a.type === 'prestigeMulti'));
    if (prestigeMulti) baseGain *= prestigeMulti.effect;
    return baseGain;
  }, []);

  const calculateAscensionGain = useCallback((state: GameState) => {
    return Math.floor(Math.sqrt(state.totalPrestigePoints / 100));
  }, []);

  const getUpgradeCost = useCallback((upgrade: Upgrade) => {
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.owned));
  }, []);

  // ----------------- Action Functions -----------------
  const buySkillNode = useCallback((id: string) => {
    setGameState(prev => {
      const node = prev.skillTree.find(n => n.id === id);
      if (!node || node.owned || prev.prestigePoints < node.cost) return prev;
      const newSkillTree = prev.skillTree.map(n => n.id === id ? { ...n, owned: true } : n);
      const newState = { ...prev, skillTree: newSkillTree, prestigePoints: prev.prestigePoints - node.cost };
      return { ...newState, clickPower: calculateClickPower(newState), cps: calculateCPS(newState) };
    });
  }, [calculateClickPower, calculateCPS]);

  const buyAscensionNode = useCallback((id: string) => {
    setGameState(prev => {
      const node = prev.ascensionTree.find(n => n.id === id);
      if (!node || node.owned || prev.ascensionPoints < node.cost) return prev;
      const newAscensionTree = prev.ascensionTree.map(n => n.id === id ? { ...n, owned: true } : n);
      return { ...prev, ascensionTree: newAscensionTree, ascensionPoints: prev.ascensionPoints - node.cost };
    });
  }, []);

  const setFormula = useCallback((formula: string) => {}, []);
  const saveGame = useCallback(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState)), [gameState]);
  const resetGame = useCallback(() => { if (confirm('Reset all progress?')) { localStorage.removeItem(STORAGE_KEY); setGameState(getInitialState()); }}, []);

  const handleClick = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      clicks: prev.clicks + prev.clickPower,
      lifetimeClicks: prev.lifetimeClicks + prev.clickPower,
    }));
  }, []);

  const buyUpgrade = useCallback((id: string) => {
    setGameState(prev => {
      const upgrade = prev.upgrades.find(u => u.id === id);
      if (!upgrade) return prev;
      const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.owned));
      if (prev.clicks < cost) return prev;
      const newUpgrades = prev.upgrades.map(u => u.id === id ? { ...u, owned: u.owned + 1 } : u);
      const newState = { ...prev, upgrades: newUpgrades, clicks: prev.clicks - cost };
      return { ...newState, clickPower: calculateClickPower(newState), cps: calculateCPS(newState) };
    });
  }, [calculateClickPower, calculateCPS]);

  const prestige = useCallback(() => {
    setGameState(prev => {
      const gain = calculatePrestigeGain(prev);
      if (gain <= 0) return prev;
      return { ...getInitialState(), prestigePoints: prev.prestigePoints + gain, totalPrestigePoints: prev.totalPrestigePoints + gain };
    });
  }, [calculatePrestigeGain]);

  const ascend = useCallback(() => {
    setGameState(prev => {
      const gain = calculateAscensionGain(prev);
      if (gain <= 0) return prev;
      return { ...getInitialState(), ascensionPoints: prev.ascensionPoints + gain, totalAscensionPoints: prev.totalAscensionPoints + gain };
    });
  }, [calculateAscensionGain]);

  // Auto-clicker loop & stats tracking
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      setGameState(prev => {
        const newClicks = prev.clicks + prev.cps * delta;
        const newLifetime = prev.lifetimeClicks + prev.cps * delta;
        const newBestCPS = Math.max(prev.stats.bestCPS, prev.cps);
        const shouldAddHistory = prev.stats.cpsHistory.length === 0 || now - (prev.stats.cpsHistory[prev.stats.cpsHistory.length - 1]?.time || 0) > 10000;
        const newCpsHistory = shouldAddHistory ? [...prev.stats.cpsHistory.slice(-50), { time: now, cps: prev.cps }] : prev.stats.cpsHistory;
        const newClicksHistory = shouldAddHistory ? [...prev.stats.clicksHistory.slice(-50), { time: now, clicks: newLifetime }] : prev.stats.clicksHistory;
        return { ...prev, clicks: newClicks, lifetimeClicks: newLifetime, stats: { ...prev.stats, totalPlaytime: prev.stats.totalPlaytime + delta, bestCPS: newBestCPS, cpsHistory: newCpsHistory, clicksHistory: newClicksHistory } };
      });
    }, 100);
    return () => clearInterval(interval);
  }, []);

  // Auto-save
  useEffect(() => {
    const interval = setInterval(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState)), 30000);
    return () => clearInterval(interval);
  }, [gameState]);

  return { gameState, handleClick, buyUpgrade, buySkillNode, buyAscensionNode, prestige, ascend, setFormula, saveGame, resetGame, getUpgradeCost, calculatePrestigeGain, calculateAscensionGain };
}

// ----------------- Initial Data -----------------
const initialUpgrades: Upgrade[] = [
  { id: 'energy', name: '⚡ Energy Drink', description: '+5 click power', baseCost: 100, costMultiplier: 1.25, owned: 0, effect: 5, type: 'clickPower' },
  { id: 'superClick', name: 'Super Click', description: '+15 click power', baseCost: 1000, costMultiplier: 1.3, owned: 0, effect: 15, type: 'clickPower' },
  { id: 'megaClick', name: 'Mega Click', description: '+50 click power', baseCost: 5000, costMultiplier: 1.35, owned: 0, effect: 50, type: 'clickPower' },
  { id: 'sean', name: "💜 Sean's Love", description: '+1 auto-clicker', baseCost: 500, costMultiplier: 1.3, owned: 0, effect: 1, type: 'autoClicker' },
  { id: 'megaAuto', name: 'Mega Auto', description: '+5 auto-clickers', baseCost: 2000, costMultiplier: 1.35, owned: 0, effect: 5, type: 'autoClicker' },
  { id: 'ultraAuto', name: 'Ultra Auto', description: '+20 auto-clickers', baseCost: 10000, costMultiplier: 1.4, owned: 0, effect: 20, type: 'autoClicker' },
];

const initialSkillTree: SkillNode[] = [
  { id: 'a', name: 'Click Fury', description: '2x click power', cost: 1, owned: false, effect: 2, type: 'clickMulti' },
  { id: 'b', name: 'Auto Boost', description: '1.5x auto-clickers', cost: 2, owned: false, effect: 1.5, type: 'cpsBoost' },
  { id: 'c', name: 'Click Overdrive', description: '5x click power', cost: 5, owned: false, effect: 5, type: 'clickMulti' },
  { id: 'd', name: 'CPS Surge', description: '2x auto-clickers', cost: 10, owned: false, effect: 2, type: 'cpsBoost' },
];

const initialAscensionTree: AscensionNode[] = [
  { id: 'asc1', name: 'Prestige Master', description: '2x prestige gain', cost: 1, owned: false, effect: 2, type: 'prestigeMulti' },
  { id: 'asc2', name: 'Universal Power', description: '3x all production', cost: 2, owned: false, effect: 3, type: 'allMulti' },
  { id: 'asc3', name: 'Mega Prestige', description: '5x prestige gain', cost: 5, owned: false, effect: 5, type: 'prestigeMulti' },
  { id: 'asc4', name: 'Hyper Ascension', description: '10x all production', cost: 10, owned: false, effect: 10, type: 'allMulti' },
  { id: 'asc5', name: 'Ultimate CPS', description: '20x auto-clicker output', cost: 15, owned: false, effect: 20, type: 'ultimateCPS' },
];

function createInitialAchievements(): Achievement[] {
  return [
    { id: 'first_click', name: 'First Click', description: 'Click for the first time', icon: '👆', unlocked: false, condition: s => s.lifetimeClicks >= 1 },
  ];
}
