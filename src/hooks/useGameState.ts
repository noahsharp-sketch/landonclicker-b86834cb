import { useState, useEffect, useRef, useCallback } from 'react';
import {
  initialUpgrades,
  initialSkillTree,
  initialAscensionTree,
} from '../data/gameData';
import { createInitialQuestState } from '../data/oldQuestData'; // old quest/achievement tracking
import { calculateClickPower, calculateCPS } from '../utils/calculations';
import { buyUpgrade as buyUpgradeAction } from '../utils/actions';
import { GameState, LeaderboardEntry } from '../types/types';

const STORAGE_KEY = 'landon-clicker-save';

/* ---------------- Merge Helpers ---------------- */
function mergeArrayById<T extends { id: string }>(saved: T[], fresh: T[]) {
  const map = new Map<string, T>();
  saved.forEach(i => map.set(i.id, i));
  fresh.forEach(i => { if (!map.has(i.id)) map.set(i.id, i); });
  return Array.from(map.values());
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
    upgrades: initialUpgrades,
    skillTree: initialSkillTree,
    ascensionTree: initialAscensionTree,
    achievements: [], // will load old achievement state
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

      return {
        ...fresh,
        ...parsed,
        upgrades: mergeArrayById(parsed.upgrades || [], fresh.upgrades),
        skillTree: mergeArrayById(parsed.skillTree || [], fresh.skillTree),
        ascensionTree: mergeArrayById(parsed.ascensionTree || [], fresh.ascensionTree),
        questState: { ...createInitialQuestState(), ...parsed.questState },
        achievements: parsed.achievements || [],
        stats: { ...fresh.stats, ...parsed.stats },
      };
    } catch {
      return getInitialState();
    }
  });

  const [offlineEarnings, setOfflineEarnings] = useState<number | null>(null);

  /* ---------- Core Actions ---------- */
  const handleClick = useCallback(() => {
    setGameState(prev => {
      const newState = { ...prev, clicks: prev.clicks + prev.clickPower, lifetimeClicks: prev.lifetimeClicks + prev.clickPower };
      return newState;
    });
  }, []);

  const buyUpgrade = useCallback((id: string) => {
    setGameState(prev => {
      const newState = buyUpgradeAction(prev, id);
      newState.clickPower = calculateClickPower(newState);
      newState.cps = calculateCPS(newState);
      return newState;
    });
  }, []);

  const buyUpgradeBulk = useCallback((id: string, amount: number | 'MAX') => {
    setGameState(prev => {
      const upgrade = prev.upgrades.find(u => u.id === id);
      if (!upgrade) return prev;

      let clicks = prev.clicks;
      let owned = upgrade.owned;
      let toBuy = amount === 'MAX' ? Infinity : amount;
      let bought = 0;

      while (bought < toBuy) {
        const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, owned));
        if (clicks < cost) break;
        clicks -= cost;
        owned++;
        bought++;
      }

      if (bought === 0) return prev;

      const newState = { ...prev, upgrades: prev.upgrades.map(u => u.id === id ? { ...u, owned } : u), clicks };
      newState.clickPower = calculateClickPower(newState);
      newState.cps = calculateCPS(newState);

      return newState;
    });
  }, []);

  /* ---------- Quest & Achievement Updates ---------- */
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

      const newAchievements = prev.achievements.map(a => ({
        ...a,
        unlocked: a.unlocked || a.condition(prev),
      }));

      return { ...prev, questState: { ...prev.questState, quests: newQuests, challenges: newChallenges }, achievements: newAchievements };
    });
  }, [gameState.clicks, gameState.lifetimeClicks, gameState.cps, gameState.totalPrestiges, gameState.clickPower, gameState.upgrades]);

  /* ---------- Auto Clicker + Stats ---------- */
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

  /* ---------- Auto-save ---------- */
  useEffect(() => {
    const interval = setInterval(() => {
      const stateToSave = { ...gameState, stats: { ...gameState.stats, lastOnlineTime: Date.now() } };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
    }, 30000);
    return () => clearInterval(interval);
  }, [gameState]);

  /* ---------- Claim Rewards ---------- */
  const claimQuestReward = useCallback((questId: string) => {
    setGameState(prev => {
      const quest = prev.questState.quests.find(q => q.id === questId);
      if (!quest || !quest.completed || quest.claimed) return prev;
      const newQuests = prev.questState.quests.map(q => q.id === questId ? { ...q, claimed: true } : q );
      return { ...prev, clicks: prev.clicks + (quest.rewards.clicks || 0), prestigePoints: prev.prestigePoints + (quest.rewards.prestigePoints || 0), ascensionPoints: prev.ascensionPoints + (quest.rewards.ascensionPoints || 0), questState: { ...prev.questState, quests: newQuests } };
    });
  }, []);

  const claimChallengeReward = useCallback((challengeId: string) => {
    setGameState(prev => {
      const challenge = prev.questState.challenges.find(c => c.id === challengeId);
      if (!challenge || !challenge.completed || challenge.claimed) return prev;
      const newChallenges = prev.questState.challenges.map(c => c.id === challengeId ? { ...c, claimed: true } : c );
      return { ...prev, clicks: prev.clicks + (challenge.rewards.clicks || 0), prestigePoints: prev.prestigePoints + (challenge.rewards.prestigePoints || 0), questState: { ...prev.questState, challenges: newChallenges } };
    });
  }, []);

  const addLeaderboardScore = useCallback((name: string, type: LeaderboardEntry['type']) => {
    setGameState(prev => {
      const score = type === 'lifetime' ? prev.lifetimeClicks : type === 'cps' ? prev.cps : prev.totalPrestiges;
      const newEntry: LeaderboardEntry = { id: `${Date.now()}-${Math.random()}`, name, score, date: Date.now(), type };
      const newLeaderboard = [...prev.questState.leaderboard, newEntry].sort((a, b) => b.score - a.score).slice(0, 50);
      return { ...prev, questState: { ...prev.questState, leaderboard: newLeaderboard } };
    });
  }, []);

  return {
    gameState,
    handleClick,
    buyUpgrade,
    buyUpgradeBulk,
    claimQuestReward,
    claimChallengeReward,
    addLeaderboardScore,
    offlineEarnings,
  };
}
