import type { GameState, SkillNode, AscensionNode } from '@/hooks/useGameState';

interface PrestigePanelProps {
  gameState: GameState;
  onPrestige: () => void;
  onAscend: () => void;
  onBuySkillNode: (id: string) => void;
  onBuyAscensionNode: (id: string) => void;
}

export function PrestigePanel({
  gameState,
  onPrestige,
  onAscend,
  onBuySkillNode,
  onBuyAscensionNode,
}: PrestigePanelProps) {
  const prestigeGain = Math.floor(gameState.lifetimeClicks / 1_000_000);
  const ascensionGain = Math.floor(Math.sqrt(gameState.totalPrestigePoints / 100));

  return (
    <div className="bg-card border-t-2 border-primary neon-border p-4">
      {/* Prestige / Ascension Info */}
      <div className="flex flex-wrap items-center gap-3 mb-4 text-[10px] md:text-xs">
        <div>
          <span className="text-muted-foreground">Prestige: </span>
          <span className="text-neon-yellow font-bold">{gameState.prestigePoints}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Ascension: </span>
          <span className="text-neon-purple font-bold">{gameState.ascensionPoints}</span>
        </div>

        <button
          onClick={onPrestige}
          disabled={prestigeGain <= 0}
          className={`
            px-3 py-1 rounded text-[10px] md:text-xs font-bold transition-all
            ${prestigeGain > 0 ? 'bg-neon-yellow text-background hover:scale-105' : 'bg-muted text-muted-foreground cursor-not-allowed'}
          `}
        >
          Prestige (+{prestigeGain})
        </button>

        <button
          onClick={onAscend}
          disabled={ascensionGain <= 0}
          className={`
            px-3 py-1 rounded text-[10px] md:text-xs font-bold transition-all
            ${ascensionGain > 0 ? 'bg-neon-purple text-white hover:scale-105' : 'bg-muted text-muted-foreground cursor-not-allowed'}
          `}
        >
          Ascend (+{ascensionGain})
        </button>
      </div>

      {/* Prestige Skill Tree */}
      <div className="mb-4">
        <h3 className="text-neon-yellow text-[10px] md:text-xs mb-2">Prestige Skills</h3>
        <div className="flex flex-wrap gap-2 md:gap-4">
          {gameState.skillTree.map((node) => (
            <SkillNodeButton
              key={node.id}
              node={node}
              points={gameState.prestigePoints}
              onBuy={() => onBuySkillNode(node.id)}
            />
          ))}
        </div>
      </div>

      {/* Ascension Skill Tree */}
      <div>
        <h3 className="text-neon-purple text-[10px] md:text-xs mb-2">Ascension Skills</h3>
        <div className="flex flex-wrap gap-2 md:gap-4">
          {gameState.ascensionTree.map((node) => (
            <AscensionNodeButton
              key={node.id}
              node={node}
              points={gameState.ascensionPoints}
              onBuy={() => onBuyAscensionNode(node.id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function SkillNodeButton({ node, points, onBuy }: { node: SkillNode; points: number; onBuy: () => void }) {
  const canAfford = points >= node.cost && !node.owned;
  return (
    <button
      onClick={onBuy}
      disabled={!canAfford}
      title={`${node.name}: ${node.description} (Cost: ${node.cost})`}
      className={`
        w-12 h-12 md:w-14 md:h-14 rounded-full flex flex-col items-center justify-center text-[8px] md:text-[10px] font-bold transition-all
        ${node.owned
          ? 'bg-neon-green text-background neon-border'
          : canAfford
            ? 'bg-card border-2 border-neon-yellow text-neon-yellow hover:scale-110 cursor-pointer'
            : 'bg-muted border-2 border-muted-foreground text-muted-foreground cursor-not-allowed'}
      `}
    >
      <span>{node.id.toUpperCase()}</span>
      {!node.owned && <span className="text-[6px] md:text-[8px]">{node.cost}pt</span>}
    </button>
  );
}

function AscensionNodeButton({ node, points, onBuy }: { node: AscensionNode; points: number; onBuy: () => void }) {
  const canAfford = points >= node.cost && !node.owned;
  return (
    <button
      onClick={onBuy}
      disabled={!canAfford}
      title={`${node.name}: ${node.description} (Cost: ${node.cost})`}
      className={`
        w-12 h-12 md:w-14 md:h-14 rounded-full flex flex-col items-center justify-center text-[8px] md:text-[10px] font-bold transition-all
        ${node.owned
          ? 'bg-neon-purple text-white neon-border'
          : canAfford
            ? 'bg-card border-2 border-neon-purple text-neon-purple hover:scale-110 cursor-pointer'
            : 'bg-muted border-2 border-muted-foreground text-muted-foreground cursor-not-allowed'}
      `}
    >
      <span>{node.id.replace('asc', '').toUpperCase()}</span>
      {!node.owned && <span className="text-[6px] md:text-[8px]">{node.cost}pt</span>}
    </button>
  );
}
