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
    <div className="upgrades-panel">
      {gameState.upgrades.map(upg => {
        const cost = getUpgradeCost(upg);
        const canAfford = gameState.clicks >= cost;
        return (
          <button key={upg.id} disabled={!canAfford} onClick={() => buyUpgrade(upg.id)}>
            {upg.name} - {upg.description} - Cost: {cost} clicks ({upg.owned} owned)
          </button>
        );
      })}
    </div>
  );
}
