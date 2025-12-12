import React from 'react';
import { GameState, Upgrade } from '@/hooks/useGameState';

interface UpgradesPanelProps {
  gameState: GameState;
  onBuyUpgrade: (id: string) => void;
  playPurchase: () => void;
}

const UpgradeButton: React.FC<{ upgrade: Upgrade; onClick: () => void; affordable: boolean }> = ({ upgrade, onClick, affordable }) => {
  return (
    <button
      className={`flex items-center p-3 mb-2 w-full rounded-lg shadow-md transition-all duration-200 
        ${affordable ? 'bg-yellow-300 hover:scale-105 glow' : 'bg-gray-400 cursor-not-allowed'} `}
      onClick={onClick}
      disabled={!affordable}
    >
      <span className="mr-2 text-xl">{upgrade.id === 'energy' ? '⚡' : upgrade.id === 'sean' ? '💜' : upgrade.id === 'superClick' ? '🔥' : '🚀'}</span>
      <div className="flex flex-col text-left">
        <span className="font-bold">{upgrade.name}</span>
        <span className="text-sm">{upgrade.description}</span>
      </div>
      <span className="ml-auto font-bold">${Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.owned))}</span>
    </button>
  );
};

export default function UpgradesPanel({ gameState, onBuyUpgrade, playPurchase }: UpgradesPanelProps) {
  if (!gameState || !gameState.upgrades) return null;

  const clickPowerUpgrades = gameState.upgrades.filter(u => u.type === 'clickPower');
  const autoClickerUpgrades = gameState.upgrades.filter(u => u.type === 'autoClicker');

  return (
    <div className="p-3 overflow-y-auto h-full">
      <h2 className="text-lg font-bold mb-2">Upgrades</h2>

      <h3 className="font-semibold mt-2 mb-1">Click Power</h3>
      {clickPowerUpgrades.map(upgrade => {
        const affordable = gameState.clicks >= Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.owned));
        return (
          <UpgradeButton
            key={upgrade.id}
            upgrade={upgrade}
            onClick={() => { onBuyUpgrade(upgrade.id); playPurchase(); }}
            affordable={affordable}
          />
        );
      })}

      <h3 className="font-semibold mt-4 mb-1">Auto Clickers</h3>
      {autoClickerUpgrades.map(upgrade => {
        const affordable = gameState.clicks >= Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.owned));
        return (
          <UpgradeButton
            key={upgrade.id}
            upgrade={upgrade}
            onClick={() => { onBuyUpgrade(upgrade.id); playPurchase(); }}
            affordable={affordable}
          />
        );
      })}
    </div>
  );
}
