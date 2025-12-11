import type { GameState, Upgrade } from '@/hooks/useGameState';

interface UpgradesPanelProps {
  gameState: GameState;
  onBuyUpgrade: (id: string) => void;
}

export function UpgradesPanel({ gameState, onBuyUpgrade }: UpgradesPanelProps) {
  return (
    <div className="bg-card border-t-2 border-primary neon-border p-4">
      <h3 className="text-neon-yellow text-[10px] md:text-xs mb-2">Upgrades</h3>
      <div className="flex flex-wrap gap-2 md:gap-4">
        {gameState.upgrades.map((upg) => (
          <UpgradeButton
            key={upg.id}
            upg={upg}
            points={gameState.clicks}
            onBuy={() => onBuyUpgrade(upg.id)}
          />
        ))}
      </div>
    </div>
  );
}

function UpgradeButton({ upg, points, onBuy }: { upg: Upgrade; points: number; onBuy: () => void }) {
  const cost = Math.floor(upg.baseCost * Math.pow(upg.costMultiplier, upg.owned));
  const canAfford = points >= cost;

  return (
    <button
      onClick={onBuy}
      disabled={!canAfford}
      title={`${upg.name}: ${upg.description} (Cost: ${cost})`}
      className={`
        w-12 h-12 md:w-14 md:h-14 rounded-full flex flex-col items-center justify-center text-[8px] md:text-[10px] font-bold transition-all
        ${upg.owned > 0
          ? 'bg-neon-green text-background neon-border'
          : canAfford
            ? 'bg-card border-2 border-neon-yellow text-neon-yellow hover:scale-110 cursor-pointer'
            : 'bg-muted border-2 border-muted-foreground text-muted-foreground cursor-not-allowed'}
      `}
    >
      <div className="text-center leading-tight">
        <span className="block">{upg.id.toUpperCase()}</span>
        {!upg.owned && <span className="block text-[6px] md:text-[8px]">Cost: {cost}</span>}
        {upg.owned > 0 && <span className="block text-[6px] md:text-[8px]">{upg.owned} owned</span>}
      </div>
    </button>
  );
}
