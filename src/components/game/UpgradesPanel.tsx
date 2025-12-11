import React from 'react';
import type { GameState, Upgrade } from '@/hooks/useGameState';
import { FaBolt, FaHeart } from 'react-icons/fa';

interface UpgradesPanelProps {
  gameState: GameState;
  onBuyUpgrade: (id: string) => void;
}

export function UpgradesPanel({ gameState, onBuyUpgrade }: UpgradesPanelProps) {
  const clickUpgrades = gameState.upgrades.filter(u => u.type === 'clickPower');
  const autoClickers = gameState.upgrades.filter(u => u.type === 'autoClicker');

  return (
    <div className="bg-card border-t-2 border-primary neon-border p-4 rounded-lg">
      <div className="container mx-auto space-y-6">
        {/* Click Power Upgrades */}
        <div>
          <h3 className="text-sm md:text-base font-bold text-yellow-400 mb-2">Upgrades</h3>
          <div className="flex flex-col space-y-3">
            {clickUpgrades.map(upg => (
              <UpgradeListItem key={upg.id} upg={upg} points={gameState.clicks} onBuy={() => onBuyUpgrade(upg.id)} />
            ))}
          </div>
        </div>

        {/* Auto Clickers */}
        <div>
          <h3 className="text-sm md:text-base font-bold text-purple-400 mb-2">Auto Clickers</h3>
          <div className="flex flex-col space-y-3">
            {autoClickers.map(upg => (
              <UpgradeListItem key={upg.id} upg={upg} points={gameState.clicks} onBuy={() => onBuyUpgrade(upg.id)} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ----------------- Upgrade List Item -----------------
function UpgradeListItem({ upg, points, onBuy }: { upg: Upgrade; points: number; onBuy: () => void }) {
  const cost = Math.floor(upg.baseCost * Math.pow(upg.costMultiplier, upg.owned));
  const canAfford = points >= cost;

  const icon = upg.type === 'clickPower' ? <FaBolt className="text-yellow-400 w-6 h-6" /> : <FaHeart className="text-pink-400 w-6 h-6" />;

  return (
    <button
      onClick={onBuy}
      disabled={!canAfford || upg.owned >= 1}
      title={`${upg.name}: ${upg.description} (Cost: ${cost})`}
      className={`
        flex items-center justify-between p-3 rounded-lg shadow-md font-bold transition-all
        bg-gradient-to-r from-pink-300 via-purple-300 to-yellow-300
        ${canAfford && upg.owned < 1 ? 'hover:scale-105 hover:shadow-2xl animate-pulse' : ''}
        ${upg.owned >= 1 ? 'opacity-60 cursor-not-allowed' : ''}
      `}
    >
      <div className="flex items-center space-x-3">
        <div>{icon}</div>
        <div className="flex flex-col">
          <span className="truncate">{upg.name}</span>
          <span className="text-xs text-gray-700">{upg.owned > 0 ? `Owned: ${upg.owned}` : `Cost: ${cost}`}</span>
        </div>
      </div>
      {canAfford && upg.owned < 1 && <span className="w-2 h-2 bg-yellow-400 rounded-full animate-ping"></span>}
    </button>
  );
}
