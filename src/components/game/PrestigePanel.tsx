import type { GameState, SkillNode, AscensionNode } from '@/hooks/useGameState';

interface PrestigePanelProps {
  gameState: GameState;
  calculatePrestigeGain: (state: GameState) => number;
  calculateAscensionGain: (state: GameState) => number;
  onPrestige: () => void;
  onAscend: () => void;
  onBuySkillNode: (id: string) => void;
  onBuyAscensionNode: (id: string) => void;
  onSave: () => void;
  onReset: () => void;
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
  onSave,
  onReset,
  playPrestige,
  playAscension,
  playPurchase,
}: PrestigePanelProps) {
  const prestigeGain = calculatePrestigeGain(gameState);
  const ascensionGain = calculateAscensionGain(gameState);

  return (
    <div className="bg-card border-t-2 border-primary neon-border p-4">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <div>
          <span>Prestige: {gameState.prestigePoints}</span> | 
          <span> Ascension: {gameState.ascensionPoints}</span>
        </div>

        <div className="flex gap-2">
          <button onClick={onPrestige} disabled={prestigeGain <= 0}>
            Prestige (+{prestigeGain})
          </button>
          <button onClick={onAscend} disabled={ascensionGain <= 0}>
            Ascend (+{ascensionGain})
          </button>
          <button onClick={onSave}>Save</button>
          <button onClick={onReset}>Reset</button>
        </div>
      </div>

      {/* Skill Trees */}
      <div>
        <h3>Prestige Skills</h3>
        <div className="flex gap-2">
          {gameState.skillTree.map((node) => (
            <button key={node.id} onClick={() => onBuySkillNode(node.id)} disabled={node.owned || gameState.prestigePoints < node.cost}>
              {node.name} ({node.cost}pt)
            </button>
          ))}
        </div>
      </div>

      <div>
        <h3>Ascension Skills</h3>
        <div className="flex gap-2">
          {gameState.ascensionTree.map((node) => (
            <button key={node.id} onClick={() => onBuyAscensionNode(node.id)} disabled={node.owned || gameState.ascensionPoints < node.cost}>
              {node.name} ({node.cost}pt)
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
