import React from 'react';
import { useGameState } from '@/hooks/useGameState';

interface PrestigePanelProps {
  gameState: ReturnType<typeof useGameState>['gameState'];
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
  const prestigeGain = Math.floor(gameState.lifetimeClicks / 1_000_000);
  const ascensionGain = Math.floor(Math.sqrt(gameState.totalPrestigePoints / 100));

  return (
    <div className="bg-card p-4 border-t-2 border-primary neon-border">
      <h2 className="text-xl font-bold mb-2">Prestige & Ascension</h2>

      <div className="mb-4">
        <button
          onClick={onPrestige}
          className="w-full py-2 mb-2 rounded-md border-2 border-yellow-400 bg-yellow-300 hover:bg-yellow-400 transition"
        >
          Prestige (+{prestigeGain} points)
        </button>
        <button
          onClick={onAscend}
          className="w-full py-2 mb-2 rounded-md border-2 border-blue-400 bg-blue-300 hover:bg-blue-400 transition"
        >
          Ascend (+{ascensionGain} points)
        </button>
      </div>

      <div className="mb-4">
        <h3 className="font-semibold mb-2">Prestige Upgrades</h3>
        {gameState.skillTree.map(node => (
          <button
            key={node.id}
            disabled={node.owned || gameState.prestigePoints < node.cost}
            onClick={() => onBuySkillNode(node.id)}
            className={`w-full text-left px-2 py-1 mb-1 rounded-md border-2 ${
              node.owned
                ? 'border-gray-400 bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'border-yellow-500 bg-yellow-200 hover:bg-yellow-300'
            } transition`}
          >
            <div className="font-bold">{node.name}</div>
            <div className="text-sm">{node.description}</div>
            <div className="text-xs">Cost: {node.cost} prestige points</div>
          </button>
        ))}
      </div>

      <div className="mb-4">
        <h3 className="font-semibold mb-2">Ascension Upgrades</h3>
        {gameState.ascensionTree.map(node => (
          <button
            key={node.id}
            disabled={node.owned || gameState.ascensionPoints < node.cost}
            onClick={() => onBuyAscensionNode(node.id)}
            className={`w-full text-left px-2 py-1 mb-1 rounded-md border-2 ${
              node.owned
                ? 'border-gray-400 bg-gray-300 text-gray-600 cursor-not-allowed'
                : 'border-blue-500 bg-blue-200 hover:bg-blue-300'
            } transition`}
          >
            <div className="font-bold">{node.name}</div>
            <div className="text-sm">{node.description}</div>
            <div className="text-xs">Cost: {node.cost} ascension points</div>
          </button>
        ))}
      </div>

      <div className="flex gap-2">
        <button
          onClick={onSave}
          className="flex-1 py-2 rounded-md border-2 border-green-400 bg-green-200 hover:bg-green-300 transition"
        >
          Save
        </button>
        <button
          onClick={onReset}
          className="flex-1 py-2 rounded-md border-2 border-red-400 bg-red-200 hover:bg-red-300 transition"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
