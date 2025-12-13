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

  // -----------------------------
  // Calculations
  // -----------------------------
  const calculateClickPower = useCallback((state: GameState) => {
    let power = 1;
    state.upgrades.filter(u => u.type === 'clickPower')
      .forEach(u => power += u.effect * u.owned);
    state.skillTree.filter(s => s.owned && s.type === 'clickMulti')
      .forEach(s => power *= s.effect);
    state.transcendenceTree.filter(t => t.owned && ['infinitePower','globalMulti'].includes(t.type))
      .forEach(t => power *= t.effect);
    state.eternityTree.filter(e => e.owned && ['omnipotent'].includes(e.type))
      .forEach(e => power *= e.effect);
    return power;
  }, []);

  const calculateCPS = useCallback((state: GameState) => {
    let cps = 0;
    state.upgrades.filter(u => u.type === 'autoClicker')
      .forEach(u => cps += u.effect * u.owned * state.clickPower);
    state.skillTree.filter(s => s.owned && ['cpsBoost','cpsMulti'].includes(s.type))
      .forEach(s => cps *= s.effect);
    state.ascensionTree.filter(a => a.owned && ['allMulti','ultimateCPS'].includes(a.type))
      .forEach(a => cps *= a.effect);
    state.transcendenceTree.filter(t => t.owned && ['eternityBoost','globalMulti'].includes(t.type))
      .forEach(t => cps *= t.effect);
    state.eternityTree.filter(e => e.owned && ['infiniteAuto','omnipotent'].includes(e.type))
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

  // -----------------------------
  // Quest Tracking Fix
  // -----------------------------
  const updateQuestProgress = useCallback((state: GameState, type: string, amount: number) => {
    const newQuests = state.questState.quests.map(quest => {
      if (quest.completed) return quest;
      const newSteps = quest.steps.map(step => ({
        ...step,
        current: step.type === type ? step.current + amount : step.current
      }));
      const completed = newSteps.every(s => s.current >= s.target);
      const currentStep = newSteps.findIndex(s => s.current < s.target);
      return { ...quest, steps: newSteps, completed, currentStep: currentStep === -1 ? newSteps.length - 1 : currentStep };
    });
    const newChallenges = state.questState.challenges.map(c => {
      const current = (() => {
        switch(c.conditionType || c.type){
          case 'clicks': return state.clicks;
          case 'lifetimeClicks': return state.lifetimeClicks;
          case 'cps': return state.cps;
          case 'upgrades': return state.upgrades.reduce((sum, u) => sum + u.owned, 0);
          case 'prestiges': return state.totalPrestiges;
          case 'ascensions': return state.totalAscensions;
          case 'transcendences': return state.totalTranscendences;
          case 'eternities': return state.totalEternities;
          default: return 0;
        }
      })();
      return {...c, current, completed: current >= c.target};
    });
    return { ...state, questState: { ...state.questState, quests: newQuests, challenges: newChallenges } };
  }, []);

  const updateEventProgress = useCallback((state: GameState, eventId: string) => {
    const event = state.questState.events.find(e => e.id === eventId);
    if (!event || !event.completed) return state;
    return updateQuestProgress(state, 'specialEvent', 1);
  }, [updateQuestProgress]);

  // -----------------------------
  // Actions
  // -----------------------------
  const handleClick = useCallback(() => {
    setGameState(prev => {
      let newState = {...prev, clicks: prev.clicks + prev.clickPower, lifetimeClicks: prev.lifetimeClicks + prev.clickPower};
      return updateQuestProgress(newState, 'clicks', newState.clickPower);
    });
  }, [updateQuestProgress]);

  const buyUpgrade = useCallback((id: string) => {
    setGameState(prev => {
      const upgrade = prev.upgrades.find(u => u.id === id);
      if (!upgrade) return prev;
      const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.owned));
      if (prev.clicks < cost) return prev;
      let newState = {...prev, upgrades: prev.upgrades.map(u => u.id === id ? {...u, owned: u.owned + 1} : u), clicks: prev.clicks - cost};
      newState = {...newState, clickPower: calculateClickPower(newState), cps: calculateCPS(newState)};
      if(upgrade.type==='autoClicker') newState = updateQuestProgress(newState, 'autoClicker', 1);
      return newState;
    });
  }, [calculateClickPower, calculateCPS, updateQuestProgress]);

  const buyUpgradeBulk = useCallback((id: string, amount: number | "MAX") => {
    setGameState(prev => {
      const upgrade = prev.upgrades.find(u => u.id === id);
      if(!upgrade) return prev;
      let clicks = prev.clicks;
      let owned = upgrade.owned;
      let toBuy = amount === "MAX" ? Infinity : amount;
      let bought = 0;

      while(bought < toBuy){
        const nextCost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, owned));
        if(clicks < nextCost) break;
        clicks -= nextCost;
        owned++;
        bought++;
      }

      if(bought===0) return prev;

      let newState = {...prev, upgrades: prev.upgrades.map(u => u.id===id ? {...u, owned} : u), clicks};
      newState = {...newState, clickPower: calculateClickPower(newState), cps: calculateCPS(newState)};
      if(upgrade.type==='autoClicker') newState = updateQuestProgress(newState,'autoClicker',bought);
      return newState;
    });
  }, [calculateClickPower, calculateCPS, updateQuestProgress]);

  // -----------------------------
  // Prestige / Ascend / Transcend / Eternity
  // -----------------------------
  const getStartingClicks = useCallback((state: GameState) => {
    let starting = 0;
    state.skillTree.filter(s=>s.owned && s.type==='startingClicks').forEach(s=>starting+=s.effect);
    state.ascensionTree.filter(a=>a.owned && a.type==='megaStart').forEach(a=>starting+=a.effect);
    state.transcendenceTree.filter(t=>t.owned && t.type==='cosmicStart').forEach(t=>starting+=t.effect);
    state.eternityTree.filter(e=>e.owned && e.type==='beyondReality').forEach(e=>starting+=e.effect);
    return starting;
  }, []);

  const prestige = useCallback(() => {
    setGameState(prev => {
      const gain = calculatePrestigeGain(prev);
      if(gain<=0) return prev;
      let newState = {...getInitialState(), clicks:getStartingClicks(prev), skillTree: prev.skillTree, ascensionTree: prev.ascensionTree, transcendenceTree: prev.transcendenceTree, eternityTree: prev.eternityTree, achievements: prev.achievements, questState: prev.questState, prestigePoints: prev.prestigePoints+gain, totalPrestigePoints: prev.totalPrestigePoints+gain, totalPrestiges: prev.totalPrestiges+1, ascensionPoints: prev.ascensionPoints, totalAscensionPoints: prev.totalAscensionPoints, totalAscensions: prev.totalAscensions, transcendencePoints: prev.transcendencePoints, totalTranscendencePoints: prev.totalTranscendencePoints, totalTranscendences: prev.totalTranscendences, eternityPoints: prev.eternityPoints, totalEternityPoints: prev.totalEternityPoints, totalEternities: prev.totalEternities, stats: prev.stats};
      return updateQuestProgress(newState,'prestige',gain);
    });
  }, [calculatePrestigeGain,getStartingClicks,updateQuestProgress]);

  const ascend = useCallback(() => {
    setGameState(prev => {
      const gain = calculateAscensionGain(prev);
      if(gain<=0) return prev;
      let newState = {...getInitialState(), clicks:getStartingClicks(prev), ascensionTree: prev.ascensionTree, transcendenceTree: prev.transcendenceTree, eternityTree: prev.eternityTree, achievements: prev.achievements, questState: prev.questState, ascensionPoints: prev.ascensionPoints+gain, totalAscensionPoints: prev.totalAscensionPoints+gain, totalAscensions: prev.totalAscensions+1, transcendencePoints: prev.transcendencePoints, totalTranscendencePoints: prev.totalTranscendencePoints, totalTranscendences: prev.totalTranscendences, eternityPoints: prev.eternityPoints, totalEternityPoints: prev.totalEternityPoints, totalEternities: prev.totalEternities, stats: prev.stats};
      return updateQuestProgress(newState,'ascension',gain);
    });
  }, [calculateAscensionGain,getStartingClicks,updateQuestProgress]);

  const transcend = useCallback(() => {
    setGameState(prev => {
      const gain = calculateTranscendenceGain(prev);
      if(gain<=0) return prev;
      let newState = {...getInitialState(), clicks:getStartingClicks(prev), transcendenceTree: prev.transcendenceTree, eternityTree: prev.eternityTree, achievements: prev.achievements, questState: prev.questState, transcendencePoints: prev.transcendencePoints+gain, totalTranscendencePoints: prev.totalTranscendencePoints+gain, totalTranscendences: prev.totalTranscendences+1, eternityPoints: prev.eternityPoints, totalEternityPoints: prev.totalEternityPoints, totalEternities: prev.totalEternities, stats: prev.stats};
      return updateQuestProgress(newState,'transcendence',gain);
    });
  }, [calculateTranscendenceGain,getStartingClicks,updateQuestProgress]);

  const enterEternity = useCallback(() => {
    setGameState(prev => {
      const gain = calculateEternityGain(prev);
      if(gain<=0) return prev;
      let newState = {...getInitialState(), eternityTree: prev.eternityTree, achievements: prev.achievements, questState: prev.questState, eternityPoints: prev.eternityPoints+gain, totalEternityPoints: prev.totalEternityPoints+gain, totalEternities: prev.totalEternities+1, stats: prev.stats};
      return updateQuestProgress(newState,'eternity',gain);
    });
  }, [calculateEternityGain,updateQuestProgress]);

  // -----------------------------
  // Claim rewards
  // -----------------------------
  const claimQuestReward = useCallback((questId: string) => {
    setGameState(prev => {
      const quest = prev.questState.quests.find(q => q.id === questId);
      if(!quest || quest.claimed || !quest.completed) return prev;
      return {...prev, clicks: prev.clicks + (quest.rewards.clicks||0), prestigePoints: prev.prestigePoints+(quest.rewards.prestigePoints||0), ascensionPoints: prev.ascensionPoints+(quest.rewards.ascensionPoints||0), questState: {...prev.questState, quests: prev.questState.quests.map(q => q.id===questId ? {...q, claimed:true} : q)}};
    });
  }, []);

  const claimChallengeReward = useCallback((challengeId: string) => {
    setGameState(prev => {
      const challenge = prev.questState.challenges.find(c => c.id===challengeId);
      if(!challenge || challenge.claimed || !challenge.completed) return prev;
      return {...prev, clicks: prev.clicks+(challenge.rewards.clicks||0), prestigePoints: prev.prestigePoints+(challenge.rewards.prestigePoints||0), questState: {...prev.questState, challenges: prev.questState.challenges.map(c=>c.id===challengeId?{...c,claimed:true}:c)}};
    });
  }, []);

  const claimEventReward = useCallback((eventId: string) => {
    setGameState(prev => {
      const event = prev.questState.events.find(e=>e.id===eventId);
      if(!event || event.claimed || !event.completed) return prev;
      return {...prev, clicks: prev.clicks+(event.rewards.clicks||0), prestigePoints: prev.prestigePoints+(event.rewards.prestigePoints||0), ascensionPoints: prev.ascensionPoints+(event.rewards.ascensionPoints||0), questState: {...prev.questState, events: prev.questState.events.map(e=>e.id===eventId?{...e,claimed:true}:e)}};
    });
  }, []);

  const addLeaderboardScore = useCallback((name:string,type:'lifetime'|'cps'|'prestiges')=>{
    setGameState(prev=>{
      const score = type==='lifetime'?prev.lifetimeClicks:type==='cps'?prev.cps:prev.totalPrestiges;
      const newEntry = {id:`${Date.now()}-${Math.random()}`, name, score, date:Date.now(), type};
      return {...prev, questState:{...prev.questState, leaderboard:[...prev.questState.leaderboard,newEntry].sort((a,b)=>b.score-a.score).slice(0,100)}};
    });
  },[]);

  const resetGame = useCallback(()=>{
    if(confirm('Are you sure you want to reset all progress?')){
      localStorage.removeItem(STORAGE_KEY);
      setGameState(getInitialState());
    }
  },[]);

  const saveGame = useCallback(()=>{
    localStorage.setItem(STORAGE_KEY,JSON.stringify({...gameState, stats:{...gameState.stats,lastOnlineTime:Date.now()}}));
  },[gameState]);

  // -----------------------------
  // Auto-click & Stats Loop
  // -----------------------------
  useEffect(()=>{
    const interval = setInterval(()=>{
      const now = Date.now();
      const delta = (now - lastTickRef.current)/1000;
      lastTickRef.current = now;

      setGameState(prev=>{
        let newClicks = prev.clicks + prev.cps * delta;
        let newLifetime = prev.lifetimeClicks + prev.cps * delta;
        let newState = {...prev, clicks:newClicks, lifetimeClicks:newLifetime};
        newState = updateQuestProgress(newState,'clicks',prev.cps*delta);

        prev.questState.events.forEach(event=>{
          if(event.completed && !event.claimed) newState = updateEventProgress(newState,event.id);
        });

        const newBestCPS = Math.max(prev.stats.bestCPS,prev.cps);
        const shouldAddHistory = prev.stats.cpsHistory.length===0 || now-(prev.stats.cpsHistory[prev.stats.cpsHistory.length-1]?.time||0) > 10000;
        const newCpsHistory = shouldAddHistory ? [...prev.stats.cpsHistory.slice(-50), {time:now, cps:prev.cps}] : prev.stats.cpsHistory;
        const newClicksHistory = shouldAddHistory ? [...prev.stats.clicksHistory.slice(-50), {time:now, clicks:newLifetime}] : prev.stats.clicksHistory;

        newState.stats = {...prev.stats, totalPlaytime: prev.stats.totalPlaytime + delta, bestCPS:newBestCPS, cpsHistory:newCpsHistory, clicksHistory:newClicksHistory};
        return newState;
      });
    },100);

    return ()=>clearInterval(interval);
  },[updateQuestProgress, updateEventProgress]);

  // -----------------------------
  // Auto-save
  // -----------------------------
  useEffect(()=>{
    const interval = setInterval(()=>saveGame(),30000);
    return ()=>clearInterval(interval);
  },[saveGame]);

  return {
    gameState,
    handleClick,
    buyUpgrade,
    buyUpgradeBulk,
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
  };
}
