import React from 'react';
import type { GameState, SkillNode, AscensionNode } from '@/hooks/useGameState';

interface PrestigePanelProps {
  gameState: GameState;
  calculatePrestigeGain: (state: GameState) => number;
  calculateAscensionGain: (state: GameState) => number;
  onPrestige: () => void;
  onAscend: () => void;
  onBuySkillNode: (id: string) => void;
  onBuyAscensionNode: (id: string) => void;
  onSetFormula: (index: number) => void;
  onSave: () => void;
  onReset: () => void;
  playPrestige: () => void;
  playAscension: () => void;
  playPurchase: () => void;
}

export function PrestigePanel({
  gameState,
  calculatePrestigeGain,
  calculateAscensionGain,
  onPrestige,
  onAscend,
  onBuySkillNode,
  onBuyAscensionNode,
  onSetFormula,
  onSave,
  onReset,
  playPrestige,
  playAscension,
  playPurchase,
}: PrestigePanelProps) {
  const prestigeGain = calculatePrestigeGain(gameState);
  const ascensionGain = calculateAscensionGain(gameState);

  const handlePrestige = () => {
    if (prestigeGain > 0) {
      onPrestige();
      playPrestige();
    }
  };

  const handleAscend = () => {
    if (ascensionGain > 0 && confirm('Ascension will reset ALL progress including prestige! Are you sure?')) {
      onAscend();
      playAscension();
    }
  };

  const handleBuyNode = (id: string) => {
    onBuySkillNode(id);
    playPurchase();
  };

  const handleBuyAscensionNode = (id: string) => {
    onBuyAscensionNode(id);
    playPurchase();
  };

  const handleReset = () => {
    if (confirm('Are you sure you want to reset ALL progress? This cannot be undone!')) {
      onReset();
    }
  };

  return (
    <div className="bg-card border-t-2 border-primary neon-border p-4 space-y-4">
      <div className="flex justify-between items-center text-xs md:text-sm">
        <div>
          <span className="text-muted-foreground">Prestige: </span>
          <span className="text-neon-yellow font-bold">{gameState.prestigePoints}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Ascension: </span>
          <span className="text-neon-purple font-bold">{gameState.ascensionPoints}</span>
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        <button
          onClick={handlePrestige}
          disabled={prestigeGain <= 0}
          className={`px-3 py-1 rounded text-xs font-bold transition-all
            ${prestigeGain > 0 ? 'bg-neon-yellow text-black hover:scale-105 glow' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
        >
          Prestige (+{prestigeGain})
        </button>

        <button
          onClick={handleAscend}
          disabled={ascensionGain <= 0}
          className={`px-3 py-1 rounded text-xs font-bold transition-all
            ${ascensionGain > 0 ? 'bg-neon-purple text-white hover:scale-105 glow' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
        >
          Ascend (+{ascensionGain})
        </button>

        <button
          onClick={onSave}
          className="px-3 py-1 rounded text-xs bg-primary text-primary-foreground hover:scale-105 transition-transform"
        >
          Save
        </button>

        <button
          onClick={handleReset}
          className="px-3 py-1 rounded text-xs bg-destructive text-destructive-foreground hover:scale-105 transition-transform"
        >
          Reset
        </button>
      </div>

      {/* Skill Trees */}
      <SkillTree
        title="Prestige Skills"
        nodes={gameState.skillTree}
        points={gameState.prestigePoints}
        onBuy={handleBuyNode}
        color="yellow"
      />
      <SkillTree
        title="Ascension Skills"
        nodes={gameState.ascensionTree}
        points={gameState.ascensionPoints}
        onBuy={handleBuyAscensionNode}
        color="purple"
      />
    </div>
  );
}

interface SkillTreeProps {
  title: string;
  nodes: (SkillNode | AscensionNode)[];
  points: number;
  onBuy: (id: string) => void;
  color: 'yellow' | 'purple';
}

function SkillTree({ title, nodes, points, onBuy, color }: SkillTreeProps) {
  return (
    <div>
      <h3 className={`text-xs md:text-sm mb-2 ${color === 'yellow' ? 'text-neon-yellow' : 'text-neon-purple'}`}>
        {title}
      </h3>
      <div className="flex flex-wrap gap-2">
        {nodes.map(node => (
          <button
            key={node.id}
            onClick={() => onBuy(node.id)}
            disabled={node.owned || points < node.cost}
            className={`w-16 h-16 rounded-lg flex flex-col items-center justify-center text-[10px] md:text-xs font-bold transition-all
              ${node.owned ? 'bg-gray-700 text-gray-300' : points >= node.cost ? `bg-${color}-400 text-black hover:scale-105 glow` : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
          >
            <span>{node.name}</span>
            {!node.owned && <span className="text-[8px]">{node.cost} pt</span>}
          </button>
        ))}
      </div>
    </div>
  );
}
