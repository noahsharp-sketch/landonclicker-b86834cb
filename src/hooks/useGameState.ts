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

  const getStartingClicks = useCallback((state: GameState) => {
    let starting = 0;
    const skillStart = state.skillTree.find(s => s.owned && s.type === 'startingClicks');
    if (skillStart) starting += skillStart.effect;
    const megaStart = state.ascensionTree.find(a => a.owned && a.type === 'megaStart');
    if (megaStart) starting += megaStart.effect;
    const cosmicStart = state.transcendenceTree.find(t => t.owned && t.type === 'cosmicStart');
    if (cosmicStart) starting += cosmicStart.effect;
    const beyondReality = state.eternityTree.find(e => e.owned && e.type === 'beyondReality');
    if (beyondReality) starting += beyondReality.effect;
    return starting;
  }, []);

  // --- CLICK FUNCTION ---
  const handleClick = useCallback(() => {
    setGameState(prev => {
      const clickAmount = prev.clickPower;

      // Update quests
      const updatedQuests = prev.questState.quests.map(q => {
        if (q.completed) return q;
        const step = q.steps[q.currentStep];
        if (!step) return q;
        let newCurrent = step.current;
        if (step.type === 'clicks' || step.type === 'lifetimeClicks') newCurrent += clickAmount;
        const completed = newCurrent >= step.target;
        return {
          ...q,
          steps: q.steps.map((s, idx) => idx === q.currentStep ? { ...s, current: Math.min(newCurrent, step.target) } : s),
          currentStep: completed ? q.currentStep + 1 : q.currentStep,
          completed: completed && q.currentStep === q.steps.length - 1,
        };
      });

      return {
        ...prev,
        clicks: prev.clicks + clickAmount,
        lifetimeClicks: prev.lifetimeClicks + clickAmount,
        questState: {
          ...prev.questState,
          quests: updatedQuests,
        },
      };
    });
  }, []);

  // --- BUY FUNCTIONS ---
  const buyUpgrade = useCallback((id: string) => {
    setGameState(prev => {
      const upgrade = prev.upgrades.find(u => u.id === id);
      if (!upgrade) return prev;
      const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.owned));
      if (prev.clicks < cost) return prev;

      const newUpgrades = prev.upgrades.map(u => u.id === id ? { ...u, owned: u.owned + 1 } : u);

      // Track quests for autoClicker purchase
      const updatedQuests = prev.questState.quests.map(q => {
        if (q.completed) return q;
        const step = q.steps[q.currentStep];
        if (!step) return q;
        let newCurrent = step.current;
        if (step.type === 'autoClicksGenerated' && upgrade.type === 'autoClicker') newCurrent += upgrade.effect;
        const completed = newCurrent >= step.target;
        return {
          ...q,
          steps: q.steps.map((s, idx) => idx === q.currentStep ? { ...s, current: Math.min(newCurrent, step.target) } : s),
          currentStep: completed ? q.currentStep + 1 : q.currentStep,
          completed: completed && q.currentStep === q.steps.length - 1,
        };
      });

      const newState = { ...prev, clicks: prev.clicks - cost, upgrades: newUpgrades, questState: { ...prev.questState, quests: updatedQuests } };
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

      // Track quests for bulk auto-clickers
      const updatedQuests = prev.questState.quests.map(q => {
        if (q.completed) return q;
        const step = q.steps[q.currentStep];
        if (!step) return q;
        let newCurrent = step.current;
        if (step.type === 'autoClicksGenerated' && upgrade.type === 'autoClicker') newCurrent += upgrade.effect * bought;
        const completed = newCurrent >= step.target;
        return {
          ...q,
          steps: q.steps.map((s, idx) => idx === q.currentStep ? { ...s, current: Math.min(newCurrent, step.target) } : s),
          currentStep: completed ? q.currentStep + 1 : q.currentStep,
          completed: completed && q.currentStep === q.steps.length - 1,
        };
      });

      const newState = { ...prev, clicks, upgrades: newUpgrades, questState: { ...prev.questState, quests: updatedQuests } };
      return { ...newState, clickPower: calculateClickPower(newState), cps: calculateCPS(newState) };
    });
  }, [calculateClickPower, calculateCPS]);

  // --- PRESTIGE / ASCENSION / TRANSCENDENCE / ETERNITY ---
  const prestige = useCallback(() => {
    setGameState(prev => {
      const gain = calculatePrestigeGain(prev);
      if (gain <= 0) return prev;
      const startingClicks = getStartingClicks(prev);
      return {
        ...getInitialState(),
        clicks: startingClicks,
        skillTree: prev.skillTree,
        ascensionTree: prev.ascensionTree,
        transcendenceTree: prev.transcendenceTree,
        eternityTree: prev.eternityTree,
        achievements: prev.achievements,
        questState: prev.questState,
        prestigePoints: prev.prestigePoints + gain,
        totalPrestigePoints: prev.totalPrestigePoints + gain,
        totalPrestiges: prev.totalPrestiges + 1,
        stats: prev.stats,
      };
    });
  }, [calculatePrestigeGain, getStartingClicks]);

  const ascend = useCallback(() => {
    setGameState(prev => {
      const gain = calculateAscensionGain(prev);
      if (gain <= 0) return prev;
      const startingClicks = getStartingClicks(prev);
      return {
        ...getInitialState(),
        clicks: startingClicks,
        ascensionTree: prev.ascensionTree,
        transcendenceTree: prev.transcendenceTree,
        eternityTree: prev.eternityTree,
        achievements: prev.achievements,
        questState: prev.questState,
        ascensionPoints: prev.ascensionPoints + gain,
        totalAscensionPoints: prev.totalAscensionPoints + gain,
        totalAscensions: prev.totalAscensions + 1,
        stats: prev.stats,
      };
    });
  }, [calculateAscensionGain, getStartingClicks]);

  const transcend = useCallback(() => {
    setGameState(prev => {
      const gain = calculateTranscendenceGain(prev);
      if (gain <= 0) return prev;
      const startingClicks = getStartingClicks(prev);
      return {
        ...getInitialState(),
        clicks: startingClicks,
        transcendenceTree: prev.transcendenceTree,
        eternityTree: prev.eternityTree,
        achievements: prev.achievements,
        questState: prev.questState,
        transcendencePoints: prev.transcendencePoints + gain,
        totalTranscendencePoints: prev.totalTranscendencePoints + gain,
        totalTranscendences: prev.totalTranscendences + 1,
        stats: prev.stats,
      };
    });
  }, [calculateTranscendenceGain, getStartingClicks]);

  const enterEternity = useCallback(() => {
    setGameState(prev => {
      const gain = calculateEternityGain(prev);
      if (gain <= 0) return prev;
      return {
        ...getInitialState(),
        eternityTree: prev.eternityTree,
        achievements: prev.achievements,
        questState: prev.questState,
        eternityPoints: prev.eternityPoints + gain,
        totalEternityPoints: prev.totalEternityPoints + gain,
        totalEternities: prev.totalEternities + 1,
        stats: prev.stats,
      };
    });
  }, [calculateEternityGain]);

  // --- QUEST / CHALLENGE / EVENT CLAIMING ---
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
          quests: prev.questState.quests.map(q => q.id === questId ? { ...q, claimed: true } : q),
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
          challenges: prev.questState.challenges.map(c => c.id === challengeId ? { ...c, claimed: true } : c),
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
        questState: {
          ...prev.questState,
          events: prev.questState.events.map(e => e.id === eventId ? { ...e, claimed: true } : e),
        },
      };
    });
  }, []);

  // --- AUTO CLICKER LOOP ---
  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const delta = (now - lastTickRef.current) / 1000;
      lastTickRef.current = now;

      setGameState(prev => {
        const newClicks = prev.clicks + prev.cps * delta;
        const newLifetime = prev.lifetimeClicks + prev.cps * delta;
        const newBestCPS = Math.max(prev.stats.bestCPS, prev.cps);

        const updatedQuests = prev.questState.quests.map(quest => {
          if (quest.completed) return quest;
          const currentStep = quest.steps[quest.currentStep];
          if (!currentStep) return quest;
          let newCurrent = currentStep.current;
          if (currentStep.type === 'clicks' || currentStep.type === 'lifetimeClicks' || currentStep.type === 'autoClicksGenerated') {
            newCurrent += prev.cps * delta;
          }
          const completed = newCurrent >= currentStep.target;
          return {
            ...quest,
            steps: quest.steps.map((step, idx) =>
              idx === quest.currentStep ? { ...step, current: Math.min(newCurrent, currentStep.target) } : step
            ),
            currentStep: completed ? quest.currentStep + 1 : quest.currentStep,
            completed: completed && quest.currentStep === quest.steps.length - 1,
          };
        });

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
          questState: {
            ...prev.questState,
            quests: updatedQuests,
          },
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

  // --- AUTO SAVE ---
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
    buyUpgrade,
    buyUpgradeBulk,
    prestige,
    ascend,
    transcend,
    enterEternity,
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
  };
}
