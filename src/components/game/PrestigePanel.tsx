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
    <div className="bg-card p-4 border-t-2 border-primary neon-border">
      <h2 className="text-xl font-bold mb-2">Prestige</h2>
      <p>Prestige Points: {gameState.prestigePoints}</p>
      <button onClick={onPrestige} className="upgrade-btn mb-4">
        Reset for {gameState.prestigePoints} Prestige Points
      </button>

      <h3 className="text-lg font-bold mt-4">Skill Tree</h3>
      <div className="grid gap-2">
        {gameState.skillTree.map(node => (
          <button
            key={node.id}
            className={`upgrade-btn ${node.owned ? 'owned' : ''}`}
            onClick={() => onBuySkillNode(node.id)}
            disabled={node.owned}
          >
            {node.name} - {node.description} {node.owned ? '(Purchased)' : ''}
          </button>
        ))}
      </div>

      <h2 className="text-xl font-bold mb-2 mt-4">Ascension</h2>
      <p>Ascension Points: {gameState.ascensionPoints}</p>
      <button onClick={onAscend} className="upgrade-btn mb-4">
        Ascend for {gameState.ascensionPoints} Ascension Points
      </button>

      <h3 className="text-lg font-bold mt-4">Ascension Tree</h3>
      <div className="grid gap-2">
        {gameState.ascensionTree.map(node => (
          <button
            key={node.id}
            className={`upgrade-btn ${node.owned ? 'owned' : ''}`}
            onClick={() => onBuyAscensionNode(node.id)}
            disabled={node.owned}
          >
            {node.name} - {node.description} {node.owned ? '(Purchased)' : ''}
          </button>
        ))}
      </div>

      <div className="mt-4 flex gap-2">
        <button onClick={onSave} className="upgrade-btn">Save Game</button>
        <button onClick={onReset} className="upgrade-btn">Reset Game</button>
      </div>
    </div>
  );
}
