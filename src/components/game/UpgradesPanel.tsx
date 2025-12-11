import type { GameState } from '@/hooks/useGameState';

interface UpgradesPanelProps {
  gameState: GameState;
  buyUpgrade: (id: string) => void;
}

export function UpgradesPanel({ gameState, buyUpgrade }: UpgradesPanelProps) {

  const getUpgradeCost = (upgrade: any) => {
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.owned));
  };

  return (
    <div className="bg-card border-t-2 border-primary neon-border p-4">
      <h3 className="text-neon-yellow mb-2 text-xs md:text-sm">Upgrades</h3>
      <div className="flex flex-wrap gap-2 md:gap-4">
        {gameState.upgrades.map(upg => {
          const cost = getUpgradeCost(upg);
          const canAfford = gameState.clicks >= cost;

          return (
            <button
              key={upg.id}
              onClick={() => buyUpgrade(upg.id)}
              disabled={!canAfford}
              className={`
                w-24 md:w-32 p-2 rounded-lg flex flex-col items-center justify-center text-[8px] md:text-xs font-bold transition-all
                ${upg.owned > 0
                  ? 'bg-neon-green text-background neon-border'
                  : canAfford
                    ? 'bg-card border-2 border-neon-yellow text-neon-yellow hover:scale-105 cursor-pointer'
                    : 'bg-muted border-2 border-muted-foreground text-muted-foreground cursor-not-allowed'}
              `}
              title={`${upg.name}: ${upg.description} (Cost: ${cost})`}
            >
              <span className="text-center">{upg.name}</span>
              <span className="text-[8px] md:text-[10px]">{upg.description}</span>
              {!upg.owned && <span className="text-[6px] md:text-[8px]">Cost: {cost}</span>}
              {upg.owned > 0 && <span className="text-[6px] md:text-[8px]">{upg.owned} owned</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
