import type { GameState, SkillNode, AscensionNode } from '@/hooks/useGameState';
import { formatNumber } from '@/lib/formatNumber';

interface PrestigePanelProps {
  gameState: GameState;
  onPrestige: () => void;
  onAscend: () => void;
  onBuySkillNode: (id: string) => void;
  onBuyAscensionNode: (id: string) => void;
  onSave: () => void;
  onReset: () => void;
}

export function PrestigePanel({
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
    <div className="bg-card border-t-2 border-primary neon-border p-4">
      <div className="container mx-auto space-y-4">
        {/* Action buttons */}
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2">
            <span className="text-neon-yellow text-xs font-retro">PP: {formatNumber(gameState.prestigePoints)}</span>
            <button 
              onClick={onPrestige}
              disabled={prestigeGain <= 0}
              className="bg-neon-yellow text-background font-bold px-3 py-1 rounded text-sm hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Prestige +{prestigeGain}
            </button>
          </div>
          
          <div className="flex items-center gap-2">
            <span className="text-neon-purple text-xs font-retro">AP: {formatNumber(gameState.ascensionPoints)}</span>
            <button 
              onClick={onAscend}
              disabled={ascensionGain <= 0}
              className="bg-neon-purple text-background font-bold px-3 py-1 rounded text-sm hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Ascend +{ascensionGain}
            </button>
          </div>
          
          <div className="ml-auto flex gap-2">
            <button onClick={onSave} className="bg-neon-cyan text-background font-bold px-3 py-1 rounded text-sm hover:scale-105 transition-transform">
              Save
            </button>
            <button onClick={onReset} className="bg-destructive text-destructive-foreground font-bold px-3 py-1 rounded text-sm hover:scale-105 transition-transform">
              Reset
            </button>
          </div>
        </div>

        {/* Skill Trees */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Prestige Skills */}
          <div>
            <h3 className="text-neon-yellow font-bold mb-2 text-sm font-retro">⭐ Prestige Skills</h3>
            <div className="flex flex-wrap gap-2">
              {gameState.skillTree.map(node => (
                <SkillNodeButton 
                  key={node.id} 
                  node={node} 
                  points={gameState.prestigePoints} 
                  onBuy={() => onBuySkillNode(node.id)} 
                  color="yellow"
                />
              ))}
            </div>
          </div>

          {/* Ascension Skills */}
          <div>
            <h3 className="text-neon-purple font-bold mb-2 text-sm font-retro">🌟 Ascension Skills</h3>
            <div className="flex flex-wrap gap-2">
              {gameState.ascensionTree.map(node => (
                <SkillNodeButton 
                  key={node.id} 
                  node={node} 
                  points={gameState.ascensionPoints} 
                  onBuy={() => onBuyAscensionNode(node.id)} 
                  color="purple"
                />
              ))}
            </div>
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
  color 
}: { 
  node: SkillNode | AscensionNode; 
  points: number; 
  onBuy: () => void;
  color: 'yellow' | 'purple';
}) {
  const canAfford = points >= node.cost && !node.owned;
  const bgColor = color === 'yellow' ? 'bg-neon-yellow' : 'bg-neon-purple';
  const borderColor = color === 'yellow' ? 'border-neon-yellow' : 'border-neon-purple';
  
  return (
    <button
      onClick={onBuy}
      disabled={!canAfford}
      title={`${node.name}: ${node.description} (Cost: ${node.cost})`}
      className={`
        px-3 py-2 rounded-lg font-bold text-xs transition-all
        ${node.owned 
          ? `${bgColor} text-background` 
          : canAfford 
            ? `border ${borderColor} text-foreground hover:scale-105` 
            : 'border border-muted text-muted-foreground cursor-not-allowed'
        }
      `}
    >
      {node.name} {!node.owned && `(${node.cost})`}
    </button>
  );
}