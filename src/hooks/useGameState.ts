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
import type { GameState, LeaderboardEntry } from '../types/types';

const STORAGE_KEY = 'landon-clicker-save';

/* ---------------- Merge helpers ---------------- */
function mergeArrayById<T extends { id: string }>(saved: T[], fresh: T[]) {
  const map = new Map<string, T>();
  saved.forEach(item => map.set(item.id, item));
  fresh.forEach(item => { if (!map.has(item.id)) map.set(item.id, item); });
  return Array.from(map.values());
}

/* ---------------- useGameState Hook ---------------- */
export function useGameState() {
  const lastTickRef = useRef(Date.now());
  const tickCounterRef = useRef(0);
  const [offlineEarnings, setOfflineEarnings] = useState<number | null>(null);

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
  });

  /* ---------- Load saved state with offline progress ---------- */
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return getInitialState();

    try {
      const parsed = JSON.parse(saved);
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
        upgrades: mergeArrayById(parsed.upgrades || [], fresh.upgrades),
        skillTree: mergeArrayById(parsed.skillTree || [], fresh.skillTree),
        ascensionTree: mergeArrayById(parsed.ascensionTree || [], fresh.ascensionTree),
        transcendenceTree: mergeArrayById(parsed.transcendenceTree || [], fresh.transcendenceTree),
        eternityTree: mergeArrayById(parsed.eternityTree || [], fresh.eternityTree),
        achievements: mergeArrayById(parsed.achievements || [], fresh.achievements),
        questState: {
          ...fresh.questState,
          ...parsed.questState,
          events: generateSpecialEvents(),
        },
        stats: { ...fresh.stats, ...parsed.stats, lastOnlineTime: Date.now() },
      };
    } catch {
      return getInitialState();
    }
  });

  /* ---------------- Calculations ---------------- */
  const calculateClickPower = useCallback((state: GameState) => {
    let power = 1;
    state.upgrades.filter(u => u.type === 'clickPower').forEach(u => power += u.effect * u.owned);
    state.skillTree.filter(s => s.owned && s.type === 'clickMulti').forEach(s => power *= s.effect);
    state.transcendenceTree.filter(t => t.owned && (t.type === 'infinitePower' || t.type === 'globalMulti')).forEach(t => power *= t.effect);
    state.eternityTree.filter(e => e.owned && e.type === 'omnipotent').forEach(e => power *= e.effect);
    return power;
  }, []);

  const calculateCPS = useCallback((state: GameState) => {
    let cps = 0;
    state.upgrades.filter(u => u.type === 'autoClicker').forEach(u => cps += u.effect * u.owned * state.clickPower);
    state.skillTree.filter(s => s.owned && (s.type === 'cpsBoost' || s.type === 'cpsMulti')).forEach(s => cps *= s.effect);
    state.ascensionTree.filter(a => a.owned && (a.type === 'allMulti' || a.type === 'ultimateCPS')).forEach(a => cps *= a.effect);
    state.transcendenceTree.filter(t => t.owned && (t.type === 'eternityBoost' || t.type === 'globalMulti')).forEach(t => cps *= t.effect);
    state.eternityTree.filter(e => e.owned && (e.type === 'infiniteAuto' || e.type === 'omnipotent')).forEach(e => cps *= e.effect);
    return cps;
  }, []);

  const calculatePrestigeGain = useCallback((state: GameState) => {
    let gain = Math.floor(state.lifetimeClicks / 10_000_000);
    state.ascensionTree.filter(a => a.owned && a.type === 'prestigeMulti').forEach(a => gain *= a.effect);
    return gain;
  }, []);

  const calculateAscensionGain = useCallback((state: GameState) => {
    let gain = Math.floor(Math.sqrt(state.totalPrestigePoints / 500));
    state.transcendenceTree.filter(t => t.owned && t.type === 'ascensionMulti').forEach(t => gain *= t.effect);
    return gain;
  }, []);

  const calculateTranscendenceGain = useCallback((state: GameState) => {
    let gain = Math.floor(Math.sqrt(state.totalAscensionPoints / 250));
    state.eternityTree.filter(e => e.owned && e.type === 'transcendenceMulti').forEach(e => gain *= e.effect);
    return gain;
  }, []);

  const calculateEternityGain = useCallback((state: GameState) => {
    return Math.floor(Math.sqrt(state.totalTranscendencePoints / 100));
  }, []);

  const getUpgradeCost = useCallback((upgrade: { baseCost: number; costMultiplier: number; owned: number }) => {
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.owned));
  }, []);

  /* ---------------- Quest & Event Updates ---------------- */
  const updateQuestProgress = useCallback((state: GameState, type: string, amount: number) => {
    const newQuests = state.questState.quests.map(q => {
      if (q.completed) return q;
      const steps = q.steps.map((step, idx) => idx !== q.currentStep ? step : (step.type === type ? { ...step, current: Math.min(step.target, step.current + amount) } : step));
      const completed = steps.every(s => s.current >= s.target);
      return { ...q, steps, completed };
    });
    return { ...state, questState: { ...state.questState, quests: newQuests } };
  }, []);

  const updateEventProgress = useCallback((state: GameState, eventId: string) => {
    const event = state.questState.events.find(e => e.id === eventId);
    if (!event || !event.completed) return state;
    return updateQuestProgress(state, 'specialEvent', 1);
  }, [updateQuestProgress]);

  /* ---------------- Core Actions ---------------- */
  const handleClick = useCallback(() => {
    setGameState(prev => {
      let newState = { ...prev, clicks: prev.clicks + prev.clickPower, lifetimeClicks: prev.lifetimeClicks + prev.clickPower };
      newState = updateQuestProgress(newState, 'clicks', newState.clickPower);
      return newState;
    });
  }, [updateQuestProgress]);

  const buyUpgrade = useCallback((id: string) => {
    setGameState(prev => {
      const upgrade = prev.upgrades.find(u => u.id === id);
      if (!upgrade) return prev;
      const cost = getUpgradeCost(upgrade);
      if (prev.clicks < cost) return prev;

      let newState = { ...prev, upgrades: prev.upgrades.map(u => u.id === id ? { ...u, owned: u.owned + 1 } : u), clicks: prev.clicks - cost };
      newState = { ...newState, clickPower: calculateClickPower(newState), cps: calculateCPS(newState) };
      if (upgrade.type === 'autoClicker') newState = updateQuestProgress(newState, 'autoClicker', 1);
      return newState;
    });
  }, [calculateClickPower, calculateCPS, updateQuestProgress, getUpgradeCost]);

  const buyUpgradeBulk = useCallback((id: string, amount: number | 'MAX') => {
    setGameState(prev => {
      const upgrade = prev.upgrades.find(u => u.id === id);
      if (!upgrade) return prev;

      let clicks = prev.clicks;
      let owned = upgrade.owned;
      let toBuy = amount === 'MAX' ? Infinity : amount;
      let bought = 0;

      while (bought < toBuy) {
        const nextCost = getUpgradeCost({ ...upgrade, owned });
        if (clicks < nextCost) break;
        clicks -= nextCost;
        owned++;
        bought++;
      }

      if (bought === 0) return prev;

      let newState = { ...prev, upgrades: prev.upgrades.map(u => u.id === id ? { ...u, owned } : u), clicks };
      newState = { ...newState, clickPower: calculateClickPower(newState), cps: calculateCPS(newState) };
      if (upgrade.type === 'autoClicker') newState = updateQuestProgress(newState, 'autoClicker', bought);
      return newState;
    });
  }, [calculateClickPower, calculateCPS, updateQuestProgress, getUpgradeCost]);

  /* ---------------- Prestige / Ascend / Transcend / Eternity ---------------- */
  const getStartingClicks = useCallback((state: GameState) => {
    let starting = 0;
    ['startingClicks', 'megaStart', 'cosmicStart', 'beyondReality'].forEach(type => {
      state.skillTree.concat(state.ascensionTree, state.transcendenceTree, state.eternityTree).filter(s => s.owned && s.type === type).forEach(s => starting += s.effect);
    });
    return starting;
  }, []);

  const prestige = useCallback(() => { /* similar logic for prestige */ }, []);
  const ascend = useCallback(() => { /* similar logic for ascend */ }, []);
  const transcend = useCallback(() => { /* similar logic for transcend */ }, []);
  const enterEternity = useCallback(() => { /* similar logic for eternity */ }, []);

  /* ---------------- Reward claims ---------------- */
  const claimQuestReward = useCallback((questId: string) => { /* ... */ }, []);
  const claimChallengeReward = useCallback((challengeId: string) => { /* ... */ }, []);
  const claimEventReward = useCallback((eventId: string) => { /* ... */ }, []);
  const addLeaderboardScore = useCallback((name: string, type: 'lifetime' | 'cps' | 'prestiges') => { /* ... */ }, []);

  /* ---------------- Reset & Save ---------------- */
  const resetGame = useCallback(() => { /* ... */ }, []);
  const saveGame = useCallback(() => { localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...gameState, stats: { ...gameState.stats, lastOnlineTime: Date.now() } })); }, [gameState]);

  /* ---------------- Auto-click & Stats Loop ---------------- */
  useEffect(() => { /* ... */ }, [updateQuestProgress, updateEventProgress]);
  useEffect(() => { const interval = setInterval(() => saveGame(), 30000); return () => clearInterval(interval); }, [saveGame]);

  return {
    gameState,
    handleClick,
    buyUpgrade,
    buyUpgradeBulk,
    prestige,
    ascend,
    transcend,
    enterEternity,
    resetGame,
    saveGame,
    getUpgradeCost,
    calculatePrestigeGain,
    calculateAscensionGain,
    calculateTranscendenceGain,
    calculateEternityGain,
    offlineEarnings,
    claimQuestReward,
    claimChallengeReward,
    claimEventReward,
    addLeaderboardScore,
  };
}
