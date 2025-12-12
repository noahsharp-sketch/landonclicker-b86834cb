import { GameState } from '../types/types';

export const calculateClickPower = (state: GameState) => {
  let power = 1;
  
  // Base power from upgrades
  state.upgrades.filter(u => u.type === 'clickPower')
    .forEach(u => power += u.effect * u.owned);
  
  // Click multipliers from skill tree
  state.skillTree.filter(s => s.owned && s.type === 'clickMulti')
    .forEach(s => power *= s.effect);
  
  // All multiplier from ascension tree
  state.ascensionTree.filter(a => a.owned && a.type === 'allMulti')
    .forEach(a => power *= a.effect);
  
  return power;
};

export const calculateCPS = (state: GameState) => {
  let cps = 0;
  
  // Base CPS from auto-clickers (multiplied by click power)
  state.upgrades.filter(u => u.type === 'autoClicker')
    .forEach(u => cps += u.effect * u.owned * state.clickPower);
  
  // CPS boost from skill tree
  state.skillTree.filter(s => s.owned && s.type === 'cpsBoost')
    .forEach(s => cps *= s.effect);
  
  // CPS multiplier from skill tree
  state.skillTree.filter(s => s.owned && s.type === 'cpsMulti')
    .forEach(s => cps *= s.effect);
  
  // Ultimate CPS from ascension tree
  state.ascensionTree.filter(a => a.owned && a.type === 'ultimateCPS')
    .forEach(a => cps *= a.effect);
  
  // All multiplier from ascension tree (already applied to click power, so skip for CPS base)
  
  return cps;
};

export const calculatePrestigeGain = (state: GameState) => {
  let gain = Math.floor(state.lifetimeClicks / 1_000_000);
  
  // Prestige multipliers from ascension tree
  state.ascensionTree.filter(a => a.owned && a.type === 'prestigeMulti')
    .forEach(a => gain = Math.floor(gain * a.effect));
  
  return gain;
};

export const calculateAscensionGain = (state: GameState) => {
  return Math.floor(Math.sqrt(state.totalPrestigePoints / 100));
};

export const getUpgradeCost = (state: GameState, id: string): number => {
  const upgrade = state.upgrades.find(u => u.id === id);
  if (!upgrade) return Infinity;
  
  let cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.owned));
  
  // Cost reduction from skill tree
  state.skillTree.filter(s => s.owned && s.type === 'costReduction')
    .forEach(s => cost = Math.floor(cost * s.effect));
  
  // Super cost reduction from ascension tree
  state.ascensionTree.filter(a => a.owned && a.type === 'superCost')
    .forEach(a => cost = Math.floor(cost * a.effect));
  
  return cost;
};
