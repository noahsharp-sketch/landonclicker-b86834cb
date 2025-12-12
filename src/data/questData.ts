import { Quest, Challenge, SpecialEvent } from '../types/types';

export function createInitialQuests(): Quest[] {
  return [
    {
      id: 'beginner_journey',
      name: '🌟 Beginner Journey',
      description: 'Complete your first steps as a clicker!',
      icon: '🚀',
      steps: [
        { id: 'step1', description: 'Reach 100 clicks', target: 100, current: 0, type: 'clicks' },
        { id: 'step2', description: 'Reach 50 click power', target: 50, current: 0, type: 'clickPower' },
        { id: 'step3', description: 'Buy 5 upgrades total', target: 5, current: 0, type: 'upgrades' },
      ],
      currentStep: 0,
      completed: false,
      claimed: false,
      rewards: { clicks: 5000 },
    },
    {
      id: 'automation_master',
      name: '🤖 Automation Master',
      description: 'Master the art of auto-clicking!',
      icon: '⚡',
      steps: [
        { id: 'step1', description: 'Reach 10 CPS', target: 10, current: 0, type: 'cps' },
        { id: 'step2', description: 'Reach 100 CPS', target: 100, current: 0, type: 'cps' },
        { id: 'step3', description: 'Reach 500 CPS', target: 500, current: 0, type: 'cps' },
        { id: 'step4', description: 'Reach 1000 CPS', target: 1000, current: 0, type: 'cps' },
      ],
      currentStep: 0,
      completed: false,
      claimed: false,
      rewards: { clicks: 50000, prestigePoints: 2 },
    },
    {
      id: 'click_champion',
      name: '👆 Click Champion',
      description: 'Prove your clicking dedication!',
      icon: '🏆',
      steps: [
        { id: 'step1', description: 'Reach 10,000 lifetime clicks', target: 10000, current: 0, type: 'lifetimeClicks' },
        { id: 'step2', description: 'Reach 100,000 lifetime clicks', target: 100000, current: 0, type: 'lifetimeClicks' },
        { id: 'step3', description: 'Reach 1,000,000 lifetime clicks', target: 1000000, current: 0, type: 'lifetimeClicks' },
      ],
      currentStep: 0,
      completed: false,
      claimed: false,
      rewards: { prestigePoints: 5 },
    },
    {
      id: 'prestige_path',
      name: '⭐ Prestige Path',
      description: 'Walk the path of prestige!',
      icon: '✨',
      steps: [
        { id: 'step1', description: 'Prestige 1 time', target: 1, current: 0, type: 'prestiges' },
        { id: 'step2', description: 'Prestige 3 times', target: 3, current: 0, type: 'prestiges' },
        { id: 'step3', description: 'Prestige 5 times', target: 5, current: 0, type: 'prestiges' },
        { id: 'step4', description: 'Prestige 10 times', target: 10, current: 0, type: 'prestiges' },
      ],
      currentStep: 0,
      completed: false,
      claimed: false,
      rewards: { ascensionPoints: 1 },
    },
    {
      id: 'power_surge',
      name: '💪 Power Surge',
      description: 'Maximize your clicking power!',
      icon: '🔥',
      steps: [
        { id: 'step1', description: 'Reach 100 click power', target: 100, current: 0, type: 'clickPower' },
        { id: 'step2', description: 'Reach 500 click power', target: 500, current: 0, type: 'clickPower' },
        { id: 'step3', description: 'Reach 1000 click power', target: 1000, current: 0, type: 'clickPower' },
      ],
      currentStep: 0,
      completed: false,
      claimed: false,
      rewards: { clicks: 100000, prestigePoints: 3 },
    },
    {
      id: 'upgrade_collector',
      name: '📦 Upgrade Collector',
      description: 'Collect all the upgrades!',
      icon: '🎁',
      steps: [
        { id: 'step1', description: 'Buy 10 upgrades', target: 10, current: 0, type: 'upgrades' },
        { id: 'step2', description: 'Buy 25 upgrades', target: 25, current: 0, type: 'upgrades' },
        { id: 'step3', description: 'Buy 50 upgrades', target: 50, current: 0, type: 'upgrades' },
        { id: 'step4', description: 'Buy 100 upgrades', target: 100, current: 0, type: 'upgrades' },
      ],
      currentStep: 0,
      completed: false,
      claimed: false,
      rewards: { prestigePoints: 4, ascensionPoints: 1 },
    },
  ];
}

function getNextDailyReset(): number {
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return tomorrow.getTime();
}

function getNextWeeklyReset(): number {
  const now = new Date();
  const daysUntilMonday = (8 - now.getDay()) % 7 || 7;
  const nextMonday = new Date(now);
  nextMonday.setDate(nextMonday.getDate() + daysUntilMonday);
  nextMonday.setHours(0, 0, 0, 0);
  return nextMonday.getTime();
}

export function createDailyChallenges(): Challenge[] {
  const dailyExpiry = getNextDailyReset();
  
  return [
    {
      id: 'daily_clicks',
      name: '🎯 Daily Clicks',
      description: 'Earn 50,000 clicks today',
      icon: '👆',
      type: 'daily',
      target: 50000,
      current: 0,
      completed: false,
      claimed: false,
      expiresAt: dailyExpiry,
      conditionType: 'clicks',
      rewards: { clicks: 10000 },
    },
    {
      id: 'daily_cps',
      name: '⚡ Speed Demon',
      description: 'Reach 200 CPS today',
      icon: '🚀',
      type: 'daily',
      target: 200,
      current: 0,
      completed: false,
      claimed: false,
      expiresAt: dailyExpiry,
      conditionType: 'cps',
      rewards: { clicks: 25000 },
    },
  ];
}

export function createWeeklyChallenges(): Challenge[] {
  const weeklyExpiry = getNextWeeklyReset();
  
  return [
    {
      id: 'weekly_lifetime',
      name: '🌟 Weekly Grind',
      description: 'Earn 500,000 lifetime clicks this week',
      icon: '💪',
      type: 'weekly',
      target: 500000,
      current: 0,
      completed: false,
      claimed: false,
      expiresAt: weeklyExpiry,
      conditionType: 'lifetimeClicks',
      rewards: { clicks: 100000, prestigePoints: 2 },
    },
    {
      id: 'weekly_upgrades',
      name: '🛒 Shopping Spree',
      description: 'Buy 30 upgrades this week',
      icon: '🎁',
      type: 'weekly',
      target: 30,
      current: 0,
      completed: false,
      claimed: false,
      expiresAt: weeklyExpiry,
      conditionType: 'upgrades',
      rewards: { prestigePoints: 3 },
    },
  ];
}

// Generate rotating special events
export function generateSpecialEvents(): SpecialEvent[] {
  const now = Date.now();
  const hourMs = 60 * 60 * 1000;
  
  // Events rotate every few hours for demo purposes (in production would be days)
  const eventPool: Omit<SpecialEvent, 'startsAt' | 'endsAt' | 'active'>[] = [
    {
      id: 'gold_rush',
      name: '💰 Gold Rush',
      description: '2x clicks for a limited time! Complete challenges for massive rewards.',
      icon: '💰',
      theme: 'gold',
      multipliers: { clicks: 2 },
      challenges: [
        { id: 'gr1', description: 'Earn 100,000 clicks', target: 100000, current: 0, completed: false, type: 'clicks' },
        { id: 'gr2', description: 'Buy 20 upgrades', target: 20, current: 0, completed: false, type: 'upgrades' },
      ],
      rewards: { clicks: 500000, prestigePoints: 5 },
      completed: false,
      claimed: false,
    },
    {
      id: 'cosmic_surge',
      name: '🌌 Cosmic Surge',
      description: '3x CPS boost! Automate your way to victory.',
      icon: '🌌',
      theme: 'cosmic',
      multipliers: { cps: 3 },
      challenges: [
        { id: 'cs1', description: 'Reach 500 CPS', target: 500, current: 0, completed: false, type: 'cps' },
        { id: 'cs2', description: 'Earn 500,000 lifetime clicks', target: 500000, current: 0, completed: false, type: 'lifetimeClicks' },
      ],
      rewards: { clicks: 250000, prestigePoints: 3, ascensionPoints: 1 },
      completed: false,
      claimed: false,
    },
    {
      id: 'speed_demon',
      name: '⚡ Speed Demon',
      description: '2x CPS and clicks! The ultimate combo event.',
      icon: '⚡',
      theme: 'speed',
      multipliers: { clicks: 1.5, cps: 2 },
      challenges: [
        { id: 'sd1', description: 'Reach 1000 CPS', target: 1000, current: 0, completed: false, type: 'cps' },
        { id: 'sd2', description: 'Prestige 2 times', target: 2, current: 0, completed: false, type: 'prestiges' },
      ],
      rewards: { prestigePoints: 8, ascensionPoints: 2 },
      completed: false,
      claimed: false,
    },
    {
      id: 'power_hour',
      name: '💪 Power Hour',
      description: 'Enhanced prestige gains! Perfect time to reset.',
      icon: '💪',
      theme: 'power',
      multipliers: { prestigeGain: 2 },
      challenges: [
        { id: 'ph1', description: 'Prestige 3 times', target: 3, current: 0, completed: false, type: 'prestiges' },
        { id: 'ph2', description: 'Earn 1,000,000 lifetime clicks', target: 1000000, current: 0, completed: false, type: 'lifetimeClicks' },
      ],
      rewards: { prestigePoints: 10, ascensionPoints: 3 },
      completed: false,
      claimed: false,
    },
    {
      id: 'lucky_day',
      name: '🍀 Lucky Day',
      description: 'Everything is boosted! Don\'t miss this rare event.',
      icon: '🍀',
      theme: 'lucky',
      multipliers: { clicks: 1.5, cps: 1.5, prestigeGain: 1.5 },
      challenges: [
        { id: 'ld1', description: 'Earn 200,000 clicks', target: 200000, current: 0, completed: false, type: 'clicks' },
        { id: 'ld2', description: 'Buy 30 upgrades', target: 30, current: 0, completed: false, type: 'upgrades' },
        { id: 'ld3', description: 'Reach 300 CPS', target: 300, current: 0, completed: false, type: 'cps' },
      ],
      rewards: { clicks: 1000000, prestigePoints: 10, ascensionPoints: 2 },
      completed: false,
      claimed: false,
    },
  ];

  // Pick a random event and make it active
  const randomIndex = Math.floor((now / (hourMs * 4)) % eventPool.length);
  const activeEvent = eventPool[randomIndex];
  
  // Event lasts 4 hours
  const eventStart = Math.floor(now / (hourMs * 4)) * (hourMs * 4);
  const eventEnd = eventStart + (hourMs * 4);

  return [{
    ...activeEvent,
    startsAt: eventStart,
    endsAt: eventEnd,
    active: now >= eventStart && now < eventEnd,
  }];
}

export function createInitialQuestState() {
  return {
    quests: createInitialQuests(),
    challenges: [...createDailyChallenges(), ...createWeeklyChallenges()],
    leaderboard: [],
    events: generateSpecialEvents(),
    lastDailyReset: Date.now(),
    lastWeeklyReset: Date.now(),
  };
}
