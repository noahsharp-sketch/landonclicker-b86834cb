import { useState, useEffect, useCallback } from 'react';

// --- Interfaces ---
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

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  condition: (s: GameState) => boolean;
}

export interface PrestigeNode {
  id: string;
  name: string;
  cost: number;
  effectDescription: string;
  owned: boolean;
  type: 'clickPowerMulti' | 'autoClickerMulti' | 'costReduction';
  effect: number;
}

export interface AscensionNode {
  id: string;
  name: string;
  cost: number;
  effectDescription: string;
  owned: boolean;
  type: 'allMulti' | 'startingClicks';
  effect: number;
}

export interface GameState {
  clicks: number;
  lifetimeClicks: number;
  clickPower: number;
  upgrades: Upgrade[];
  achievements: Achievement[];
  prestigePoints: number;
  totalPrestigePoints: number;
  prestigeTree: PrestigeNode[];
  ascensionTree: AscensionNode[];
}

// --- Initial Data ---
const initialUpgrades: Upgrade[] = [
  { id: 'energy', name: '⚡ Energy Drink', description: '+2 click power', baseCost: 100, costMultiplier: 1.15, owned: 0, effect: 2, type: 'clickPower' },
  { id: 'bear', name: '🐻 Bear', description: '+4 click power', baseCost: 10000, costMultiplier: 1.2, owned: 0, effect: 4, type: 'clickPower' },
  { id: 'sean', name: "💜 Sean's Love", description: '+1 auto-clicker', baseCost: 1000, costMultiplier: 1.15, owned: 0, effect: 1, type: 'autoClicker' },
  { id: 'robot', name: '🤖 Robot Helper', description: '+10 auto-clicker', baseCost: 1000000, costMultiplier: 1.25, owned: 0, effect: 10, type: 'autoClicker' },
];

const createAchievements = (): Achievement[] => [
  { id: 'first_click', name: 'First Click', description: 'Click for the first time', icon: '👆', unlocked: false, condition: s => s.lifetimeClicks >= 1 },
  { id: 'click_10', name: 'Clicker', description: 'Reach 10 clicks', icon: '💯', unlocked: false, condition: s => s.lifetimeClicks >= 10 },
  { id: 'prestige_1', name: 'Prestige Starter', description: 'Prestige for the first time', icon: '✨', unlocked: false, condition: s => s.totalPrestigePoints >= 1 },
];

const initialPrestigeNodes: PrestigeNode[] = [
  { id: 'clickMulti', name: 'Click Power Booster', cost: 1, effectDescription: '2x click power', owned: false, type: 'clickPowerMulti', effect: 2 },
  { id: 'autoBoost', name: 'Auto-Clicker Boost', cost: 2, effectDescription: '1.5x auto-clickers', owned: false, type: 'autoClickerMulti', effect: 1.5 },
  { id: 'discount', name: 'Shop Discount', cost: 3, effectDescription: '10% cheaper upgrades', owned: false, type: 'costReduction', effect: 0.9 },
];

const initialAscensionNodes: AscensionNode[] = [
  { id: 'allMulti', name: 'Universal Power', cost: 2, effectDescription: '3x all production', owned: false, type: 'allMulti', effect: 3 },
  { id: 'megaStart', name: 'Godlike Start', cost: 5, effectDescription: '+1,000,000 starting clicks', owned: false, type: 'startingClicks', effect: 1000000 },
];

// --- Hook ---
export function useGameState() {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem('clicker-save');
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        return { ...getInitialState(), ...parsed };
      } catch {}
    }
    return getInitialState();
  });

  function getInitialState(): GameState {
    return {
      clicks: 0,
      lifetimeClicks: 0,
      clickPower: 1,
      upgrades: initialUpgrades,
      achievements: createAchievements(),
      prestigePoints: 0,
      totalPrestigePoints: 0,
      prestigeTree: initialPrestigeNodes,
      ascensionTree: initialAscensionNodes,
    };
  }

  const calcClickPower = (state: GameState) => {
    let cp = 1 + state.upgrades.filter(u => u.type === 'clickPower').reduce((a, u) => a + u.effect * u.owned, 0);
    state.prestigeTree.filter(n => n.owned && n.type === 'clickPowerMulti').forEach(n => cp *= n.effect);
    state.ascensionTree.filter(n => n.owned && n.type === 'allMulti').forEach(n => cp *= n.effect);
    return cp;
  };

  const totalAutoClickers = (state: GameState) => {
    let total = state.upgrades.filter(u => u.type === 'autoClicker').reduce((a, u) => a + u.effect * u.owned, 0);
    state.prestigeTree.filter(n => n.owned && n.type === 'autoClickerMulti').forEach(n => total *= n.effect);
    state.ascensionTree.filter(n => n.owned && n.type === 'allMulti').forEach(n => total *= n.effect);
    return total;
  };

  const updateState = useCallback((fn: (s: GameState) => GameState) => {
    setGameState(prev => {
      const s = fn(prev);
      return { ...s, clickPower: calcClickPower(s) };
    });
  }, []);

  const checkAchievements = (state: GameState) =>
    state.achievements.map(a => a.unlocked ? a : a.condition(state) ? { ...a, unlocked: true } : a);

  const handleClick = () => updateState(s => {
    const clicks = s.clicks + s.clickPower;
    const lifetimeClicks = s.lifetimeClicks + s.clickPower;
    return { ...s, clicks, lifetimeClicks, achievements: checkAchievements({ ...s, clicks, lifetimeClicks }) };
  });

  const buyUpgrade = (id: string) => updateState(s => {
    const u = s.upgrades.find(up => up.id === id);
    if (!u) return s;
    const cost = Math.floor(u.baseCost * Math.pow(u.costMultiplier, u.owned) *
      s.prestigeTree.filter(n => n.owned && n.type === 'costReduction').reduce((a, n) => a * n.effect, 1));
    if (s.clicks < cost) return s;
    return { ...s, clicks: s.clicks - cost, upgrades: s.upgrades.map(up => up.id === id ? { ...up, owned: up.owned + 1 } : up) };
  });

  const buyPrestigeNode = (id: string) => updateState(s => {
    const n = s.prestigeTree.find(p => p.id === id);
    if (!n || n.owned || s.prestigePoints < n.cost) return s;
    return { ...s, prestigePoints: s.prestigePoints - n.cost, prestigeTree: s.prestigeTree.map(p => p.id === id ? { ...p, owned: true } : p) };
  });

  const buyAscensionNode = (id: string) => updateState(s => {
    const n = s.ascensionTree.find(a => a.id === id);
    if (!n || n.owned || s.prestigePoints < n.cost) return s;
    return { ...s, prestigePoints: s.prestigePoints - n.cost, ascensionTree: s.ascensionTree.map(a => a.id === id ? { ...a, owned: true } : a) };
  });

  const prestige = () => updateState(s => {
    const gain = Math.floor(s.lifetimeClicks / 1000000);
    if (gain <= 0) return s;
    const startClicks = s.ascensionTree.filter(a => a.owned && a.type === 'startingClicks').reduce((a, n) => a + n.effect, 0);
    return { ...getInitialState(), prestigePoints: s.prestigePoints + gain, totalPrestigePoints: s.totalPrestigePoints + gain, clicks: startClicks, prestigeTree: s.prestigeTree, ascensionTree: s.ascensionTree, achievements: checkAchievements({ ...s, totalPrestigePoints: s.totalPrestigePoints + gain }) };
  });

  const resetGame = () => { localStorage.removeItem('clicker-save'); setGameState(getInitialState()); };

  useEffect(() => {
    const interval = setInterval(() => {
      updateState(s => {
        const gained = totalAutoClickers(s) * s.clickPower * 0.1;
        const clicks = s.clicks + gained;
        const lifetimeClicks = s.lifetimeClicks + gained;
        return { ...s, clicks, lifetimeClicks, achievements: checkAchievements({ ...s, clicks, lifetimeClicks }) };
      });
    }, 100);
    return () => clearInterval(interval);
  }, [updateState]);

  useEffect(() => {
    const save = () => localStorage.setItem('clicker-save', JSON.stringify(gameState));
    const interval = setInterval(save, 30000);
    window.addEventListener('beforeunload', save);
    return () => { clearInterval(interval); window.removeEventListener('beforeunload', save); };
  }, [gameState]);

  return { gameState, handleClick, buyUpgrade, buyPrestigeNode, buyAscensionNode, prestige, resetGame };
}
