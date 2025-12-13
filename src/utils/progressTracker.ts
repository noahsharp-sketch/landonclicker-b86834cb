import type { GameState } from '../types/types';

/**
 * Dynamically get the value of a stat
 */
export function getStat(state: GameState, type: string): number {
  if (type in state) return (state as any)[type];
  if (type in state.stats) return (state.stats as any)[type];
  if (type === 'upgrades') return state.upgrades.reduce((sum, u) => sum + u.owned, 0);
  if (type === 'prestiges') return state.totalPrestiges;
  if (type === 'ascensions') return state.totalAscensions;
  if (type === 'transcendences') return state.totalTranscendences;
  if (type === 'eternities') return state.totalEternities;

  console.warn(`getStat: unknown stat type "${type}"`);
  return 0;
}

/**
 * Update all achievements, quests, challenges, and events
 */
export function updateProgress(state: GameState): GameState {

  const updateCollection = <
    T extends { id: string; type?: string; target?: number; current?: number; completed?: boolean }
  >(items: T[], typeKey: 'type' | 'conditionType' | 'id' = 'type') => {
    return items.map(item => {
      if (item.completed) return item;
      const key = item[typeKey] || '';
      const current = getStat(state, key);
      return { ...item, current, completed: item.target !== undefined ? current >= item.target : item.completed };
    });
  };

  return {
    ...state,
    achievements: updateCollection(state.achievements),
    questState: {
      ...state.questState,
      quests: state.questState.quests.map(q => {
        const steps = q.steps.map(s => ({ ...s, current: getStat(state, s.type) }));
        const completed = steps.every(s => s.current >= s.target);
        const currentStep = steps.findIndex(s => s.current < s.target);
        return { ...q, steps, completed, currentStep: currentStep === -1 ? steps.length - 1 : currentStep };
      }),
      challenges: updateCollection(state.questState.challenges, 'conditionType'),
      events: updateCollection(state.questState.events, 'id'),
    },
  };
}

/**
 * Reset daily and weekly quests if needed
 */
export function resetPeriodicQuests(state: GameState): GameState {
  const now = Date.now();

  const updatedQuests = state.questState.quests.map(q => {
    if (q.frequency === 'daily' && !isSameDay(q.lastClaim || 0, now)) {
      return { ...q, claimed: false, completed: false, lastClaim: now };
    }
    if (q.frequency === 'weekly' && !isSameWeek(q.lastClaim || 0, now)) {
      return { ...q, claimed: false, completed: false, lastClaim: now };
    }
    return q;
  });

  return { ...state, questState: { ...state.questState, quests: updatedQuests } };
}

/** --------------------------
 * Helper functions for day/week
 */
function isSameDay(time1: number, time2: number) {
  const d1 = new Date(time1);
  const d2 = new Date(time2);
  return d1.getFullYear() === d2.getFullYear() &&
         d1.getMonth() === d2.getMonth() &&
         d1.getDate() === d2.getDate();
}

function isSameWeek(time1: number, time2: number) {
  const d1 = new Date(time1);
  const d2 = new Date(time2);
  const week1 = getWeekNumber(d1);
  const week2 = getWeekNumber(d2);
  return d1.getFullYear() === d2.getFullYear() && week1 === week2;
}

function getWeekNumber(d: Date) {
  const onejan = new Date(d.getFullYear(),0,1);
  return Math.ceil((((d.getTime() - onejan.getTime()) / 86400000) + onejan.getDay()+1)/7);
}
