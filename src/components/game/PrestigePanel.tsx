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

  const handleBuyAscNode = (id: string) => {
    onBuyAscensionNode(id);
    playPurchase();
  };

  return (
    <div className="bg-card border-t-2 border-primary neon-border p-4">
      <h3 className="text-neon-yellow">Prestige: {gameState.prestigePoints} (+{prestigeGain})</h3>
      <h3 className="text-neon-purple">Ascension: {gameState.ascensionPoints} (+{ascensionGain})</h3>

      <button onClick={handlePrestige} disabled={prestigeGain <= 0}>Prestige</button>
      <button onClick={handleAscend} disabled={ascensionGain <= 0}>Ascend</button>

      <div className="skill-tree">
        {gameState.skillTree.map(node => (
          <button key={node.id} onClick={() => handleBuyNode(node.id)}>
            {node.name} ({node.description}) - Cost: {node.cost}pt
          </button>
        ))}
      </div>

      <div className="ascension-tree">
        {gameState.ascensionTree.map(node => (
          <button key={node.id} onClick={() => handleBuyAscNode(node.id)}>
            {node.name} ({node.description}) - Cost: {node.cost}pt
          </button>
        ))}
      </div>
    </div>
  );
}
