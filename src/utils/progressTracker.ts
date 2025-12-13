import type { GameState, Achievement, Quest, Event, Challenge } from '../types/types';

/**
 * Dynamically gets the stat value for a type string
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
 * Update achievements, quests, challenges, and events
 */
export function updateProgress(state: GameState): GameState {

  const updateCollection = <T extends { id: string; type?: string; target?: number; current?: number; completed?: boolean }>(
    items: T[],
    typeKey: 'type' | 'conditionType' | 'id' = 'type'
  ) => {
    return items.map(item => {
      if (item.completed) return item;
      const key = item[typeKey] || '';
      const current = getStat(state, key);
      if (!item.completed && item.target !== undefined && current >= item.target) {
        console.log(`Unlocked: ${item.id}`);
      }
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
