import React from "react";
import { useGameState } from "./useGameState";

export default function PrestigePanel() {
  const { gameState, prestige, calculatePrestigeGain } = useGameState();

  const gain = calculatePrestigeGain(gameState);

  return (
    <div style={{ padding: "1rem", border: "2px solid #f0c040", borderRadius: "12px", background: "#fff0e0", width: "300px" }}>
      <h2 style={{ fontSize: "1.2rem", marginBottom: "0.5rem" }}>Prestige</h2>
      <p>Prestige Points: {gameState.prestigePoints}</p>
      <p>Next Prestige Gain: {gain}</p>
      <button
        style={{
          marginTop: "0.5rem",
          padding: "0.5rem 1rem",
          fontSize: "1rem",
          borderRadius: "8px",
          border: "2px solid #f0c040",
          background: gain > 0 ? "#ffe680" : "#ccc",
          cursor: gain > 0 ? "pointer" : "not-allowed",
          transition: "0.2s",
        }}
        onClick={prestige}
        disabled={gain <= 0}
      >
        Prestige
      </button>
    </div>
  );
}
