import { formatNumber } from '@/lib/formatNumber';

interface StatsBarProps {
  clicks: number;
  cps: number;
  lifetimeClicks: number;
  clickPower: number;
}

export function StatsBar({ clicks, cps, lifetimeClicks, clickPower }: StatsBarProps) {
  return (
    <header className="bg-card border-b-2 border-primary neon-border p-3 md:p-4">
      <div className="container mx-auto flex flex-wrap items-center justify-between gap-2 md:gap-4">
        <h1 className="text-lg md:text-xl text-primary neon-text">🐻 Landon Clicker</h1>
        <div className="flex flex-wrap gap-3 md:gap-6 text-[10px] md:text-xs">
          <div className="text-center">
            <span className="text-muted-foreground block">Clicks</span>
            <span className="text-primary font-bold">{formatNumber(clicks)}</span>
          </div>
          <div className="text-center">
            <span className="text-muted-foreground block">CPS</span>
            <span className="text-secondary font-bold">{formatNumber(cps)}</span>
          </div>
          <div className="text-center">
            <span className="text-muted-foreground block">Lifetime</span>
            <span className="text-neon-yellow font-bold">{formatNumber(lifetimeClicks)}</span>
          </div>
          <div className="text-center">
            <span className="text-muted-foreground block">Power</span>
            <span className="text-neon-green font-bold">{clickPower}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
