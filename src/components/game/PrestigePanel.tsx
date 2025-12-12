import type { GameState, SkillNode, AscensionNode } from '@/hooks/useGameState';

interface PrestigePanelProps {
  gameState: GameState;
  calculatePrestigeGain: (state: GameState) => number;
  calculateAscensionGain: (state: GameState) => number;
  onPrestige: () => void;
  onAscend: () => void;
  onBuySkillNode: (id: string) => void;
  onBuyAscensionNode: (id: string) => void;
  onSetFormula: (index: number) => void;
  onSave: () => void;
  onReset: () => void;
  playPrestige: () => void;
  playAscension: () => void;
  playPurchase: () => void;
}

const formulaNames = ['Sqrt(Lifetime/1M)', 'Log10(Lifetime) - 5', 'CPS / 10', 'Total Upgrades'];

export function PrestigePanel({
  gameState,
  calculatePrestigeGain,
  calculateAscensionGain,
  onPrestige,
  onAscend,
  onBuySkillNode,
  onBuyAscensionNode,
  onSetFormula,
  onSave,
  onReset,
  playPrestige,
  playAscension,
  playPurchase,
}: PrestigePanelProps) {
  const prestigeGain = calculatePrestigeGain(gameState);
  const ascensionGain = calculateAscensionGain(gameState);

  const handlePrestige = () => { if (prestigeGain > 0) { onPrestige(); playPrestige(); } };
  const handleAscend = () => { if (ascensionGain > 0 && confirm('Ascension resets ALL progress!')) { onAscend(); playAscension(); } };
  const handleBuyNode = (id: string) => { onBuySkillNode(id); playPurchase(); };
  const handleBuyAscensionNode = (id: string) => { onBuyAscensionNode(id); playPurchase(); };
  const handleReset = () => { if (confirm('Reset ALL progress?')) { onReset(); } };

  const SkillNodeButton = ({ node }: { node: SkillNode }) => {
    const canAfford = gameState.prestigePoints >= node.cost && !node.owned;
    return (
      <button
        onClick={() => canAfford && handleBuyNode(node.id)}
        disabled={!canAfford}
        className={`w-14 h-14 rounded-lg flex flex-col items-center justify-center font-bold text-xs transition-all
          ${node.owned ? 'bg-gray-300 text-gray-700' : canAfford ? 'bg-yellow-400 hover:scale-110 glow' : 'bg-gray-400 cursor-not-allowed'}`}
        title={`${node.name}: ${node.description}`}
      >
        <span>{node.id.toUpperCase()}</span>
        {!node.owned && <span className="text-[10px]">{node.cost}</span>}
      </button>
    );
  };

  const AscensionNodeButton = ({ node }: { node: AscensionNode }) => {
    const canAfford = gameState.ascensionPoints >= node.cost && !node.owned;
    return (
      <button
        onClick={() => canAfford && handleBuyAscensionNode(node.id)}
        disabled={!canAfford}
        className={`w-14 h-14 rounded-lg flex flex-col items-center justify-center font-bold text-xs transition-all
          ${node.owned ? 'bg-gray-300 text-gray-700' : canAfford ? 'bg-purple-400 hover:scale-110 glow' : 'bg-gray-400 cursor-not-allowed'}`}
        title={`${node.name}: ${node.description}`}
      >
        <span>{node.id.replace('asc', '').toUpperCase()}</span>
        {!node.owned && <span className="text-[10px]">{node.cost}</span>}
      </button>
    );
  };

  return (
    <div className="bg-card border-t-2 border-primary neon-border p-4 flex flex-col gap-4">
      <div className="flex justify-between flex-wrap gap-3">
        <div>
          <span className="text-muted-foreground">Prestige:</span>
          <span className="text-neon-yellow font-bold ml-1">{gameState.prestigePoints}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Ascension:</span>
          <span className="text-neon-purple font-bold ml-1">{gameState.ascensionPoints}</span>
        </div>

        <select value={gameState.selectedFormula} onChange={e => onSetFormula(Number(e.target.value))} className="bg-muted border border-border rounded px-2 py-1 text-xs">
          {formulaNames.map((f, i) => <option key={i} value={i}>{f}</option>)}
        </select>

        <button onClick={handlePrestige} disabled={prestigeGain <= 0} className={`px-3 py-1 rounded font-bold text-xs ${prestigeGain>0?'bg-neon-yellow':'bg-muted'}`}>Prestige (+{prestigeGain})</button>
        <button onClick={handleAscend} disabled={ascensionGain <= 0} className={`px-3 py-1 rounded font-bold text-xs ${ascensionGain>0?'bg-neon-purple':'bg-muted'}`}>Ascend (+{ascensionGain})</button>
        <button onClick={onSave} className="px-3 py-1 rounded bg-primary text-primary-foreground font-bold text-xs">Save</button>
        <button onClick={handleReset} className="px-3 py-1 rounded bg-destructive text-destructive-foreground font-bold text-xs">Reset</button>
      </div>

      <div>
        <h3 className="text-yellow-400 font-bold text-sm mb-2">Prestige Skills</h3>
        <div className="flex flex-wrap gap-2">{gameState.skillTree.map(node => <SkillNodeButton key={node.id} node={node} />)}</div>
      </div>

      <div>
        <h3 className="text-purple-400 font-bold text-sm mb-2">Ascension Skills</h3>
        <div className="flex flex-wrap gap-2">{gameState.ascensionTree.map(node => <AscensionNodeButton key={node.id} node={node} />)}</div>
      </div>
    </div>
  );
}
