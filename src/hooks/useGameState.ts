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
import type { GameState, Achievement } from '../types/types';

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

/* Merge achievements while preserving unlocked status and condition functions */
function mergeAchievements(saved: any[], fresh: ReturnType<typeof createInitialAchievements>) {
  return fresh.map(freshAch => {
    const savedAch = saved.find(s => s.id === freshAch.id);
    return savedAch ? { ...freshAch, unlocked: savedAch.unlocked } : freshAch;
  });
}

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

  /* ---------- Load saved state ---------- */
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

      /* Calculate offline progress */
      const now = Date.now();
      const offlineSeconds = Math.min((now - loadedState.stats.lastOnlineTime) / 1000, 86400);
      if (offlineSeconds > 0 && loadedState.cps > 0) {
        const offlineClicks = loadedState.cps * offlineSeconds * 0.5;
        loadedState.clicks += offlineClicks;
        loadedState.lifetimeClicks += offlineClicks;
      }

      return loadedState;
    } catch {
      return getInitialState();
    }
  });

  const [offlineEarnings, setOfflineEarnings] = useState<number | null>(null);

  /* ---------- Core Actions ---------- */
  const handleClick = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      clicks: prev.clicks + prev.clickPower,
      lifetimeClicks: prev.lifetimeClicks + prev.clickPower,
      stats: { ...prev.stats, totalClicks: prev.stats.totalClicks + 1 },
    }));
  }, []);

  const buyUpgrade = useCallback((id: string) => {
    setGameState(prev => buyUpgradeAction(prev, id));
  }, []);

  const buySkillNode = useCallback((id: string) => {
    setGameState(prev => {
      const node = prev.skillTree.find(n => n.id === id);
      if (!node || node.owned || prev.prestigePoints < node.cost) return prev;
      const newTree = prev.skillTree.map(n => n.id === id ? { ...n, owned: true } : n);
      const newState = { ...prev, skillTree: newTree, prestigePoints: prev.prestigePoints - node.cost };
      return { ...newState, clickPower: calculateClickPower(newState), cps: calculateCPS(newState) };
    });
  }, []);

  const buyAscensionNode = useCallback((id: string) => {
    setGameState(prev => {
      const node = prev.ascensionTree.find(n => n.id === id);
      if (!node || node.owned || prev.ascensionPoints < node.cost) return prev;
      const newTree = prev.ascensionTree.map(n => n.id === id ? { ...n, owned: true } : n);
      const newState = { ...prev, ascensionTree: newTree, ascensionPoints: prev.ascensionPoints - node.cost };
      return { ...newState, clickPower: calculateClickPower(newState), cps: calculateCPS(newState) };
    });
  }, []);

  const prestige = useCallback(() => {
    setGameState(prev => {
      const gain = calculatePrestigeGain(prev);
      if (gain <= 0) return prev;
      const newState = { ...prev, clicks: 0, lifetimeClicks: 0, clickPower: 1, cps: 0, prestigePoints: prev.prestigePoints + gain, totalPrestigePoints: prev.totalPrestigePoints + gain, totalPrestiges: prev.totalPrestiges + 1, upgrades: initialUpgrades };
      return { ...newState, clickPower: calculateClickPower(newState), cps: calculateCPS(newState) };
    });
  }, []);

  const ascend = useCallback(() => {
    setGameState(prev => {
      const gain = calculateAscensionGain(prev);
      if (gain <= 0) return prev;
      const newState = { ...prev, clicks: 0, lifetimeClicks: 0, clickPower: 1, cps: 0, prestigePoints: 0, totalPrestigePoints: 0, totalPrestiges: 0, ascensionPoints: prev.ascensionPoints + gain, totalAscensionPoints: prev.totalAscensionPoints + gain, skillTree: initialSkillTree, upgrades: initialUpgrades };
      return { ...newState, clickPower: calculateClickPower(newState), cps: calculateCPS(newState) };
    });
  }, []);

  /* ---------- Quest & Challenge Actions ---------- */
  const claimQuestReward = useCallback((questId: string) => {
    setGameState(prev => {
      const quest = prev.questState.quests.find(q => q.id === questId);
      if (!quest || !quest.completed || quest.claimed) return prev;
      const newQuests = prev.questState.quests.map(q => q.id === questId ? { ...q, claimed: true } : q);
      return { ...prev, clicks: prev.clicks + (quest.rewards.clicks || 0), prestigePoints: prev.prestigePoints + (quest.rewards.prestigePoints || 0), questState: { ...prev.questState, quests: newQuests } };
    });
  }, []);

  /* ---------- Achievement Tracking ---------- */
  useEffect(() => {
    setGameState(prev => {
      const newAchievements = prev.achievements.map(a => ({ ...a, unlocked: a.unlocked || a.condition(prev) }));
      const hasChanges = newAchievements.some((a, i) => a.unlocked !== prev.achievements[i].unlocked);
      return hasChanges ? { ...prev, achievements: newAchievements } : prev;
    });
  }, [gameState.clicks, gameState.lifetimeClicks, gameState.totalPrestiges, gameState.ascensionPoints, gameState.cps, gameState.upgrades, gameState.clickPower]);

  /* ---------- CPS Tick Loop ---------- */
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      setGameState(prev => ({
        ...prev,
        clicks: prev.clicks + prev.cps * delta,
        lifetimeClicks: prev.lifetimeClicks + prev.cps * delta,
        stats: { ...prev.stats, totalPlaytime: prev.stats.totalPlaytime + delta, bestCPS: Math.max(prev.stats.bestCPS, prev.cps), lastOnlineTime: now },
      }));
    }, 100);
    return () => clearInterval(interval);
  }, []);

  /* ---------- Auto Save ---------- */
  useEffect(() => {
    const interval = setInterval(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...gameState, stats: { ...gameState.stats, lastOnlineTime: Date.now() } }));
    }, 30000);
    return () => clearInterval(interval);
  }, [gameState]);

  /* ---------- Reset / Save ---------- */
  const resetGame = useCallback(() => {
    if (confirm('Are you sure you want to reset all progress?')) {
      localStorage.removeItem(STORAGE_KEY);
      setGameState(getInitialState());
    }
  }, []);

  const saveGame = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...gameState, stats: { ...gameState.stats, lastOnlineTime: Date.now() } }));
  }, [gameState]);

  return {
    gameState,
    handleClick,
    buyUpgrade,
    buySkillNode,
    buyAscensionNode,
    prestige,
    ascend,
    saveGame,
    resetGame,
    offlineEarnings,
    claimQuestReward,
  };
}
