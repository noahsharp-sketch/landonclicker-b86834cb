import { formatNumber } from '@/lib/formatNumber';
import type { Upgrade, GameState } from '@/hooks/useGameState';

interface UpgradesPanelProps {
  upgrades: Upgrade[];
  clicks: number;
  gameState: GameState;
  getUpgradeCost: (upgrade: Upgrade, state: GameState) => number;
  onBuyUpgrade: (id: string) => void;
  playPurchase: () => void;
}

export function UpgradesPanel({ 
  upgrades, 
  clicks, 
  gameState, 
  getUpgradeCost, 
  onBuyUpgrade,
  playPurchase 
}: UpgradesPanelProps) {
  const clickPowerUpgrades = upgrades.filter(u => u.type === 'clickPower');
  const autoClickerUpgrades = upgrades.filter(u => u.type === 'autoClicker');

  const handleBuy = (id: string) => {
    onBuyUpgrade(id);
    playPurchase();
  };

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
      <section>
        <h2 className="text-sm text-primary neon-text mb-3">Click Power</h2>
        <div className="flex flex-col gap-2">
          {clickPowerUpgrades.map(upgrade => {
            const cost = getUpgradeCost(upgrade, gameState);
            const canAfford = clicks >= cost;
            
            return (
              <button
                key={upgrade.id}
                onClick={() => canAfford && handleBuy(upgrade.id)}
                disabled={!canAfford}
                className={`p-3 rounded border text-left transition-all text-[10px] md:text-xs
                  ${canAfford 
                    ? 'border-primary bg-card hover:bg-muted neon-border cursor-pointer' 
                    : 'border-muted bg-muted/30 opacity-50 cursor-not-allowed'}`}
              >
                <div className="flex justify-between items-start">
                  <span className="font-bold">{upgrade.name}</span>
                  <span className="text-muted-foreground">x{upgrade.owned}</span>
                </div>
                <p className="text-muted-foreground mt-1">{upgrade.description}</p>
                <p className={`mt-1 ${canAfford ? 'text-neon-green' : 'text-destructive'}`}>
                  Cost: {formatNumber(cost)}
                </p>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="text-sm text-secondary neon-text-pink mb-3">Auto-Clickers</h2>
        <div className="flex flex-col gap-2">
          {autoClickerUpgrades.map(upgrade => {
            const cost = getUpgradeCost(upgrade, gameState);
            const canAfford = clicks >= cost;
            
            return (
              <button
                key={upgrade.id}
                onClick={() => canAfford && handleBuy(upgrade.id)}
                disabled={!canAfford}
                className={`p-3 rounded border text-left transition-all text-[10px] md:text-xs
                  ${canAfford 
                    ? 'border-secondary bg-card hover:bg-muted neon-border-pink cursor-pointer' 
                    : 'border-muted bg-muted/30 opacity-50 cursor-not-allowed'}`}
              >
                <div className="flex justify-between items-start">
                  <span className="font-bold">{upgrade.name}</span>
                  <span className="text-muted-foreground">x{upgrade.owned}</span>
                </div>
                <p className="text-muted-foreground mt-1">{upgrade.description}</p>
                <p className={`mt-1 ${canAfford ? 'text-neon-green' : 'text-destructive'}`}>
                  Cost: {formatNumber(cost)}
                </p>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}
