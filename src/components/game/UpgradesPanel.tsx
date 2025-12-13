import { useState } from 'react';
import type { GameState, Upgrade } from '@/types/types';
import { formatNumber } from '@/lib/formatNumber';

interface UpgradesPanelProps {
  gameState: GameState;
  onBuyUpgrade: (id: string) => void;
  onBuyUpgradeBulk: (id: string, amount: number | "MAX") => void;
  playPurchase: () => void;
}

type BulkAmount = 1 | 10 | 25 | 100 | "MAX";

export function UpgradesPanel({ gameState, onBuyUpgrade, onBuyUpgradeBulk, playPurchase }: UpgradesPanelProps) {
  const [bulkAmount, setBulkAmount] = useState<BulkAmount>(1);

  const getUpgradeCost = (upgrade: Upgrade) => {
    return Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, upgrade.owned));
  };

  const getBulkCost = (upgrade: Upgrade, amount: BulkAmount) => {
    if (amount === 1) return getUpgradeCost(upgrade);
    
    let totalCost = 0;
    let tempOwned = upgrade.owned;
    const buyCount = amount === "MAX" ? 1000 : amount;
    
    for (let i = 0; i < buyCount; i++) {
      const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, tempOwned));
      if (amount === "MAX" && totalCost + cost > gameState.clicks) break;
      totalCost += cost;
      tempOwned++;
    }
    
    return totalCost;
  };

  const getMaxAffordable = (upgrade: Upgrade) => {
    let owned = upgrade.owned;
    let clicks = gameState.clicks;
    let count = 0;
    
    while (count < 10000) {
      const cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, owned));
      if (clicks < cost) break;
      clicks -= cost;
      owned++;
      count++;
    }
    
    return count;
  };

  const handleBuy = (id: string) => {
    if (bulkAmount === 1) {
      onBuyUpgrade(id);
    } else {
      onBuyUpgradeBulk(id, bulkAmount);
    }
    playPurchase();
  };

  const bulkOptions: BulkAmount[] = [1, 10, 25, 100, "MAX"];

  return (
    <div className="h-full flex flex-col">
      <div className="p-3 border-b border-primary/50">
        <h2 className="text-primary font-retro text-xs mb-2 neon-text">UPGRADES</h2>
        
        {/* Bulk Purchase Selector */}
        <div className="flex gap-1 flex-wrap">
          {bulkOptions.map((amount) => (
            <button
              key={amount}
              onClick={() => setBulkAmount(amount)}
              className={`
                px-2 py-1 text-xs rounded font-bold transition-all
                ${bulkAmount === amount 
                  ? 'bg-primary text-primary-foreground' 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }
              `}
            >
              {amount === "MAX" ? "MAX" : `×${amount}`}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2 space-y-2">
        {gameState.upgrades.map((upgrade) => {
          const cost = getBulkCost(upgrade, bulkAmount);
          const canAfford = gameState.clicks >= cost;
          const maxBuy = getMaxAffordable(upgrade);
          const displayAmount = bulkAmount === "MAX" ? maxBuy : bulkAmount;
          
          return (
            <button
              key={upgrade.id}
              onClick={() => handleBuy(upgrade.id)}
              disabled={!canAfford || (bulkAmount === "MAX" && maxBuy === 0)}
              className={`
                w-full text-left p-3 rounded-lg transition-all border
                ${canAfford && (bulkAmount !== "MAX" || maxBuy > 0)
                  ? 'border-primary hover:scale-[1.02] bg-card hover:bg-card/80' 
                  : 'border-muted/30 opacity-50 cursor-not-allowed bg-muted/20'
                }
              `}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <span className="text-foreground font-bold text-sm">{upgrade.name}</span>
                  <p className="text-muted-foreground text-xs mt-0.5">{upgrade.description}</p>
                </div>
                <span className="text-muted-foreground text-xs font-retro">
                  ×{upgrade.owned}
                </span>
              </div>
              <div className="flex justify-between items-center mt-2">
                <span className={`text-xs font-bold ${canAfford ? 'text-neon-green' : 'text-destructive'}`}>
                  {formatNumber(cost)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {bulkAmount === "MAX" 
                    ? `Buy ${maxBuy}` 
                    : `Buy ${displayAmount}`
                  }
                </span>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
