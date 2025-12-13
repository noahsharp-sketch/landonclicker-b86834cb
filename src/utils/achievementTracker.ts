import type { GameState, Achievement } from '../types/types';
import { getStat } from './progressTracker';

export function updateAchievements(state: GameState): Achievement[] {
  return state.achievements.map(a => {
    if (a.completed) return a;

    const current = getStat(state, a.type);

    const completed = current >= a.target;

    if (completed && !a.completed) {
      console.log(`Achievement unlocked: ${a.name}`);
    }

    return { ...a, current, completed };
  });
}
