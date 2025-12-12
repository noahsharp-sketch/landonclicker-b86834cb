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

  return (
    <div className="bg-card border-t-2 border-primary neon-border p-4">
      <div className="container mx-auto">
        {/* Prestige & Ascension Stats */}
        <div className="flex gap-4 mb-4 text-sm">
          <span>Prestige: {gameState.prestigePoints}</span>
          <span>Ascension: {gameState.ascensionPoints}</span>
        </div>

        {/* Prestige Button */}
        <div className="flex gap-2 mb-4">
          <button
            onClick={handlePrestige}
            disabled={prestigeGain <= 0}
            className={`px-3 py-2 rounded text-xs font-bold transition-all
              ${prestigeGain > 0 
                ? 'bg-yellow-400 text-black hover:scale-105 glow' 
                : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
          >
            Prestige (+{prestigeGain})
          </button>

          <button
            onClick={handleAscend}
            disabled={ascensionGain <= 0}
            className={`px-3 py-2 rounded text-xs font-bold transition-all
              ${ascensionGain > 0 
                ? 'bg-purple-400 text-white hover:scale-105 glow' 
                : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
          >
            Ascend (+{ascensionGain})
          </button>
        </div>

        {/* Prestige Skill Tree */}
        <div className="mb-4">
          <h3 className="text-yellow-400 mb-2">Prestige Skills</h3>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {gameState.skillTree.map(node => (
              <button
                key={node.id}
                onClick={() => handleBuyNode(node.id)}
                disabled={node.owned || gameState.prestigePoints < node.cost}
                title={`${node.name}: ${node.description} (Cost: ${node.cost})`}
                className={`p-2 rounded-lg text-xs font-bold text-center transition-all
                  ${node.owned 
                    ? 'bg-gray-300 text-gray-700 cursor-not-allowed' 
                    : 'bg-yellow-300 text-black hover:scale-105 glow'}`}
              >
                {node.name} <br /> {node.owned ? 'Owned' : `Cost: ${node.cost}`}
              </button>
            ))}
          </div>
        </div>

        {/* Ascension Skill Tree */}
        <div>
          <h3 className="text-purple-400 mb-2">Ascension Skills</h3>
          <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
            {gameState.ascensionTree.map(node => (
              <button>
                key={node.id}
                onClick={() => handleBuyAscensionNode(node.id)}
                disabled={node.owned || gameState.ascensionPoints < node.cost}
                title={`${node.name}: ${node.description} (Cost: ${node.cost})`}
                className={`p-2 rounded-lg text-xs font-bold text-center transition-all
                  ${node.owned 
                    ? 'bg-gray-300 text-gray-700 cursor-not-allowed' 
                    : 'bg-purple-300 text-white hover:scale-105 glow'}`}
              >
                {node.name} <br /> {node.owned ? 'Owned' : `Cost: ${node.cost}`}
              </button
