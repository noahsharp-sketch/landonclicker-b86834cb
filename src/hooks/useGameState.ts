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
  // Auto-Clickers
  { id: 'sean', name: "💜 Sean's Love", description: '+1 CPS', baseCost: 1000, costMultiplier: 1.15, owned: 0, effect: 1, type: 'autoClicker' },
  { id: 'benicio', name: "💖 Benicio's Love", description: '+3 CPS', baseCost: 100000, costMultiplier: 1.2, owned: 0, effect: 3, type: 'autoClicker' },
  { id: 'robot', name: '🤖 Robot Helper', description: '+10 CPS', baseCost: 10000000, costMultiplier: 1.25, owned: 0, effect: 10, type: 'autoClicker' },
  { id: 'ai', name: '🧠 AI Assistant', description: '+50 CPS', baseCost: 1000000000, costMultiplier: 1.3, owned: 0, effect: 50, type: 'autoClicker' },
  { id: 'quantum', name: '⚛️ Quantum Clicker', description: '+200 CPS', baseCost: 100000000000, costMultiplier: 1.35, owned: 0, effect: 200, type: 'autoClicker' },
  { id: 'singularity', name: '🕳️ Singularity', description: '+1000 CPS', baseCost: 10000000000000, costMultiplier: 1.4, owned: 0, effect: 1000, type: 'autoClicker' },
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

const createInitialAchievements = (): Achievement[] => [
  { id: 'first_click', name: 'First Click', description: 'Click for the first time', icon: '👆', unlocked: false, condition: (s) => s.lifetimeClicks >= 1 },
  { id: 'click_100', name: 'Clicker', description: 'Reach 100 clicks', icon: '💯', unlocked: false, condition: (s) => s.lifetimeClicks >= 100 },
  { id: 'click_10k', name: 'Click Master', description: 'Reach 10,000 clicks', icon: '🎯', unlocked: false, condition: (s) => s.lifetimeClicks >= 10000 },
  { id: 'click_1m', name: 'Click Legend', description: 'Reach 1 million clicks', icon: '🏆', unlocked: false, condition: (s) => s.lifetimeClicks >= 1000000 },
  { id: 'click_1b', name: 'Click God', description: 'Reach 1 billion clicks', icon: '👑', unlocked: false, condition: (s) => s.lifetimeClicks >= 1000000000 },
  { id: 'click_1t', name: 'Beyond Infinity', description: 'Reach 1 trillion clicks', icon: '🌌', unlocked: false, condition: (s) => s.lifetimeClicks >= 1000000000000 },
  { id: 'upgrade_1', name: 'First Purchase', description: 'Buy your first upgrade', icon: '🛒', unlocked: false, condition: (s) => s.upgrades.some(u => u.owned > 0) },
  { id: 'upgrade_10', name: 'Shopper', description: 'Own 10 total upgrades', icon: '🛍️', unlocked: false, condition: (s) => s.upgrades.reduce((sum, u) => sum + u.owned, 0) >= 10 },
  { id: 'upgrade_50', name: 'Collector', description: 'Own 50 total upgrades', icon: '📦', unlocked: false, condition: (s) => s.upgrades.reduce((sum, u) => sum + u.owned, 0) >= 50 },
  { id: 'upgrade_100', name: 'Hoarder', description: 'Own 100 total upgrades', icon: '🏪', unlocked: false, condition: (s) => s.upgrades.reduce((sum, u) => sum + u.owned, 0) >= 100 },
  { id: 'cps_10', name: 'Automation', description: 'Reach 10 CPS', icon: '⚙️', unlocked: false, condition: (s) => s.cps >= 10 },
  { id: 'cps_100', name: 'Factory', description: 'Reach 100 CPS', icon: '🏭', unlocked: false, condition: (s) => s.cps >= 100 },
  { id: 'cps_1000', name: 'Industrial', description: 'Reach 1,000 CPS', icon: '🔧', unlocked: false, condition: (s) => s.cps >= 1000 },
  { id: 'prestige_1', name: 'New Beginning', description: 'Prestige for the first time', icon: '✨', unlocked: false, condition: (s) => s.totalPrestiges >= 1 },
  { id: 'prestige_5', name: 'Veteran', description: 'Prestige 5 times', icon: '⭐', unlocked: false, condition: (s) => s.totalPrestiges >= 5 },
  { id: 'prestige_10', name: 'Master Prestige', description: 'Prestige 10 times', icon: '🌟', unlocked: false, condition: (s) => s.totalPrestiges >= 10 },
  { id: 'ascension_1', name: 'Ascended', description: 'Ascend for the first time', icon: '🔮', unlocked: false, condition: (s) => s.totalAscensionPoints >= 1 },
  { id: 'ascension_5', name: 'Transcendent', description: 'Earn 5 ascension points', icon: '💎', unlocked: false, condition: (s) => s.totalAscensionPoints >= 5 },
  { id: 'power_100', name: 'Powerful', description: 'Reach 100 click power', icon: '💪', unlocked: false, condition: (s) => s.clickPower >= 100 },
  { id: 'power_1000', name: 'Mighty', description: 'Reach 1,000 click power', icon: '🦾', unlocked: false, condition: (s) => s.clickPower >= 1000 },
];

const STORAGE_KEY = 'landon-clicker-save';

export function useGameState() {
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure new fields exist for old saves
        return {
          ...getInitialState(),
          ...parsed,
          upgrades: mergeUpgrades(parsed.upgrades),
          ascensionTree: parsed.ascensionTree || initialAscensionTree,
          achievements: mergeAchievements(parsed.achievements),
          totalPrestiges: parsed.totalPrestiges || 0,
          ascensionPoints: parsed.ascensionPoints || 0,
          totalAscensionPoints: parsed.totalAscensionPoints || 0,
        };
      } catch {
        return getInitialState();
      }
    }
    return getInitialState();
  });

  const lastTickRef = useRef(Date.now());

  function mergeUpgrades(savedUpgrades: Upgrade[] | undefined): Upgrade[] {
    if (!savedUpgrades) return initialUpgrades;
    return initialUpgrades.map(initial => {
      const saved = savedUpgrades.find(s => s.id === initial.id);
      return saved ? { ...initial, owned: saved.owned } : initial;
    });
  }

  function mergeAchievements(savedAchievements: Achievement[] | undefined): Achievement[] {
    const initial = createInitialAchievements();
    if (!savedAchievements) return initial;
    return initial.map(a => {
      const saved = savedAchievements.find(s => s.id === a.id);
      return saved ? { ...a, unlocked: saved.unlocked } : a;
    });
  }

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
      achievements: createInitialAchievements(),
    };
  }

  const getAscensionMultiplier = useCallback((state: GameState, type: AscensionNode['type']) => {
    const node = state.ascensionTree.find(n => n.type === type && n.owned);
    return node ? node.effect : 1;
  }, []);

  const calculateClickPower = useCallback((state: GameState) => {
    let power = 1;
    state.upgrades.filter(u => u.type === 'clickPower').forEach(u => {
      power += u.effect * u.owned;
    });
    const clickMulti = state.skillTree.find(s => s.id === 'a' && s.owned);
    if (clickMulti) power *= clickMulti.effect;
    power *= getAscensionMultiplier(state, 'allMulti');
    return power;
  }, [getAscensionMultiplier]);

  const calculateCPS = useCallback((state: GameState) => {
    let cps = 0;
    state.upgrades.filter(u => u.type === 'autoClicker').forEach(u => {
      cps += u.effect * u.owned;
    });
    const cpsBoost = state.skillTree.find(s => s.id === 'b' && s.owned);
    if (cpsBoost) cps *= cpsBoost.effect;
    const cpsMulti = state.skillTree.find(s => s.id === 'e' && s.owned);
    if (cpsMulti) cps *= cpsMulti.effect;
    cps *= getAscensionMultiplier(state, 'allMulti');
    cps *= getAscensionMultiplier(state, 'ultimateCPS');
    return cps;
  }, [getAscensionMultiplier]);

  const getUpgradeCost = useCallback((upgrade: Upgrade, state: GameState) => {
    let cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.owned));
    const costReduction = state.skillTree.find(s => s.id === 'c' && s.owned);
    if (costReduction) cost = Math.floor(cost * costReduction.effect);
    cost = Math.floor(cost * getAscensionMultiplier(state, 'superCost'));
    return cost;
  }, [getAscensionMultiplier]);

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

  const buyAscensionNode = useCallback((nodeId: string) => {
    setGameState(prev => {
      const node = prev.ascensionTree.find(n => n.id === nodeId);
      if (!node || node.owned || prev.ascensionPoints < node.cost) return prev;

      const newAscensionTree = prev.ascensionTree.map(n =>
        n.id === nodeId ? { ...n, owned: true } : n
      );

      const newState = {
        ...prev,
        ascensionPoints: prev.ascensionPoints - node.cost,
        ascensionTree: newAscensionTree,
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
    let gain = Math.max(0, formulas[state.selectedFormula] || 0);
    gain = Math.floor(gain * getAscensionMultiplier(state, 'prestigeMulti'));
    return gain;
  }, [getAscensionMultiplier]);

  const calculateAscensionGain = useCallback((state: GameState) => {
    return Math.floor(Math.sqrt(state.totalPrestigePoints / 100));
  }, []);

  const prestige = useCallback(() => {
    setGameState(prev => {
      const gain = calculatePrestigeGain(prev);
      if (gain <= 0) return prev;

      const startingClicks = prev.skillTree.find(s => s.id === 'd' && s.owned);
      let startClicks = startingClicks ? startingClicks.effect : 0;
      startClicks += getAscensionMultiplier(prev, 'megaStart') > 1 ? 1000000 : 0;

      return {
        ...prev,
        clicks: startClicks,
        lifetimeClicks: 0,
        upgrades: initialUpgrades.map(u => ({ ...u, owned: 0 })),
        prestigePoints: prev.prestigePoints + gain,
        totalPrestigePoints: prev.totalPrestigePoints + gain,
        totalPrestiges: prev.totalPrestiges + 1,
        clickPower: calculateClickPower({ ...prev, upgrades: initialUpgrades.map(u => ({ ...u, owned: 0 })) }),
        cps: calculateCPS({ ...prev, upgrades: initialUpgrades.map(u => ({ ...u, owned: 0 })) }),
      };
    });
  }, [calculatePrestigeGain, calculateClickPower, calculateCPS, getAscensionMultiplier]);

  const ascend = useCallback(() => {
    setGameState(prev => {
      const gain = calculateAscensionGain(prev);
      if (gain <= 0) return prev;

      return {
        ...getInitialState(),
        ascensionTree: prev.ascensionTree,
        ascensionPoints: prev.ascensionPoints + gain,
        totalAscensionPoints: prev.totalAscensionPoints + gain,
        achievements: prev.achievements,
      };
    });
  }, [calculateAscensionGain]);

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

  // Check achievements
  useEffect(() => {
    setGameState(prev => {
      const newAchievements = prev.achievements.map(a => {
        if (a.unlocked) return a;
        if (a.condition(prev)) return { ...a, unlocked: true };
        return a;
      });
      
      const hasNewUnlock = newAchievements.some((a, i) => a.unlocked && !prev.achievements[i].unlocked);
      if (!hasNewUnlock) return prev;
      
      return { ...prev, achievements: newAchievements };
    });
  }, [gameState.lifetimeClicks, gameState.cps, gameState.clickPower, gameState.totalPrestiges, gameState.totalAscensionPoints]);

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
