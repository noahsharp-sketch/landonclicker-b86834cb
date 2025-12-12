import type { GameState, SkillNode, AscensionNode } from '@/hooks/useGameState';

interface PrestigePanelProps {
  gameState: GameState;
  calculatePrestigeGain: (state: GameState) => number;
  calculateAscensionGain: (state: GameState) => number;
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
  calculatePrestigeGain,
  calculateAscensionGain,
  onPrestige,
  onAscend,
  onBuySkillNode,
  onBuyAscensionNode,
  playPrestige,
  playAscension,
  playPurchase,
}: PrestigePanelProps) {
  const prestigeGain = calculatePrestigeGain(gameState);
  const ascensionGain = calculateAscensionGain(gameState);

  return (
    <div className="bg-card border-t-2 border-primary p-4 rounded-md">
      <div className="flex justify-between mb-4">
        <div>
          <span>Prestige: {gameState.prestigePoints}</span>
        </div>
        <div>
          <span>Ascension: {gameState.ascensionPoints}</span>
        </div>
      </div>

      <button
        onClick={() => { if (prestigeGain > 0) { onPrestige(); playPrestige(); } }}
        disabled={prestigeGain <= 0}
        className={`w-full p-2 mb-2 rounded-lg font-bold text-white transition-all ${prestigeGain > 0 ? 'bg-yellow-400 hover:scale-105' : 'bg-gray-400 cursor-not-allowed'}`}
      >
        Prestige (+{prestigeGain})
      </button>

      <button
        onClick={() => { if (ascensionGain > 0) { onAscend(); playAscension(); } }}
        disabled={ascensionGain <= 0}
        className={`w-full p-2 mb-4 rounded-lg font-bold text-white transition-all ${ascensionGain > 0 ? 'bg-purple-500 hover:scale-105' : 'bg-gray-400 cursor-not-allowed'}`}
      >
        Ascend (+{ascensionGain})
      </button>

      <h3 className="font-bold mb-2 text-yellow-400">Prestige Skills</h3>
      <div className="flex flex-wrap gap-2 mb-4">
        {gameState.skillTree.map(node => (
          <button
            key={node.id}
            disabled={node.owned || gameState.prestigePoints < node.cost}
            onClick={() => { onBuySkillNode(node.id); playPurchase(); }}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${node.owned ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-yellow-200 hover:scale-105'}`}
            title={`${node.name}: ${node.description} (Cost: ${node.cost})`}
          >
            {node.name} ({node.cost})
          </button>
        ))}
      </div>

      <h3 className="font-bold mb-2 text-purple-500">Ascension Skills</h3>
      <div className="flex flex-wrap gap-2">
        {gameState.ascensionTree.map(node => (
          <button
            key={node.id}
            disabled={node.owned || gameState.ascensionPoints < node.cost}
            onClick={() => { onBuyAscensionNode(node.id); playPurchase(); }}
            className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${node.owned ? 'bg-gray-400 text-gray-700 cursor-not-allowed' : 'bg-purple-300 hover:scale-105'}`}
            title={`${node.name}: ${node.description} (Cost: ${node.cost})`}
          >
            {node.name} ({node.cost})
          </button>
        ))}
      </div>
    </div>
  );
}
