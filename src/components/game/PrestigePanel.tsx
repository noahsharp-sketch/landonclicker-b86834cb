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
    <div className="p-4 flex flex-col md:flex-row gap-4 bg-card border-t-2 border-primary">
      {/* Prestige */}
      <div className="flex-1 flex flex-col gap-2">
        <h2 className="font-bold text-lg">Prestige</h2>
        <button
          className={`w-full p-3 rounded-lg border-2 border-purple-400 bg-purple-200
                      hover:bg-purple-300 hover:shadow-lg font-bold transition-all`}
          onClick={onPrestige}
        >
          Prestige (+{Math.floor(gameState.lifetimeClicks / 1_000_000)} points)
        </button>

        {gameState.skillTree.map(skill => (
          <button
            key={skill.id}
            className={`
              w-full p-2 rounded-lg border-2 border-purple-400
              bg-purple-200 hover:bg-purple-300 hover:shadow-lg
              transition-all font-bold text-left
              ${skill.owned ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            onClick={() => {
              if (!skill.owned) onBuySkillNode(skill.id);
            }}
          >
            {skill.name} - {skill.description}
          </button>
        ))}
      </div>

      {/* Ascension */}
      <div className="flex-1 flex flex-col gap-2">
        <h2 className="font-bold text-lg">Ascension</h2>
        <button
          className={`w-full p-3 rounded-lg border-2 border-indigo-400 bg-indigo-200
                      hover:bg-indigo-300 hover:shadow-lg font-bold transition-all`}
          onClick={onAscend}
        >
          Ascend (+{Math.floor(Math.sqrt(gameState.totalPrestigePoints / 100))} points)
        </button>

        {gameState.ascensionTree.map(node => (
          <button
            key={node.id}
            className={`
              w-full p-2 rounded-lg border-2 border-indigo-400
              bg-indigo-200 hover:bg-indigo-300 hover:shadow-lg
              transition-all font-bold text-left
              ${node.owned ? 'opacity-50 cursor-not-allowed' : ''}
            `}
            onClick={() => {
              if (!node.owned) onBuyAscensionNode(node.id);
            }}
          >
            {node.name} - {node.description}
          </button>
        ))}
      </div>

      {/* Save / Reset */}
      <div className="flex flex-col gap-2 md:w-48">
        <button
          className="w-full p-2 rounded-lg border-2 border-green-400 bg-green-200 hover:bg-green-300 hover:shadow-lg font-bold transition-all"
          onClick={onSave}
        >
          Save
        </button>
        <button
          className="w-full p-2 rounded-lg border-2 border-red-400 bg-red-200 hover:bg-red-300 hover:shadow-lg font-bold transition-all"
          onClick={onReset}
        >
          Reset
        </button>
      </div>
    </div>
  );
}
