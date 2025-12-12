import React from 'react';
import { GameState, Upgrade } from '@/hooks/useGameState';

interface UpgradesPanelProps {
  gameState: GameState;
  onBuyUpgrade: (id: string) => void;
  playPurchase: () => void;
}

const UpgradesPanel: React.FC<UpgradesPanelProps> = ({ gameState, onBuyUpgrade, playPurchase }) => {
  const clickUpgrades = gameState.upgrades.filter(u => u.type === 'clickPower');
  const autoUpgrades = gameState.upgrades.filter(u => u.type === 'autoClicker');

  const renderUpgradeButton = (upgrade: Upgrade) => {
    const cost = Math.floor(upgrade.baseCost * upgrade.owned);
    const affordable = gameState.clicks >= cost;

    return (
      <button
        key={upgrade.id}
        className={`upgrade-btn ${affordable ? 'affordable' : 'unaffordable'} ${upgrade.owned > 0 ? 'owned' : ''}`}
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
        <div className="text-sm opacity-80">+{upgrade.effect * (upgrade.owned + 1)} {upgrade.type === 'clickPower' ? 'Click Power' : 'CPS'}</div>
      </button>
    );
  };

  return (
    <div className="flex flex-col gap-2 p-2">
      <h2 className="text-lg font-bold mb-2">Click Upgrades</h2>
      {clickUpgrades.map(renderUpgradeButton)}

      <h2 className="text-lg font-bold mt-4 mb-2">Auto-Clickers</h2>
      {autoUpgrades.map(renderUpgradeButton)}
    </div>
  );
};

export default UpgradesPanel;
