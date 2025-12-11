import React from 'react';
import type { GameState, Upgrade } from '@/hooks/useGameState';
import { FaBolt, FaHeart } from 'react-icons/fa'; // Example icons for upgrades

interface UpgradesPanelProps {
  gameState: GameState;
  onBuyUpgrade: (id: string) => void;
}

export function UpgradesPanel({ gameState, onBuyUpgrade }: UpgradesPanelProps) {
  const clickUpgrades = gameState.upgrades.filter(u => u.type === 'clickPower');
  const autoClickers = gameState.upgrades.filter(u => u.type === 'autoClicker');

  return (
    <div className="bg-card border-t-2 border-primary neon-border p-4 rounded-lg">
      <div className="container mx-auto">
        {/* Click Power Upgrades */}
        <h3 className="text-sm md:text-base font-bold text-yellow-400 mb-2">Upgrades</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {clickUpgrades.map(upg => (
            <UpgradeButton key={upg.id} upg={upg} points={gameState.clicks} onBuy={() => onBuyUpgrade(upg.id)} />
          ))}
        </div>

        {/* Auto Clickers */}
        <h3 className="text-sm md:text-base font-bold text-purple-400 mb-2">Auto Clickers</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {autoClickers.map(upg => (
            <UpgradeButton key={upg.id} upg={upg} points={gameState.clicks} onBuy={() => onBuyUpgrade(upg.id)} />
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

  // Choose icon based on upgrade type
  const icon = upg.type === 'clickPower' ? <FaBolt className="text-yellow-400 w-5 h-5" /> : <FaHeart className="text-pink-400 w-5 h-5" />;

  return (
    <button
      onClick={onBuy}
      disabled={!canAfford || upg.owned >= 1}
      title={`${upg.name}: ${upg.description} (Cost: ${cost})`}
      className={`
        relative flex flex-col justify-center items-center p-3 rounded-xl shadow-lg font-bold text-sm md:text-base transition-all
        bg-gradient-to-br from-pink-300 via-purple-300 to-yellow-300
        ${canAfford && upg.owned < 1 ? 'hover:scale-105 hover:shadow-2xl animate-pulse' : ''}
        ${upg.owned >= 1 ? 'opacity-60 cursor-not-allowed' : ''}
      `}
    >
      <div className="mb-1">{icon}</div>
      <span className="truncate text-center">{upg.name}</span>
      <span className="text-xs mt-1">{upg.owned > 0 ? `Owned: ${upg.owned}` : `Cost: ${cost}`}</span>

      {/* Optional: playful sparkle effect */}
      {canAfford && upg.owned < 1 && (
        <span className="absolute top-1 right-1 w-2 h-2 bg-yellow-400 rounded-full animate-ping"></span>
      )}
    </button>
  );
}
