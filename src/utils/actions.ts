import { GameState } from '../types/types';
import { calculateClickPower, calculateCPS, getUpgradeCost } from './calculations';

export const buyUpgrade = (state: GameState, id: string): GameState => {
  const upgrade = state.upgrades.find(u => u.id === id);
  if (!upgrade) return state;

  const cost = getUpgradeCost(state, id);
  if (state.clicks < cost) return state;

  const newUpgrades = state.upgrades.map(u => u.id === id ? { ...u, owned: u.owned + 1 } : u);
  const newState = { ...state, upgrades: newUpgrades, clicks: state.clicks - cost };
  return { ...newState, clickPower: calculateClickPower(newState), cps: calculateCPS(newState) };
};
