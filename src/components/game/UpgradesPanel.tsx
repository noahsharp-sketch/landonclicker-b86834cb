import type { Upgrade } from '@/hooks/useGameState';

interface UpgradesPanelProps {
  upgrades: Upgrade[];
  handleBuyUpgrade: (id: string) => void;
  getUpgradeCost: (upgrade: Upgrade) => number;
  clicks: number;
}

export function UpgradesPanel({ upgrades, handleBuyUpgrade, getUpgradeCost, clicks }: UpgradesPanelProps) {
  const clickUpgrades = upgrades.filter(u => u.type === 'clickPower');
  const autoUpgrades = upgrades.filter(u => u.type === 'autoClicker');

  const UpgradeButton = ({ upgrade }: { upgrade: Upgrade }) => {
    const cost = getUpgradeCost(upgrade);
    const affordable = clicks >= cost;
    return (
      <button
        onClick={() => affordable && handleBuyUpgrade(upgrade.id)}
        disabled={!affordable}
        className={`flex items-center justify-between w-32 md:w-40 px-3 py-2 rounded-lg font-bold text-sm transition-all
          ${affordable ? 'bg-yellow-400 hover:scale-105 glow' : 'bg-gray-400 cursor-not-allowed'}
          ${upgrade.owned > 0 ? 'opacity-70' : ''}`}
        title={`${upgrade.description} (Owned: ${upgrade.owned})`}
      >
        <span>{upgrade.name}</span>
        <span className="ml-2">{cost}</span>
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-4">
      <h3 className="text-lg font-bold text-yellow-300">Click Upgrades</h3>
      <div className="flex flex-wrap gap-2">
        {clickUpgrades.map(u => <UpgradeButton key={u.id} upgrade={u} />)}
      </div>

      <h3 className="text-lg font-bold text-purple-300 mt-4">Auto-Clickers</h3>
      <div className="flex flex-wrap gap-2">
        {autoUpgrades.map(u => <UpgradeButton key={u.id} upgrade={u} />)}
      </div>
    </div>
  );
}
