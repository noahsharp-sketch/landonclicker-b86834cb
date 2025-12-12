import { formatNumber } from '@/lib/formatNumber';
import { AudioControls } from './AudioControls';
import { AchievementsPanel } from './AchievementsPanel';
import { StatisticsPanel } from './StatisticsPanel';
import type { Achievement, GameStats } from '@/hooks/useGameState';

interface StatsBarProps {
  clicks: number;
  cps: number;
  lifetimeClicks: number;
  clickPower: number;
  achievements: Achievement[];
  stats: GameStats;
  audioSettings: {
    volume: number;
    sfxEnabled: boolean;
    musicEnabled: boolean;
  };
  onVolumeChange: (volume: number) => void;
  onSfxToggle: (enabled: boolean) => void;
  onMusicToggle: (enabled: boolean) => void;
  playAchievement: () => void;
}

export function StatsBar({ 
  clicks, 
  cps, 
  lifetimeClicks, 
  clickPower,
  achievements,
  stats,
  audioSettings,
  onVolumeChange,
  onSfxToggle,
  onMusicToggle,
  playAchievement,
}: StatsBarProps) {
  return (
    <header className="bg-card border-b-2 border-primary neon-border px-4 py-3">
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-primary neon-text text-sm md:text-lg font-bold font-retro">
          🐻 Landon Clicker
        </h1>

        <div className="flex flex-wrap items-center gap-3 md:gap-6 text-[10px] md:text-xs">
          <div>
            <span className="text-muted-foreground">Clicks: </span>
            <span className="text-foreground font-bold">{formatNumber(clicks)}</span>
          </div>
          <div>
            <span className="text-muted-foreground">CPS: </span>
            <span className="text-neon-cyan font-bold">{formatNumber(cps)}</span>
          </div>
          <div className="hidden sm:block">
            <span className="text-muted-foreground">Lifetime: </span>
            <span className="text-foreground">{formatNumber(lifetimeClicks)}</span>
          </div>
          <div className="hidden sm:block">
            <span className="text-muted-foreground">Power: </span>
            <span className="text-neon-yellow">{formatNumber(clickPower)}</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <StatisticsPanel 
            stats={stats}
            currentCPS={cps}
            lifetimeClicks={lifetimeClicks}
          />
          <AchievementsPanel 
            achievements={achievements} 
            playAchievement={playAchievement}
          />
          <AudioControls
            volume={audioSettings.volume}
            sfxEnabled={audioSettings.sfxEnabled}
            musicEnabled={audioSettings.musicEnabled}
            onVolumeChange={onVolumeChange}
            onSfxToggle={onSfxToggle}
            onMusicToggle={onMusicToggle}
          />
        </div>
      </div>
    </header>
  );
}