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
import type { GameState, QuestStep } from '../types/types';

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

  // ---------------------------
  // Quest tracking function
  // ---------------------------
  const updateQuestProgress = useCallback((state: GameState): GameState => {
    const updateSteps = (steps: QuestStep[]) => {
      return steps.map(step => {
        let currentValue = 0;
        switch(step.type) {
          case 'clicks': currentValue = state.clicks; break;
          case 'cps': currentValue = state.cps; break;
          case 'clickPower': currentValue = state.clickPower; break;
          case 'upgrades': currentValue = state.upgrades.reduce((sum, u) => sum + u.owned, 0); break;
          case 'lifetimeClicks': currentValue = state.lifetimeClicks; break;
          case 'prestiges': currentValue = state.totalPrestiges; break;
          case 'ascensions': currentValue = state.totalAscensions; break;
          case 'transcendences': currentValue = state.totalTranscendences; break;
          case 'eternities': currentValue = state.totalEternities; break;
          default: currentValue = step.current;
        }
        return { ...step, current: currentValue };
      });
    };

    const updateQuestList = (quests: typeof state.questState.quests) => {
      return quests.map(q => {
        const updatedSteps = updateSteps(q.steps);
        const completed = updatedSteps.every(s => s.current >= s.target);
        const currentStep = updatedSteps.findIndex(s => s.current < s.target);
        return { ...q, steps: updatedSteps, completed, currentStep: currentStep === -1 ? updatedSteps.length - 1 : currentStep };
      });
    };

    const updateChallenges = (challenges: typeof state.questState.challenges) => {
      return challenges.map(c => {
        const currentValue = (() => {
          switch(c.conditionType) {
            case 'clicks': return state.clicks;
            case 'cps': return state.cps;
            case 'clickPower': return state.clickPower;
            case 'upgrades': return state.upgrades.reduce((sum, u) => sum + u.owned, 0);
            case 'lifetimeClicks': return state.lifetimeClicks;
            case 'prestiges': return state.totalPrestiges;
            default: return c.current;
          }
        })();
        const completed = currentValue >= c.target;
        return { ...c, current: currentValue, completed };
      });
    };

    const updateEvents = (events: typeof state.questState.events) => {
      return events.map(e => {
        const updatedChallenges = e.challenges.map(ch => {
          const currentValue = (() => {
            switch(ch.type) {
              case 'clicks': return state.clicks;
              case 'cps': return state.cps;
              case 'upgrades': return state.upgrades.reduce((sum, u) => sum + u.owned, 0);
              case 'lifetimeClicks': return state.lifetimeClicks;
              case 'prestiges': return state.totalPrestiges;
              default: return ch.current;
            }
          })();
          return { ...ch, current: currentValue, completed: currentValue >= ch.target };
        });
        const completed = updatedChallenges.every(ch => ch.completed);
        return { ...e, challenges: updatedChallenges, completed };
      });
    };

    return {
      ...state,
      questState: {
        ...state.questState,
        quests: updateQuestList(state.questState.quests),
        challenges: updateChallenges(state.questState.challenges),
        events: updateEvents(state.questState.events),
      },
    };
  }, []);

  // ---------------------------
  // Rest of your code (clicks, CPS, upgrades, prestige, etc.)
  // ---------------------------

  const calculateClickPower = useCallback((state: GameState) => {
    let power = 1;
    state.upgrades.filter(u => u.type === 'clickPower')
      .forEach(u => power += u.effect * u.owned);
    state.skillTree.filter(s => s.owned && s.type === 'clickMulti').forEach(s => power *= s.effect);
    state.transcendenceTree.filter(t => t.owned && t.type === 'infinitePower').forEach(t => power *= t.effect);
    state.transcendenceTree.filter(t => t.owned && t.type === 'globalMulti').forEach(t => power *= t.effect);
    state.eternityTree.filter(e => e.owned && e.type === 'omnipotent').forEach(e => power *= e.effect);
    return power;
  }, []);

  const calculateCPS = useCallback((state: GameState) => {
    let cps = 0;
    state.upgrades.filter(u => u.type === 'autoClicker').forEach(u => cps += u.effect * u.owned * state.clickPower);
    state.skillTree.filter(s => s.owned && (s.type === 'cpsBoost' || s.type === 'cpsMulti')).forEach(s => cps *= s.effect);
    state.ascensionTree.filter(a => a.owned && (a.type === 'allMulti' || a.type === 'ultimateCPS')).forEach(a => cps *= a.effect);
    state.transcendenceTree.filter(t => t.owned && (t.type === 'eternityBoost' || t.type === 'globalMulti')).forEach(t => cps *= t.effect);
    state.eternityTree.filter(e => e.owned && (e.type === 'infiniteAuto' || e.type === 'omnipotent')).forEach(e => cps *= e.effect);
    return cps;
  }, []);

  const handleClick = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      clicks: prev.clicks + prev.clickPower,
      lifetimeClicks: prev.lifetimeClicks + prev.clickPower,
    }));
  }, []);

  // ---------------------------
  // Auto clicker & quest update loop
  // ---------------------------
  useEffect(() => {
    let tickCount = 0;
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;
      tickCount++;

      setGameState(prev => {
        // Update clicks and lifetimeClicks
        let newState = { ...prev, clicks: prev.clicks + prev.cps * delta, lifetimeClicks: prev.lifetimeClicks + prev.cps * delta };

        // Update stats
        newState.stats = { ...prev.stats, totalPlaytime: prev.stats.totalPlaytime + delta, bestCPS: Math.max(prev.stats.bestCPS, prev.cps) };

        // Every 10 ticks, update quests
        if (tickCount % 10 === 0) {
          newState = updateQuestProgress(newState);
        }

        return newState;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [updateQuestProgress]);

  // ---------------------------
  // Auto save
  // ---------------------------
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
    handleClick,
    saveGame,
    offlineEarnings,
  };
}
