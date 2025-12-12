import { useState, useEffect, useCallback, useRef } from 'react';

/* ---------------- MERGE FIX: ensures new upgrades are added safely ---------------- */
function mergeArrayById<T extends { id: string }>(saved: T[], fresh: T[]) {
  const map = new Map<string, T>();

  // Add saved entries
  saved.forEach(item => map.set(item.id, item));

  // Add any new entries (or updated defaults)
  fresh.forEach(item => {
    if (!map.has(item.id)) {
      map.set(item.id, item);
    }
  });

  return Array.from(map.values());
}
/* ------------------------------------------------------------------------------- */

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

  /* ------------ LOAD + MERGE FIX ---------------- */
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
        achievements: mergeArrayById(parsed.achievements || [], fresh.achievements)
      };
    } catch {
      return getInitialState();
    }
  });
  /* --------------------------------------------------- */

  // ----------------- Calculation Functions -----------------
  const calculateClickPower = useCallback((state: GameState) => {
    let power = 1;
    state.upgrades.filter(u => u.type === 'clickPower')
      .forEach(u => power += u.effect * u.owned);
    const clickMulti = state.skillTree.find(s => s.owned && s.type === 'clickMulti');
    if (clickMulti) power *= clickMulti.effect;
    return power;
  }, []);

  const calculateCPS = useCallback((state: GameState) => {
    let cps = 0;
    state.upgrades.filter(u => u.type === 'autoClicker')
      .forEach(u => cps += u.effect * u.owned * state.clickPower);
    const cpsBoost = state.skillTree.find(s => s.owned && s.type === 'cpsBoost');
    if (cpsBoost) cps *= cpsBoost.effect;
    return cps;
  }, []);

  const calculatePrestigeGain = useCallback((state: GameState) => {
    return Math.floor(state.lifetimeClicks / 1_000_000);
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

  const saveGame = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState));
  }, [gameState]);

  const resetGame = useCallback(() => {
    if (confirm('Are you sure you want to reset all progress?')) {
      localStorage.removeItem(STORAGE_KEY);
      setGameState(getInitialState());
    }
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
        upgrades: prev.upgrades,
        skillTree: prev.skillTree,
        ascensionTree: prev.ascensionTree,
        achievements: prev.achievements,
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
        upgrades: prev.upgrades,
        skillTree: prev.skillTree,
        ascensionTree: prev.ascensionTree,
        achievements: prev.achievements,
        ascensionPoints: prev.ascensionPoints + gain,
        totalAscensionPoints: prev.totalAscensionPoints + gain,
      };
    });
  }, [calculateAscensionGain]);

  // ----------------- Auto Clicker + Stats -----------------
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      setGameState(prev => {
        const newClicks = prev.clicks + prev.cps * delta;
        const newLifetime = prev.lifetimeClicks + prev.cps * delta;
        const newBestCPS = Math.max(prev.stats.bestCPS, prev.cps);

        const shouldAddHistory = prev.stats.cpsHistory.length === 0 ||
          now - (prev.stats.cpsHistory[prev.stats.cpsHistory.length - 1]?.time || 0) > 10000;

        const newCpsHistory = shouldAddHistory
          ? [...prev.stats.cpsHistory.slice(-50), { time: now, cps: prev.cps }]
          : prev.stats.cpsHistory;

        const newClicksHistory = shouldAddHistory
          ? [...prev.stats.clicksHistory.slice(-50), { time: now, clicks: newLifetime }]
          : prev.stats.clicksHistory;

        return {
          ...prev,
          clicks: newClicks,
          lifetimeClicks: newLifetime,
          stats: {
            ...prev.stats,
            totalPlaytime: prev.stats.totalPlaytime + delta,
            bestCPS: newBestCPS,
            cpsHistory: newCpsHistory,
            clicksHistory: newClicksHistory,
          },
        };
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Auto-save
  useEffect(() => {
    const interval = setInterval(() =>
      localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState)),
    30000);
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
    setFormula,
    saveGame,
    resetGame,
    getUpgradeCost,
    calculatePrestigeGain,
    calculateAscensionGain,
  };
}

// ----------------- Initial Data -----------------
const initialUpgrades: Upgrade[] = [
  { id: 'energy', name: '⚡ Energy Drink', description: '+2 click power', baseCost: 100, costMultiplier: 1.15, owned: 0, effect: 2, type: 'clickPower' },
  { id: 'sean', name: "💜 Sean's Love", description: '+1 auto-clicker', baseCost: 1000, costMultiplier: 1.15, owned: 0, effect: 1, type: 'autoClicker' },
  { id: 'superClick', name: 'Quarter Zip', description: '+5 click power', baseCost: 5000, costMultiplier: 1.2, owned: 0, effect: 5, type: 'clickPower' },
  { id: 'megaAuto', name: "💕Benicio's love", description: '+5 auto-clickers', baseCost: 10000, costMultiplier: 1.2, owned: 0, effect: 5, type: 'autoClicker' },
  { id: 'hot sauce', name: 'Hot Sauce', description: '+20 click power', baseCost: 20000, costMultiplier: 1.2, owned: 0, effect: 20, type: "clickPower" },
  { id: 'Evil Ben G', name: '😈Evil Ben G', description: '+10 auto-clickers', baseCost: 100000, costMultiplier: 1.2, owned: 0, effect: 10, type: "autoClicker" },
  { id: 'discord mod', name: 'Discord Mod', description: '+100 click power', baseCost: 150000, costMultiplier: 1.2, owned: 0, effect: 100, type: "clickPower" },
  { id: 'macha', name: 'Macha', description: '+500 click power', baseCost: 1000000, costMultiplier: 1.2, owned: 0, effect: 500, type: "clickPower" },
];

const initialSkillTree: SkillNode[] = [
  { id: 'a', name: 'Click Fury', description: '2x click power', cost: 1, owned: false, effect: 2, type: 'clickMulti' },
  { id: 'b', name: 'Auto Boost', description: '1.5x auto-clickers', cost: 2, owned: false, effect: 1.5, type: 'cpsBoost' },
  { id: 'c', name: 'Auto Multi', description: '3x auto-clicker multi', cost: 2, owned: false, effect: 1.5, type: 'cpsMulti' },
];

const initialAscensionTree: AscensionNode[] = [
  { id: 'asc1', name: 'Prestige Master', description: '2x prestige gain', cost: 1, owned: false, effect: 2, type: 'prestigeMulti' },
  { id: 'asc2', name: 'Universal Power', description: '3x all production', cost: 2, owned: false, effect: 3, type: 'allMulti' },
  { id: 'asc3', name: 'Ultimate Clicker', description: '3.5x auto-clickers', cost: 5, owned: false, effect: 3.5, type: 'ultimateCPS' },
];

// ----------------- Tiered Achievements -----------------
function createInitialAchievements(): Achievement[] {
  return [
    // Tier 1: Beginner
    { id: 'first_click', name: 'First Click', description: 'Click for the first time', icon: '👆', unlocked: false, condition: s => s.lifetimeClicks >= 1 },
    { id: 'click_100', name: 'Getting Started', description: 'Reach 100 lifetime clicks', icon: '✋', unlocked: false, condition: s => s.lifetimeClicks >= 100 },
    { id: 'first_upgrade', name: 'First Purchase', description: 'Buy your first upgrade', icon: '🛠️', unlocked: false, condition: s => s.upgrades.some(u => u.owned >= 1) },
    { id: 'play_1_min', name: 'Getting Warmed Up', description: 'Play for 1 minute', icon: '⏱️', unlocked: false, condition: s => s.stats.totalPlaytime >= 60 },

    // Tier 2: Intermediate
    { id: 'click_1000', name: 'Clicker Apprentice', description: 'Reach 1,000 lifetime clicks', icon: '🖐️', unlocked: false, condition: s => s.lifetimeClicks >= 1000 },
    { id: 'upgrade_10', name: 'Collector', description: 'Own 10 upgrades', icon: '📦', unlocked: false, condition: s => s.upgrades.reduce((sum, u) => sum + u.owned, 0) >= 10 },
    { id: 'prestige_1', name: 'Prestige Initiate', description: 'Prestige for the first time', icon: '🏅', unlocked: false, condition: s => s.totalPrestigePoints >= 1 },
    { id: 'power_50', name: 'Powerful Clicks', description: 'Reach 50 click power', icon: '💪', unlocked: false, condition: s => s.clickPower >= 50 },
    { id: 'cps_10', name: 'Automated', description: 'Reach 10 CPS', icon: '🤖', unlocked: false, condition: s => s.cps >= 10 },
    { id: 'play_10_min', name: 'Committed Clicker', description: 'Play for 10 minutes', icon: '🕙', unlocked: false, condition: s => s.stats.totalPlaytime >= 600 },

    // Tier 3: Advanced
    { id: 'click_10000', name: 'Clicking Pro', description: 'Reach 10,000 lifetime clicks', icon: '🤚', unlocked: false, condition: s => s.lifetimeClicks >= 10000 },
    { id: 'upgrade_25', name: 'Super Collector', description: 'Own 25 upgrades', icon: '📦✨', unlocked: false, condition: s => s.upgrades.reduce((sum, u) => sum + u.owned, 0) >= 25 },
    { id: 'prestige_10', name: 'Prestige Veteran', description: 'Accumulate 10 total prestige points', icon: '🎖️', unlocked: false, condition: s => s.totalPrestigePoints >= 10 },
    { id: 'ascend_1', name: 'Ascendant', description: 'Ascend for the first time', icon: '🌟', unlocked: false, condition: s => s.totalAscensionPoints >= 1 },
    { id: 'power_200', name: 'Super Clicker', description: 'Reach 200 click power', icon: '💪⚡', unlocked: false, condition: s => s.clickPower >= 200 },
    { id: 'cps_50', name: 'Autoclicker Commander', description: 'Reach 50 CPS', icon: '🤖⚡', unlocked: false, condition: s => s.cps >= 50 },
    { id: 'click_100000', name: 'Click Master', description: 'Reach 100,000 lifetime clicks', icon: '🖐️✨', unlocked: false, condition: s => s.lifetimeClicks >= 100000 },
    { id: 'upgrade_50', name: 'Ultimate Collector', description: 'Own 50 upgrades', icon: '📦🌟', unlocked: false, condition: s => s.upgrades.reduce((sum, u) => sum + u.owned, 0) >= 50 },
    { id: 'prestige_50', name: 'Prestige Legend', description: 'Accumulate 50 total prestige points', icon: '🏆', unlocked: false, condition: s => s.totalPrestigePoints >= 50 },
    { id: 'ascend_5', name: 'Ascension Expert', description: 'Accumulate 5 total ascension points', icon: '🌠', unlocked: false, condition: s => s.totalAscensionPoints >= 5 },
    { id: 'power_1000', name: 'Click Overlord', description: 'Reach 1,000 click power', icon: '💪🔥', unlocked: false, condition: s => s.clickPower >= 1000 },
    { id: 'cps_200', name: 'Autoclicker Overlord', description: 'Reach 200 CPS', icon: '🤖🔥', unlocked: false, condition: s => s.cps >= 200 },
  ];
}
