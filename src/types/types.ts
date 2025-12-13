export interface Upgrade {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  costMultiplier: number;
  owned: number;
  effect: number;
  type: 'clickPower' | 'autoClicker';
}

export interface SkillNode {
  id: string;
  name: string;
  description: string;
  cost: number;
  owned: boolean;
  effect: number;
  type: 'clickMulti' | 'cpsMulti' | 'costReduction' | 'startingClicks' | 'cpsBoost';
}

export interface AscensionNode {
  id: string;
  name: string;
  description: string;
  cost: number;
  owned: boolean;
  effect: number;
  type: 'prestigeMulti' | 'allMulti' | 'superCost' | 'megaStart' | 'ultimateCPS';
}

export interface TranscendenceNode {
  id: string;
  name: string;
  description: string;
  cost: number;
  owned: boolean;
  effect: number;
  type: 'globalMulti' | 'ascensionMulti' | 'infinitePower' | 'cosmicStart' | 'eternityBoost';
}

export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  condition: (state: GameState) => boolean;
}

export interface GameStats {
  startTime: number;
  totalPlaytime: number;
  bestCPS: number;
  totalClicks: number;
  cpsHistory: { time: number; cps: number }[];
  clicksHistory: { time: number; clicks: number }[];
  lastOnlineTime: number;
}

// Quest System Types
export interface QuestStep {
  id: string;
  description: string;
  target: number;
  current: number;
  type: 'clicks' | 'lifetimeClicks' | 'cps' | 'upgrades' | 'prestiges' | 'clickPower';
}

export interface Quest {
  id: string;
  name: string;
  description: string;
  icon: string;
  steps: QuestStep[];
  currentStep: number;
  completed: boolean;
  claimed: boolean;
  rewards: {
    clicks?: number;
    prestigePoints?: number;
    ascensionPoints?: number;
    achievementId?: string;
  };
}

// Challenge System Types
export interface Challenge {
  id: string;
  name: string;
  description: string;
  icon: string;
  type: 'daily' | 'weekly';
  target: number;
  current: number;
  completed: boolean;
  claimed: boolean;
  expiresAt: number;
  conditionType: 'clicks' | 'lifetimeClicks' | 'cps' | 'upgrades' | 'prestiges';
  rewards: {
    clicks?: number;
    prestigePoints?: number;
  };
}

// Leaderboard Types
export interface LeaderboardEntry {
  id: string;
  name: string;
  score: number;
  date: number;
  type: 'lifetime' | 'cps' | 'prestiges';
}

// Special Events
export interface SpecialEvent {
  id: string;
  name: string;
  description: string;
  icon: string;
  theme: 'gold' | 'cosmic' | 'speed' | 'power' | 'lucky';
  startsAt: number;
  endsAt: number;
  active: boolean;
  multipliers: {
    clicks?: number;
    cps?: number;
    prestigeGain?: number;
  };
  challenges: EventChallenge[];
  rewards: {
    clicks?: number;
    prestigePoints?: number;
    ascensionPoints?: number;
  };
  completed: boolean;
  claimed: boolean;
}

export interface EventChallenge {
  id: string;
  description: string;
  target: number;
  current: number;
  completed: boolean;
  type: 'clicks' | 'lifetimeClicks' | 'cps' | 'upgrades' | 'prestiges';
}

export interface QuestState {
  quests: Quest[];
  challenges: Challenge[];
  leaderboard: LeaderboardEntry[];
  events: SpecialEvent[];
  lastDailyReset: number;
  lastWeeklyReset: number;
}

export interface GameState {
  clicks: number;
  lifetimeClicks: number;
  clickPower: number;
  cps: number;
  prestigePoints: number;
  totalPrestigePoints: number;
  ascensionPoints: number;
  totalAscensionPoints: number;
  transcendencePoints: number;
  totalTranscendencePoints: number;
  totalPrestiges: number;
  totalAscensions: number;
  totalTranscendences: number;
  upgrades: Upgrade[];
  skillTree: SkillNode[];
  ascensionTree: AscensionNode[];
  transcendenceTree: TranscendenceNode[];
  achievements: Achievement[];
  stats: GameStats;
  questState: QuestState;
}
