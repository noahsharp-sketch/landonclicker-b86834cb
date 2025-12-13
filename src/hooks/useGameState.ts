import { useState, useEffect, useRef, useCallback } from 'react';
import { initialUpgrades, initialSkillTree, initialAscensionTree, createInitialAchievements } from '../data/gameData';
import { createInitialQuestState, createDailyChallenges, createWeeklyChallenges } from '../data/questData';
import { calculateClickPower, calculateCPS, calculatePrestigeGain, calculateAscensionGain } from '../utils/calculations';
import { GameState, LeaderboardEntry } from '../types/types';

const STORAGE_KEY = 'landon-clicker-save';

/* ---------------- Merge helpers ---------------- */
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

/* ---------------- Hook ---------------- */
export function useGameState() {
  const lastTickRef = useRef(Date.now());

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

  /* ---------- Load saved state ---------- */
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return getInitialState();
    try {
      const parsed = JSON.parse(saved);
      const fresh = getInitialState();
      const loadedState: GameState = {
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

  const [offlineEarnings, setOfflineEarnings] = useState<number | null>(null);

  /* ---------- Game Actions ---------- */
  const handleClick = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      clicks: prev.clicks + prev.clickPower,
      lifetimeClicks: prev.lifetimeClicks + prev.clickPower,
      stats: { ...prev.stats, totalClicks: prev.stats.totalClicks + 1 },
    }));
  }, []);

  /* ---------- Bulk Upgrade Support ---------- */
  const buyUpgrade = useCallback((id: string, bulk = 1) => {
    setGameState(prev => {
      const upgrade = prev.upgrades.find(u => u.id === id);
      if (!upgrade) return prev;

      let newOwned = upgrade.owned;
      let newClicks = prev.clicks;

      for (let i = 0; i < bulk; i++) {
        const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, newOwned));
        if (newClicks < cost) break;
        newClicks -= cost;
        newOwned += 1;
      }

      if (newOwned === upgrade.owned) return prev;

      const newUpgrades = prev.upgrades.map(u => u.id === id ? { ...u, owned: newOwned } : u);
      const newState = { ...prev, upgrades: newUpgrades, clicks: newClicks };
      return { ...newState, clickPower: calculateClickPower(newState), cps: calculateCPS(newState) };
    });
  }, [calculateClickPower, calculateCPS]);

  const buySkillNode = useCallback((id: string, bulk = 1) => {
    setGameState(prev => {
      let newState = { ...prev };
      for (let i = 0; i < bulk; i++) {
        const node = newState.skillTree.find(n => n.id === id);
        if (!node || node.owned || newState.prestigePoints < node.cost) break;
        newState.skillTree = newState.skillTree.map(n => n.id === id ? { ...n, owned: true } : n);
        newState.prestigePoints -= node.cost;
        newState.clickPower = calculateClickPower(newState);
        newState.cps = calculateCPS(newState);
      }
      return newState;
    });
  }, [calculateClickPower, calculateCPS]);

  const buyAscensionNode = useCallback((id: string, bulk = 1) => {
    setGameState(prev => {
      let newState = { ...prev };
      for (let i = 0; i < bulk; i++) {
        const node = newState.ascensionTree.find(n => n.id === id);
        if (!node || node.owned || newState.ascensionPoints < node.cost) break;
        newState.ascensionTree = newState.ascensionTree.map(n => n.id === id ? { ...n, owned: true } : n);
        newState.ascensionPoints -= node.cost;
        newState.clickPower = calculateClickPower(newState);
        newState.cps = calculateCPS(newState);
      }
      return newState;
    });
  }, [calculateClickPower, calculateCPS]);

  /* ---------- Quest & Challenge Actions ---------- */
  const claimQuestReward = useCallback((questId: string) => {
    setGameState(prev => {
      const quest = prev.questState.quests.find(q => q.id === questId);
      if (!quest || !quest.completed || quest.claimed) return prev;

      const newQuests = prev.questState.quests.map(q => 
        q.id === questId ? { ...q, claimed: true } : q
      );

      return {
        ...prev,
        clicks: prev.clicks + (quest.rewards.clicks || 0),
        prestigePoints: prev.prestigePoints + (quest.rewards.prestigePoints || 0),
        ascensionPoints: prev.ascensionPoints + (quest.rewards.ascensionPoints || 0),
        questState: { ...prev.questState, quests: newQuests },
      };
    });
  }, []);

  const claimChallengeReward = useCallback((challengeId: string) => {
    setGameState(prev => {
      const challenge = prev.questState.challenges.find(c => c.id === challengeId);
      if (!challenge || !challenge.completed || challenge.claimed) return prev;

      const newChallenges = prev.questState.challenges.map(c => 
        c.id === challengeId ? { ...c, claimed: true } : c
      );

      return {
        ...prev,
        clicks: prev.clicks + (challenge.rewards.clicks || 0),
        prestigePoints: prev.prestigePoints + (challenge.rewards.prestigePoints || 0),
        questState: { ...prev.questState, challenges: newChallenges },
      };
    });
  }, []);

  /* ---------- Auto-update quests & challenges ---------- */
  useEffect(() => {
    setGameState(prev => {
      const totalUpgrades = prev.upgrades.reduce((sum, u) => sum + u.owned, 0);

      const newQuests = prev.questState.quests.map(quest => {
        if (quest.completed) return quest;
        const updatedSteps = quest.steps.map(step => {
          let current = 0;
          switch (step.type) {
            case 'clicks': current = prev.clicks; break;
            case 'lifetimeClicks': current = prev.lifetimeClicks; break;
            case 'cps': current = prev.cps; break;
            case 'upgrades': current = totalUpgrades; break;
            case 'prestiges': current = prev.totalPrestiges; break;
            case 'clickPower': current = prev.clickPower; break;
          }
          return { ...step, current };
        });

        let currentStep = quest.currentStep;
        while (currentStep < updatedSteps.length && updatedSteps[currentStep].current >= updatedSteps[currentStep].target) {
          currentStep++;
        }

        const completed = currentStep >= updatedSteps.length;
        return { ...quest, steps: updatedSteps, currentStep, completed };
      });

      const newChallenges = prev.questState.challenges.map(challenge => {
        if (challenge.completed || challenge.claimed) return challenge;

        let current = 0;
        switch (challenge.conditionType) {
          case 'clicks': current = prev.clicks; break;
          case 'lifetimeClicks': current = prev.lifetimeClicks; break;
          case 'cps': current = prev.cps; break;
          case 'upgrades': current = totalUpgrades; break;
          case 'prestiges': current = prev.totalPrestiges; break;
        }

        const completed = current >= challenge.target;
        return { ...challenge, current, completed };
      });

      return {
        ...prev,
        questState: { ...prev.questState, quests: newQuests, challenges: newChallenges },
      };
    });
  }, [gameState.clicks, gameState.lifetimeClicks, gameState.cps, gameState.totalPrestiges, gameState.clickPower, gameState.upgrades]);

  /* ---------- Auto CPS / Click Tracking ---------- */
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      setGameState(prev => ({
        ...prev,
        clicks: prev.clicks + prev.cps * delta,
        lifetimeClicks: prev.lifetimeClicks + prev.cps * delta,
        stats: {
          ...prev.stats,
          totalPlaytime: prev.stats.totalPlaytime + delta,
          bestCPS: Math.max(prev.stats.bestCPS, prev.cps),
          lastOnlineTime: now,
        },
      }));
    }, 100);

    return () => clearInterval(interval);
  }, []);

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
    claimQuestReward,
    claimChallengeReward,
    offlineEarnings,
  };
}
