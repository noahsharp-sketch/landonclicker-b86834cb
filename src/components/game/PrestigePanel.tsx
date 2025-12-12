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
    <div className="p-4 bg-card border-t-2 border-primary neon-border flex flex-col gap-3">
      <button className="upgrade-btn affordable" onClick={onPrestige}>
        Gain Prestige ({gameState.lifetimeClicks.toLocaleString()} Clicks)
      </button>
      <button className="upgrade-btn affordable" onClick={onAscend}>
        Gain Ascension ({gameState.totalPrestigePoints.toLocaleString()} Prestige Points)
      </button>

      <div>
        <h3 className="font-bold mb-1">Prestige Upgrades</h3>
        {gameState.skillTree.map(node => (
          <button
            key={node.id}
            className={`upgrade-btn ${node.owned ? 'owned' : 'affordable'}`}
            onClick={() => !node.owned && onBuySkillNode(node.id)}
          >
            {node.name} - {node.description} ({node.owned ? 'Purchased' : `Cost: ${node.cost}`})
          </button>
        ))}
      </div>

      <div>
        <h3 className="font-bold mb-1">Ascension Upgrades</h3>
        {gameState.ascensionTree.map(node => (
          <button
            key={node.id}
            className={`upgrade-btn ${node.owned ? 'owned' : 'affordable'}`}
            onClick={() => !node.owned && onBuyAscensionNode(node.id)}
          >
            {node.name} - {node.description} ({node.owned ? 'Purchased' : `Cost: ${node.cost}`})
          </button>
        ))}
      </div>

      <div className="flex gap-2 mt-2">
        <button className="upgrade-btn affordable flex-1" onClick={onSave}>Save</button>
        <button className="upgrade-btn affordable flex-1" onClick={onReset}>Reset</button>
      </div>
    </div>
  );
}
