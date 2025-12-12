import React from 'react';
import type { GameState, SkillNode, AscensionNode } from '@/hooks/useGameState';

interface PrestigePanelProps {
  gameState?: GameState;
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

const formulaNames = [
  'Sqrt(Lifetime/1M)',
  'Log10(Lifetime) - 5',
  'CPS / 10',
  'Total Upgrades',
];

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
  if (!gameState) return null; // safe check

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
    <div className="bg-card border-t-2 border-primary neon-border p-4 rounded-md">
      <div className="container mx-auto">
        {/* Controls row */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-4 text-[10px] md:text-xs">
            <div>
              <span className="text-muted-foreground">Prestige: </span>
              <span className="text-neon-yellow font-bold">{gameState.prestigePoints}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Ascension: </span>
              <span className="text-neon-purple font-bold">{gameState.ascensionPoints}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={gameState.selectedFormula}
              onChange={(e) => onSetFormula(Number(e.target.value))}
              className="bg-muted border border-border rounded px-2 py-1 text-[10px] md:text-xs text-foreground"
            >
              {formulaNames.map((name, i) => (
                <option key={i} value={i}>{name}</option>
              ))}
            </select>

            <button
              onClick={handlePrestige}
              disabled={prestigeGain <= 0}
              className={`px-3 py-1 rounded text-[10px] md:text-xs font-bold transition-all
                ${prestigeGain > 0 
                  ? 'bg-neon-yellow text-background hover:scale-105' 
                  : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
            >
              Prestige (+{prestigeGain})
            </button>

            <button
              onClick={handleAscend}
              disabled={ascensionGain <= 0}
              className={`px-3 py-1 rounded text-[10px] md:text-xs font-bold transition-all
                ${ascensionGain > 0 
                  ? 'bg-neon-purple text-white hover:scale-105' 
                  : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
            >
              Ascend (+{ascensionGain})
            </button>

            <button
              onClick={onSave}
              className="px-3 py-1 rounded text-[10px] md:text-xs bg-primary text-primary-foreground hover:scale-105 transition-transform"
            >
              Save
            </button>

            <button
              onClick={handleReset}
              className="px-3 py-1 rounded text-[10px] md:text-xs bg-destructive text-destructive-foreground hover:scale-105 transition-transform"
            >
              Reset
            </button>
          </div>
        </div>

        {/* Prestige Skill Tree */}
        <div className="mb-4">
          <h3 className="text-[10px] md:text-xs text-neon-yellow mb-2">Prestige Skills</h3>
          <div className="flex flex-wrap justify-center items-center gap-2 md:gap-4">
            {gameState.skillTree?.map((node, index) => (
              <div key={node.id} className="flex items-center">
                <SkillNodeButton 
                  node={node} 
                  points={gameState.prestigePoints}
                  onBuy={() => handleBuyNode(node.id)}
                  color="yellow"
                />
                {index < gameState.skillTree.length - 1 && (
                  <div className="w-4 md:w-8 h-0.5 bg-border mx-1" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Ascension Skill Tree */}
        <div>
          <h3 className="text-[10px] md:text-xs text-neon-purple mb-2">Ascension Skills</h3>
          <div className="flex flex-wrap justify-center items-center gap-2 md:gap-4">
            {gameState.ascensionTree?.map((node, index) => (
              <div key={node.id} className="flex items-center">
                <AscensionNodeButton 
                  node={node} 
                  points={gameState.ascensionPoints}
                  onBuy={() => handleBuyAscensionNode(node.id)}
                />
                {index < gameState.ascensionTree.length - 1 && (
                  <div className="w-4 md:w-8 h-0.5 bg-neon-purple/30 mx-1" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function SkillNodeButton({ 
  node, 
  points, 
  onBuy,
  color = 'yellow',
}: { 
  node: SkillNode; 
  points: number;
  onBuy: () => void;
  color?: 'yellow' | 'purple';
}) {
  const canAfford = points >= node.cost && !node.owned;

  return (
    <button
      onClick={onBuy}
      disabled={!canAfford}
      title={`${node.name}: ${node.description} (Cost: ${node.cost})`}
      className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-[8px] md:text-[10px] font-bold transition-all
        ${node.owned 
          ? 'bg-neon-green text-background neon-border' 
          : canAfford 
            ? `bg-card border-2 border-neon-${color} text-neon-${color} hover:scale-110 cursor-pointer` 
            : 'bg-muted border-2 border-muted-foreground text-muted-foreground cursor-not-allowed'}`}
    >
      <div className="text-center leading-tight">
        <span className="block">{node.id.toUpperCase()}</span>
        {!node.owned && <span className="block text-[6px] md:text-[8px]">{node.cost}pt</span>}
      </div>
    </button>
  );
}

function AscensionNodeButton({ 
  node, 
  points, 
  onBuy,
}: { 
  node: AscensionNode; 
  points: number;
  onBuy: () => void;
}) {
  const canAfford = points >= node.cost && !node.owned;

  return (
    <button
      onClick={onBuy}
      disabled={!canAfford}
      title={`${node.name}: ${node.description} (Cost: ${node.cost})`}
      className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center text-[8px] md:text-[10px] font-bold transition-all
        ${node.owned 
          ? 'bg-neon-purple text-white' 
          : canAfford 
            ? 'bg-card border-2 border-neon-purple text-neon-purple hover:scale-110 cursor-pointer' 
            : 'bg-muted border-2 border-muted-foreground text-muted-foreground cursor-not-allowed'}`}
    >
      <div className="text-center leading-tight">
        <span className="block">{node.id.replace('asc', '').toUpperCase()}</span>
        {!node.owned && <span className="block text-[6px] md:text-[8px]">{node.cost}pt</span>}
      </div>
    </button>
  );
}
