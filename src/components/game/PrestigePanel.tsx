import type { GameState, SkillNode, AscensionNode, TranscendenceNode } from '@/types/types';
import { formatNumber } from '@/lib/formatNumber';

interface PrestigePanelProps {
  gameState: GameState;
  onPrestige: () => void;
  onAscend: () => void;
  onTranscend: () => void;
  onBuySkillNode: (id: string) => void;
  onBuyAscensionNode: (id: string) => void;
  onBuyTranscendenceNode: (id: string) => void;
  onSave: () => void;
  onReset: () => void;
}

export function PrestigePanel({
  gameState,
  onPrestige,
  onAscend,
  onTranscend,
  onBuySkillNode,
  onBuyAscensionNode,
  onBuyTranscendenceNode,
  onSave,
  onReset,
}: PrestigePanelProps) {
  const prestigeGain = Math.floor(gameState.lifetimeClicks / 1_000_000);
  const ascensionGain = Math.floor(Math.sqrt(gameState.totalPrestigePoints / 100));
  const transcendenceGain = Math.floor(Math.sqrt(gameState.totalAscensionPoints / 50));
  
  const clicksNeeded = 1_000_000 - (gameState.lifetimeClicks % 1_000_000);
  const ppNeeded = Math.pow(ascensionGain + 1, 2) * 100 - gameState.totalPrestigePoints;
  const apNeeded = Math.pow(transcendenceGain + 1, 2) * 50 - gameState.totalAscensionPoints;

  return (
    <div className="bg-card border-t-2 border-primary neon-border p-4">
      <div className="container mx-auto space-y-4">
        {/* Reset Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Prestige */}
          <div className="bg-background/50 rounded-lg p-3 border border-neon-yellow/30">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-neon-yellow font-bold text-sm font-retro">⭐ PRESTIGE</h3>
              <span className="text-neon-yellow text-xs font-retro">PP: {formatNumber(gameState.prestigePoints)}</span>
            </div>
            <p className="text-muted-foreground text-xs mb-2">
              Reset for <span className="text-neon-yellow font-bold">Prestige Points</span>. 1 PP per 1M clicks.
            </p>
            <p className="text-xs text-muted-foreground mb-2">
              {prestigeGain > 0 
                ? `Gain ${formatNumber(prestigeGain)} PP` 
                : `Need ${formatNumber(clicksNeeded)} more`}
            </p>
            <button 
              onClick={onPrestige}
              disabled={prestigeGain <= 0}
              className="w-full bg-neon-yellow text-background font-bold px-3 py-2 rounded text-sm hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Prestige {prestigeGain > 0 && `+${formatNumber(prestigeGain)}`}
            </button>
          </div>

          {/* Ascension */}
          <div className="bg-background/50 rounded-lg p-3 border border-neon-purple/30">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-neon-purple font-bold text-sm font-retro">🌟 ASCENSION</h3>
              <span className="text-neon-purple text-xs font-retro">AP: {formatNumber(gameState.ascensionPoints)}</span>
            </div>
            <p className="text-muted-foreground text-xs mb-2">
              Reset all (incl. PP) for <span className="text-neon-purple font-bold">Ascension Points</span>.
            </p>
            <p className="text-xs text-muted-foreground mb-2">
              {ascensionGain > 0 
                ? `Gain ${formatNumber(ascensionGain)} AP` 
                : `Need ${formatNumber(Math.max(0, ppNeeded))} more PP`}
            </p>
            <button 
              onClick={onAscend}
              disabled={ascensionGain <= 0}
              className="w-full bg-neon-purple text-background font-bold px-3 py-2 rounded text-sm hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Ascend {ascensionGain > 0 && `+${formatNumber(ascensionGain)}`}
            </button>
          </div>

          {/* Transcendence */}
          <div className="bg-background/50 rounded-lg p-3 border border-neon-cyan/30">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-primary font-bold text-sm font-retro">🌀 TRANSCEND</h3>
              <span className="text-primary text-xs font-retro">TP: {formatNumber(gameState.transcendencePoints)}</span>
            </div>
            <p className="text-muted-foreground text-xs mb-2">
              Reset EVERYTHING for <span className="text-primary font-bold">Transcendence Points</span>.
            </p>
            <p className="text-xs text-muted-foreground mb-2">
              {transcendenceGain > 0 
                ? `Gain ${formatNumber(transcendenceGain)} TP` 
                : `Need ${formatNumber(Math.max(0, apNeeded))} more AP`}
            </p>
            <button 
              onClick={onTranscend}
              disabled={transcendenceGain <= 0}
              className="w-full bg-primary text-primary-foreground font-bold px-3 py-2 rounded text-sm hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Transcend {transcendenceGain > 0 && `+${formatNumber(transcendenceGain)}`}
            </button>
          </div>
        </div>

        {/* Skill Trees */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Prestige Skills */}
          <div className="bg-background/30 rounded-lg p-3">
            <h4 className="text-neon-yellow font-bold mb-2 text-xs font-retro">⭐ Prestige Skills</h4>
            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
              {gameState.skillTree.map(node => (
                <SkillNodeCard 
                  key={node.id} 
                  node={node} 
                  points={gameState.prestigePoints} 
                  onBuy={() => onBuySkillNode(node.id)} 
                  color="yellow"
                  currency="PP"
                />
              ))}
            </div>
          </div>

          {/* Ascension Skills */}
          <div className="bg-background/30 rounded-lg p-3">
            <h4 className="text-neon-purple font-bold mb-2 text-xs font-retro">🌟 Ascension Skills</h4>
            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
              {gameState.ascensionTree.map(node => (
                <SkillNodeCard 
                  key={node.id} 
                  node={node} 
                  points={gameState.ascensionPoints} 
                  onBuy={() => onBuyAscensionNode(node.id)} 
                  color="purple"
                  currency="AP"
                />
              ))}
            </div>
          </div>

          {/* Transcendence Skills */}
          <div className="bg-background/30 rounded-lg p-3">
            <h4 className="text-primary font-bold mb-2 text-xs font-retro">🌀 Transcendence Skills</h4>
            <div className="grid grid-cols-1 gap-2 max-h-40 overflow-y-auto">
              {gameState.transcendenceTree.map(node => (
                <SkillNodeCard 
                  key={node.id} 
                  node={node} 
                  points={gameState.transcendencePoints} 
                  onBuy={() => onBuyTranscendenceNode(node.id)} 
                  color="cyan"
                  currency="TP"
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
  color,
  currency,
}: { 
  node: SkillNode | AscensionNode | TranscendenceNode; 
  points: number; 
  onBuy: () => void;
  color: 'yellow' | 'purple' | 'cyan';
  currency: string;
}) {
  const canAfford = points >= node.cost && !node.owned;
  const colorClasses = {
    yellow: { bg: 'bg-neon-yellow', border: 'border-neon-yellow', text: 'text-neon-yellow' },
    purple: { bg: 'bg-neon-purple', border: 'border-neon-purple', text: 'text-neon-purple' },
    cyan: { bg: 'bg-primary', border: 'border-primary', text: 'text-primary' },
  };
  const { bg, border, text } = colorClasses[color];
  
  return (
    <button
      onClick={onBuy}
      disabled={!canAfford}
      className={`
        w-full text-left p-2 rounded-lg transition-all
        ${node.owned 
          ? `${bg} text-background` 
          : canAfford 
            ? `border ${border} text-foreground hover:scale-[1.02]` 
            : 'border border-muted/50 text-muted-foreground cursor-not-allowed opacity-60'
        }
      `}
    >
      <div className="flex justify-between items-center">
        <span className="font-bold text-xs">{node.name}</span>
        {node.owned ? (
          <span className="text-xs">✓</span>
        ) : (
          <span className={`text-xs ${canAfford ? text : ''}`}>{node.cost} {currency}</span>
        )}
      </div>
      <p className={`text-xs mt-1 ${node.owned ? 'opacity-80' : 'text-muted-foreground'}`}>
        {node.description}
      </p>
    </button>
  );
}
