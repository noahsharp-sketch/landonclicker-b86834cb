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
  saved.forEach(i => map.set(i.id, i));
  fresh.forEach(i => {
    if (!map.has(i.id)) map.set(i.id, i);
  });
  return Array.from(map.values());
}

const STORAGE_KEY = 'landon-clicker-save';

export function useGameState() {
  const lastTickRef = useRef(Date.now());
  const [offlineEarnings, setOfflineEarnings] = useState<number | null>(null);

  /* ---------------- INITIAL STATE ---------------- */

  function getInitialState(): GameState {
    const questState = createInitialQuestState();

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

      questState: {
        ...questState,
        quests: questState.quests ?? [],
        challenges: questState.challenges ?? [],
        events: questState.events ?? [],
        leaderboard: questState.leaderboard ?? [],
      },
    };
  }

  /* ---------------- LOAD SAVE ---------------- */

  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return getInitialState();

    try {
      const parsed = JSON.parse(saved);
      const fresh = getInitialState();

      const lastOnline = parsed.stats?.lastOnlineTime ?? Date.now();
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
          quests: parsed.questState?.quests ?? fresh.questState.quests,
          challenges: parsed.questState?.challenges ?? fresh.questState.challenges,
          events: generateSpecialEvents(),
          leaderboard: parsed.questState?.leaderboard ?? [],
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

  /* ---------------- CALCULATIONS ---------------- */

  const calculateClickPower = useCallback((state: GameState) => {
    let power = 1;

    state.upgrades.filter(u => u.type === 'clickPower')
      .forEach(u => power += u.effect * u.owned);

    state.skillTree.filter(s => s.owned && s.type === 'clickMulti')
      .forEach(s => power *= s.effect);

    state.transcendenceTree.filter(t => t.owned && ['infinitePower', 'globalMulti'].includes(t.type))
      .forEach(t => power *= t.effect);

    state.eternityTree.filter(e => e.owned && e.type === 'omnipotent')
      .forEach(e => power *= e.effect);

    return power;
  }, []);

  const calculateCPS = useCallback((state: GameState) => {
    let cps = 0;

    state.upgrades.filter(u => u.type === 'autoClicker')
      .forEach(u => cps += u.effect * u.owned * state.clickPower);

    state.skillTree.filter(s => s.owned && ['cpsBoost', 'cpsMulti'].includes(s.type))
      .forEach(s => cps *= s.effect);

    state.ascensionTree.filter(a => a.owned && ['allMulti', 'ultimateCPS'].includes(a.type))
      .forEach(a => cps *= a.effect);

    state.transcendenceTree.filter(t => t.owned && ['eternityBoost', 'globalMulti'].includes(t.type))
      .forEach(t => cps *= t.effect);

    state.eternityTree.filter(e => e.owned && ['infiniteAuto', 'omnipotent'].includes(e.type))
      .forEach(e => cps *= e.effect);

    return cps;
  }, []);

  const getUpgradeCost = useCallback(
    (u: { baseCost: number; costMultiplier: number; owned: number }) =>
      Math.floor(u.baseCost * Math.pow(u.costMultiplier, u.owned)),
    []
  );

  /* ---------------- QUEST UPDATES ---------------- */

  const updateQuestProgress = useCallback((state: GameState, type: string, amount: number) => {
    const quests = (state.questState.quests ?? []).map(q => {
      if (q.completed) return q;

      const steps = q.steps.map((s, i) =>
        i === q.currentStep && s.type === type
          ? { ...s, current: Math.min(s.target, s.current + amount) }
          : s
      );

      return {
        ...q,
        steps,
        completed: steps.every(s => s.current >= s.target),
      };
    });

    return { ...state, questState: { ...state.questState, quests } };
  }, []);

  /* ---------------- CORE ACTIONS ---------------- */

  const handleClick = useCallback(() => {
    setGameState(prev => {
      let s = {
        ...prev,
        clicks: prev.clicks + prev.clickPower,
        lifetimeClicks: prev.lifetimeClicks + prev.clickPower,
      };
      return updateQuestProgress(s, 'clicks', prev.clickPower);
    });
  }, [updateQuestProgress]);

  const buyUpgrade = useCallback((id: string) => {
    setGameState(prev => {
      const u = prev.upgrades.find(x => x.id === id);
      if (!u) return prev;

      const cost = getUpgradeCost(u);
      if (prev.clicks < cost) return prev;

      let s = {
        ...prev,
        clicks: prev.clicks - cost,
        upgrades: prev.upgrades.map(x =>
          x.id === id ? { ...x, owned: x.owned + 1 } : x
        ),
      };

      s = { ...s, clickPower: calculateClickPower(s), cps: calculateCPS(s) };

      if (u.type === 'autoClicker') {
        s = updateQuestProgress(s, 'autoClicker', 1);
      }

      return s;
    });
  }, [calculateClickPower, calculateCPS, getUpgradeCost, updateQuestProgress]);

  /* ---------------- MAIN LOOP ---------------- */

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      setGameState(prev => {
        let s = {
          ...prev,
          clicks: prev.clicks + prev.cps * delta,
          lifetimeClicks: prev.lifetimeClicks + prev.cps * delta,
        };

        s = updateQuestProgress(s, 'clicks', prev.cps * delta);

        s.stats = {
          ...prev.stats,
          totalPlaytime: prev.stats.totalPlaytime + delta,
          bestCPS: Math.max(prev.stats.bestCPS, prev.cps),
        };

        return s;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [updateQuestProgress]);

  /* ---------------- SAVE ---------------- */

  const saveGame = useCallback(() => {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ ...gameState, stats: { ...gameState.stats, lastOnlineTime: Date.now() } })
    );
  }, [gameState]);

  useEffect(() => {
    const i = setInterval(saveGame, 30000);
    return () => clearInterval(i);
  }, [saveGame]);

  /* ---------------- RETURN ---------------- */

  return {
    gameState,
    handleClick,
    buyUpgrade,
    getUpgradeCost,
    saveGame,
    offlineEarnings,
  };
}
