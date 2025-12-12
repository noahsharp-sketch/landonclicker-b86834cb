import { GameState } from './useGameState'; // make sure path is correct

export function applyCheat(state: GameState, code: string): GameState {
  const newState = { ...state };

  switch(code.toLowerCase()) {
    case 'giveme1000clicks':
      newState.clicks += 1000;
      newState.lifetimeClicks += 1000;
      break;
    case 'maxclickpower':
      newState.clickPower = 9999;
      break;
    case 'maxcps':
      newState.cps = 999;
      break;
    case 'unlockallupgrades':
      newState.upgrades = newState.upgrades.map(u => ({ ...u, owned: 999 }));
      break;
    case 'unlockallachievements':
      newState.achievements = newState.achievements.map(a => ({ ...a, unlocked: true }));
      break;
    case 'givemeprestige':
      newState.prestigePoints += 100;
      newState.totalPrestigePoints += 100;
      break;
    case 'giveascension':
      newState.ascensionPoints += 50;
      newState.totalAscensionPoints += 50;
      break;
    default:
      console.warn('Unknown cheat code:', code);
  }

  return newState;
}
