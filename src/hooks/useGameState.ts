import { useState, useEffect, useCallback, useRef } from 'react';
import {
  initialUpgrades,
  initialSkillTree,
  initialAscensionTree,
  initialTranscendenceTree,
  initialEternityTree,
  createInitialAchievements,
} from '../data/gameData';
import { createInitialQuestState, generateSpecialEvents } from '../data/questData';
import type { GameState } from '../types/types';

const STORAGE_KEY = 'landon-clicker-save';
const SAVE_VERSION = 2; // increment if structure changes

function mergeArrayById<T extends { id: string }>(saved: T[], fresh: T[]) {
  const map = new Map<string, T>();
  saved.forEach(item => map.set(item.id, item));
  fresh.forEach(item => {
    if (!map.has(item.id)) map.set(item.id, item);
  });
  return Array.from(map.values());
}

export function useGameState() {
  const lastTickRef = useRef(Date.now());
  const tickCounterRef = useRef(0);
  const [offlineEarnings, setOfflineEarnings] = useState<number | null>(null);

  function getInitialState(): GameState {
    return {
      version: SAVE_VERSION,
      clicks: 0,
      lifetimeClicks: 0,
      clickPower: 1,
      cps: 0,
      prestigePoints: 0,
      totalPrestigePoints: 0,
      ascensionPoints: 0,
      totalAscensionPoints: 0,
      transcendencePoints: 0,
      totalTranscendencePoints: 0,
      eternityPoints: 0,
      totalEternityPoints: 0,
      totalPrestiges: 0,
      totalAscensions: 0,
      totalTranscendences: 0,
      totalEternities: 0,
      upgrades: initialUpgrades,
      skillTree: initialSkillTree,
      ascensionTree: initialAscensionTree,
      transcendenceTree: initialTranscendenceTree,
      eternityTree: initialEternityTree,
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
      questState: createInitialQuestState(),
    };
  }

  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return getInitialState();
    try {
      const parsed = JSON.parse(saved);

      // versioned migration
      if (!parsed.version || parsed.version < SAVE_VERSION) {
        parsed.version = SAVE_VERSION;
        parsed.upgrades = mergeArrayById(parsed.upgrades || [], initialUpgrades);
        parsed.skillTree = mergeArrayById(parsed.skillTree || [], initialSkillTree);
        parsed.ascensionTree = mergeArrayById(parsed.ascensionTree || [], initialAscensionTree);
        parsed.transcendenceTree = mergeArrayById(parsed.transcendenceTree || [], initialTranscendenceTree);
        parsed.eternityTree = mergeArrayById(parsed.eternityTree || [], initialEternityTree);
        parsed.achievements = mergeArrayById(parsed.achievements || [], createInitialAchievements());
        parsed.questState = { ...createInitialQuestState(), ...parsed.questState, events: generateSpecialEvents() };
      }

      const fresh = getInitialState();

      const lastOnline = parsed.stats?.lastOnlineTime || Date.now();
      const offlineSeconds = Math.min((Date.now() - lastOnline) / 1000, 86400);
      const offlineClicks = Math.floor((parsed.cps || 0) * offlineSeconds * 0.5);

      if (offlineClicks > 0) {
        setOfflineEarnings(offlineClicks);
        setTimeout(() => setOfflineEarnings(null), 5000);
      }

      return {
        ...fresh,
        ...parsed,
        clicks: (parsed.clicks || 0) + offlineClicks,
        lifetimeClicks: (parsed.lifetimeClicks || 0) + offlineClicks,
      };
    } catch {
      return getInitialState();
    }
  });

  /** --------------------------
   * Utility Calculations
   * -------------------------- */
  const calculateClickPower = useCallback((state: GameState) => {
    let power = 1;
    state.upgrades.filter(u => u.type === 'clickPower').forEach(u => power += u.effect * u.owned);
    state.skillTree.filter(s => s.owned && s.type === 'clickMulti').forEach(s => power *= s.effect);
    state.transcendenceTree.filter(t => t.owned && ['infinitePower', 'globalMulti'].includes(t.type)).forEach(t => power *= t.effect);
    state.eternityTree.filter(e => e.owned && e.type === 'omnipotent').forEach(e => power *= e.effect);
    return power;
  }, []);

  const calculateCPS = useCallback((state: GameState) => {
    let cps = 0;
    state.upgrades.filter(u => u.type === 'autoClicker').forEach(u => cps += u.effect * u.owned * state.clickPower);
    state.skillTree.filter(s => s.owned && ['cpsBoost','cpsMulti'].includes(s.type)).forEach(s => cps *= s.effect);
    state.ascensionTree.filter(a => a.owned && ['allMulti','ultimateCPS'].includes(a.type)).forEach(a => cps *= a.effect);
    state.transcendenceTree.filter(t => t.owned && ['eternityBoost','globalMulti'].includes(t.type)).forEach(t => cps *= t.effect);
    state.eternityTree.filter(e => e.owned && ['infiniteAuto','omnipotent'].includes(e.type)).forEach(e => cps *= e.effect);
    return cps;
  }, []);

  /** --------------------------
   * Quest & Achievement Tracking
   * -------------------------- */
  const checkQuestProgress = useCallback((state: GameState): GameState => {
    const getStat = (type: string) => {
      switch (type) {
        case 'clicks': return state.clicks;
        case 'lifetimeClicks': return state.lifetimeClicks;
        case 'cps': return state.cps;
        case 'clickPower': return state.clickPower;
        case 'upgrades': return state.upgrades.reduce((sum, u) => sum + u.owned, 0);
        case 'prestiges': return state.totalPrestiges;
        case 'ascensions': return state.totalAscensions;
        case 'transcendences': return state.totalTranscendences;
        case 'eternities': return state.totalEternities;
        case 'autoClicker': return state.upgrades.find(u => u.type === 'autoClicker')?.owned || 0;
        default: return 0;
      }
    };

    const updateSteps = (steps: any[]) =>
      steps.map(step => ({ ...step, current: step.type === 'specialEvent' ? (state.questState.events.find(e=>e.id===step.eventId)?.completed?1:0) : getStat(step.type) }));

    const updateQuestArray = (quests: any[]) =>
      quests.map(q => {
        const steps = updateSteps(q.steps);
        const completed = steps.every(s => s.current >= s.target);
        const currentStep = steps.findIndex(s => s.current < s.target);
        return { ...q, steps, completed, currentStep: currentStep === -1 ? steps.length-1 : currentStep };
      });

    return {
      ...state,
      questState: {
        ...state.questState,
        quests: updateQuestArray(state.questState.quests),
        dailyQuests: updateQuestArray(state.questState.dailyQuests),
        weeklyQuests: updateQuestArray(state.questState.weeklyQuests),
        events: updateQuestArray(state.questState.events),
      },
    };
  }, []);

  /** --------------------------
   * Core Actions
   * -------------------------- */
  const handleClick = useCallback(() => {
    setGameState(prev => {
      const newState = { ...prev, clicks: prev.clicks + prev.clickPower, lifetimeClicks: prev.lifetimeClicks + prev.clickPower };
      return checkQuestProgress(newState);
    });
  }, [checkQuestProgress]);

  const buyUpgrade = useCallback((id: string) => {
    setGameState(prev => {
      const upgrade = prev.upgrades.find(u => u.id === id);
      if (!upgrade) return prev;
      const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.owned));
      if (prev.clicks < cost) return prev;
      const newState = {
        ...prev,
        upgrades: prev.upgrades.map(u => u.id === id ? { ...u, owned: u.owned + 1 } : u),
        clicks: prev.clicks - cost,
      };
      return { ...newState, clickPower: calculateClickPower(newState), cps: calculateCPS(newState) };
    });
  }, [calculateClickPower, calculateCPS]);

  const buyUpgradeBulk = useCallback((id: string, amount: number | 'MAX') => {
    setGameState(prev => {
      const upgrade = prev.upgrades.find(u => u.id === id);
      if (!upgrade) return prev;

      let owned = upgrade.owned;
      let clicks = prev.clicks;
      let bought = 0;
      let toBuy = amount === 'MAX' ? Infinity : amount;

      while (bought < toBuy) {
        const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, owned));
        if (clicks < cost) break;
        clicks -= cost;
        owned++;
        bought++;
      }

      if (bought === 0) return prev;

      const newState = {
        ...prev,
        upgrades: prev.upgrades.map(u => u.id === id ? { ...u, owned } : u),
        clicks,
      };
      return { ...newState, clickPower: calculateClickPower(newState), cps: calculateCPS(newState) };
    });
  }, [calculateClickPower, calculateCPS]);

  /** --------------------------
   * Main Loop
   * -------------------------- */
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      setGameState(prev => {
        let next = { ...prev, clicks: prev.clicks + prev.cps * delta, lifetimeClicks: prev.lifetimeClicks + prev.cps * delta };
        next = checkQuestProgress(next);
        tickCounterRef.current++;
        return next;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [checkQuestProgress]);

  useEffect(() => {
    const interval = setInterval(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...gameState, stats: { ...gameState.stats, lastOnlineTime: Date.now() } }));
    }, 30000);
    return () => clearInterval(interval);
  }, [gameState]);

  return {
    gameState,
    handleClick,
    buyUpgrade,
    buyUpgradeBulk,
    checkQuestProgress,
  };
}
