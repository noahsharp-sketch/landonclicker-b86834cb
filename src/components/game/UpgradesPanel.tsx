import type { GameState, Upgrade } from '@/types/types';
import { getUpgradeCost } from '@/utils/calculations';
import { Zap, Heart } from 'lucide-react';

interface UpgradesPanelProps {
  gameState: GameState;
  onBuyUpgrade: (id: string) => void;
  playPurchase: () => void;
}

export function UpgradesPanel({ gameState, onBuyUpgrade, playPurchase }: UpgradesPanelProps) {
  const clickUpgrades = gameState.upgrades.filter(u => u.type === 'clickPower');
  const autoClickers = gameState.upgrades.filter(u => u.type === 'autoClicker');

  const handleBuy = (id: string) => {
    onBuyUpgrade(id);
    playPurchase();
  };

  return (
    <div className="p-4 space-y-6 overflow-y-auto max-h-[50vh] md:max-h-full">
      {/* Click Power Upgrades */}
      <div>
        <h3 className="text-sm md:text-base font-bold text-neon-yellow mb-2 font-retro">⚡ Upgrades</h3>
        <div className="flex flex-col space-y-3">
          {clickUpgrades.map(upg => (
            <UpgradeListItem 
              key={upg.id} 
              upg={upg} 
              cost={getUpgradeCost(gameState, upg.id)}
              points={gameState.clicks} 
              onBuy={() => handleBuy(upg.id)} 
            />
          ))}
        </div>
      </div>

      {/* Auto Clickers */}
      <div>
        <h3 className="text-sm md:text-base font-bold text-neon-purple mb-2 font-retro">💜 Auto Clickers</h3>
        <div className="flex flex-col space-y-3">
          {autoClickers.map(upg => (
            <UpgradeListItem 
              key={upg.id} 
              upg={upg} 
              cost={getUpgradeCost(gameState, upg.id)}
              points={gameState.clicks} 
              onBuy={() => handleBuy(upg.id)} 
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function UpgradeListItem({ upg, cost, points, onBuy }: { upg: Upgrade; cost: number; points: number; onBuy: () => void }) {
  const canAfford = points >= cost;

  const icon = upg.type === 'clickPower' 
    ? <Zap className="text-neon-yellow w-5 h-5" /> 
    : <Heart className="text-neon-pink w-5 h-5" />;

  return (
    <button
      onClick={onBuy}
      disabled={!canAfford}
      className={`
        flex items-center justify-between p-3 rounded-lg font-bold transition-all
        bg-card border border-border
        ${canAfford ? 'hover:scale-105 hover:border-primary neon-border cursor-pointer' : 'opacity-60 cursor-not-allowed'}
      `}
    >
      <div className="flex items-center gap-3">
        {icon}
        <div className="flex flex-col text-left">
          <span className="text-foreground text-sm">{upg.name}</span>
          <span className="text-xs text-muted-foreground">Owned: {upg.owned} • Cost: {Math.floor(cost)}</span>
        </div>
      </div>
      {canAfford && <span className="w-2 h-2 bg-neon-cyan rounded-full animate-pulse"></span>}
    </button>
  );
}
