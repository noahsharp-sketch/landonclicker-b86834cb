import { GameState } from './types';

export const calculateClickPower = (state: GameState) => {
  let power = 1;
  state.upgrades.filter(u => u.type === 'clickPower')
    .forEach(u => power += u.effect * u.owned);
  const clickMulti = state.skillTree.find(s => s.owned && s.type === 'clickMulti');
  if (clickMulti) power *= clickMulti.effect;
  return power;
};

export const calculateCPS = (state: GameState) => {
  let cps = 0;
  state.upgrades.filter(u => u.type === 'autoClicker')
    .forEach(u => cps += u.effect * u.owned * state.clickPower);
  const cpsBoost = state.skillTree.find(s => s.owned && s.type === 'cpsBoost');
  if (cpsBoost) cps *= cpsBoost.effect;
  return cps;
};

export const calculatePrestigeGain = (state: GameState) => Math.floor(state.lifetimeClicks / 1_000_000);

export const calculateAscensionGain = (state: GameState) => Math.floor(Math.sqrt(state.totalPrestigePoints / 100));
