import React from 'react';
import { Upgrade } from '@/hooks/useGameState';

interface UpgradesPanelProps {
  gameState: {
    upgrades: Upgrade[];
    clicks: number;
  };
  onBuyUpgrade: (id: string) => void;
  playPurchase: () => void;
}

export default function UpgradesPanel({ gameState, onBuyUpgrade, playPurchase }: UpgradesPanelProps) {
  const clickPowerUpgrades = gameState.upgrades.filter(u => u.type === 'clickPower');
  const autoClickerUpgrades = gameState.upgrades.filter(u => u.type === 'autoClicker');

  const renderUpgradeButton = (upgrade: Upgrade) => {
    const cost = upgrade.baseCost * upgrade.owned + upgrade.effect; // linear scaling
    const affordable = gameState.clicks >= cost;

    return (
      <button
        key={upgrade.id}
        onClick={() => { if (affordable) { onBuyUpgrade(upgrade.id); playPurchase(); } }}
        disabled={!affordable}
        className={`w-full text-left px-3 py-2 mb-2 rounded-lg border-2 transition
          ${upgrade.type === 'clickPower' ? 'border-pink-500 bg-pink-200 hover:bg-pink-300' : 'border-purple-500 bg-purple-200 hover:bg-purple-300'} 
          ${!affordable ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="font-bold text-gray-900">{upgrade.name}</div>
        <div className="text-sm text-gray-800">{upgrade.description}</div>
        <div className="text-xs text-gray-700">Cost: {cost} clicks</div>
        <div className="text-xs text-gray-700">Effect: +{upgrade.effect} {upgrade.type === 'clickPower' ? 'click power' : 'auto-clickers'} per owned</div>
      </button>
    );
  };

  return (
    <div className="p-4">
      <h3 className="font-bold mb-2 text-gray-900">Click Power Upgrades</h3>
      {clickPowerUpgrades.map(renderUpgradeButton)}

      <h3 className="font-bold mt-4 mb-2 text-gray-900">Auto-Clickers</h3>
      {autoClickerUpgrades.map(renderUpgradeButton)}
    </div>
  );
}
