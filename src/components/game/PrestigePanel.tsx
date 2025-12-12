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
  return (
    <div className="bg-card p-4 border-t-2 border-primary flex flex-col space-y-4">
      <div className="flex space-x-2">
        <button
          onClick={onPrestige}
          className="flex-1 rounded-lg p-3 bg-yellow-400 hover:bg-yellow-500 shadow-lg font-bold"
        >
          Prestige ({gameState.prestigePoints}💎)
        </button>
        <button
          onClick={onAscend}
          className="flex-1 rounded-lg p-3 bg-indigo-400 hover:bg-indigo-500 shadow-lg font-bold"
        >
          Ascend ({gameState.ascensionPoints}⭐)
        </button>
      </div>

      <div>
        <h3 className="font-bold mb-2">Skill Tree</h3>
        <div className="flex flex-wrap gap-2">
          {gameState.skillTree.map(node => (
            <button
              key={node.id}
              onClick={() => !node.owned && onBuySkillNode(node.id)}
              className={`
                rounded-lg p-2 text-sm transition-all
                ${node.owned ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-400 hover:bg-green-500'}
              `}
            >
              {node.name} ({node.cost}💎)
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-bold mb-2">Ascension Tree</h3>
        <div className="flex flex-wrap gap-2">
          {gameState.ascensionTree.map(node => (
            <button
              key={node.id}
              onClick={() => !node.owned && onBuyAscensionNode(node.id)}
              className={`
                rounded-lg p-2 text-sm transition-all
                ${node.owned ? 'bg-gray-400 cursor-not-allowed' : 'bg-pink-400 hover:bg-pink-500'}
              `}
            >
              {node.name} ({node.cost}⭐)
            </button>
          ))}
        </div>
      </div>

      <div className="flex space-x-2">
        <button
          onClick={onSave}
          className="flex-1 rounded-lg p-2 bg-blue-400 hover:bg-blue-500 shadow font-bold"
        >
          Save
        </button>
        <button
          onClick={onReset}
          className="flex-1 rounded-lg p-2 bg-red-400 hover:bg-red-500 shadow font-bold"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
