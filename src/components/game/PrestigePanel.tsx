import type { GameState, SkillNode, AscensionNode } from '@/types/types';
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
  const clicksNeeded = 1_000_000 - (gameState.lifetimeClicks % 1_000_000);
  const ppNeeded = Math.pow(ascensionGain + 1, 2) * 100 - gameState.totalPrestigePoints;

  return (
    <div className="bg-card border-t-2 border-primary neon-border p-4">
      <div className="container mx-auto space-y-4">
        {/* Prestige Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Prestige */}
          <div className="bg-background/50 rounded-lg p-3 border border-neon-yellow/30">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-neon-yellow font-bold text-sm font-retro">⭐ PRESTIGE</h3>
              <span className="text-neon-yellow text-xs font-retro">PP: {formatNumber(gameState.prestigePoints)}</span>
            </div>
            <p className="text-muted-foreground text-xs mb-2">
              Reset progress to earn <span className="text-neon-yellow font-bold">Prestige Points (PP)</span>. 
              Earn 1 PP per 1M lifetime clicks.
            </p>
            <p className="text-xs text-muted-foreground mb-2">
              {prestigeGain > 0 
                ? `You'll gain ${prestigeGain} PP` 
                : `Need ${formatNumber(clicksNeeded)} more clicks for 1 PP`}
            </p>
            <button 
              onClick={onPrestige}
              disabled={prestigeGain <= 0}
              className="w-full bg-neon-yellow text-background font-bold px-3 py-2 rounded text-sm hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Prestige {prestigeGain > 0 && `+${prestigeGain} PP`}
            </button>
          </div>

          {/* Ascension */}
          <div className="bg-background/50 rounded-lg p-3 border border-neon-purple/30">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-neon-purple font-bold text-sm font-retro">🌟 ASCENSION</h3>
              <span className="text-neon-purple text-xs font-retro">AP: {formatNumber(gameState.ascensionPoints)}</span>
            </div>
            <p className="text-muted-foreground text-xs mb-2">
              Reset everything (including PP) to earn <span className="text-neon-purple font-bold">Ascension Points (AP)</span>. 
              Earn AP based on total PP earned: √(total PP / 100).
            </p>
            <p className="text-xs text-muted-foreground mb-2">
              {ascensionGain > 0 
                ? `You'll gain ${ascensionGain} AP` 
                : `Need ${formatNumber(Math.max(0, ppNeeded))} more total PP for 1 AP`}
            </p>
            <button 
              onClick={onAscend}
              disabled={ascensionGain <= 0}
              className="w-full bg-neon-purple text-background font-bold px-3 py-2 rounded text-sm hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Ascend {ascensionGain > 0 && `+${ascensionGain} AP`}
            </button>
          </div>
        </div>

        {/* Skill Trees */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Prestige Skills */}
          <div className="bg-background/30 rounded-lg p-3">
            <h4 className="text-neon-yellow font-bold mb-2 text-xs font-retro">⭐ Prestige Skills (spend PP)</h4>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
              {gameState.skillTree.map(node => (
                <SkillNodeCard 
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
          <div className="bg-background/30 rounded-lg p-3">
            <h4 className="text-neon-purple font-bold mb-2 text-xs font-retro">🌟 Ascension Skills (spend AP)</h4>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
              {gameState.ascensionTree.map(node => (
                <SkillNodeCard 
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

        {/* Save/Reset */}
        <div className="flex justify-end gap-2">
          <button onClick={onSave} className="bg-neon-cyan text-background font-bold px-4 py-1 rounded text-sm hover:scale-105 transition-transform">
            Save
          </button>
          <button onClick={onReset} className="bg-destructive text-destructive-foreground font-bold px-4 py-1 rounded text-sm hover:scale-105 transition-transform">
            Reset All
          </button>
        </div>
      </div>
    </div>
  );
}

function SkillNodeCard({ 
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
  const textColor = color === 'yellow' ? 'text-neon-yellow' : 'text-neon-purple';
  
  return (
    <button
      onClick={onBuy}
      disabled={!canAfford}
      className={`
        w-full text-left p-2 rounded-lg transition-all
        ${node.owned 
          ? `${bgColor} text-background` 
          : canAfford 
            ? `border ${borderColor} text-foreground hover:scale-[1.02]` 
            : 'border border-muted/50 text-muted-foreground cursor-not-allowed opacity-60'
        }
      `}
    >
      <div className="flex justify-between items-center">
        <span className="font-bold text-xs">{node.name}</span>
        {node.owned ? (
          <span className="text-xs">✓ Owned</span>
        ) : (
          <span className={`text-xs ${canAfford ? textColor : ''}`}>{node.cost} {color === 'yellow' ? 'PP' : 'AP'}</span>
        )}
      </div>
      <p className={`text-xs mt-1 ${node.owned ? 'opacity-80' : 'text-muted-foreground'}`}>
        {node.description}
      </p>
    </button>
  );
}
