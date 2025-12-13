import { useState, useEffect, useRef, useCallback } from 'react';
import { initialUpgrades, initialSkillTree, initialAscensionTree, createInitialAchievements } from '../data/gameData';
import { createInitialQuestState, createDailyChallenges, createWeeklyChallenges } from '../data/questData';
import { calculateClickPower, calculateCPS, calculatePrestigeGain, calculateAscensionGain } from '../utils/calculations';
import { buyUpgrade as buyUpgradeAction } from '../utils/actions';
import { applyAchievementBoosts } from '../utils/progressTracker';
import { GameState, LeaderboardEntry } from '../types/types';

const STORAGE_KEY = 'landon-clicker-save';

/* Helper to merge arrays by id */
function mergeArrayById<T extends { id: string }>(saved: T[], fresh: T[]) {
  const map = new Map<string, T>();
  saved.forEach(i => map.set(i.id, i));
  fresh.forEach(i => { if (!map.has(i.id)) map.set(i.id, i); });
  return Array.from(map.values());
}

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
      lastOnlineTime: Date.now(),
    },
    questState: createInitialQuestState(),
  });

  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return getInitialState();
    try {
      const parsed = JSON.parse(saved);
      const fresh = getInitialState();
      let loadedState: GameState = {
        ...fresh,
        ...parsed,
        upgrades: mergeArrayById(parsed.upgrades || [], fresh.upgrades),
        skillTree: mergeArrayById(parsed.skillTree || [], fresh.skillTree),
        ascensionTree: mergeArrayById(parsed.ascensionTree || [], fresh.ascensionTree),
        achievements: mergeAchievements(parsed.achievements || [], fresh.achievements),
        stats: { ...fresh.stats, ...parsed.stats },
        questState: {
          ...fresh.questState,
          ...parsed.questState,
          quests: mergeArrayById(parsed.questState?.quests || [], fresh.questState.quests),
          challenges: parsed.questState?.challenges || fresh.questState.challenges,
          leaderboard: parsed.questState?.leaderboard || [],
        },
      };
      return loadedState;
    } catch {
      return getInitialState();
    }
  });

  /* ---------- Handle Click ---------- */
  const handleClick = useCallback(() => {
    setGameState(prev => ({ ...prev, clicks: prev.clicks + prev.clickPower, lifetimeClicks: prev.lifetimeClicks + prev.clickPower, stats: { ...prev.stats, totalClicks: prev.stats.totalClicks + 1 } }));
  }, []);

  const buyUpgrade = useCallback((id: string) => {
    setGameState(prev => buyUpgradeAction(prev, id));
  }, []);

  /* ---------- Quest & Achievement Updates ---------- */
  useEffect(() => {
    setGameState(prev => {
      // Check achievements
      const newAchievements = prev.achievements.map(a => ({ ...a, unlocked: a.unlocked || a.condition(prev) }));
      const hasChanges = newAchievements.some((a, i) => a.unlocked !== prev.achievements[i].unlocked);
      if (!hasChanges) return prev;

      const updatedState = { ...prev, achievements: newAchievements };
      return applyAchievementBoosts(updatedState);
    });
  }, [gameState.lifetimeClicks, gameState.totalPrestiges, gameState.cps, gameState.upgrades]);
  
  return {
    gameState,
    handleClick,
    buyUpgrade,
  };
}
