import type { Upgrade } from '@/hooks/useGameState';

interface UpgradesPanelProps {
  upgrades: Upgrade[];
  points: number;
  buyUpgrade: (id: string) => void;
  getUpgradeCost: (upgrade: Upgrade) => number;
  playPurchase: () => void;
}

export function UpgradesPanel({
  upgrades,
  points,
  buyUpgrade,
  getUpgradeCost,
  playPurchase,
}: UpgradesPanelProps) {
  const handleBuy = (upgrade: Upgrade) => {
    const cost = getUpgradeCost(upgrade);
    if (points >= cost) {
      buyUpgrade(upgrade.id);
      playPurchase();
    }
  };

  return (
    <div className="bg-card border-t-2 border-primary neon-border p-4">
      <h3 className="text-[10px] md:text-xs text-neon-yellow mb-2">Upgrades</h3>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-4">
        {upgrades.map(upgrade => {
          const cost = getUpgradeCost(upgrade);
          const canAfford = points >= cost;

          return (
            <button
              key={upgrade.id}
              onClick={() => handleBuy(upgrade)}
              disabled={!canAfford}
              title={`${upgrade.name}: ${upgrade.description} (Cost: ${cost})`}
              className={`p-2 md:p-3 rounded text-[8px] md:text-[10px] font-bold flex flex-col items-center justify-center transition-all
                ${upgrade.owned > 0
                  ? 'bg-neon-green text-background neon-border'
                  : canAfford
                    ? 'bg-card border-2 border-neon-yellow text-neon-yellow hover:scale-105 cursor-pointer'
                    : 'bg-muted border-2 border-muted-foreground text-muted-foreground cursor-not-allowed'}`}
            >
              <span className="block">{upgrade.name}</span>
              {upgrade.owned === 0 && <span className="block text-[6px] md:text-[8px]">{cost}pt</span>}
              {upgrade.owned > 0 && <span className="block text-[6px] md:text-[8px]">Owned: {upgrade.owned}</span>}
            </button>
          );
        })}
      </div>
    </div>
  );
}
