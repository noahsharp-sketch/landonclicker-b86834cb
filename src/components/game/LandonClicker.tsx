import { useGameState } from '@/hooks/useGameState';
import { useSound } from '@/hooks/useSound';
import { StatsBar } from './StatsBar';
import { ClickArea } from './ClickArea';
import { UpgradesPanel } from './UpgradesPanel';
import { PrestigePanel } from './PrestigePanel';
import { formatNumber } from '@/lib/formatNumber';

export function LandonClicker() {
  const {
    gameState,
    handleClick,
    buyUpgrade,
    buyUpgradeBulk,
    buySkillNode,
    buyAscensionNode,
    buyTranscendenceNode,
    prestige,
    ascend,
    transcend,
    saveGame,
    resetGame,
    offlineEarnings,
    claimQuestReward,
    claimChallengeReward,
    addLeaderboardScore,
    claimEventReward,
  } = useGameState();

  const { 
    playClick, 
    playPurchase, 
    playPrestige, 
    playAscension,
    playAchievement,
    settings,
    setVolume,
    setSfxEnabled,
    setMusicEnabled,
  } = useSound();

  // Check for active event multipliers
  const activeEvent = gameState.questState?.events?.find(e => e.active && !e.claimed);

  return (
    <div className="min-h-screen flex flex-col bg-background crt-overlay">
      {/* Offline Earnings Notification */}
      {offlineEarnings && offlineEarnings > 0 && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-scale-in">
          <div className="bg-card border-2 border-neon-cyan neon-border px-4 py-3 rounded-lg">
            <p className="text-neon-cyan font-bold text-sm">Welcome back!</p>
            <p className="text-foreground text-xs">You earned {formatNumber(offlineEarnings)} clicks while away!</p>
          </div>
        </div>
      )}

      {/* Active Event Indicator */}
      {activeEvent && (
        <div className="bg-gradient-to-r from-neon-yellow/20 via-neon-purple/20 to-neon-cyan/20 border-b border-neon-yellow/50 py-1 text-center">
          <span className="text-xs font-bold animate-pulse">
            {activeEvent.icon} {activeEvent.name} Active! 
            {activeEvent.multipliers.clicks && ` ${activeEvent.multipliers.clicks}x Clicks`}
            {activeEvent.multipliers.cps && ` ${activeEvent.multipliers.cps}x CPS`}
            {activeEvent.multipliers.prestigeGain && ` ${activeEvent.multipliers.prestigeGain}x Prestige`}
          </span>
        </div>
      )}

      <StatsBar
        clicks={gameState.clicks}
        cps={gameState.cps}
        lifetimeClicks={gameState.lifetimeClicks}
        clickPower={gameState.clickPower}
        achievements={gameState.achievements}
        stats={gameState.stats}
        gameState={gameState}
        audioSettings={settings}
        onVolumeChange={setVolume}
        onSfxToggle={setSfxEnabled}
        onMusicToggle={setMusicEnabled}
        playAchievement={playAchievement}
        onClaimQuestReward={claimQuestReward}
        onClaimChallengeReward={claimChallengeReward}
        onAddLeaderboardScore={addLeaderboardScore}
        onClaimEventReward={claimEventReward}
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
            gameState={gameState}
            onBuyUpgrade={buyUpgrade}
            onBuyUpgradeBulk={buyUpgradeBulk}
            playPurchase={playPurchase}
          />
        </aside>
      </main>

      <PrestigePanel
        gameState={gameState}
        onPrestige={() => { prestige(); playPrestige(); }}
        onAscend={() => { ascend(); playAscension(); }}
        onTranscend={() => { transcend(); playAscension(); }}
        onBuySkillNode={(id) => { buySkillNode(id); playPurchase(); }}
        onBuyAscensionNode={(id) => { buyAscensionNode(id); playPurchase(); }}
        onBuyTranscendenceNode={(id) => { buyTranscendenceNode(id); playPurchase(); }}
        onSave={saveGame}
        onReset={resetGame}
      />
    </div>
  );
}
