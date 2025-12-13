import type { GameState, Quest, Challenge, Event } from '../types/types';
import { getStat } from './progressTracker';

export function getStat(state: GameState, type: string): number {
  switch (type) {
    case 'clicks': return state.clicks;
    case 'lifetimeClicks': return state.lifetimeClicks;
    case 'prestiges': return state.totalPrestiges;
    case 'ascensions': return state.totalAscensions;
    case 'transcendences': return state.totalTranscendences;
    case 'eternities': return state.totalEternities;
    case 'upgrades': return state.upgrades.reduce((sum, u) => sum + u.owned, 0);
    case 'autoClickers': return state.upgrades.filter(u => u.type === 'autoClicker').reduce((sum, u) => sum + u.owned, 0);
    default:
      return (state.stats as any)[type] ?? 0;
  }
}

export function updateProgress(state: GameState): GameState {
  // Update quests
  const updatedQuests = state.questState.quests.map(q => {
    const steps = q.steps.map(s => ({ ...s, current: getStat(state, s.type) }));
    const completed = steps.every(s => s.current >= s.target);
    const currentStep = steps.findIndex(s => s.current < s.target);
    return { ...q, steps, completed, currentStep: currentStep === -1 ? steps.length - 1 : currentStep };
  });

  // Update challenges
  const updatedChallenges = state.questState.challenges.map(c => {
    const current = getStat(state, c.conditionType || c.type);
    return { ...c, current, completed: current >= c.target };
  });

  // Update events
  const updatedEvents = state.questState.events.map(e => {
    const current = getStat(state, e.type || e.id);
    return { ...e, current, completed: current >= (e.target || 1) };
  });

  return {
    ...state,
    questState: { ...state.questState, quests: updatedQuests, challenges: updatedChallenges, events: updatedEvents },
  };
}

export function resetPeriodicQuests(state: GameState): GameState {
  const resetQuests = state.questState.quests.map(q => {
    if (q.periodic && !q.claimed) {
      return { ...q, completed: false, currentStep: 0, steps: q.steps.map(s => ({ ...s, current: 0 })), claimed: false };
    }
    return q;
  });

  const resetEvents = state.questState.events.map(e => {
    if (e.periodic && !e.claimed) {
      return { ...e, completed: false, current: 0, claimed: false };
    }
    return e;
  });

  return { ...state, questState: { ...state.questState, quests: resetQuests, events: resetEvents } };
}
