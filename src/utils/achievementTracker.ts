import type { GameState, Achievement } from '../types/types';
import { getStat } from './progressTracker';

/**
 * Updates all achievements based on the current game state
 */
export function updateAchievements(state: GameState): Achievement[] {
  return state.achievements.map(a => {
    if (a.completed) return a;
    const current = getStat(state, a.type || '');
    return { ...a, current, completed: current >= a.target };
  });
}

/**
 * Optional helper to get newly completed achievements for notifications
 */
export function getNewlyCompletedAchievements(state: GameState): Achievement[] {
  return state.achievements.filter(a => a.completed && !a.notified);
}
