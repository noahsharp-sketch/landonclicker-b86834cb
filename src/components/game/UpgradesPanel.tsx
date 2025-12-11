import type { GameState } from '@/hooks/useGameState';

interface UpgradesPanelProps {
  gameState: GameState;
  buyUpgrade: (id: string) => void;
  playPurchase: () => void;
}

export function UpgradesPanel({ gameState, buyUpgrade, playPurchase }: UpgradesPanelProps) {
  // Old upgrade cost logic (adjust as needed)
  const getUpgradeCost = (upgrade: any) => {
    return upgrade.baseCost * (upgrade.level + 1);
  };

  return (
    <div className="bg-card p-4 rounded neon-border">
      <h3 className="text-[10px] md:text-xs mb-2">Upgrades</h3>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
        {gameState.upgrades.map(upgrade => {
          const cost = getUpgradeCost(upgrade);
          const canAfford = gameState.clicks >= cost;
          return (
            <button
              key={upgrade.id}
              onClick={() => {
                if (canAfford) {
                  buyUpgrade(upgrade.id);
                  playPurchase();
                }
              }}
              disabled={!canAfford}
              title={`${upgrade.name}: ${upgrade.description} (Cost: ${cost})`}
              className={`px-2 py-1 rounded text-[8px] md:text-[10px] font-bold transition-all
                ${canAfford ? 'bg-card border-2 border-neon-yellow text-neon-yellow hover:scale-105 cursor-pointer'
                  : 'bg-muted border-2 border-muted-foreground text-muted-foreground cursor-not-allowed'}`}
            >
              <div className="text-center">
                <span className="block">{upgrade.name}</span>
                {!upgrade.owned && <span className="block text-[6px] md:text-[8px]">{cost}</span>}
                {upgrade.owned > 0 && <span className="block text-[6px] md:text-[8px]">Owned: {upgrade.owned}</span>}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
