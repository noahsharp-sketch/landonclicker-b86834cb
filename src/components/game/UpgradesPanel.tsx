import React from 'react';
import { GameState } from '@/hooks/useGameState';

interface UpgradesPanelProps {
  gameState: GameState;
  onBuyUpgrade: (id: string) => void;
  playPurchase: () => void;
}

const upgradeColors = {
  clickPower: 'bg-pink-400 hover:bg-pink-500',
  autoClicker: 'bg-purple-400 hover:bg-purple-500',
};

export default function UpgradesPanel({ gameState, onBuyUpgrade, playPurchase }: UpgradesPanelProps) {
  const clickPowerUpgrades = gameState.upgrades.filter(u => u.type === 'clickPower');
  const autoClickerUpgrades = gameState.upgrades.filter(u => u.type === 'autoClicker');

  const renderUpgradeButton = (upgrade: typeof gameState.upgrades[0]) => {
    const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.owned));
    const affordable = gameState.clicks >= cost;

    return (
      <button
        key={upgrade.id}
        onClick={() => {
          if (affordable) {
            onBuyUpgrade(upgrade.id);
            playPurchase();
          }
        }}
        className={`
          w-full rounded-lg p-2 mb-2 text-left transition-all
          ${upgradeColors[upgrade.type]}
          ${affordable ? 'border-2 border-yellow-400 shadow-lg' : 'opacity-50 cursor-not-allowed'}
        `}
      >
        <div className="flex justify-between items-center">
          <div>
            <span className="font-bold">{upgrade.name}</span>
            <div className="text-sm">{upgrade.description}</div>
          </div>
          <div className="text-right">
            <div className="font-bold">{cost}💎</div>
            <div className="text-xs">Owned: {upgrade.owned}</div>
          </div>
        </div>
      </button>
    );
  };

  return (
    <div className="p-4 overflow-y-auto h-full">
      <h2 className="font-bold text-lg mb-2">Upgrades</h2>
      <h3 className="mt-2 font-semibold">Click Power</h3>
      {clickPowerUpgrades.map(renderUpgradeButton)}
      <h3 className="mt-4 font-semibold">Auto Clickers</h3>
      {autoClickerUpgrades.map(renderUpgradeButton)}
    </div>
  );
}
