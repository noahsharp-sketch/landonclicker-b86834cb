import React from 'react';
import type { GameState, Upgrade } from '@/hooks/useGameState';

interface UpgradesPanelProps {
  gameState: GameState;
  buyUpgrade: (id: string) => void;
  getUpgradeCost: (upgrade: Upgrade) => number;
}

export function UpgradesPanel({ gameState, buyUpgrade, getUpgradeCost }: UpgradesPanelProps) {
  const clickUpgrades = gameState.upgrades.filter(u => u.type === 'clickPower');
  const autoUpgrades = gameState.upgrades.filter(u => u.type === 'autoClicker');

  return (
    <div className="bg-card border-t-2 border-primary neon-border p-4 space-y-6">
      {/* Click Upgrades */}
      <div>
        <h3 className="text-neon-yellow text-sm mb-2">Click Upgrades</h3>
        <div className="flex flex-col gap-2">
          {clickUpgrades.map(u => (
            <UpgradeButton
              key={u.id}
              upgrade={u}
              affordable={gameState.clicks >= getUpgradeCost(u)}
              cost={getUpgradeCost(u)}
              onClick={() => buyUpgrade(u.id)}
            />
          ))}
        </div>
      </div>

      {/* Auto-clickers */}
      <div>
        <h3 className="text-neon-purple text-sm mb-2">Auto Clickers</h3>
        <div className="flex flex-col gap-2">
          {autoUpgrades.map(u => (
            <UpgradeButton
              key={u.id}
              upgrade={u}
              affordable={gameState.clicks >= getUpgradeCost(u)}
              cost={getUpgradeCost(u)}
              onClick={() => buyUpgrade(u.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ---------------- Upgrade Button ----------------

interface UpgradeButtonProps {
  upgrade: Upgrade;
  affordable: boolean;
  cost: number;
  onClick: () => void;
}

function UpgradeButton({ upgrade, affordable, cost, onClick }: UpgradeButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={!affordable}
      className={`flex justify-between items-center px-3 py-2 rounded-lg text-sm font-bold transition-all
        ${upgrade.owned > 0 ? 'bg-gray-700 text-gray-300' : affordable ? 'bg-yellow-400 text-black hover:scale-105 glow' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
    >
      <span>{upgrade.name} {upgrade.owned > 0 && `(${upgrade.owned})`}</span>
      <span className="text-xs font-bold">{cost} 💎</span>
    </button>
  );
}
