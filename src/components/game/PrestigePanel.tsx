import React from "react";

interface PrestigePanelProps {
  gameState: any;
  calculatePrestigeGain: (state: any) => number;
  calculateAscensionGain: (state: any) => number;
  onPrestige: () => void;
  onAscend: () => void;
}

export default function PrestigePanel({
  gameState,
  calculatePrestigeGain,
  calculateAscensionGain,
  onPrestige,
  onAscend,
}: PrestigePanelProps) {
  if (!gameState) return null;

  const prestigeGain = calculatePrestigeGain(gameState);
  const ascensionGain = calculateAscensionGain(gameState);

  return (
    <div style={{ padding: "1rem", border: "2px solid gold", borderRadius: "10px", background: "#fef1e6" }}>
      <h2>Prestige</h2>
      <p>Prestige Points: {gameState.prestigePoints}</p>
      <p>Can Gain: {prestigeGain}</p>
      <button
        onClick={onPrestige}
        disabled={prestigeGain <= 0}
        style={{
          padding: "0.5rem 1rem",
          marginTop: "0.5rem",
          borderRadius: "8px",
          border: "2px solid orange",
          background: prestigeGain > 0 ? "#ffdd88" : "#ccc",
          fontWeight: "bold",
          cursor: prestigeGain > 0 ? "pointer" : "not-allowed",
        }}
      >
        Prestige
      </button>

      <h2 style={{ marginTop: "1rem" }}>Ascension</h2>
      <p>Ascension Points: {gameState.ascensionPoints}</p>
      <p>Can Gain: {ascensionGain}</p>
      <button
        onClick={onAscend}
        disabled={ascensionGain <= 0}
        style={{
          padding: "0.5rem 1rem",
          marginTop: "0.5rem",
          borderRadius: "8px",
          border: "2px solid violet",
          background: ascensionGain > 0 ? "#dd88ff" : "#ccc",
          fontWeight: "bold",
          cursor: ascensionGain > 0 ? "pointer" : "not-allowed",
        }}
      >
        Ascend
      </button>
    </div>
  );
}
