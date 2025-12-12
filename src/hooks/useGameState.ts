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
    };
  }

  // ----------------- Calculation Functions -----------------

  const calculateClickPower = useCallback((state: GameState) => {
    let power = 1;
    state.upgrades.filter(u => u.type === 'clickPower').forEach(u => {
      // enhanced scaling: each upgrade owned increases effect exponentially
      power += u.effect * Math.pow(1.5, u.owned - 1 || 0);
    });
    const clickMulti = state.skillTree.find(s => s.id === 'a' && s.owned);
    if (clickMulti) power *= clickMulti.effect;
    return power;
  }, []);

  const calculateCPS = useCallback((state: GameState) => {
    let cps = 0;
    state.upgrades.filter(u => u.type === 'autoClicker').forEach(u => {
      // enhanced scaling: each auto-clicker gives exponentially more CPS
      cps += u.effect * Math.pow(1.6, u.owned - 1 || 0) * state.clickPower;
    });
    const cpsBoost = state.skillTree.find(s => s.id === 'b' && s.owned);
    if (cpsBoost) cps *= cpsBoost.effect;
    return cps;
  }, []);

  const calculatePrestigeGain = useCallback((state: GameState) => {
    return Math.floor(state.lifetimeClicks / 500_000); // more generous
  }, []);

  const calculateAscensionGain = useCallback((state: GameState) => {
    return Math.floor(Math.sqrt(state.totalPrestigePoints / 50)); // more generous
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
      return {
        ...getInitialState(),
        prestigePoints: prev.prestigePoints + gain,
        totalPrestigePoints: prev.totalPrestigePoints + gain,
      };
    });
  }, [calculatePrestigeGain]);

  const ascend = useCallback(() => {
    setGameState(prev => {
      const gain = calculateAscensionGain(prev);
      if (gain <= 0) return prev;
      return {
        ...getInitialState(),
        ascensionPoints: prev.ascensionPoints + gain,
        totalAscensionPoints: prev.totalAscensionPoints + gain,
      };
    });
  }, [calculateAscensionGain]);

  // Auto-clicker loop
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      setGameState(prev => ({
        ...prev,
        clicks: prev.clicks + prev.cps * delta,
        lifetimeClicks: prev.lifetimeClicks + prev.cps * delta,
      }));
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Auto-save
  useEffect(() => {
    const interval = setInterval(() => localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState)), 30000);
    return () => clearInterval(interval);
  }, [gameState]);

  return {
    gameState,
    handleClick,
    buyUpgrade,
    buySkillNode,
    buyAscensionNode,
    prestige,
    ascend,
    getUpgradeCost,
    calculatePrestigeGain,
    calculateAscensionGain,
  };
}

// ----------------- Initial Data -----------------

const initialUpgrades: Upgrade[] = [
  { id: 'energy', name: '⚡ Energy Drink', description: '+2 click power', baseCost: 100, costMultiplier: 1.2, owned: 0, effect: 2, type: 'clickPower' },
  { id: 'sean', name: "💜 Sean's Love", description: '+1 auto-clicker', baseCost: 1000, costMultiplier: 1.25, owned: 0, effect: 1, type: 'autoClicker' },
  { id: 'superClick', name: 'Super Click', description: '+5 click power', baseCost: 5000, costMultiplier: 1.3, owned: 0, effect: 5, type: 'clickPower' },
  { id: 'megaAuto', name: 'Mega Auto', description: '+5 auto-clickers', baseCost: 10000, costMultiplier: 1.35, owned: 0, effect: 5, type: 'autoClicker' },
];

const initialSkillTree: SkillNode[] = [
  { id: 'a', name: 'Click Fury', description: '2x click power', cost: 1, owned: false, effect: 2, type: 'clickMulti' },
  { id: 'b', name: 'Auto Boost', description: '1.5x auto-clickers', cost: 2, owned: false, effect: 1.5, type: 'cpsBoost' },
];

const initialAscensionTree: AscensionNode[] = [
  { id: 'asc1', name: 'Prestige Master', description: '2x prestige gain', cost: 1, owned: false, effect: 2, type: 'prestigeMulti' },
  { id: 'asc2', name: 'Universal Power', description: '3x all production', cost: 2, owned: false, effect: 3, type: 'allMulti' },
  { id: 'asc3', name: 'Mega Clicks', description: '5x click power', cost: 5, owned: false, effect: 5, type: 'allMulti' },
  { id: 'asc4', name: 'Ultimate CPS', description: '5x CPS', cost: 5, owned: false, effect: 5, type: 'allMulti' },
];

function createInitialAchievements(): Achievement[] {
  return [
    { id: 'first_click', name: 'First Click', description: 'Click for the first time', icon: '👆', unlocked: false, condition: s => s.lifetimeClicks >= 1 },
  ];
}
