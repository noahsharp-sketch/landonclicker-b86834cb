import React from 'react';
import type { GameState, Upgrade } from '@/hooks/useGameState';

interface UpgradesPanelProps {
  gameState: GameState;
  onBuyUpgrade: (id: string) => void;
}

export function UpgradesPanel({ gameState, onBuyUpgrade }: UpgradesPanelProps) {
  const clickUpgrades = gameState.upgrades.filter(u => u.type === 'clickPower');
  const autoClickers = gameState.upgrades.filter(u => u.type === 'autoClicker');

  return (
    <div className="bg-card border-t-2 border-primary neon-border p-4">
      <div className="container mx-auto">
        {/* Click Power Upgrades */}
        <h3 className="text-[10px] md:text-xs text-neon-yellow mb-2">Upgrades</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {clickUpgrades.map(upg => (
            <UpgradeButton
              key={upg.id}
              upg={upg}
              points={gameState.clicks}
              onBuy={() => onBuyUpgrade(upg.id)}
            />
          ))}
        </div>

        {/* Auto Clickers */}
        <h3 className="text-[10px] md:text-xs text-neon-purple mb-2">Auto Clickers</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
          {autoClickers.map(upg => (
            <UpgradeButton
              key={upg.id}
              upg={upg}
              points={gameState.clicks}
              onBuy={() => onBuyUpgrade(upg.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ----------------- Upgrade Button -----------------
function UpgradeButton({ upg, points, onBuy }: { upg: Upgrade; points: number; onBuy: () => void }) {
  const cost = Math.floor(upg.baseCost * Math.pow(upg.costMultiplier, upg.owned));
  const canAfford = points >= cost;

  return (
    <button
      onClick={onBuy}
      disabled={!canAfford}
      title={`${upg.name}: ${upg.description} (Cost: ${cost})`}
      className={`
        w-full min-h-[60px] flex flex-col justify-between p-2 rounded-md font-bold text-[8px] md:text-[10px] transition-all
        text-left
        ${canAfford
          ? 'bg-card border-2 border-neon-yellow text-neon-yellow hover:scale-105 hover:shadow-lg cursor-pointer'
          : 'bg-muted border-2 border-muted-foreground text-muted-foreground cursor-not-allowed'}
      `}
    >
      <span className="truncate font-semibold">{upg.name}</span>
      {upg.owned > 0 ? (
        <span className="text-[6px] md:text-[8px]">Owned: {upg.owned}</span>
      ) : (
        <span className="text-[6px] md:text-[8px]">Cost: {cost}</span>
      )}
    </button>
  );
}
