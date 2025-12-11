import { useGameState } from '@/hooks/useGameState';
import { useSound } from '@/hooks/useSound';
import { StatsBar } from './StatsBar';
import { ClickArea } from './ClickArea';
import { UpgradesPanel } from './UpgradesPanel';
import { PrestigePanel } from './PrestigePanel';

export function LandonClicker() {
  const {
    gameState,
    handleClick,
    buyUpgrade,
    buySkillNode,
    prestige,
    setFormula,
    saveGame,
    resetGame,
    getUpgradeCost,
    calculatePrestigeGain,
  } = useGameState();

  const { playClick, playPurchase, playPrestige } = useSound();

  return (
    <div className="min-h-screen flex flex-col bg-background crt-overlay">
      <StatsBar
        clicks={gameState.clicks}
        cps={gameState.cps}
        lifetimeClicks={gameState.lifetimeClicks}
        clickPower={gameState.clickPower}
      />

      <main className="flex-1 flex flex-col md:flex-row">
        {/* Click area */}
        <div className="flex-1 flex items-center justify-center bg-gradient-to-b from-background to-card">
          <ClickArea
            clickPower={gameState.clickPower}
            onClickAction={handleClick}
            playClick={playClick}
          />
        </div>

        {/* Upgrades sidebar */}
        <aside className="w-full md:w-80 lg:w-96 bg-card border-l-0 md:border-l-2 border-t-2 md:border-t-0 border-primary neon-border">
          <UpgradesPanel
            upgrades={gameState.upgrades}
            clicks={gameState.clicks}
            gameState={gameState}
            getUpgradeCost={getUpgradeCost}
            onBuyUpgrade={buyUpgrade}
            playPurchase={playPurchase}
          />
        </aside>
      </main>

      <PrestigePanel
        gameState={gameState}
        calculatePrestigeGain={calculatePrestigeGain}
        onPrestige={prestige}
        onBuySkillNode={buySkillNode}
        onSetFormula={setFormula}
        onSave={saveGame}
        onReset={resetGame}
        playPrestige={playPrestige}
        playPurchase={playPurchase}
      />
    </div>
  );
}
