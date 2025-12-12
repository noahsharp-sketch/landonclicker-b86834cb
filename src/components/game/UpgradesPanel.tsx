import React from 'react';
import { Upgrade, GameState } from '@/hooks/useGameState';

interface UpgradesPanelProps {
  gameState: GameState;
  onBuyUpgrade: (id: string) => void;
  playPurchase: () => void;
}

export default function UpgradesPanel({ gameState, onBuyUpgrade, playPurchase }: UpgradesPanelProps) {
  if (!gameState?.upgrades) return null;

  return (
    <div className="p-4 flex flex-col gap-3">
      <h2 className="text-xl font-bold text-center text-yellow-400 mb-2">Upgrades</h2>
      {gameState.upgrades.map((upgrade: Upgrade) => {
        const cost = Math.floor(upgrade.baseCost * upgrade.costMultiplier ** upgrade.owned);
        const affordable = gameState.clicks >= cost;
        const purchased = upgrade.owned > 0;

        return (
          <button
            key={upgrade.id}
            onClick={() => { if (affordable) { onBuyUpgrade(upgrade.id); playPurchase(); } }}
            className={`
              w-full flex justify-between items-center px-3 py-2 rounded-lg
              font-bold text-white
              ${affordable ? 'bg-gradient-to-r from-yellow-400 to-yellow-300 hover:scale-105 hover:shadow-lg transition-all' : 'bg-gray-700 cursor-not-allowed'}
              ${purchased ? 'opacity-70' : ''}
              border-2 border-white
            `}
          >
            <div className="flex flex-col text-left">
              <span className="truncate">{upgrade.name}</span>
              <span className="text-sm text-gray-200">{upgrade.description} ({upgrade.effect * (upgrade.owned + 1)} per click)</span>
            </div>
            <div className="ml-2 text-white font-semibold">{cost}</div>
          </button>
        );
      })}
    </div>
  );
}
