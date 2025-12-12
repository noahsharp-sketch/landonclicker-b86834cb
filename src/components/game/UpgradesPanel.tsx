import type { Upgrade } from '@/hooks/useGameState';

interface UpgradesPanelProps {
  upgrades?: Upgrade[]; // optional to avoid crash
  clicks: number;
  buyUpgrade: (id: string) => void;
}

export function UpgradesPanel({ upgrades = [], clicks, buyUpgrade }: UpgradesPanelProps) {
  const clickUpgrades = upgrades.filter(u => u.type === 'clickPower');
  const autoUpgrades = upgrades.filter(u => u.type === 'autoClicker');

  const UpgradeButton = ({ upgrade }: { upgrade: Upgrade }) => {
    const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.owned));
    const canAfford = clicks >= cost;

    return (
      <button
        onClick={() => canAfford && buyUpgrade(upgrade.id)}
        disabled={!canAfford}
        title={`${upgrade.name}: ${upgrade.description} (Cost: ${cost})`}
        className={`w-24 h-16 rounded-lg p-2 flex flex-col items-center justify-center font-bold transition-all text-[10px]
          ${upgrade.owned > 0 ? 'bg-gray-300 text-gray-800' : canAfford ? 'bg-yellow-400 hover:scale-105 border-2 border-yellow-500 cursor-pointer' : 'bg-gray-200 text-gray-500 cursor-not-allowed'}`}
      >
        <span className="text-sm">{upgrade.name}</span>
        <span className="text-[8px]">{upgrade.owned > 0 ? `Owned: ${upgrade.owned}` : `Cost: ${cost}`}</span>
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-4 p-4">
      {/* Click Power Upgrades */}
      <div>
        <h3 className="text-sm font-bold text-yellow-600 mb-2">Click Power Upgrades</h3>
        <div className="flex flex-wrap gap-2">
          {clickUpgrades.map(u => (
            <UpgradeButton key={u.id} upgrade={u} />
          ))}
        </div>
      </div>

      {/* Auto-Clicker Upgrades */}
      <div>
        <h3 className="text-sm font-bold text-purple-600 mb-2">Auto-Clicker Upgrades</h3>
        <div className="flex flex-wrap gap-2">
          {autoUpgrades.map(u => (
            <UpgradeButton key={u.id} upgrade={u} />
          ))}
        </div>
      </div>
    </div>
  );
}
