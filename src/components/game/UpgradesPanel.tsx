import React from 'react';
import { Upgrade, GameState } from '@/hooks/useGameState';

interface UpgradesPanelProps {
  gameState: GameState;
  onBuyUpgrade: (id: string) => void;
  playPurchase: () => void;
}

export default function UpgradesPanel({ gameState, onBuyUpgrade, playPurchase }: UpgradesPanelProps) {
  return (
    <div className="p-4 flex flex-col gap-3">
      {gameState.upgrades.map((upgrade: Upgrade) => {
        const cost = Math.floor(upgrade.baseCost * upgrade.costMultiplier ** upgrade.owned);
        const affordable = gameState.clicks >= cost;

        return (
          <button
            key={upgrade.id}
            className={`
              w-full p-3 rounded-lg border-2 border-yellow-400
              bg-yellow-200 hover:bg-yellow-300 hover:shadow-lg
              transition-all font-bold text-center
              ${!affordable ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            onClick={() => {
              if (affordable) {
                onBuyUpgrade(upgrade.id);
                playPurchase();
              }
            }}
          >
            <div className="flex justify-between items-center">
              <span>{upgrade.name}</span>
              <span>{cost}</span>
            </div>
            <div className="text-sm opacity-80">
              +{upgrade.effect * (upgrade.owned + 1)} {upgrade.type === 'clickPower' ? 'Click Power' : 'CPS'}
            </div>
          </button>
        );
      })}
    </div>
  );
}
