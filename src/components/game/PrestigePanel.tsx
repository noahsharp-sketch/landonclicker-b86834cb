import { useState } from 'react';
import type { GameState, SkillNode, AscensionNode, TranscendenceNode, EternityNode } from '@/types/types';
import { formatNumber } from '@/lib/formatNumber';

interface PrestigePanelProps {
  gameState: GameState;
  onPrestige: () => void;
  onAscend: () => void;
  onTranscend: () => void;
  onEternity: () => void;
  onBuySkillNode: (id: string) => void;
  onBuyAscensionNode: (id: string) => void;
  onBuyTranscendenceNode: (id: string) => void;
  onBuyEternityNode: (id: string) => void;
  onSave: () => void;
  onReset: () => void;
}

type TabType = 'prestige' | 'ascension' | 'transcendence' | 'eternity';

export function PrestigePanel({
  gameState,
  onPrestige,
  onAscend,
  onTranscend,
  onEternity,
  onBuySkillNode,
  onBuyAscensionNode,
  onBuyTranscendenceNode,
  onBuyEternityNode,
  onSave,
  onReset,
}: PrestigePanelProps) {
  const [activeTab, setActiveTab] = useState<TabType>('prestige');

  // Harder scaling: 10M per PP, 500 PP base for AP, 250 AP base for TP, 100 TP base for EP
  const prestigeGain = Math.floor(gameState.lifetimeClicks / 10_000_000);
  const ascensionGain = Math.floor(Math.sqrt(gameState.totalPrestigePoints / 500));
  const transcendenceGain = Math.floor(Math.sqrt(gameState.totalAscensionPoints / 250));
  const eternityGain = Math.floor(Math.sqrt(gameState.totalTranscendencePoints / 100));
  
  const clicksNeeded = 10_000_000 - (gameState.lifetimeClicks % 10_000_000);
  const ppNeeded = Math.pow(ascensionGain + 1, 2) * 500 - gameState.totalPrestigePoints;
  const apNeeded = Math.pow(transcendenceGain + 1, 2) * 250 - gameState.totalAscensionPoints;
  const tpNeeded = Math.pow(eternityGain + 1, 2) * 100 - gameState.totalTranscendencePoints;

  const tabs: { id: TabType; label: string; icon: string; color: string }[] = [
    { id: 'prestige', label: 'Prestige', icon: '⭐', color: 'neon-yellow' },
    { id: 'ascension', label: 'Ascension', icon: '🌟', color: 'neon-purple' },
    { id: 'transcendence', label: 'Transcend', icon: '🌀', color: 'primary' },
    { id: 'eternity', label: 'Eternity', icon: '🕳️', color: 'neon-pink' },
  ];

  return (
    <div className="bg-card border-t-2 border-primary neon-border p-4">
      <div className="container mx-auto space-y-4">
        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`
                px-4 py-2 text-xs font-retro rounded whitespace-nowrap transition-all
                ${activeTab === tab.id 
                  ? `bg-${tab.color} text-background` 
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }
              `}
              style={activeTab === tab.id ? {
                backgroundColor: tab.color === 'primary' ? 'hsl(var(--primary))' 
                  : tab.color === 'neon-yellow' ? 'hsl(var(--neon-yellow))'
                  : tab.color === 'neon-purple' ? 'hsl(var(--neon-purple))'
                  : 'hsl(var(--neon-pink))'
              } : {}}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Prestige Tab */}
        {activeTab === 'prestige' && (
          <div className="space-y-4">
            <div className="bg-background/50 rounded-lg p-4 border border-neon-yellow/30">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-neon-yellow font-bold text-sm font-retro">⭐ PRESTIGE</h3>
                <span className="text-neon-yellow text-xs font-retro">PP: {formatNumber(gameState.prestigePoints)}</span>
              </div>
              <p className="text-muted-foreground text-xs mb-2">
                Reset for <span className="text-neon-yellow font-bold">Prestige Points</span>. 1 PP per 10M clicks.
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                {prestigeGain > 0 
                  ? `Gain ${formatNumber(prestigeGain)} PP` 
                  : `Need ${formatNumber(clicksNeeded)} more clicks`}
              </p>
              <button 
                onClick={onPrestige}
                disabled={prestigeGain <= 0}
                className="w-full bg-neon-yellow text-background font-bold px-3 py-2 rounded text-sm hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Prestige {prestigeGain > 0 && `+${formatNumber(prestigeGain)} PP`}
              </button>
            </div>

            <div className="bg-background/30 rounded-lg p-3">
              <h4 className="text-neon-yellow font-bold mb-2 text-xs font-retro">⭐ Prestige Skills</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
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
          </div>
        )}

        {/* Ascension Tab */}
        {activeTab === 'ascension' && (
          <div className="space-y-4">
            <div className="bg-background/50 rounded-lg p-4 border border-neon-purple/30">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-neon-purple font-bold text-sm font-retro">🌟 ASCENSION</h3>
                <span className="text-neon-purple text-xs font-retro">AP: {formatNumber(gameState.ascensionPoints)}</span>
              </div>
              <p className="text-muted-foreground text-xs mb-2">
                Reset all (incl. PP & skills) for <span className="text-neon-purple font-bold">Ascension Points</span>.
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                {ascensionGain > 0 
                  ? `Gain ${formatNumber(ascensionGain)} AP` 
                  : `Need ${formatNumber(Math.max(0, ppNeeded))} more total PP`}
              </p>
              <button 
                onClick={onAscend}
                disabled={ascensionGain <= 0}
                className="w-full bg-neon-purple text-background font-bold px-3 py-2 rounded text-sm hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Ascend {ascensionGain > 0 && `+${formatNumber(ascensionGain)} AP`}
              </button>
            </div>

            <div className="bg-background/30 rounded-lg p-3">
              <h4 className="text-neon-purple font-bold mb-2 text-xs font-retro">🌟 Ascension Skills</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
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
          </div>
        )}

        {/* Transcendence Tab */}
        {activeTab === 'transcendence' && (
          <div className="space-y-4">
            <div className="bg-background/50 rounded-lg p-4 border border-primary/30">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-primary font-bold text-sm font-retro">🌀 TRANSCENDENCE</h3>
                <span className="text-primary text-xs font-retro">TP: {formatNumber(gameState.transcendencePoints)}</span>
              </div>
              <p className="text-muted-foreground text-xs mb-2">
                Reset everything for <span className="text-primary font-bold">Transcendence Points</span>.
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                {transcendenceGain > 0 
                  ? `Gain ${formatNumber(transcendenceGain)} TP` 
                  : `Need ${formatNumber(Math.max(0, apNeeded))} more total AP`}
              </p>
              <button 
                onClick={onTranscend}
                disabled={transcendenceGain <= 0}
                className="w-full bg-primary text-primary-foreground font-bold px-3 py-2 rounded text-sm hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Transcend {transcendenceGain > 0 && `+${formatNumber(transcendenceGain)} TP`}
              </button>
            </div>

            <div className="bg-background/30 rounded-lg p-3">
              <h4 className="text-primary font-bold mb-2 text-xs font-retro">🌀 Transcendence Skills</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
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
        )}

        {/* Eternity Tab */}
        {activeTab === 'eternity' && (
          <div className="space-y-4">
            <div className="bg-background/50 rounded-lg p-4 border border-secondary/30">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-secondary font-bold text-sm font-retro">🕳️ ETERNITY</h3>
                <span className="text-secondary text-xs font-retro">EP: {formatNumber(gameState.eternityPoints)}</span>
              </div>
              <p className="text-muted-foreground text-xs mb-2">
                Ultimate reset for <span className="text-secondary font-bold">Eternity Points</span>. The final frontier!
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                {eternityGain > 0 
                  ? `Gain ${formatNumber(eternityGain)} EP` 
                  : `Need ${formatNumber(Math.max(0, tpNeeded))} more total TP`}
              </p>
              <button 
                onClick={onEternity}
                disabled={eternityGain <= 0}
                className="w-full bg-secondary text-secondary-foreground font-bold px-3 py-2 rounded text-sm hover:scale-105 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Enter Eternity {eternityGain > 0 && `+${formatNumber(eternityGain)} EP`}
              </button>
            </div>

            <div className="bg-background/30 rounded-lg p-3">
              <h4 className="text-secondary font-bold mb-2 text-xs font-retro">🕳️ Eternity Skills</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                {gameState.eternityTree.map(node => (
                  <SkillNodeCard 
                    key={node.id} 
                    node={node} 
                    points={gameState.eternityPoints} 
                    onBuy={() => onBuyEternityNode(node.id)} 
                    color="pink"
                    currency="EP"
                  />
                ))}
              </div>
            </div>
          </div>
        )}

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
  node: SkillNode | AscensionNode | TranscendenceNode | EternityNode; 
  points: number; 
  onBuy: () => void;
  color: 'yellow' | 'purple' | 'cyan' | 'pink';
  currency: string;
}) {
  const canAfford = points >= node.cost && !node.owned;
  const colorClasses = {
    yellow: { bg: 'bg-neon-yellow', border: 'border-neon-yellow', text: 'text-neon-yellow' },
    purple: { bg: 'bg-neon-purple', border: 'border-neon-purple', text: 'text-neon-purple' },
    cyan: { bg: 'bg-primary', border: 'border-primary', text: 'text-primary' },
    pink: { bg: 'bg-secondary', border: 'border-secondary', text: 'text-secondary' },
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
