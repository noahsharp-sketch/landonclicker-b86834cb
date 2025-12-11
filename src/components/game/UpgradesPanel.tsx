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
  selectedFormula: number;
  achievements: Achievement[];
}

const initialUpgrades: Upgrade[] = [
  // Click Power Upgrades
  { id: 'energy', name: '⚡ Energy Drink', description: '+2 click power', baseCost: 100, costMultiplier: 1.15, owned: 0, effect: 2, type: 'clickPower' },
  { id: 'bear', name: '🐻 Bear', description: '+4 click power', baseCost: 10000, costMultiplier: 1.2, owned: 0, effect: 4, type: 'clickPower' },
  { id: 'quartzip', name: '🧥 Quarter Zip', description: '+10 click power', baseCost: 1000000, costMultiplier: 1.25, owned: 0, effect: 10, type: 'clickPower' },
  { id: 'hacker', name: '💻 Hacker', description: '+30 click power', baseCost: 100000000, costMultiplier: 1.3, owned: 0, effect: 30, type: 'clickPower' },
  { id: 'rocket', name: '🚀 Rocket', description: '+100 click power', baseCost: 10000000000, costMultiplier: 1.35, owned: 0, effect: 100, type: 'clickPower' },
  { id: 'galaxy', name: '🌌 Galaxy', description: '+500 click power', baseCost: 1000000000000, costMultiplier: 1.4, owned: 0, effect: 500, type: 'clickPower' },
  { id: 'universe', name: '🌀 Universe', description: '+2000 click power', baseCost: 100000000000000, costMultiplier: 1.45, owned: 0, effect: 2000, type: 'clickPower' },
  // Auto-Clickers (CPS based on clickPower)
  { id: 'sean', name: "💜 Sean's Love", description: '+1x click power per second', baseCost: 1000, costMultiplier: 1.15, owned: 0, effect: 1, type: 'autoClicker' },
  { id: 'benicio', name: "💖 Benicio's Love", description: '+3x click power per second', baseCost: 100000, costMultiplier: 1.2, owned: 0, effect: 3, type: 'autoClicker' },
  { id: 'robot', name: '🤖 Robot Helper', description: '+10x click power per second', baseCost: 10000000, costMultiplier: 1.25, owned: 0, effect: 10, type: 'autoClicker' },
  { id: 'ai', name: '🧠 AI Assistant', description: '+50x click power per second', baseCost: 1000000000, costMultiplier: 1.3, owned: 0, effect: 50, type: 'autoClicker' },
  { id: 'quantum', name: '⚛️ Quantum Clicker', description: '+200x click power per second', baseCost: 100000000000, costMultiplier: 1.35, owned: 0, effect: 200, type: 'autoClicker' },
  { id: 'singularity', name: '🕳️ Singularity', description: '+1000x click power per second', baseCost: 10000000000000, costMultiplier: 1.4, owned: 0, effect: 1000, type: 'autoClicker' },
];

const initialSkillTree: SkillNode[] = [
  { id: 'a', name: 'Click Fury', description: '2x click power', cost: 1, owned: false, effect: 2, type: 'clickMulti' },
  { id: 'b', name: 'Auto Boost', description: '1.5x auto-clickers', cost: 2, owned: false, effect: 1.5, type: 'cpsBoost' },
  { id: 'c', name: 'Discount', description: '10% cost reduction', cost: 3, owned: false, effect: 0.9, type: 'costReduction' },
  { id: 'd', name: 'Head Start', description: '+1000 starting clicks', cost: 5, owned: false, effect: 1000, type: 'startingClicks' },
  { id: 'e', name: 'CPS Surge', description: '2x CPS', cost: 10, owned: false, effect: 2, type: 'cpsMulti' },
];

const initialAscensionTree: AscensionNode[] = [
  { id: 'asc1', name: 'Prestige Master', description: '2x prestige gain', cost: 1, owned: false, effect: 2, type: 'prestigeMulti' },
  { id: 'asc2', name: 'Universal Power', description: '3x all production', cost: 2, owned: false, effect: 3, type: 'allMulti' },
  { id: 'asc3', name: 'Mega Discount', description: '25% cost reduction', cost: 3, owned: false, effect: 0.75, type: 'superCost' },
  { id: 'asc4', name: 'Godlike Start', description: '+1M starting clicks', cost: 5, owned: false, effect: 1000000, type: 'megaStart' },
  { id: 'asc5', name: 'Infinite Growth', description: '5x CPS multiplier', cost: 10, owned: false, effect: 5, type: 'ultimateCPS' },
];

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
      selectedFormula: 0,
      achievements: [],
    };
  }

  const calculateClickPower = useCallback((state: GameState) => {
    let power = 1;
    state.upgrades.filter(u => u.type === 'clickPower').forEach(u => power += u.effect * u.owned);
    const clickMulti = state.skillTree.find(s => s.id === 'a' && s.owned);
    if (clickMulti) power *= clickMulti.effect;
    return power;
  }, []);

  const calculateCPS = useCallback((state: GameState) => {
    let cps = 0;
    // CPS now is: autoClicker.effect * clickPower * owned
    state.upgrades.filter(u => u.type === 'autoClicker').forEach(u => {
      cps += u.effect * state.clickPower * u.owned;
    });
    const cpsBoost = state.skillTree.find(s => s.id === 'b' && s.owned);
    if (cpsBoost) cps *= cpsBoost.effect;
    const cpsMulti = state.skillTree.find(s => s.id === 'e' && s.owned);
    if (cpsMulti) cps *= cpsMulti.effect;
    return cps;
  }, []);

  const getUpgradeCost = useCallback((upgrade: Upgrade) => {
    let cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.owned));
    return cost;
  }, []);

  const calculatePrestigeGain = useCallback((state: GameState) => {
    // Fixed formula: lifetimeClicks / 1,000,000
    return Math.floor(state.lifetimeClicks / 1000000);
  }, []);

  const calculateAscensionGain = useCallback((state: GameState) => {
    // Fixed formula: totalPrestigePoints / 100
    return Math.floor(state.totalPrestigePoints / 100);
  }, []);

  const buyUpgrade = useCallback((upgradeId: string) => {
    setGameState(prev => {
      const upgrade = prev.upgrades.find(u => u.id === upgradeId);
      if (!upgrade) return prev;
      const cost = getUpgradeCost(upgrade);
      if (prev.clicks < cost) return prev;

      const newUpgrades = prev.upgrades.map(u => u.id === upgradeId ? { ...u, owned: u.owned + 1 } : u);
      const newState = { ...prev, clicks: prev.clicks - cost, upgrades: newUpgrades };
      return { ...newState, clickPower: calculateClickPower(newState), cps: calculateCPS(newState) };
    });
  }, [getUpgradeCost, calculateClickPower, calculateCPS]);

  const handleClick = useCallback(() => {
    setGameState(prev => ({ ...prev, clicks: prev.clicks + prev.clickPower, lifetimeClicks: prev.lifetimeClicks + prev.clickPower }));
  }, []);

  // Auto-clicker tick
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      setGameState(prev => {
        if (prev.cps <= 0) return prev;
        const gained = prev.cps * delta;
        return { ...prev, clicks: prev.clicks + gained, lifetimeClicks: prev.lifetimeClicks + gained };
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return {
    gameState,
    handleClick,
    buyUpgrade,
    calculateClickPower,
    calculateCPS,
    getUpgradeCost,
    calculatePrestigeGain,
    calculateAscensionGain,
  };
}
