import React from "react";
import { useGameState } from "./useGameState";

export default function UpgradesPanel() {
  const { gameState, buyUpgrade, getUpgradeCost } = useGameState();

  if (!gameState || !gameState.upgrades) return null;

  const clickUpgrades = gameState.upgrades.filter(u => u.type === "clickPower");
  const autoClickers = gameState.upgrades.filter(u => u.type === "autoClicker");

  const renderUpgrade = (upgrade: typeof clickUpgrades[0]) => {
    const cost = getUpgradeCost(upgrade);
    const affordable = gameState.clicks >= cost;

    return (
      <div
        key={upgrade.id}
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0.5rem",
          marginBottom: "0.5rem",
          borderRadius: "8px",
          background: affordable ? "#ffe680" : "#ddd",
          border: "2px solid #f0c040",
          cursor: affordable ? "pointer" : "not-allowed",
          transition: "0.2s",
        }}
        onClick={() => affordable && buyUpgrade(upgrade.id)}
      >
        <span>{upgrade.name}</span>
        <span>{cost}</span>
      </div>
    );
  };

  return (
    <div style={{ width: "350px" }}>
      <h2 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Upgrades</h2>
      <h3>Click Upgrades</h3>
      {clickUpgrades.map(renderUpgrade)}
      <h3>Auto Clickers</h3>
      {autoClickers.map(renderUpgrade)}
    </div>
  );
}
