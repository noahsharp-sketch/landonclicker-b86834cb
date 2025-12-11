import type { GameState, SkillNode, AscensionNode } from '@/hooks/useGameState';

interface PrestigePanelProps {
  gameState: GameState;
  onPrestige: () => void;
  onAscend: () => void;
  onBuySkillNode: (id: string) => void;
  onBuyAscensionNode: (id: string) => void;
  playPrestige: () => void;
  playAscension: () => void;
  playPurchase: () => void;
}

export function PrestigePanel({
  gameState,
  onPrestige,
  onAscend,
  onBuySkillNode,
  onBuyAscensionNode,
  playPrestige,
  playAscension,
  playPurchase,
}: PrestigePanelProps) {
  const prestigeGain = Math.floor(gameState.lifetimeClicks / 1_000_000);
  const ascensionGain = Math.floor(Math.sqrt(gameState.totalPrestigePoints / 100));

  return (
    <div className="bg-card border-t-2 border-primary neon-border p-4 rounded-lg">
      <div className="container mx-auto space-y-4">
        <div className="flex gap-4">
          <button onClick={() => { if(prestigeGain>0){onPrestige();playPrestige();} }} className="bg-yellow-400 text-black font-bold px-4 py-2 rounded hover:scale-105 disabled:opacity-60" disabled={prestigeGain<=0}>Prestige +{prestigeGain}</button>
          <button onClick={() => { if(ascensionGain>0){onAscend();playAscension();} }} className="bg-purple-500 text-white font-bold px-4 py-2 rounded hover:scale-105 disabled:opacity-60" disabled={ascensionGain<=0}>Ascend +{ascensionGain}</button>
        </div>

        {/* Prestige Skills */}
        <div>
          <h3 className="text-yellow-400 font-bold mb-2">Prestige Skills</h3>
          <div className="flex flex-col space-y-3">
            {gameState.skillTree.map(node => (
              <SkillNodeButton key={node.id} node={node} points={gameState.prestigePoints} onBuy={() => { onBuySkillNode(node.id); playPurchase(); }} />
            ))}
          </div>
        </div>

        {/* Ascension Skills */}
        <div>
          <h3 className="text-purple-400 font-bold mb-2">Ascension Skills</h3>
          <div className="flex flex-col space-y-3">
            {gameState.ascensionTree.map(node => (
              <AscensionNodeButton key={node.id} node={node} points={gameState.ascensionPoints} onBuy={() => { onBuyAscensionNode(node.id); playPurchase(); }} />
            ))}
          </div>
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
      className={`
        flex justify-between items-center p-3 rounded-lg font-bold transition-all
        ${node.owned ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-yellow-300 hover:scale-105'}
      `}
      title={`${node.name}: ${node.description} (Cost: ${node.cost})`}
    >
      <span>{node.name}</span>
      <span>{!node.owned && node.cost}</span>
    </button>
  );
}

function AscensionNodeButton({ node, points, onBuy }: { node: AscensionNode; points: number; onBuy: () => void }) {
  const canAfford = points >= node.cost && !node.owned;
  return (
    <button
      onClick={onBuy}
      disabled={!canAfford}
      className={`
        flex justify-between items-center p-3 rounded-lg font-bold transition-all
        ${node.owned ? 'bg-gray-400 text-white cursor-not-allowed' : 'bg-purple-400 hover:scale-105'}
      `}
      title={`${node.name}: ${node.description} (Cost: ${node.cost})`}
    >
      <span>{node.name}</span>
      <span>{!node.owned && node.cost}</span>
    </button>
  );
}
