import { Upgrade, SkillNode, AscensionNode, Achievement } from '../types/types';

export const initialUpgrades: Upgrade[] = [
  { id: 'energy', name: '⚡ Energy Drink', description: '+2 click power', baseCost: 100, costMultiplier: 1.15, owned: 0, effect: 2, type: 'clickPower' },
  { id: 'sean', name: "💜 Sean's Love", description: '+1 auto-clicker', baseCost: 1000, costMultiplier: 1.15, owned: 0, effect: 1, type: 'autoClicker' },
  { id: 'superClick', name: 'Quarter Zip', description: '+5 click power', baseCost: 5000, costMultiplier: 1.2, owned: 0, effect: 5, type: 'clickPower' },
  { id: 'megaAuto', name: "💕Benicio's love", description: '+5 auto-clickers', baseCost: 10000, costMultiplier: 1.2, owned: 0, effect: 5, type: 'autoClicker' },
  { id: 'hot sauce', name: 'Hot Sauce', description: '+20 click power', baseCost: 20000, costMultiplier: 1.2, owned: 0, effect: 20, type: "clickPower" },
  { id: 'Evil Ben G', name: '😈Evil Ben G', description: '+10 auto-clickers', baseCost: 100000, costMultiplier: 1.2, owned: 0, effect: 10, type: "autoClicker" },
  { id: 'discord mod', name: 'Discord Mod', description: '+100 click power', baseCost: 150000, costMultiplier: 1.2, owned: 0, effect: 100, type: "clickPower" },
  { id: 'macha', name: 'Macha', description: '+500 click power', baseCost: 1000000, costMultiplier: 1.2, owned: 0, effect: 500, type: "clickPower" },
];

export const initialSkillTree: SkillNode[] = [
  { id: 'a', name: 'Click Fury', description: '2x click power', cost: 1, owned: false, effect: 2, type: 'clickMulti' },
  { id: 'b', name: 'Auto Boost', description: '1.5x auto-clickers', cost: 2, owned: false, effect: 1.5, type: 'cpsBoost' },
  { id: 'c', name: 'Auto Multi', description: '3x auto-clicker multi', cost: 2, owned: false, effect: 1.5, type: 'cpsMulti' },
];

export const initialAscensionTree: AscensionNode[] = [
  { id: 'asc1', name: 'Prestige Master', description: '2x prestige gain', cost: 1, owned: false, effect: 2, type: 'prestigeMulti' },
  { id: 'asc2', name: 'Universal Power', description: '3x all production', cost: 2, owned: false, effect: 3, type: 'allMulti' },
  { id: 'asc3', name: 'Ultimate Clicker', description: '3.5x auto-clickers', cost: 5, owned: false, effect: 3.5, type: 'ultimateCPS' },
];

export function createInitialAchievements(): Achievement[] {
  return [
    { id: 'first_click', name: 'First Click', description: 'Click for the first time', icon: '👆', unlocked: false, condition: s => s.lifetimeClicks >= 1 },
    { id: 'click_100', name: 'Getting Started', description: 'Reach 100 lifetime clicks', icon: '✋', unlocked: false, condition: s => s.lifetimeClicks >= 100 },
    { id: 'first_upgrade', name: 'First Purchase', description: 'Buy your first upgrade', icon: '🛠️', unlocked: false, condition: s => s.upgrades.some(u => u.owned >= 1) },
    // ... add more achievements
  ];
}
