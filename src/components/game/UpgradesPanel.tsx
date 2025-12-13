import React from 'react';
import { useGameState } from '../hooks/useGameState';
import type { Upgrade } from '../data/gameData';

export function UpgradePanel() {
  const { gameState, buyUpgrade, buyUpgradeBulk, getUpgradeCost } = useGameState();

  // Helper: calculate max affordable
  function maxAffordable(upgrade: Upgrade) {
    let owned = upgrade.owned;
    let clicks = gameState.clicks;
    let total = 0;
    let cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, owned));
    while (clicks >= cost) {
      clicks -= cost;
      owned++;
      total++;
      cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, owned));
    }
    return total;
  }

  return (
    <div className="upgrade-panel">
      <h2>Upgrades</h2>
      <ul>
        {gameState.upgrades.map(upgrade => {
          const cost = getUpgradeCost(upgrade);
          const canAfford = gameState.clicks >= cost;
          const maxBuy = maxAffordable(upgrade);
          return (
            <li key={upgrade.id} className="upgrade-item">
              <h3>{upgrade.name}</h3>
              <p>{upgrade.description}</p>
              <p>Owned: {upgrade.owned}</p>
              <p>Cost: {cost.toLocaleString()}</p>

              <div className="buttons">
                {/* Single purchase */}
                <button
                  disabled={!canAfford}
                  onClick={() => buyUpgrade(upgrade.id)}
                >
                  Buy 1
                </button>

                {/* Buy 10 */}
                <button
                  disabled={gameState.clicks < getUpgradeCost({ ...upgrade, owned: upgrade.owned + 9 })}
                  onClick={() => buyUpgradeBulk(upgrade.id, 10)}
                >
                  Buy 10
                </button>

                {/* Buy MAX */}
                <button
                  disabled={maxBuy === 0}
                  onClick={() => buyUpgradeBulk(upgrade.id, 'MAX')}
                >
                  Buy MAX ({maxBuy})
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
