import { Quest, Challenge, QuestStep } from '../types/types';

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

export function createInitialQuestState() {
  return {
    quests: createInitialQuests(),
    challenges: [...createDailyChallenges(), ...createWeeklyChallenges()],
    leaderboard: [],
    lastDailyReset: Date.now(),
    lastWeeklyReset: Date.now(),
  };
}
