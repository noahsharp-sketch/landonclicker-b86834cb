import { useState, useEffect, useCallback, useRef } from 'react';
import {
  initialUpgrades,
  initialSkillTree,
  initialAscensionTree,
  initialTranscendenceTree,
  createInitialAchievements,
} from '../data/gameData';
import { createInitialQuestState, generateSpecialEvents } from '../data/questData';
import type { GameState, QuestState } from '../types/types';

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

  const [gameState, setGameState] = useState<GameState>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return getInitialState();
    try {
      const parsed = JSON.parse(saved);
      const fresh = getInitialState();
      
      // Calculate offline earnings
      const lastOnline = parsed.stats?.lastOnlineTime || Date.now();
      const offlineSeconds = Math.min((Date.now() - lastOnline) / 1000, 86400); // Max 24 hours
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

  const calculateClickPower = useCallback((state: GameState) => {
    let power = 1;
    state.upgrades.filter(u => u.type === 'clickPower')
      .forEach(u => power += u.effect * u.owned);
    
    // Prestige skills
    state.skillTree.filter(s => s.owned && s.type === 'clickMulti')
      .forEach(s => power *= s.effect);
    
    // Transcendence bonuses
    state.transcendenceTree.filter(t => t.owned && t.type === 'infinitePower')
      .forEach(t => power *= t.effect);
    state.transcendenceTree.filter(t => t.owned && t.type === 'globalMulti')
      .forEach(t => power *= t.effect);
    
    return power;
  }, []);

  const calculateCPS = useCallback((state: GameState) => {
    let cps = 0;
    state.upgrades.filter(u => u.type === 'autoClicker')
      .forEach(u => cps += u.effect * u.owned * state.clickPower);
    
    // Prestige skills
    state.skillTree.filter(s => s.owned && s.type === 'cpsBoost')
      .forEach(s => cps *= s.effect);
    state.skillTree.filter(s => s.owned && s.type === 'cpsMulti')
      .forEach(s => cps *= s.effect);
    
    // Ascension bonuses
    state.ascensionTree.filter(a => a.owned && a.type === 'allMulti')
      .forEach(a => cps *= a.effect);
    state.ascensionTree.filter(a => a.owned && a.type === 'ultimateCPS')
      .forEach(a => cps *= a.effect);
    
    // Transcendence bonuses
    state.transcendenceTree.filter(t => t.owned && t.type === 'eternityBoost')
      .forEach(t => cps *= t.effect);
    state.transcendenceTree.filter(t => t.owned && t.type === 'globalMulti')
      .forEach(t => cps *= t.effect);
    
    return cps;
  }, []);

  const calculatePrestigeGain = useCallback((state: GameState) => {
    let gain = Math.floor(state.lifetimeClicks / 1_000_000);
    state.ascensionTree.filter(a => a.owned && a.type === 'prestigeMulti')
      .forEach(a => gain *= a.effect);
    return gain;
  }, []);

  const calculateAscensionGain = useCallback((state: GameState) => {
    let gain = Math.floor(Math.sqrt(state.totalPrestigePoints / 100));
    state.transcendenceTree.filter(t => t.owned && t.type === 'ascensionMulti')
      .forEach(t => gain *= t.effect);
    return gain;
  }, []);

  const calculateTranscendenceGain = useCallback((state: GameState) => {
    return Math.floor(Math.sqrt(state.totalAscensionPoints / 50));
  }, []);

  const getUpgradeCost = useCallback((upgrade: { baseCost: number; costMultiplier: number; owned: number }) => {
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.owned));
  }, []);

  const handleClick = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      clicks: prev.clicks + prev.clickPower,
      lifetimeClicks: prev.lifetimeClicks + prev.clickPower,
    }));
  }, []);

  const buyUpgrade = useCallback((id: string) => {
    setGameState(prev => {
      const upgrade = prev.upgrades.find(u => u.id === id);
      if (!upgrade) return prev;

      const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.owned));
      if (prev.clicks < cost) return prev;

      const newUpgrades = prev.upgrades.map(u => u.id === id ? { ...u, owned: u.owned + 1 } : u);
      const newState = { ...prev, upgrades: newUpgrades, clicks: prev.clicks - cost };
      return { ...newState, clickPower: calculateClickPower(newState), cps: calculateCPS(newState) };
    });
  }, [calculateClickPower, calculateCPS]);

  const buyUpgradeBulk = useCallback((id: string, amount: number | "MAX") => {
    setGameState(prev => {
      const upgrade = prev.upgrades.find(u => u.id === id);
      if (!upgrade) return prev;

      let clicks = prev.clicks;
      let owned = upgrade.owned;
      let toBuy = amount === "MAX" ? Infinity : amount;
      let bought = 0;

      while (bought < toBuy) {
        const nextCost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, owned));
        if (clicks < nextCost) break;
        clicks -= nextCost;
        owned++;
        bought++;
      }

      if (bought === 0) return prev;

      const newUpgrades = prev.upgrades.map(u => u.id === id ? { ...u, owned } : u);
      const newState = { ...prev, clicks, upgrades: newUpgrades };
      return { ...newState, clickPower: calculateClickPower(newState), cps: calculateCPS(newState) };
    });
  }, [calculateClickPower, calculateCPS]);

  const buySkillNode = useCallback((id: string) => {
    setGameState(prev => {
      const node = prev.skillTree.find(n => n.id === id);
      if (!node || node.owned || prev.prestigePoints < node.cost) return prev;

      const newSkillTree = prev.skillTree.map(n => n.id === id ? { ...n, owned: true } : n);
      const newState = { ...prev, skillTree: newSkillTree, prestigePoints: prev.prestigePoints - node.cost };
      return { ...newState, clickPower: calculateClickPower(newState), cps: calculateCPS(newState) };
    });
  }, [calculateClickPower, calculateCPS]);

  const buyAscensionNode = useCallback((id: string) => {
    setGameState(prev => {
      const node = prev.ascensionTree.find(n => n.id === id);
      if (!node || node.owned || prev.ascensionPoints < node.cost) return prev;

      const newAscensionTree = prev.ascensionTree.map(n => n.id === id ? { ...n, owned: true } : n);
      const newState = { ...prev, ascensionTree: newAscensionTree, ascensionPoints: prev.ascensionPoints - node.cost };
      return { ...newState, clickPower: calculateClickPower(newState), cps: calculateCPS(newState) };
    });
  }, [calculateClickPower, calculateCPS]);

  const buyTranscendenceNode = useCallback((id: string) => {
    setGameState(prev => {
      const node = prev.transcendenceTree.find(n => n.id === id);
      if (!node || node.owned || prev.transcendencePoints < node.cost) return prev;

      const newTranscendenceTree = prev.transcendenceTree.map(n => n.id === id ? { ...n, owned: true } : n);
      const newState = { ...prev, transcendenceTree: newTranscendenceTree, transcendencePoints: prev.transcendencePoints - node.cost };
      return { ...newState, clickPower: calculateClickPower(newState), cps: calculateCPS(newState) };
    });
  }, [calculateClickPower, calculateCPS]);

  const prestige = useCallback(() => {
    setGameState(prev => {
      const gain = calculatePrestigeGain(prev);
      if (gain <= 0) return prev;
      
      const startingClicks = prev.skillTree.find(s => s.owned && s.type === 'startingClicks')?.effect || 0;
      const megaStart = prev.ascensionTree.find(a => a.owned && a.type === 'megaStart')?.effect || 0;
      const cosmicStart = prev.transcendenceTree.find(t => t.owned && t.type === 'cosmicStart')?.effect || 0;
      
      return {
        ...getInitialState(),
        clicks: startingClicks + megaStart + cosmicStart,
        upgrades: initialUpgrades,
        skillTree: prev.skillTree,
        ascensionTree: prev.ascensionTree,
        transcendenceTree: prev.transcendenceTree,
        achievements: prev.achievements,
        questState: prev.questState,
        prestigePoints: prev.prestigePoints + gain,
        totalPrestigePoints: prev.totalPrestigePoints + gain,
        totalPrestiges: prev.totalPrestiges + 1,
        ascensionPoints: prev.ascensionPoints,
        totalAscensionPoints: prev.totalAscensionPoints,
        totalAscensions: prev.totalAscensions,
        transcendencePoints: prev.transcendencePoints,
        totalTranscendencePoints: prev.totalTranscendencePoints,
        totalTranscendences: prev.totalTranscendences,
        stats: prev.stats,
      };
    });
  }, [calculatePrestigeGain]);

  const ascend = useCallback(() => {
    setGameState(prev => {
      const gain = calculateAscensionGain(prev);
      if (gain <= 0) return prev;
      
      const cosmicStart = prev.transcendenceTree.find(t => t.owned && t.type === 'cosmicStart')?.effect || 0;
      
      return {
        ...getInitialState(),
        clicks: cosmicStart,
        upgrades: initialUpgrades,
        skillTree: initialSkillTree,
        ascensionTree: prev.ascensionTree,
        transcendenceTree: prev.transcendenceTree,
        achievements: prev.achievements,
        questState: prev.questState,
        ascensionPoints: prev.ascensionPoints + gain,
        totalAscensionPoints: prev.totalAscensionPoints + gain,
        totalAscensions: prev.totalAscensions + 1,
        transcendencePoints: prev.transcendencePoints,
        totalTranscendencePoints: prev.totalTranscendencePoints,
        totalTranscendences: prev.totalTranscendences,
        stats: prev.stats,
      };
    });
  }, [calculateAscensionGain]);

  const transcend = useCallback(() => {
    setGameState(prev => {
      const gain = calculateTranscendenceGain(prev);
      if (gain <= 0) return prev;
      
      return {
        ...getInitialState(),
        transcendenceTree: prev.transcendenceTree,
        achievements: prev.achievements,
        questState: prev.questState,
        transcendencePoints: prev.transcendencePoints + gain,
        totalTranscendencePoints: prev.totalTranscendencePoints + gain,
        totalTranscendences: prev.totalTranscendences + 1,
        stats: prev.stats,
      };
    });
  }, [calculateTranscendenceGain]);

  const claimQuestReward = useCallback((questId: string) => {
    setGameState(prev => {
      const quest = prev.questState.quests.find(q => q.id === questId);
      if (!quest || quest.claimed || !quest.completed) return prev;
      
      return {
        ...prev,
        clicks: prev.clicks + (quest.rewards.clicks || 0),
        prestigePoints: prev.prestigePoints + (quest.rewards.prestigePoints || 0),
        ascensionPoints: prev.ascensionPoints + (quest.rewards.ascensionPoints || 0),
        questState: {
          ...prev.questState,
          quests: prev.questState.quests.map(q => 
            q.id === questId ? { ...q, claimed: true } : q
          ),
        },
      };
    });
  }, []);

  const claimChallengeReward = useCallback((challengeId: string) => {
    setGameState(prev => {
      const challenge = prev.questState.challenges.find(c => c.id === challengeId);
      if (!challenge || challenge.claimed || !challenge.completed) return prev;
      
      return {
        ...prev,
        clicks: prev.clicks + (challenge.rewards.clicks || 0),
        prestigePoints: prev.prestigePoints + (challenge.rewards.prestigePoints || 0),
        questState: {
          ...prev.questState,
          challenges: prev.questState.challenges.map(c => 
            c.id === challengeId ? { ...c, claimed: true } : c
          ),
        },
      };
    });
  }, []);

  const claimEventReward = useCallback((eventId: string) => {
    setGameState(prev => {
      const event = prev.questState.events.find(e => e.id === eventId);
      if (!event || event.claimed || !event.completed) return prev;
      
      return {
        ...prev,
        clicks: prev.clicks + (event.rewards.clicks || 0),
        prestigePoints: prev.prestigePoints + (event.rewards.prestigePoints || 0),
        ascensionPoints: prev.ascensionPoints + (event.rewards.ascensionPoints || 0),
        questState: {
          ...prev.questState,
          events: prev.questState.events.map(e => 
            e.id === eventId ? { ...e, claimed: true } : e
          ),
        },
      };
    });
  }, []);

  const addLeaderboardScore = useCallback((name: string, type: 'lifetime' | 'cps' | 'prestiges') => {
    setGameState(prev => {
      const score = type === 'lifetime' ? prev.lifetimeClicks 
        : type === 'cps' ? prev.cps 
        : prev.totalPrestiges;
      
      const newEntry = {
        id: `${Date.now()}-${Math.random()}`,
        name,
        score,
        date: Date.now(),
        type,
      };
      
      return {
        ...prev,
        questState: {
          ...prev.questState,
          leaderboard: [...prev.questState.leaderboard, newEntry]
            .sort((a, b) => b.score - a.score)
            .slice(0, 100),
        },
      };
    });
  }, []);

  const resetGame = useCallback(() => {
    if (confirm('Are you sure you want to reset all progress?')) {
      localStorage.removeItem(STORAGE_KEY);
      setGameState(getInitialState());
    }
  }, []);

  const saveGame = useCallback(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
      ...gameState,
      stats: { ...gameState.stats, lastOnlineTime: Date.now() },
    }));
  }, [gameState]);

  // Auto clicker & stats loop
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      setGameState(prev => {
        const newClicks = prev.clicks + prev.cps * delta;
        const newLifetime = prev.lifetimeClicks + prev.cps * delta;
        const newBestCPS = Math.max(prev.stats.bestCPS, prev.cps);

        const shouldAddHistory = prev.stats.cpsHistory.length === 0 ||
          now - (prev.stats.cpsHistory[prev.stats.cpsHistory.length - 1]?.time || 0) > 10000;

        const newCpsHistory = shouldAddHistory
          ? [...prev.stats.cpsHistory.slice(-50), { time: now, cps: prev.cps }]
          : prev.stats.cpsHistory;

        const newClicksHistory = shouldAddHistory
          ? [...prev.stats.clicksHistory.slice(-50), { time: now, clicks: newLifetime }]
          : prev.stats.clicksHistory;

        return {
          ...prev,
          clicks: newClicks,
          lifetimeClicks: newLifetime,
          stats: {
            ...prev.stats,
            totalPlaytime: prev.stats.totalPlaytime + delta,
            bestCPS: newBestCPS,
            cpsHistory: newCpsHistory,
            clicksHistory: newClicksHistory,
          },
        };
      });
    }, 100);

    return () => clearInterval(interval);
  }, []);

  // Auto save
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
    prestige,
    ascend,
    transcend,
    resetGame,
    saveGame,
    getUpgradeCost,
    calculatePrestigeGain,
    calculateAscensionGain,
    calculateTranscendenceGain,
    offlineEarnings,
    claimQuestReward,
    claimChallengeReward,
    claimEventReward,
    addLeaderboardScore,
  };
}
