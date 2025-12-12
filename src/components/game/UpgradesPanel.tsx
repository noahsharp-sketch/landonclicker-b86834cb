import React, { useState } from "react";
import { useGameState } from "../hooks/useGameState";

export default function UpgradePanel() {
  const { gameState, buyUpgrade, getUpgradeCost } = useGameState();
  const [bulkAmount, setBulkAmount] = useState(1);

  const bulkOptions = [1, 10, 25, 100, "MAX"] as const;

  // Calculate total bulk cost
  const getBulkCost = (upgrade) => {
    let total = 0;
    let owned = upgrade.owned;

    if (bulkAmount === "MAX") {
      let clicks = gameState.clicks;
      while (clicks >= Math.floor(upgrade.baseCost * Math.pow(upgrade.costMultiplier, owned))) {
        const nextCost = Math.floor(
          upgrade.baseCost * Math.pow(upgrade.costMultiplier, owned)
        );
        total += nextCost;
        clicks -= nextCost;
        owned++;
      }
      return total;
    }

    for (let i = 0; i < bulkAmount; i++) {
      const cost = Math.floor(
        upgrade.baseCost * Math.pow(upgrade.costMultiplier, owned)
      );
      total += cost;
      owned++;
    }
    return total;
  };

  const canAfford = (upgrade) => {
    return gameState.clicks >= getBulkCost(upgrade);
  };

  const handleBulkBuy = (upgrade) => {
    if (!canAfford(upgrade)) return;

    if (bulkAmount === "MAX") {
      // Keep buying until broke
      while (gameState.clicks >= getUpgradeCost(upgrade)) {
        buyUpgrade(upgrade.id);
      }
      return;
    }

    for (let i = 0; i < bulkAmount; i++) {
      if (gameState.clicks >= getUpgradeCost(upgrade)) {
        buyUpgrade(upgrade.id);
      }
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2 className="text-xl font-bold mb-3">Upgrades</h2>

      {/* Bulk Buttons */}
      <div className="flex gap-2 mb-4">
        {bulkOptions.map((opt) => (
          <button
            key={opt}
            className={`px-3 py-1 rounded ${
              bulkAmount === opt
                ? "bg-blue-600 text-white"
                : "bg-gray-300 text-black"
            }`}
            onClick={() => setBulkAmount(opt)}
          >
            {opt}
          </button>
        ))}
      </div>

      {/* Upgrades List */}
      <div className="flex flex-col gap-4">
        {gameState.upgrades.map((upgrade) => {
          const cost = getBulkCost(upgrade);

          return (
            <div
              key={upgrade.id}
              className="p-3 border rounded bg-gray-100 shadow-sm flex justify-between"
            >
              <div>
                <div className="text-lg font-semibold">{upgrade.name}</div>
                <div className="text-sm text-gray-600">
                  {upgrade.description}
                </div>
                <div className="text-sm text-gray-800 mt-1">
                  Owned: {upgrade.owned}
                </div>
                <div className="text-sm mt-1">
                  Bulk Cost: <strong>{Math.floor(cost)}</strong>
                </div>
              </div>

              <button
                onClick={() => handleBulkBuy(upgrade)}
                disabled={!canAfford(upgrade)}
                className={`px-4 py-2 rounded font-bold self-center ${
                  canAfford(upgrade)
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-gray-400 text-gray-700 cursor-not-allowed"
                }`}
              >
                Buy {bulkAmount === "MAX" ? "Max" : `${bulkAmount}×`}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
