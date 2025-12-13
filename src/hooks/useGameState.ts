import { useState, useEffect, useCallback, useRef } from 'react';
import {
  initialUpgrades,
  initialSkillTree,
  initialAscensionTree,
  initialTranscendenceTree,
  createInitialAchievements,
} from '../data/gameData';
import { createInitialQuestState, generateSpecialEvents } from '../data/questData';
import type { GameState } from '../types/types';

function mergeArrayById<T extends { id: string }>(saved: T[], fresh: T[]) {
  const map = new Map<string, T>();
  saved.forEach(item => map.set(item.id, item));
  fresh.forEach(item => {
    if (!map.has(item.id)) map.set(item.id, item);
  });
  return Array.from(map.values());
}

const STORAGE_KEY = 'landon-clicker-save';

export function useGameState() {
  const lastTickRef = useRef(Date.now());
  const [offlineEarnings, setOfflineEarnings] = useState<number | null>(null);

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
      transcendencePoints: 0,
      totalTranscendencePoints: 0,
      totalPrestiges: 0,
      totalAscensions: 0,
      totalTranscendences: 0,
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
    };
  }

  /* ---------- Load saved state ---------- */
  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return getInitialState();
    try {
      const parsed = JSON.parse(saved);
      const fresh = getInitialState();

      // Offline earnings
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
        achievements: parsed.achievements || fresh.achievements,
        questState: {
          ...fresh.questState,
          ...parsed.questState,
          events: generateSpecialEvents(),
        },
        stats: {
          ...fresh.stats,
          ...parsed.stats,
          lastOnlineTime: Date.now(),
        },
      };
    } catch {
      return getInitialState();
    }
  });

  /* ---------- Calculations ---------- */
  const calculateClickPower = useCallback((state: GameState) => {
    let power = 1;
    state.upgrades.filter(u => u.type === 'clickPower').forEach(u => power += u.effect * u.owned);
    state.skillTree.filter(s => s.owned && s.type === 'clickMulti').forEach(s => power *= s.effect);
    state.transcendenceTree.filter(t => t.owned && t.type === 'infinitePower').forEach(t => power *= t.effect);
    state.transcendenceTree.filter(t => t.owned && t.type === 'globalMulti').forEach(t => power *= t.effect);
    return power;
  }, []);

  const calculateCPS = useCallback((state: GameState) => {
    let cps = 0;
    state.upgrades.filter(u => u.type === 'autoClicker').forEach(u => cps += u.effect * u.owned * state.clickPower);
    state.skillTree.filter(s => s.owned && s.type === 'cpsBoost').forEach(s => cps *= s.effect);
    state.skillTree.filter(s => s.owned && s.type === 'cpsMulti').forEach(s => cps *= s.effect);
    state.ascensionTree.filter(a => a.owned && (a.type === 'allMulti' || a.type === 'ultimateCPS')).forEach(a => cps *= a.effect);
    state.transcendenceTree.filter(t => t.owned && (t.type === 'eternityBoost' || t.type === 'globalMulti')).forEach(t => cps *= t.effect);
    return cps;
  }, []);

  /* ---------- Quest & Achievement Tracking ---------- */
  useEffect(() => {
    setGameState(prev => {
      const totalUpgrades = prev.upgrades.reduce((sum, u) => sum + u.owned, 0);

      // Update Quests
      const newQuests = prev.questState.quests.map(q => {
        if (q.completed) return q;
        const updatedSteps = q.steps.map(step => {
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
        let currentStep = q.currentStep;
        while (currentStep < updatedSteps.length && updatedSteps[currentStep].current >= updatedSteps[currentStep].target) currentStep++;
        return { ...q, steps: updatedSteps, currentStep, completed: currentStep >= updatedSteps.length };
      });

      // Update Challenges
      const newChallenges = prev.questState.challenges.map(c => {
        if (c.completed || c.claimed) return c;
        let current = 0;
        switch (c.conditionType) {
          case 'clicks': current = prev.clicks; break;
          case 'lifetimeClicks': current = prev.lifetimeClicks; break;
          case 'cps': current = prev.cps; break;
          case 'upgrades': current = totalUpgrades; break;
          case 'prestiges': current = prev.totalPrestiges; break;
        }
        return { ...c, current, completed: current >= c.target };
      });

      // Update Achievements
      const newAchievements = prev.achievements.map(a => ({ ...a, unlocked: a.unlocked || a.condition(prev) }));

      return { ...prev, questState: { ...prev.questState, quests: newQuests, challenges: newChallenges }, achievements: newAchievements };
    });
  }, [gameState.clicks, gameState.lifetimeClicks, gameState.cps, gameState.totalPrestiges, gameState.clickPower, gameState.upgrades]);

  /* ---------- Auto Clicker & Stats ---------- */
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

  return {
    gameState,
    handleClick: useCallback(() => setGameState(prev => ({ ...prev, clicks: prev.clicks + prev.clickPower, lifetimeClicks: prev.lifetimeClicks + prev.clickPower })), []),
    buyUpgrade,
    buyUpgradeBulk: useCallback((id: string, amount: number | "MAX") => {
      setGameState(prev => {
        const upgrade = prev.upgrades.find(u => u.id === id);
        if (!upgrade) return prev;
        let clicks = prev.clicks, owned = upgrade.owned, toBuy = amount === "MAX" ? Infinity : amount, bought = 0;
        while (bought < toBuy) {
          const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, owned));
          if (clicks < cost) break;
          clicks -= cost; owned++; bought++;
        }
        if (bought === 0) return prev;
        const newUpgrades = prev.upgrades.map(u => u.id === id ? { ...u, owned } : u);
        const newState = { ...prev, clicks, upgrades: newUpgrades };
        return { ...newState, clickPower: calculateClickPower(newState), cps: calculateCPS(newState) };
      });
    }, [calculateClickPower, calculateCPS]),
    buySkillNode: () => {},
    buyAscensionNode: () => {},
    buyTranscendenceNode: () => {},
    prestige: () => {},
    ascend: () => {},
    transcend: () => {},
    claimQuestReward: () => {},
    claimChallengeReward: () => {},
    claimEventReward: () => {},
    addLeaderboardScore: () => {},
    offlineEarnings,
  };
}
