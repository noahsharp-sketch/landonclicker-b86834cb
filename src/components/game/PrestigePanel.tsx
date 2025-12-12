import React from 'react';
import { GameState } from '@/hooks/useGameState';

interface PrestigePanelProps {
  gameState: GameState;
  onPrestige: () => void;
  onAscend: () => void;
  onBuySkillNode: (id: string) => void;
  onBuyAscensionNode: (id: string) => void;
  onSave: () => void;
  onReset: () => void;
}

export default function PrestigePanel({
  gameState,
  onPrestige,
  onAscend,
  onBuySkillNode,
  onBuyAscensionNode,
  onSave,
  onReset,
}: PrestigePanelProps) {
  if (!gameState) return null;

  return (
    <div className="p-4 bg-card border-t-2 border-primary neon-border flex flex-col md:flex-row gap-4">
      <div className="flex-1">
        <h2 className="font-bold mb-2">Prestige</h2>
        <button
          className="w-full p-2 mb-2 rounded-lg bg-yellow-300 hover:scale-105 transition"
          onClick={onPrestige}
        >
          Prestige (+{Math.floor(gameState.lifetimeClicks / 1_000_000)} points)
        </button>
        <h2 className="font-bold mb-2 mt-2">Skill Tree</h2>
        {gameState.skillTree.map(node => (
          <button
            key={node.id}
            disabled={node.owned || gameState.prestigePoints < node.cost}
            className={`w-full p-2 mb-1 rounded-lg ${node.owned ? 'bg-gray-400' : 'bg-green-300 hover:scale-105'} transition`}
            onClick={() => onBuySkillNode(node.id)}
          >
            {node.name} ({node.owned ? 'Owned' : node.cost} pts)
          </button>
        ))}
      </div>

      <div className="flex-1">
        <h2 className="font-bold mb-2">Ascension</h2>
        <button
          className="w-full p-2 mb-2 rounded-lg bg-yellow-400 hover:scale-105 transition"
          onClick={onAscend}
        >
          Ascend (+{Math.floor(Math.sqrt(gameState.totalPrestigePoints / 100))} pts)
        </button>
        <h2 className="font-bold mb-2 mt-2">Ascension Tree</h2>
        {gameState.ascensionTree.map(node => (
          <button
            key={node.id}
            disabled={node.owned || gameState.ascensionPoints < node.cost}
            className={`w-full p-2 mb-1 rounded-lg ${node.owned ? 'bg-gray-400' : 'bg-pink-300 hover:scale-105'} transition`}
            onClick={() => onBuyAscensionNode(node.id)}
          >
            {node.name} ({node.owned ? 'Owned' : node.cost} pts)
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-2 md:w-48">
        <button
          className="w-full p-2 rounded-lg bg-blue-300 hover:scale-105 transition"
          onClick={onSave}
        >
          Save
        </button>
        <button
          className="w-full p-2 rounded-lg bg-red-400 hover:scale-105 transition"
          onClick={onReset}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
