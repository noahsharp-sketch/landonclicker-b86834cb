import { Upgrade, SkillNode, AscensionNode, TranscendenceNode, EternityNode, Achievement, GameState } from '../types/types';

export const initialUpgrades: Upgrade[] = [
  // Click Power Upgrades - higher costs, steeper scaling
  { id: 'energy', name: '⚡ Energy Drink', description: '+1 click power', baseCost: 50, costMultiplier: 1.25, owned: 0, effect: 1, type: 'clickPower' },
  { id: 'superClick', name: '👕 Quarter Zip', description: '+3 click power', baseCost: 500, costMultiplier: 1.3, owned: 0, effect: 3, type: 'clickPower' },
  { id: 'hot sauce', name: '🌶️ Hot Sauce', description: '+10 click power', baseCost: 5000, costMultiplier: 1.35, owned: 0, effect: 10, type: 'clickPower' },
  { id: 'discord mod', name: '🎮 Discord Mod', description: '+50 click power', baseCost: 100000, costMultiplier: 1.4, owned: 0, effect: 50, type: 'clickPower' },
  { id: 'macha', name: '🍵 Matcha', description: '+250 click power', baseCost: 5000000, costMultiplier: 1.45, owned: 0, effect: 250, type: 'clickPower' },
  { id: 'quantum', name: '⚛️ Quantum Click', description: '+2000 click power', baseCost: 100000000, costMultiplier: 1.5, owned: 0, effect: 2000, type: 'clickPower' },
  // Auto Clickers - reduced effects, higher costs
  { id: 'sean', name: "💜 Sean's Love", description: '+1 auto-clicker', baseCost: 200, costMultiplier: 1.2, owned: 0, effect: 1, type: 'autoClicker' },
  { id: 'megaAuto', name: "💕 Benicio's Love", description: '+3 auto-clickers', baseCost: 5000, costMultiplier: 1.3, owned: 0, effect: 3, type: 'autoClicker' },
  { id: 'Evil Ben G', name: '😈 Evil Ben G', description: '+10 auto-clickers', baseCost: 150000, costMultiplier: 1.35, owned: 0, effect: 10, type: 'autoClicker' },
  { id: 'robot', name: '🤖 Robot Helper', description: '+50 auto-clickers', baseCost: 15000000, costMultiplier: 1.4, owned: 0, effect: 50, type: 'autoClicker' },
  { id: 'hivemind', name: '🧠 Hivemind', description: '+150 auto-clickers', baseCost: 500000000, costMultiplier: 1.45, owned: 0, effect: 150, type: 'autoClicker' },
];

export const initialSkillTree: SkillNode[] = [
  { id: 'a', name: '⚡ Click Fury', description: '1.5x click power', cost: 2, owned: false, effect: 1.5, type: 'clickMulti' },
  { id: 'b', name: '🚀 Auto Boost', description: '1.25x auto-clicker speed', cost: 3, owned: false, effect: 1.25, type: 'cpsBoost' },
  { id: 'c', name: '💎 CPS Multi', description: '1.5x clicks per second', cost: 5, owned: false, effect: 1.5, type: 'cpsMulti' },
  { id: 'd', name: '💰 Bargain Hunter', description: 'Reduces upgrade costs by 10%', cost: 4, owned: false, effect: 0.9, type: 'costReduction' },
  { id: 'e', name: '🎁 Head Start', description: 'Start prestige with 1,000 clicks', cost: 5, owned: false, effect: 1000, type: 'startingClicks' },
  { id: 'f', name: '🔥 Click Mastery', description: '2x click power multiplier', cost: 10, owned: false, effect: 2, type: 'clickMulti' },
  { id: 'g', name: '⚡ Hyper CPS', description: '1.5x CPS multiplier', cost: 10, owned: false, effect: 1.5, type: 'cpsBoost' },
];

export const initialAscensionTree: AscensionNode[] = [
  { id: 'asc1', name: '⭐ Prestige Master', description: '1.5x prestige point gains', cost: 2, owned: false, effect: 1.5, type: 'prestigeMulti' },
  { id: 'asc2', name: '🌟 Universal Power', description: '2x ALL production', cost: 4, owned: false, effect: 2, type: 'allMulti' },
  { id: 'asc3', name: '🚀 Ultimate Clicker', description: '2x auto-clicker multiplier', cost: 5, owned: false, effect: 2, type: 'ultimateCPS' },
  { id: 'asc4', name: '💎 Super Savings', description: 'Reduce all costs by 15%', cost: 4, owned: false, effect: 0.85, type: 'superCost' },
  { id: 'asc5', name: '🎯 Mega Start', description: 'Start with 100K clicks after prestige', cost: 8, owned: false, effect: 100000, type: 'megaStart' },
  { id: 'asc6', name: '🔮 Prestige Surge', description: '2x prestige gain', cost: 10, owned: false, effect: 2, type: 'prestigeMulti' },
  { id: 'asc7', name: '🌌 Cosmic Power', description: '3x ALL production', cost: 15, owned: false, effect: 3, type: 'allMulti' },
];

export const initialTranscendenceTree: TranscendenceNode[] = [
  { id: 'trans1', name: '🌌 Cosmic Genesis', description: '5x ALL production permanently', cost: 2, owned: false, effect: 5, type: 'globalMulti' },
  { id: 'trans2', name: '✨ Ascension Mastery', description: '2x Ascension Point gains', cost: 4, owned: false, effect: 2, type: 'ascensionMulti' },
  { id: 'trans3', name: '♾️ Infinite Power', description: '10x click power', cost: 6, owned: false, effect: 10, type: 'infinitePower' },
  { id: 'trans4', name: '🌠 Cosmic Start', description: 'Start with 10M clicks after reset', cost: 10, owned: false, effect: 10000000, type: 'cosmicStart' },
  { id: 'trans5', name: '🔮 Eternity Boost', description: '5x CPS multiplier', cost: 12, owned: false, effect: 5, type: 'eternityBoost' },
  { id: 'trans6', name: '💫 Universal Mastery', description: '10x ALL production', cost: 18, owned: false, effect: 10, type: 'globalMulti' },
  { id: 'trans7', name: '🌀 Omnipotence', description: '50x click power', cost: 30, owned: false, effect: 50, type: 'infinitePower' },
];

export const initialEternityTree: EternityNode[] = [
  { id: 'eter1', name: '🕳️ Void Mastery', description: '25x ALL production', cost: 3, owned: false, effect: 25, type: 'omnipotent' },
  { id: 'eter2', name: '⏳ Timeless', description: '3x Transcendence gains', cost: 5, owned: false, effect: 3, type: 'transcendenceMulti' },
  { id: 'eter3', name: '🌊 Infinite Automation', description: '100x auto-clicker power', cost: 8, owned: false, effect: 100, type: 'infiniteAuto' },
  { id: 'eter4', name: '🔱 Reality Anchor', description: '1B starting clicks after reset', cost: 15, owned: false, effect: 1000000000, type: 'beyondReality' },
  { id: 'eter5', name: '💠 Dimensional Rift', description: '500x click power', cost: 25, owned: false, effect: 500, type: 'omnipotent' },
  { id: 'eter6', name: '🌟 Eternal Flame', description: '10x Transcendence gains', cost: 40, owned: false, effect: 10, type: 'transcendenceMulti' },
  { id: 'eter7', name: '♾️ True Infinity', description: '1000x ALL production', cost: 75, owned: false, effect: 1000, type: 'omnipotent' },
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
    { id: 'first_ascension', name: 'Ascended', description: 'Ascend for the first time', icon: '🌌', unlocked: false, condition: (s: GameState) => s.totalAscensions >= 1 },
    { id: 'skill_complete', name: 'Skill Master', description: 'Unlock all prestige skills', icon: '🎓', unlocked: false, condition: (s: GameState) => s.skillTree.every(n => n.owned) },
    { id: 'first_transcendence', name: 'Transcended', description: 'Transcend for the first time', icon: '🌀', unlocked: false, condition: (s: GameState) => s.totalTranscendences >= 1 },
    { id: 'transcendence_master', name: 'Beyond Reality', description: 'Unlock all Transcendence skills', icon: '♾️', unlocked: false, condition: (s: GameState) => s.transcendenceTree.every(n => n.owned) },
    { id: 'first_eternity', name: 'Eternal', description: 'Reach Eternity for the first time', icon: '🕳️', unlocked: false, condition: (s: GameState) => s.totalEternities >= 1 },
    { id: 'eternity_master', name: 'True Infinite', description: 'Unlock all Eternity skills', icon: '💠', unlocked: false, condition: (s: GameState) => s.eternityTree.every(n => n.owned) },
  ];
}
