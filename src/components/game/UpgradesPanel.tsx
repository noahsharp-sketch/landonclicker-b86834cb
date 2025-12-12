import React from 'react';
import { GameState } from '@/hooks/useGameState';

interface UpgradesPanelProps {
  gameState: GameState;
  onBuyUpgrade: (id: string) => void;
  playPurchase: () => void;
}

export default function UpgradesPanel({ gameState, onBuyUpgrade, playPurchase }: UpgradesPanelProps) {
  return (
    <div className="p-4 flex flex-col gap-2">
      <h2 className="text-xl font-bold mb-2">Upgrades</h2>

      {gameState.upgrades.map(upgrade => {
        const cost = Math.floor(upgrade.baseCost * upgrade.owned); // simple linear scaling
        return (
          <button
            key={upgrade.id}
            className={`upgrade-btn ${gameState.clicks >= cost ? 'affordable' : 'unaffordable'}`}
            onClick={() => { onBuyUpgrade(upgrade.id); playPurchase(); }}
            disabled={gameState.clicks < cost}
          >
            <div className="flex justify-between items-center">
              <span>{upgrade.name}</span>
              <span>{upgrade.type === 'clickPower' ? `+${upgrade.effect} click power` : `+${upgrade.effect} auto-clicker`}</span>
            </div>
            <div className="text-sm mt-1">Cost: {cost}</div>
          </button>
        );
      })}
    </div>
  );
}
