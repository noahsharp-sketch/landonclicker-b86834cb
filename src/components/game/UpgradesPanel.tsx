import React from 'react';
import type { Upgrade } from '@/hooks/useGameState';

interface UpgradesPanelProps {
  upgrades?: Upgrade[];
  clicks: number;
  buyUpgrade: (id: string) => void;
}

export function UpgradesPanel({ upgrades = [], clicks, buyUpgrade }: UpgradesPanelProps) {
  const clickUpgrades = upgrades.filter(u => u.type === 'clickPower');
  const autoUpgrades = upgrades.filter(u => u.type === 'autoClicker');

  const renderUpgrade = (u: Upgrade) => {
    const cost = Math.floor(u.baseCost * Math.pow(u.costMultiplier, u.owned));
    const canAfford = clicks >= cost;
    return (
      <button
        key={u.id}
        onClick={() => buyUpgrade(u.id)}
        disabled={!canAfford}
        className={`flex items-center justify-between p-2 rounded-md mb-2 w-full transition-all
          ${u.owned > 0 ? 'bg-gray-300 text-gray-700 cursor-default' : canAfford ? 'bg-yellow-400 hover:bg-yellow-500 cursor-pointer' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
        title={`${u.name}: ${u.description}`}
      >
        <span className="font-bold">{u.name}</span>
        <span className="font-mono">{cost}💰</span>
      </button>
    );
  };

  return (
    <div className="p-4 bg-card rounded-md">
      <h3 className="text-lg font-bold mb-2">Click Upgrades</h3>
      <div className="flex flex-col">{clickUpgrades.map(renderUpgrade)}</div>

      <h3 className="text-lg font-bold mt-4 mb-2">Auto Clickers</h3>
      <div className="flex flex-col">{autoUpgrades.map(renderUpgrade)}</div>
    </div>
  );
}
