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
import type { GameState, Quest, Challenge, SpecialEvent } from '../types/types';

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
  const tickCounterRef = useRef(0);
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

  // ------------------------- QUEST TRACKING -------------------------
  const updateQuestProgress = useCallback((state: GameState) => {
    const updateSteps = (steps: Quest['steps'] | Challenge['steps'], getValue: (type: string) => number) => {
      return steps.map(step => {
        if (step.current >= step.target) return step;
        const value = getValue(step.type);
        const newCurrent = Math.min(step.target, value);
        return { ...step, current: newCurrent };
      });
    };

    const updateQuests = state.questState.quests.map(q => {
      if (q.completed) return q;
      const updatedSteps = updateSteps(q.steps, (type) => {
        switch(type) {
          case 'clicks': return state.clicks;
          case 'lifetimeClicks': return state.lifetimeClicks;
          case 'clickPower': return state.clickPower;
          case 'upgrades': return state.upgrades.reduce((sum, u) => sum + u.owned, 0);
          case 'prestiges': return state.totalPrestiges;
          case 'ascensionPoints': return state.totalAscensionPoints;
          case 'transcendencePoints': return state.totalTranscendencePoints;
          case 'eternityPoints': return state.totalEternityPoints;
          case 'cps': return state.cps;
          default: return 0;
        }
      });
      const completed = updatedSteps.every(step => step.current >= step.target);
      const currentStep = updatedSteps.findIndex(step => step.current < step.target);
      return { ...q, steps: updatedSteps, currentStep: currentStep === -1 ? updatedSteps.length - 1 : currentStep, completed };
    });

    const updateChallenges = state.questState.challenges.map(c => {
      if (c.completed) return c;
      const currentVal = (() => {
        switch(c.conditionType) {
          case 'clicks': return state.clicks;
          case 'lifetimeClicks': return state.lifetimeClicks;
          case 'clickPower': return state.clickPower;
          case 'upgrades': return state.upgrades.reduce((sum, u) => sum + u.owned, 0);
          case 'prestiges': return state.totalPrestiges;
          case 'cps': return state.cps;
          default: return 0;
        }
      })();
      const newCurrent = Math.min(c.target, currentVal);
      const completed = newCurrent >= c.target;
      return { ...c, current: newCurrent, completed };
    });

    const updateEvents = state.questState.events.map(e => {
      const updatedChallenges = e.challenges.map(ch => {
        if (ch.completed) return ch;
        const currentVal = (() => {
          switch(ch.type) {
            case 'clicks': return state.clicks;
            case 'lifetimeClicks': return state.lifetimeClicks;
            case 'clickPower': return state.clickPower;
            case 'upgrades': return state.upgrades.reduce((sum, u) => sum + u.owned, 0);
            case 'prestiges': return state.totalPrestiges;
            case 'cps': return state.cps;
            default: return 0;
          }
        })();
        const newCurrent = Math.min(ch.target, currentVal);
        const completed = newCurrent >= ch.target;
        return { ...ch, current: newCurrent, completed };
      });
      const completed = updatedChallenges.every(ch => ch.completed);
      return { ...e, challenges: updatedChallenges, completed };
    });

    return {
      ...state.questState,
      quests: updateQuests,
      challenges: updateChallenges,
      events: updateEvents,
    };
  }, []);

  // ------------------------- OTHER HOOK LOGIC -------------------------
  const calculateClickPower = useCallback((state: GameState) => {
    let power = 1;
    state.upgrades.filter(u => u.type === 'clickPower')
      .forEach(u => power += u.effect * u.owned);
    state.skillTree.filter(s => s.owned && s.type === 'clickMulti')
      .forEach(s => power *= s.effect);
    state.transcendenceTree.filter(t => t.owned && (t.type === 'infinitePower' || t.type === 'globalMulti'))
      .forEach(t => power *= t.effect);
    state.eternityTree.filter(e => e.owned && e.type === 'omnipotent')
      .forEach(e => power *= e.effect);
    return power;
  }, []);

  const calculateCPS = useCallback((state: GameState) => {
    let cps = 0;
    state.upgrades.filter(u => u.type === 'autoClicker')
      .forEach(u => cps += u.effect * u.owned * state.clickPower);
    state.skillTree.filter(s => s.owned && (s.type === 'cpsBoost' || s.type === 'cpsMulti'))
      .forEach(s => cps *= s.effect);
    state.ascensionTree.filter(a => a.owned && (a.type === 'allMulti' || a.type === 'ultimateCPS'))
      .forEach(a => cps *= a.effect);
    state.transcendenceTree.filter(t => t.owned && (t.type === 'eternityBoost' || t.type === 'globalMulti'))
      .forEach(t => cps *= t.effect);
    state.eternityTree.filter(e => e.owned && (e.type === 'infiniteAuto' || e.type === 'omnipotent'))
      .forEach(e => cps *= e.effect);
    return cps;
  }, []);

  // ... (all the other functions like buyUpgrade, buySkillNode, prestige, etc. remain unchanged) ...

  // ------------------------- AUTO CLICK & STATS LOOP -------------------------
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      tickCounterRef.current++;

      setGameState(prev => {
        let newState = { ...prev };
        const newClicks = prev.clicks + prev.cps * delta;
        const newLifetime = prev.lifetimeClicks + prev.cps * delta;

        newState = {
          ...newState,
          clicks: newClicks,
          lifetimeClicks: newLifetime,
          stats: {
            ...prev.stats,
            totalPlaytime: prev.stats.totalPlaytime + delta,
            bestCPS: Math.max(prev.stats.bestCPS, prev.cps),
          },
        };

        // Run quest updates every 10 ticks
        if (tickCounterRef.current % 10 === 0) {
          newState = { ...newState, questState: updateQuestProgress(newState) };
        }

        return newState;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [updateQuestProgress]);

  // ------------------------- AUTO SAVE -------------------------
  const saveGame = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...gameState,
      stats: { ...gameState.stats, lastOnlineTime: Date.now() },
    }));
  }, [gameState]);

  useEffect(() => {
    const interval = setInterval(() => saveGame(), 30000);
    return () => clearInterval(interval);
  }, [saveGame]);

  return {
    gameState,
    // ... return all the existing functions like handleClick, buyUpgrade, prestige, ascend, etc. ...
  };
}
