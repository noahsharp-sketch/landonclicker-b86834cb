import { GameState, Achievement } from '../types/types';

export function applyAchievementBoosts(state: GameState): GameState {
  let clickMultiplier = 1;
  let cpsMultiplier = 1;

  state.achievements.forEach((ach: Achievement) => {
    if (ach.unlocked) {
      if (ach.type === 'clickPower') clickMultiplier *= ach.boost || 1;
      if (ach.type === 'cps') cpsMultiplier *= ach.boost || 1;
    }
  });

  return {
    ...state,
    clickPower: state.clickPower * clickMultiplier,
    cps: state.cps * cpsMultiplier,
  };
}
