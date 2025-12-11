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

export interface GameState {
  clicks: number;
  lifetimeClicks: number;
  clickPower: number;
  cps: number;
  prestigePoints: number;
  totalPrestigePoints: number;
  upgrades: Upgrade[];
  skillTree: SkillNode[];
  selectedFormula: number;
}

const initialUpgrades: Upgrade[] = [
  { id: 'energy', name: '⚡ Energy Drink', description: '+2 click power', baseCost: 100, costMultiplier: 1.15, owned: 0, effect: 2, type: 'clickPower' },
  { id: 'bear', name: '🐻 Bear', description: '+4 click power', baseCost: 10000, costMultiplier: 1.2, owned: 0, effect: 4, type: 'clickPower' },
  { id: 'quartzip', name: '🧥 Quarter Zip', description: '+10 click power', baseCost: 1000000, costMultiplier: 1.25, owned: 0, effect: 10, type: 'clickPower' },
  { id: 'hacker', name: '💻 Hacker', description: '+30 click power', baseCost: 100000000, costMultiplier: 1.3, owned: 0, effect: 30, type: 'clickPower' },
  { id: 'sean', name: '💜 Sean\'s Love', description: '+1 CPS', baseCost: 1000, costMultiplier: 1.15, owned: 0, effect: 1, type: 'autoClicker' },
  { id: 'benicio', name: '💖 Benicio\'s Love', description: '+3 CPS', baseCost: 100000000, costMultiplier: 1.2, owned: 0, effect: 3, type: 'autoClicker' },
];

const initialSkillTree: SkillNode[] = [
  { id: 'a', name: 'Click Fury', description: '2x click power', cost: 1, owned: false, effect: 2, type: 'clickMulti' },
  { id: 'b', name: 'Auto Boost', description: '1.5x auto-clickers', cost: 2, owned: false, effect: 1.5, type: 'cpsBoost' },
  { id: 'c', name: 'Discount', description: '10% cost reduction', cost: 3, owned: false, effect: 0.9, type: 'costReduction' },
  { id: 'd', name: 'Head Start', description: '+1000 starting clicks', cost: 5, owned: false, effect: 1000, type: 'startingClicks' },
  { id: 'e', name: 'CPS Surge', description: '2x CPS', cost: 10, owned: false, effect: 2, type: 'cpsMulti' },
];

const STORAGE_KEY = 'landon-clicker-save';

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
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
      upgrades: initialUpgrades,
      skillTree: initialSkillTree,
      selectedFormula: 0,
    };
  }

  const calculateClickPower = useCallback((state: GameState) => {
    let power = 1;
    state.upgrades.filter(u => u.type === 'clickPower').forEach(u => {
      power += u.effect * u.owned;
    });
    const clickMulti = state.skillTree.find(s => s.id === 'a' && s.owned);
    if (clickMulti) power *= clickMulti.effect;
    return power;
  }, []);

  const calculateCPS = useCallback((state: GameState) => {
    let cps = 0;
    state.upgrades.filter(u => u.type === 'autoClicker').forEach(u => {
      cps += u.effect * u.owned;
    });
    const cpsBoost = state.skillTree.find(s => s.id === 'b' && s.owned);
    if (cpsBoost) cps *= cpsBoost.effect;
    const cpsMulti = state.skillTree.find(s => s.id === 'e' && s.owned);
    if (cpsMulti) cps *= cpsMulti.effect;
    return cps;
  }, []);

  const getUpgradeCost = useCallback((upgrade: Upgrade, state: GameState) => {
    let cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.owned));
    const costReduction = state.skillTree.find(s => s.id === 'c' && s.owned);
    if (costReduction) cost = Math.floor(cost * costReduction.effect);
    return cost;
  }, []);

  const handleClick = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      clicks: prev.clicks + prev.clickPower,
      lifetimeClicks: prev.lifetimeClicks + prev.clickPower,
    }));
  }, []);

  const buyUpgrade = useCallback((upgradeId: string) => {
    setGameState(prev => {
      const upgrade = prev.upgrades.find(u => u.id === upgradeId);
      if (!upgrade) return prev;
      const cost = getUpgradeCost(upgrade, prev);
      if (prev.clicks < cost) return prev;

      const newUpgrades = prev.upgrades.map(u =>
        u.id === upgradeId ? { ...u, owned: u.owned + 1 } : u
      );

      const newState = {
        ...prev,
        clicks: prev.clicks - cost,
        upgrades: newUpgrades,
      };

      return {
        ...newState,
        clickPower: calculateClickPower(newState),
        cps: calculateCPS(newState),
      };
    });
  }, [getUpgradeCost, calculateClickPower, calculateCPS]);

  const buySkillNode = useCallback((nodeId: string) => {
    setGameState(prev => {
      const node = prev.skillTree.find(n => n.id === nodeId);
      if (!node || node.owned || prev.prestigePoints < node.cost) return prev;

      const newSkillTree = prev.skillTree.map(n =>
        n.id === nodeId ? { ...n, owned: true } : n
      );

      const newState = {
        ...prev,
        prestigePoints: prev.prestigePoints - node.cost,
        skillTree: newSkillTree,
      };

      return {
        ...newState,
        clickPower: calculateClickPower(newState),
        cps: calculateCPS(newState),
      };
    });
  }, [calculateClickPower, calculateCPS]);

  const calculatePrestigeGain = useCallback((state: GameState) => {
    const formulas = [
      Math.floor(Math.sqrt(state.lifetimeClicks / 1000000)),
      Math.floor(Math.log10(Math.max(1, state.lifetimeClicks)) - 5),
      Math.floor(state.cps / 10),
      state.upgrades.reduce((sum, u) => sum + u.owned, 0),
    ];
    return Math.max(0, formulas[state.selectedFormula] || 0);
  }, []);

  const prestige = useCallback(() => {
    setGameState(prev => {
      const gain = calculatePrestigeGain(prev);
      if (gain <= 0) return prev;

      const startingClicks = prev.skillTree.find(s => s.id === 'd' && s.owned);
      const startClicks = startingClicks ? startingClicks.effect : 0;

      return {
        ...prev,
        clicks: startClicks,
        lifetimeClicks: 0,
        upgrades: initialUpgrades,
        prestigePoints: prev.prestigePoints + gain,
        totalPrestigePoints: prev.totalPrestigePoints + gain,
        clickPower: calculateClickPower({ ...prev, upgrades: initialUpgrades }),
        cps: calculateCPS({ ...prev, upgrades: initialUpgrades }),
      };
    });
  }, [calculatePrestigeGain, calculateClickPower, calculateCPS]);

  const setFormula = useCallback((index: number) => {
    setGameState(prev => ({ ...prev, selectedFormula: index }));
  }, []);

  const saveGame = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
  }, [gameState]);

  const resetGame = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setGameState(getInitialState());
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
        return {
          ...prev,
          clicks: prev.clicks + gained,
          lifetimeClicks: prev.lifetimeClicks + gained,
        };
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Auto-save every 30 seconds
  useEffect(() => {
    const interval = setInterval(saveGame, 30000);
    return () => clearInterval(interval);
  }, [saveGame]);

  // Save on unload
  useEffect(() => {
    window.addEventListener('beforeunload', saveGame);
    return () => window.removeEventListener('beforeunload', saveGame);
  }, [saveGame]);

  // Update derived stats when upgrades change
  useEffect(() => {
    setGameState(prev => ({
      ...prev,
      clickPower: calculateClickPower(prev),
      cps: calculateCPS(prev),
    }));
  }, [calculateClickPower, calculateCPS]);

  return {
    gameState,
    handleClick,
    buyUpgrade,
    buySkillNode,
    prestige,
    setFormula,
    saveGame,
    resetGame,
    getUpgradeCost,
    calculatePrestigeGain,
  };
}
