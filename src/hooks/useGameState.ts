import { useState, useEffect, useRef, useCallback } from 'react';
import {
  initialUpgrades,
  initialSkillTree,
  initialAscensionTree,
  initialTranscendenceTree,
  initialEternityTree,
  createInitialAchievements,
} from '../data/gameData';
import {
  createInitialQuestState,
  generateSpecialEvents,
  createDailyChallenges,
  createWeeklyChallenges,
} from '../data/questData';
import {
  calculateClickPower,
  calculateCPS,
  calculatePrestigeGain,
  calculateAscensionGain,
} from '../utils/calculations';
import { buyUpgrade as buyUpgradeAction } from '../utils/actions';
import type { GameState } from '../types/types';

const STORAGE_KEY = 'landon-clicker-save';

function mergeArrayById<T extends { id: string }>(saved: T[], fresh: T[]) {
  const map = new Map<string, T>();
  fresh.forEach(item => map.set(item.id, item));
  saved.forEach(item => {
    if (map.has(item.id)) {
      map.set(item.id, { ...map.get(item.id)!, ...item });
    } else {
      map.set(item.id, item);
    }
  });
  return Array.from(map.values());
}

/* Merge achievements preserving unlocked status and conditions */
function mergeAchievements(saved: any[], fresh: ReturnType<typeof createInitialAchievements>) {
  return fresh.map(freshAch => {
    const savedAch = saved.find(s => s.id === freshAch.id);
    return savedAch ? { ...freshAch, unlocked: savedAch.unlocked } : freshAch;
  });
}

/* ---------------- Hook ---------------- */
export function useGameState() {
  const lastTickRef = useRef(Date.now());

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

  /* ---------- Progress Update Function ---------- */
  const updateProgress = useCallback((state: GameState): GameState => {
    const totalUpgrades = state.upgrades.reduce((sum, u) => sum + u.owned, 0);

    // Quests
    const newQuests = state.questState.quests.map(q => {
      if (q.completed) return q;
      const steps = q.steps.map(s => {
        let current = 0;
        switch (s.type) {
          case 'clicks': current = state.clicks; break;
          case 'lifetimeClicks': current = state.lifetimeClicks; break;
          case 'cps': current = state.cps; break;
          case 'upgrades': current = totalUpgrades; break;
          case 'prestiges': current = state.totalPrestiges; break;
          case 'ascensions': current = state.totalAscensions; break;
        }
        return { ...s, current };
      });
      let currentStep = q.currentStep;
      while (currentStep < steps.length && steps[currentStep].current >= steps[currentStep].target) currentStep++;
      return { ...q, steps, currentStep, completed: currentStep >= steps.length };
    });

    // Challenges
    const newChallenges = state.questState.challenges.map(c => {
      if (c.completed || c.claimed) return c;
      let current = 0;
      switch (c.conditionType) {
        case 'clicks': current = state.clicks; break;
        case 'lifetimeClicks': current = state.lifetimeClicks; break;
        case 'cps': current = state.cps; break;
        case 'upgrades': current = totalUpgrades; break;
        case 'prestiges': current = state.totalPrestiges; break;
        case 'ascensions': current = state.totalAscensions; break;
      }
      return { ...c, current, completed: current >= c.target };
    });

    // Events
    const newEvents = state.questState.events.map(e => {
      if (e.completed || e.claimed) return e;
      let current = 0;
      switch (e.type) {
        case 'clicks': current = state.clicks; break;
        case 'lifetimeClicks': current = state.lifetimeClicks; break;
        case 'cps': current = state.cps; break;
        case 'upgrades': current = totalUpgrades; break;
        case 'prestiges': current = state.totalPrestiges; break;
        case 'ascensions': current = state.totalAscensions; break;
      }
      return { ...e, current, completed: current >= (e.target || 1) };
    });

    // Achievements
    const newAchievements = state.achievements.map(a => ({ ...a, unlocked: a.unlocked || a.condition(state) }));

    return {
      ...state,
      questState: { ...state.questState, quests: newQuests, challenges: newChallenges, events: newEvents },
      achievements: newAchievements,
    };
  }, []);

  /* ---------- Load Saved State ---------- */
  const [gameState, setGameState] = useState<GameState>(() => {
    const savedRaw = localStorage.getItem(STORAGE_KEY);
    if (!savedRaw) return getInitialState();
    try {
      const saved = JSON.parse(savedRaw);
      const fresh = getInitialState();
      let loadedState: GameState = {
        ...fresh,
        ...saved,
        upgrades: mergeArrayById(saved.upgrades || [], fresh.upgrades),
        skillTree: mergeArrayById(saved.skillTree || [], fresh.skillTree),
        ascensionTree: mergeArrayById(saved.ascensionTree || [], fresh.ascensionTree),
        transcendenceTree: mergeArrayById(saved.transcendenceTree || [], fresh.transcendenceTree),
        eternityTree: mergeArrayById(saved.eternityTree || [], fresh.eternityTree),
        achievements: mergeAchievements(saved.achievements || [], fresh.achievements),
        questState: {
          ...fresh.questState,
          ...saved.questState,
          quests: mergeArrayById(saved.questState?.quests || [], fresh.questState.quests),
          challenges: saved.questState?.challenges || fresh.questState.challenges,
          events: saved.questState?.events || generateSpecialEvents(),
        },
        stats: { ...fresh.stats, ...saved.stats },
      };
      return updateProgress(loadedState);
    } catch {
      return getInitialState();
    }
  });

  const [offlineEarnings, setOfflineEarnings] = useState<number | null>(null);

  /* ---------- Game Actions ---------- */
  const handleClick = useCallback(() => {
    setGameState(prev => updateProgress({ ...prev, clicks: prev.clicks + prev.clickPower, lifetimeClicks: prev.lifetimeClicks + prev.clickPower }));
  }, [updateProgress]);

  const buyUpgrade = useCallback((id: string) => {
    setGameState(prev => updateProgress(buyUpgradeAction(prev, id)));
  }, [updateProgress]);

  const prestige = useCallback(() => {
    setGameState(prev => {
      const gain = calculatePrestigeGain(prev);
      if (gain <= 0) return prev;
      const newState = { ...prev, clicks: 0, lifetimeClicks: 0, clickPower: 1, cps: 0, prestigePoints: prev.prestigePoints + gain, totalPrestigePoints: prev.totalPrestigePoints + gain, totalPrestiges: prev.totalPrestiges + 1, upgrades: initialUpgrades };
      return updateProgress({ ...newState, clickPower: calculateClickPower(newState), cps: calculateCPS(newState) });
    });
  }, [updateProgress]);

  const ascend = useCallback(() => {
    setGameState(prev => {
      const gain = calculateAscensionGain(prev);
      if (gain <= 0) return prev;
      const newState = { ...prev, clicks: 0, lifetimeClicks: 0, clickPower: 1, cps: 0, prestigePoints: 0, totalPrestigePoints: 0, totalPrestiges: 0, ascensionPoints: prev.ascensionPoints + gain, totalAscensionPoints: prev.totalAscensionPoints + gain, skillTree: initialSkillTree, upgrades: initialUpgrades };
      return updateProgress({ ...newState, clickPower: calculateClickPower(newState), cps: calculateCPS(newState) });
    });
  }, [updateProgress]);

  /* ---------- Quest/Challenge/Event Claim ---------- */
  const claimQuestReward = useCallback((questId: string) => {
    setGameState(prev => {
      const quest = prev.questState.quests.find(q => q.id === questId);
      if (!quest || quest.claimed || !quest.completed) return prev;
      const newQuests = prev.questState.quests.map(q => q.id === questId ? { ...q, claimed: true } : q);
      return updateProgress({ ...prev, clicks: prev.clicks + (quest.rewards.clicks || 0), prestigePoints: prev.prestigePoints + (quest.rewards.prestigePoints || 0), questState: { ...prev.questState, quests: newQuests } });
    });
  }, [updateProgress]);

  /* ---------- CPS Tick ---------- */
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      setGameState(prev => updateProgress({ ...prev, clicks: prev.clicks + prev.cps * delta, lifetimeClicks: prev.lifetimeClicks + prev.cps * delta }));
    }, 100);
    return () => clearInterval(interval);
  }, [updateProgress]);

  /* ---------- Auto Save ---------- */
  useEffect(() => {
    const interval = setInterval(() => localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...gameState, stats: { ...gameState.stats, lastOnlineTime: Date.now() } })), 30000);
    return () => clearInterval(interval);
  }, [gameState]);

  const resetGame = useCallback(() => {
    if (confirm('Are you sure you want to reset all progress?')) {
      localStorage.removeItem(STORAGE_KEY);
      setGameState(getInitialState());
    }
  }, []);

  const saveGame = useCallback(() => localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...gameState, stats: { ...gameState.stats, lastOnlineTime: Date.now() } })), [gameState]);

  return {
    gameState,
    handleClick,
    buyUpgrade,
    prestige,
    ascend,
    saveGame,
    resetGame,
    offlineEarnings,
    claimQuestReward,
  };
}
