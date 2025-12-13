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

  // -----------------------
  // Calculation Functions
  // -----------------------
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

  const calculatePrestigeGain = useCallback((state: GameState) => {
    let gain = Math.floor(state.lifetimeClicks / 10_000_000);
    state.ascensionTree.filter(a => a.owned && a.type === 'prestigeMulti')
      .forEach(a => gain *= a.effect);
    return gain;
  }, []);

  const calculateAscensionGain = useCallback((state: GameState) => {
    let gain = Math.floor(Math.sqrt(state.totalPrestigePoints / 500));
    state.transcendenceTree.filter(t => t.owned && t.type === 'ascensionMulti')
      .forEach(t => gain *= t.effect);
    return gain;
  }, []);

  const calculateTranscendenceGain = useCallback((state: GameState) => {
    let gain = Math.floor(Math.sqrt(state.totalAscensionPoints / 250));
    state.eternityTree.filter(e => e.owned && e.type === 'transcendenceMulti')
      .forEach(e => gain *= e.effect);
    return gain;
  }, []);

  const calculateEternityGain = useCallback((state: GameState) => {
    return Math.floor(Math.sqrt(state.totalTranscendencePoints / 100));
  }, []);

  const getUpgradeCost = useCallback((upgrade: { baseCost: number; costMultiplier: number; owned: number }) => {
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.owned));
  }, []);

  // -----------------------
  // Quest Tracking Function
  // -----------------------
  const updateQuestProgress = useCallback((state: GameState, type: string, amount: number) => {
    const newQuests = state.questState.quests.map(quest => {
      if (quest.completed) return quest;
      const newSteps = quest.steps.map((step, idx) => {
        if (idx !== quest.currentStep) return step;
        if (step.type === type) {
          const newCurrent = Math.min(step.target, step.current + amount);
          return { ...step, current: newCurrent };
        }
        return step;
      });
      const completed = newSteps.every(s => s.current >= s.target);
      return { ...quest, steps: newSteps, completed };
    });

    return { ...state, questState: { ...state.questState, quests: newQuests } };
  }, []);

  // -----------------------
  // Game Actions
  // -----------------------
  const handleClick = useCallback(() => {
    setGameState(prev => {
      let newState = {
        ...prev,
        clicks: prev.clicks + prev.clickPower,
        lifetimeClicks: prev.lifetimeClicks + prev.clickPower,
      };

      // Track click-based quests
      newState = updateQuestProgress(newState, 'clicks', newState.clickPower);

      return newState;
    });
  }, [updateQuestProgress]);

  // Buy upgrades, skills, nodes remain the same...
  // (bulk buying is preserved, skipped here for brevity)
  
  // -----------------------
  // Auto-click & Stats Loop
  // -----------------------
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      setGameState(prev => {
        const newClicks = prev.clicks + prev.cps * delta;
        const newLifetime = prev.lifetimeClicks + prev.cps * delta;

        let newState = {
          ...prev,
          clicks: newClicks,
          lifetimeClicks: newLifetime,
        };

        // Track click-based quests from CPS
        newState = updateQuestProgress(newState, 'clicks', prev.cps * delta);

        return newState;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [updateQuestProgress]);

  // Auto save
  useEffect(() => {
    const interval = setInterval(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        ...gameState,
        stats: { ...gameState.stats, lastOnlineTime: Date.now() },
      }));
    }, 30000);
    return () => clearInterval(interval);
  }, [gameState]);

  return {
    gameState,
    handleClick,
    // ...all previous actions like buyUpgrade, buyUpgradeBulk, claimQuestReward, etc.
  };
}
