import type { Upgrade } from "@/hooks/useGameState";

interface UpgradesPanelProps {
  upgrades: Upgrade[];
  clicks: number;
  buyUpgrade: (id: string) => void;
  getUpgradeCost: (upgrade: Upgrade) => number;
}

export function UpgradesPanel({ upgrades, clicks, buyUpgrade, getUpgradeCost }: UpgradesPanelProps) {
  const clickUpgrades = upgrades.filter(u => u.type === "clickPower");
  const autoUpgrades = upgrades.filter(u => u.type === "autoClicker");

  const renderUpgradeButton = (u: Upgrade, color: string) => {
    const cost = getUpgradeCost(u);
    const canAfford = clicks >= cost;
    return (
      <button
        key={u.id}
        onClick={() => buyUpgrade(u.id)}
        disabled={!canAfford}
        className={`
          relative w-32 h-16 rounded-lg p-2 flex flex-col items-center justify-center font-bold text-sm
          transition-all duration-200
          ${u.owned > 0 ? 'bg-gray-400 text-gray-800 cursor-not-allowed' : `bg-${color}-300 text-white`}
          ${canAfford && u.owned === 0 ? 'hover:scale-105 hover:shadow-lg hover:bg-yellow-400' : ''}
        `}
      >
        <div className="flex items-center justify-center text-xl">{u.name}</div>
        <div className="text-xs mt-1">{u.description}</div>
        <div className="absolute bottom-1 right-1 text-xs font-bold">{cost} 💎</div>
      </button>
    );
  };

  return (
    <div className="p-4 bg-card border-t-2 border-primary neon-border">
      <h3 className="text-lg font-bold mb-2 text-yellow-500">Click Power Upgrades</h3>
      <div className="flex flex-wrap gap-3 mb-4">
        {clickUpgrades.map(u => renderUpgradeButton(u, "red"))}
      </div>

      <h3 className="text-lg font-bold mb-2 text-blue-500">Auto-Clicker Upgrades</h3>
      <div className="flex flex-wrap gap-3">
        {autoUpgrades.map(u => renderUpgradeButton(u, "blue"))}
      </div>
    </div>
  );
}
