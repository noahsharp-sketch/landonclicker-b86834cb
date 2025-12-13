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

  // --- Quest helper ---
  const updateQuestProgress = useCallback((state: GameState, type: string, amount: number) => {
    const newQuests = state.questState.quests.map(q => {
      if (q.completed) return q;
      const newSteps = q.steps.map((step, idx) => {
        if (idx !== q.currentStep) return step;
        if (step.type !== type) return step;
        const newCurrent = Math.min(step.target, step.current + amount);
        return { ...step, current: newCurrent };
      });
      const completed = newSteps.every(s => s.current >= s.target);
      return { ...q, steps: newSteps, completed };
    });

    const newChallenges = state.questState.challenges.map(c => {
      if (c.completed) return c;
      if (c.type !== type) return c;
      const newCurrent = Math.min(c.target, c.current + amount);
      const completed = newCurrent >= c.target;
      return { ...c, current: newCurrent, completed };
    });

    const newEvents = state.questState.events.map(e => {
      if (e.completed) return e;
      if (e.type !== type) return e;
      const newCurrent = Math.min(e.target, e.current + amount);
      const completed = newCurrent >= e.target;
      return { ...e, current: newCurrent, completed };
    });

    return {
      ...state,
      questState: {
        ...state.questState,
        quests: newQuests,
        challenges: newChallenges,
        events: newEvents,
      },
    };
  }, []);

  // --- Calculations ---
  const calculateClickPower = useCallback((state: GameState) => {
    let power = 1;
    state.upgrades.filter(u => u.type === 'clickPower')
      .forEach(u => power += u.effect * u.owned);
    
    state.skillTree.filter(s => s.owned && s.type === 'clickMulti')
      .forEach(s => power *= s.effect);
    
    state.transcendenceTree.filter(t => t.owned && t.type === 'infinitePower')
      .forEach(t => power *= t.effect);
    state.transcendenceTree.filter(t => t.owned && t.type === 'globalMulti')
      .forEach(t => power *= t.effect);
    
    state.eternityTree.filter(e => e.owned && e.type === 'omnipotent')
      .forEach(e => power *= e.effect);
    
    return power;
  }, []);

  const calculateCPS = useCallback((state: GameState) => {
    let cps = 0;
    state.upgrades.filter(u => u.type === 'autoClicker')
      .forEach(u => cps += u.effect * u.owned * state.clickPower);
    
    state.skillTree.filter(s => s.owned && s.type === 'cpsBoost')
      .forEach(s => cps *= s.effect);
    state.skillTree.filter(s => s.owned && s.type === 'cpsMulti')
      .forEach(s => cps *= s.effect);
    
    state.ascensionTree.filter(a => a.owned && a.type === 'allMulti')
      .forEach(a => cps *= a.effect);
    state.ascensionTree.filter(a => a.owned && a.type === 'ultimateCPS')
      .forEach(a => cps *= a.effect);
    
    state.transcendenceTree.filter(t => t.owned && t.type === 'eternityBoost')
      .forEach(t => cps *= t.effect);
    state.transcendenceTree.filter(t => t.owned && t.type === 'globalMulti')
      .forEach(t => cps *= t.effect);
    
    state.eternityTree.filter(e => e.owned && e.type === 'infiniteAuto')
      .forEach(e => cps *= e.effect);
    state.eternityTree.filter(e => e.owned && e.type === 'omnipotent')
      .forEach(e => cps *= e.effect);
    
    return cps;
  }, []);

  // --- Other functions like buyUpgrade, prestige, etc. ---
  // (Keep all of your previous callbacks, including buyUpgradeBulk, prestige, ascend, transcend, enterEternity, claimQuestReward, claimChallengeReward, claimEventReward, addLeaderboardScore, resetGame, saveGame)
  // They remain unchanged from your previous code.

  // --- Handle manual clicks ---
  const handleClick = useCallback(() => {
    setGameState(prev => {
      const newState = {
        ...prev,
        clicks: prev.clicks + prev.clickPower,
        lifetimeClicks: prev.lifetimeClicks + prev.clickPower,
      };
      return updateQuestProgress(newState, 'clicks', prev.clickPower);
    });
  }, [updateQuestProgress]);

  // --- Auto clicker & stats loop ---
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      setGameState(prev => {
        const cpsGain = prev.cps * delta;
        let newState = {
          ...prev,
          clicks: prev.clicks + cpsGain,
          lifetimeClicks: prev.lifetimeClicks + cpsGain,
        };

        // Track quest progress automatically
        newState = updateQuestProgress(newState, 'clicks', cpsGain);
        if (prev.cps > 0) newState = updateQuestProgress(newState, 'autoClicker', cpsGain);

        const newBestCPS = Math.max(prev.stats.bestCPS, prev.cps);

        const shouldAddHistory = prev.stats.cpsHistory.length === 0 ||
          now - (prev.stats.cpsHistory[prev.stats.cpsHistory.length - 1]?.time || 0) > 10000;

        const newCpsHistory = shouldAddHistory
          ? [...prev.stats.cpsHistory.slice(-50), { time: now, cps: prev.cps }]
          : prev.stats.cpsHistory;

        const newClicksHistory = shouldAddHistory
          ? [...prev.stats.clicksHistory.slice(-50), { time: now, clicks: newState.lifetimeClicks }]
          : prev.stats.clicksHistory;

        return {
          ...newState,
          stats: {
            ...newState.stats,
            totalPlaytime: newState.stats.totalPlaytime + delta,
            bestCPS: newBestCPS,
            cpsHistory: newCpsHistory,
            clicksHistory: newClicksHistory,
          },
        };
      });
    }, 100);

    return () => clearInterval(interval);
  }, [updateQuestProgress]);

  // --- Auto save ---
  useEffect(() => {
    const interval = setInterval(() => saveGame(), 30000);
    return () => clearInterval(interval);
  }, [saveGame]);

  return {
    gameState,
    handleClick,
    buyUpgrade,
    buyUpgradeBulk,
    buySkillNode,
    buyAscensionNode,
    buyTranscendenceNode,
    buyEternityNode,
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
    updateQuestProgress, // now available for external calls if needed
  };
}
