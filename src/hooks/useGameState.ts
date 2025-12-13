import { useState, useEffect, useRef, useCallback } from 'react';
import {
  initialUpgrades,
  initialSkillTree,
  initialAscensionTree,
  initialTranscendenceTree,
  createInitialAchievements,
} from '../data/gameData';
import {
  createInitialQuestState,
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
import { GameState, LeaderboardEntry } from '../types/types';

const STORAGE_KEY = 'landon-clicker-save';

/* ---------------- Merge helper ---------------- */
function mergeArrayById<T extends { id: string }>(saved: T[], fresh: T[]) {
  const map = new Map<string, T>();
  saved.forEach(i => map.set(i.id, i));
  fresh.forEach(i => {
    if (!map.has(i.id)) map.set(i.id, i);
  });
  return Array.from(map.values());
}

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
    transcendencePoints: 0,
    totalTranscendencePoints: 0,
    totalPrestiges: 0,
    upgrades: initialUpgrades,
    skillTree: initialSkillTree,
    ascensionTree: initialAscensionTree,
    transcendenceTree: initialTranscendenceTree,
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

  const calculateOfflineProgress = (state: GameState): GameState => {
    const now = Date.now();
    const lastOnline = state.stats.lastOnlineTime || now;
    const offlineSeconds = Math.min((now - lastOnline) / 1000, 86400);

    if (offlineSeconds < 10 || state.cps <= 0) {
      return { ...state, stats: { ...state.stats, lastOnlineTime: now } };
    }

    const offlineGain = state.cps * offlineSeconds * 0.5;

    return {
      ...state,
      clicks: state.clicks + offlineGain,
      lifetimeClicks: state.lifetimeClicks + offlineGain,
      stats: { ...state.stats, lastOnlineTime: now },
    };
  };

  const resetExpiredChallenges = (state: GameState): GameState => {
    const now = Date.now();
    let needsReset = false;

    const challenges = state.questState.challenges.map(c => {
      if (now > c.expiresAt) {
        needsReset = true;
        return c;
      }
      return c;
    });

    if (!needsReset) return state;

    const dailyExpired = challenges.some(c => c.type === 'daily' && now > c.expiresAt);
    const weeklyExpired = challenges.some(c => c.type === 'weekly' && now > c.expiresAt);

    let newChallenges = [...challenges];

    if (dailyExpired) {
      const freshDaily = createDailyChallenges();
      newChallenges = newChallenges.filter(c => c.type !== 'daily').concat(freshDaily);
    }

    if (weeklyExpired) {
      const freshWeekly = createWeeklyChallenges();
      newChallenges = newChallenges.filter(c => c.type !== 'weekly').concat(freshWeekly);
    }

    return {
      ...state,
      questState: {
        ...state.questState,
        challenges: newChallenges,
        lastDailyReset: dailyExpired ? now : state.questState.lastDailyReset,
        lastWeeklyReset: weeklyExpired ? now : state.questState.lastWeeklyReset,
      },
    };
  };

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
        transcendenceTree: mergeArrayById(parsed.transcendenceTree || [], fresh.transcendenceTree),
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

      loadedState = calculateOfflineProgress(loadedState);
      loadedState = resetExpiredChallenges(loadedState);

      return loadedState;
    } catch {
      return getInitialState();
    }
  });

  const [offlineEarnings, setOfflineEarnings] = useState<number | null>(null);

  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        const lastOnline = parsed.stats?.lastOnlineTime || Date.now();
        const offlineSeconds = (Date.now() - lastOnline) / 1000;
        const cps = parsed.cps || 0;

        if (offlineSeconds >= 10 && cps > 0) {
          const earnings = Math.min(offlineSeconds, 86400) * cps * 0.5;
          if (earnings > 0) {
            setOfflineEarnings(earnings);
            setTimeout(() => setOfflineEarnings(null), 5000);
          }
        }
      } catch {}
    }
  }, []);

  /* ---------- Actions ---------- */
  const handleClick = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      clicks: prev.clicks + prev.clickPower,
      lifetimeClicks: prev.lifetimeClicks + prev.clickPower,
      stats: { ...prev.stats, totalClicks: prev.stats.totalClicks + 1 },
    }));
  }, []);

  const buyUpgrade = useCallback((id: string, bulk = 1) => {
    setGameState(prev => buyUpgradeAction(prev, id, bulk));
  }, []);

  const buySkillNode = useCallback((id: string, bulk = 1) => {
    setGameState(prev => {
      const node = prev.skillTree.find(n => n.id === id);
      if (!node || node.owned) return prev;

      let availablePoints = prev.prestigePoints;
      for (let i = 0; i < bulk; i++) {
        if (availablePoints < node.cost) break;
        availablePoints -= node.cost;
        node.owned = true;
        break;
      }

      return { ...prev, skillTree: [...prev.skillTree], prestigePoints: availablePoints, clickPower: calculateClickPower(prev), cps: calculateCPS(prev) };
    });
  }, [calculateClickPower, calculateCPS]);

  const buyAscensionNode = useCallback((id: string, bulk = 1) => {
    setGameState(prev => {
      const node = prev.ascensionTree.find(n => n.id === id);
      if (!node || node.owned) return prev;

      let availablePoints = prev.ascensionPoints;
      for (let i = 0; i < bulk; i++) {
        if (availablePoints < node.cost) break;
        availablePoints -= node.cost;
        node.owned = true;
        break;
      }

      return { ...prev, ascensionTree: [...prev.ascensionTree], ascensionPoints: availablePoints, clickPower: calculateClickPower(prev), cps: calculateCPS(prev) };
    });
  }, [calculateClickPower, calculateCPS]);

  const prestige = useCallback(() => {
    setGameState(prev => {
      const gain = calculatePrestigeGain(prev);
      if (gain <= 0) return prev;

      return {
        ...prev,
        clicks: 0,
        lifetimeClicks: 0,
        clickPower: 1,
        cps: 0,
        prestigePoints: prev.prestigePoints + gain,
        totalPrestigePoints: prev.totalPrestigePoints + gain,
        totalPrestiges: prev.totalPrestiges + 1,
        upgrades: initialUpgrades,
      };
    });
  }, []);

  const ascend = useCallback(() => {
    setGameState(prev => {
      const gain = calculateAscensionGain(prev);
      if (gain <= 0) return prev;

      return {
        ...prev,
        clicks: 0,
        lifetimeClicks: 0,
        clickPower: 1,
        cps: 0,
        prestigePoints: 0,
        totalPrestigePoints: 0,
        totalPrestiges: 0,
        ascensionPoints: prev.ascensionPoints + gain,
        totalAscensionPoints: prev.totalAscensionPoints + gain,
        upgrades: initialUpgrades,
        skillTree: initialSkillTree,
      };
    });
  }, []);

  /* ---------- Quest & Challenge Updates ---------- */
  useEffect(() => {
    setGameState(prev => {
      const totalUpgrades = prev.upgrades.reduce((sum, u) => sum + u.owned, 0);

      const newQuests = prev.questState.quests.map(quest => {
        if (quest.completed) return quest;

        const updatedSteps = quest.steps.map(step => {
          let current = 0;
          switch (step.type) {
            case 'clicks':
              current = prev.clicks;
              break;
            case 'lifetimeClicks':
              current = prev.lifetimeClicks;
              break;
            case 'cps':
              current = prev.cps;
              break;
            case 'upgrades':
              current = totalUpgrades;
              break;
            case 'prestiges':
              current = prev.totalPrestiges;
              break;
            case 'clickPower':
              current = prev.clickPower;
              break;
          }
          return { ...step, current };
        });

        let currentStep = quest.currentStep;
        while (
          currentStep < updatedSteps.length &&
          updatedSteps[currentStep].current >= updatedSteps[currentStep].target
        ) {
          currentStep++;
        }

        const completed = currentStep >= updatedSteps.length;

        return { ...quest, steps: updatedSteps, currentStep, completed };
      });

      const newChallenges = prev.questState.challenges.map(challenge => {
        if (challenge.completed || challenge.claimed) return challenge;

        let current = 0;
        switch (challenge.conditionType) {
          case 'clicks':
            current = prev.clicks;
            break;
          case 'lifetimeClicks':
            current = prev.lifetimeClicks;
            break;
          case 'cps':
            current = prev.cps;
            break;
          case 'upgrades':
            current = totalUpgrades;
            break;
          case 'prestiges':
            current = prev.totalPrestiges;
            break;
        }

        const completed = current >= challenge.target;
        return { ...challenge, current, completed };
      });

      const questsChanged = JSON.stringify(newQuests) !== JSON.stringify(prev.questState.quests);
      const challengesChanged = JSON.stringify(newChallenges) !== JSON.stringify(prev.questState.challenges);

      if (!questsChanged && !challengesChanged) return prev;

      return {
        ...prev,
        questState: { ...prev.questState, quests: newQuests, challenges: newChallenges },
      };
    });
  }, [
    gameState.clicks,
    gameState.lifetimeClicks,
    gameState.cps,
    gameState.totalPrestiges,
    gameState.clickPower,
    gameState.upgrades,
  ]);

  /* ---------- Auto Save ---------- */
  useEffect(() => {
    const interval = setInterval(() => {
      const stateToSave = { ...gameState, stats: { ...gameState.stats, lastOnlineTime: Date.now() } };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }, 30000);
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
    saveGame: () => localStorage.setItem(STORAGE_KEY, JSON.stringify(gameState)),
    offlineEarnings,
  };
}
