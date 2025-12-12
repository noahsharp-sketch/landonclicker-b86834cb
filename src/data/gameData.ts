import { Upgrade, SkillNode, AscensionNode, Achievement, GameState } from '../types/types';

export const initialUpgrades: Upgrade[] = [
  { id: 'energy', name: '⚡ Energy Drink', description: '+2 click power', baseCost: 100, costMultiplier: 1.15, owned: 0, effect: 2, type: 'clickPower' },
  { id: 'sean', name: "💜 Sean's Love", description: '+1 auto-clicker', baseCost: 1000, costMultiplier: 1.15, owned: 0, effect: 1, type: 'autoClicker' },
  { id: 'superClick', name: 'Quarter Zip', description: '+5 click power', baseCost: 5000, costMultiplier: 1.2, owned: 0, effect: 5, type: 'clickPower' },
  { id: 'megaAuto', name: "💕 Benicio's Love", description: '+5 auto-clickers', baseCost: 10000, costMultiplier: 1.2, owned: 0, effect: 5, type: 'autoClicker' },
  { id: 'hot sauce', name: '🌶️ Hot Sauce', description: '+20 click power', baseCost: 20000, costMultiplier: 1.2, owned: 0, effect: 20, type: 'clickPower' },
  { id: 'Evil Ben G', name: '😈 Evil Ben G', description: '+10 auto-clickers', baseCost: 100000, costMultiplier: 1.2, owned: 0, effect: 10, type: 'autoClicker' },
  { id: 'discord mod', name: '🎮 Discord Mod', description: '+100 click power', baseCost: 150000, costMultiplier: 1.2, owned: 0, effect: 100, type: 'clickPower' },
  { id: 'macha', name: '🍵 Matcha', description: '+500 click power', baseCost: 1000000, costMultiplier: 1.2, owned: 0, effect: 500, type: 'clickPower' },
  { id: 'robot', name: '🤖 Robot Helper', description: '+50 auto-clickers', baseCost: 2000000, costMultiplier: 1.25, owned: 0, effect: 50, type: 'autoClicker' },
  { id: 'quantum', name: '⚛️ Quantum Click', description: '+2000 click power', baseCost: 10000000, costMultiplier: 1.3, owned: 0, effect: 2000, type: 'clickPower' },
];

export const initialSkillTree: SkillNode[] = [
  { id: 'a', name: '⚡ Click Fury', description: 'Doubles all click power. Your clicks become twice as powerful!', cost: 1, owned: false, effect: 2, type: 'clickMulti' },
  { id: 'b', name: '🚀 Auto Boost', description: 'Multiplies auto-clicker speed by 1.5x. More clicks per second!', cost: 2, owned: false, effect: 1.5, type: 'cpsBoost' },
  { id: 'c', name: '💎 CPS Multi', description: 'Triples your clicks per second. Massive passive income boost!', cost: 3, owned: false, effect: 3, type: 'cpsMulti' },
  { id: 'd', name: '💰 Bargain Hunter', description: 'Reduces all upgrade costs by 15%. Shop smarter!', cost: 2, owned: false, effect: 0.85, type: 'costReduction' },
  { id: 'e', name: '🎁 Head Start', description: 'Start each prestige with 10,000 clicks. Jump ahead!', cost: 3, owned: false, effect: 10000, type: 'startingClicks' },
  { id: 'f', name: '🔥 Click Mastery', description: 'Additional 3x click power multiplier. Click like a master!', cost: 5, owned: false, effect: 3, type: 'clickMulti' },
  { id: 'g', name: '⚡ Hyper CPS', description: 'Additional 2x CPS multiplier. Supercharge your auto-clickers!', cost: 5, owned: false, effect: 2, type: 'cpsBoost' },
];

export const initialAscensionTree: AscensionNode[] = [
  { id: 'asc1', name: '⭐ Prestige Master', description: 'Double prestige point gains. Prestige faster!', cost: 1, owned: false, effect: 2, type: 'prestigeMulti' },
  { id: 'asc2', name: '🌟 Universal Power', description: 'Triple ALL production. Everything is boosted!', cost: 2, owned: false, effect: 3, type: 'allMulti' },
  { id: 'asc3', name: '🚀 Ultimate Clicker', description: '3.5x auto-clicker multiplier. Maximum automation!', cost: 3, owned: false, effect: 3.5, type: 'ultimateCPS' },
  { id: 'asc4', name: '💎 Super Savings', description: 'Reduce all costs by 25%. Even better deals!', cost: 2, owned: false, effect: 0.75, type: 'superCost' },
  { id: 'asc5', name: '🎯 Mega Start', description: 'Start with 1M clicks after prestige. Incredible head start!', cost: 4, owned: false, effect: 1000000, type: 'megaStart' },
  { id: 'asc6', name: '🔮 Prestige Surge', description: 'Additional 3x prestige gain. Prestige like never before!', cost: 5, owned: false, effect: 3, type: 'prestigeMulti' },
  { id: 'asc7', name: '🌌 Cosmic Power', description: '5x ALL production. Cosmic level boost!', cost: 8, owned: false, effect: 5, type: 'allMulti' },
];

export function createInitialAchievements(): Achievement[] {
  return [
    { id: 'first_click', name: 'First Click', description: 'Click for the first time', icon: '👆', unlocked: false, condition: (s: GameState) => s.lifetimeClicks >= 1 },
    { id: 'click_100', name: 'Getting Started', description: 'Reach 100 lifetime clicks', icon: '✋', unlocked: false, condition: (s: GameState) => s.lifetimeClicks >= 100 },
    { id: 'click_1k', name: 'Thousand Club', description: 'Reach 1,000 lifetime clicks', icon: '🏆', unlocked: false, condition: (s: GameState) => s.lifetimeClicks >= 1000 },
    { id: 'click_10k', name: 'Click Enthusiast', description: 'Reach 10,000 lifetime clicks', icon: '⭐', unlocked: false, condition: (s: GameState) => s.lifetimeClicks >= 10000 },
    { id: 'click_100k', name: 'Click Master', description: 'Reach 100,000 lifetime clicks', icon: '💎', unlocked: false, condition: (s: GameState) => s.lifetimeClicks >= 100000 },
    { id: 'click_1m', name: 'Millionaire', description: 'Reach 1,000,000 lifetime clicks', icon: '🌟', unlocked: false, condition: (s: GameState) => s.lifetimeClicks >= 1000000 },
    { id: 'first_upgrade', name: 'First Purchase', description: 'Buy your first upgrade', icon: '🛒', unlocked: false, condition: (s: GameState) => s.upgrades.some(u => u.owned >= 1) },
    { id: 'upgrade_10', name: 'Upgrade Collector', description: 'Own 10 total upgrades', icon: '📦', unlocked: false, condition: (s: GameState) => s.upgrades.reduce((sum, u) => sum + u.owned, 0) >= 10 },
    { id: 'first_prestige', name: 'First Prestige', description: 'Prestige for the first time', icon: '🔄', unlocked: false, condition: (s: GameState) => s.totalPrestiges >= 1 },
    { id: 'prestige_5', name: 'Prestige Pro', description: 'Prestige 5 times', icon: '🏅', unlocked: false, condition: (s: GameState) => s.totalPrestiges >= 5 },
    { id: 'cps_100', name: 'Auto Clicker', description: 'Reach 100 CPS', icon: '⚡', unlocked: false, condition: (s: GameState) => s.cps >= 100 },
    { id: 'cps_1000', name: 'Speed Demon', description: 'Reach 1,000 CPS', icon: '🚀', unlocked: false, condition: (s: GameState) => s.cps >= 1000 },
    { id: 'first_ascension', name: 'Ascended', description: 'Ascend for the first time', icon: '🌌', unlocked: false, condition: (s: GameState) => s.totalAscensionPoints >= 1 },
    { id: 'skill_complete', name: 'Skill Master', description: 'Unlock all prestige skills', icon: '🎓', unlocked: false, condition: (s: GameState) => s.skillTree.every(n => n.owned) },
  ];
}
