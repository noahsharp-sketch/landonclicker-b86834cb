import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Target, Check, Gift, ChevronRight } from 'lucide-react';
import { formatNumber } from '@/lib/formatNumber';
import type { Quest, Challenge, GameState } from '@/types/types';

interface QuestsPanelProps {
  gameState: GameState;
  onClaimQuestReward: (questId: string) => void;
  onClaimChallengeReward: (challengeId: string) => void;
}

export function QuestsPanel({ gameState, onClaimQuestReward, onClaimChallengeReward }: QuestsPanelProps) {
  const [activeTab, setActiveTab] = useState<'quests' | 'daily' | 'weekly'>('quests');
  
  const { quests, challenges } = gameState.questState;
  const dailyChallenges = challenges.filter(c => c.type === 'daily');
  const weeklyChallenges = challenges.filter(c => c.type === 'weekly');

  const availableQuestRewards = quests.filter(q => q.completed && !q.claimed).length;
  const availableChallengeRewards = challenges.filter(c => c.completed && !c.claimed).length;
  const totalRewards = availableQuestRewards + availableChallengeRewards;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button 
          className="relative flex items-center gap-1 px-2 py-1 rounded bg-card border border-neon-cyan/50 hover:border-neon-cyan text-neon-cyan text-[10px] md:text-xs transition-all hover:scale-105"
          title="Quests & Challenges"
        >
          <Target className="w-3 h-3 md:w-4 md:h-4" />
          <span>Quests</span>
          {totalRewards > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-neon-yellow text-background text-[8px] font-bold rounded-full flex items-center justify-center animate-pulse">
              {totalRewards}
            </span>
          )}
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-lg max-h-[85vh] bg-background border-primary neon-border">
        <DialogHeader>
          <DialogTitle className="text-primary font-retro text-lg flex items-center gap-2">
            <Target className="w-5 h-5" />
            Quests & Challenges
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {(['quests', 'daily', 'weekly'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-3 rounded text-xs font-bold transition-all ${
                activeTab === tab
                  ? 'bg-primary text-background'
                  : 'bg-card border border-border hover:border-primary text-foreground'
              }`}
            >
              {tab === 'quests' && '📜 Quests'}
              {tab === 'daily' && '🌞 Daily'}
              {tab === 'weekly' && '📅 Weekly'}
            </button>
          ))}
        </div>

        <ScrollArea className="h-[50vh]">
          {activeTab === 'quests' && (
            <div className="space-y-3">
              {quests.map(quest => (
                <QuestCard 
                  key={quest.id} 
                  quest={quest} 
                  onClaim={() => onClaimQuestReward(quest.id)} 
                />
              ))}
            </div>
          )}

          {activeTab === 'daily' && (
            <div className="space-y-3">
              <TimeRemaining expiresAt={dailyChallenges[0]?.expiresAt} label="Daily reset in" />
              {dailyChallenges.map(challenge => (
                <ChallengeCard 
                  key={challenge.id} 
                  challenge={challenge} 
                  onClaim={() => onClaimChallengeReward(challenge.id)} 
                />
              ))}
            </div>
          )}

          {activeTab === 'weekly' && (
            <div className="space-y-3">
              <TimeRemaining expiresAt={weeklyChallenges[0]?.expiresAt} label="Weekly reset in" />
              {weeklyChallenges.map(challenge => (
                <ChallengeCard 
                  key={challenge.id} 
                  challenge={challenge} 
                  onClaim={() => onClaimChallengeReward(challenge.id)} 
                />
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}

function QuestCard({ quest, onClaim }: { quest: Quest; onClaim: () => void }) {
  const currentStepIndex = quest.steps.findIndex(s => s.current < s.target);
  const currentStep = currentStepIndex >= 0 ? quest.steps[currentStepIndex] : quest.steps[0];
  const progress = quest.completed 
    ? 100 
    : currentStep 
      ? Math.min(100, (currentStep.current / currentStep.target) * 100) 
      : 0;

  return (
    <div className={`p-3 rounded-lg border transition-all ${
      quest.claimed 
        ? 'bg-muted/30 border-muted opacity-60' 
        : quest.completed 
          ? 'bg-neon-cyan/10 border-neon-cyan animate-pulse' 
          : 'bg-card border-border'
    }`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{quest.icon}</span>
          <div>
            <h4 className="font-bold text-sm text-foreground">{quest.name}</h4>
            <p className="text-xs text-muted-foreground">{quest.description}</p>
          </div>
        </div>
        {quest.claimed && <Check className="w-5 h-5 text-neon-cyan" />}
      </div>

      {/* Steps */}
      <div className="space-y-1 mb-2">
        {quest.steps.map((step, idx) => (
          <div 
            key={step.id} 
            className={`flex items-center gap-2 text-xs ${
              idx < currentStepIndex ? 'text-neon-cyan' : 
              idx === currentStepIndex ? 'text-foreground' : 'text-muted-foreground'
            }`}
          >
            {idx < currentStepIndex ? (
              <Check className="w-3 h-3" />
            ) : (
              <ChevronRight className="w-3 h-3" />
            )}
            <span>{step.description}</span>
            {idx === currentStepIndex && !quest.completed && (
              <span className="ml-auto text-neon-yellow">
                {formatNumber(step.current)}/{formatNumber(step.target)}
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Progress Bar */}
      {!quest.claimed && (
        <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-2">
          <div 
            className="h-full bg-neon-cyan transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Rewards */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <Gift className="w-3 h-3 text-neon-yellow" />
          <span className="text-muted-foreground">Rewards:</span>
          {quest.rewards.clicks && <span className="text-foreground">{formatNumber(quest.rewards.clicks)} clicks</span>}
          {quest.rewards.prestigePoints && <span className="text-neon-yellow">+{quest.rewards.prestigePoints} PP</span>}
          {quest.rewards.ascensionPoints && <span className="text-neon-purple">+{quest.rewards.ascensionPoints} AP</span>}
        </div>
        
        {quest.completed && !quest.claimed && (
          <button
            onClick={onClaim}
            className="px-3 py-1 bg-neon-cyan text-background text-xs font-bold rounded hover:scale-105 transition-transform"
          >
            Claim!
          </button>
        )}
      </div>
    </div>
  );
}

function ChallengeCard({ challenge, onClaim }: { challenge: Challenge; onClaim: () => void }) {
  const progress = Math.min(100, (challenge.current / challenge.target) * 100);

  return (
    <div className={`p-3 rounded-lg border transition-all ${
      challenge.claimed 
        ? 'bg-muted/30 border-muted opacity-60' 
        : challenge.completed 
          ? 'bg-neon-yellow/10 border-neon-yellow animate-pulse' 
          : 'bg-card border-border'
    }`}>
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">{challenge.icon}</span>
          <div>
            <h4 className="font-bold text-sm text-foreground">{challenge.name}</h4>
            <p className="text-xs text-muted-foreground">{challenge.description}</p>
          </div>
        </div>
        {challenge.claimed && <Check className="w-5 h-5 text-neon-yellow" />}
      </div>

      {/* Progress */}
      {!challenge.claimed && (
        <>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">Progress</span>
            <span className="text-neon-yellow">{formatNumber(challenge.current)}/{formatNumber(challenge.target)}</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-2">
            <div 
              className="h-full bg-neon-yellow transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </>
      )}

      {/* Rewards */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs">
          <Gift className="w-3 h-3 text-neon-yellow" />
          {challenge.rewards.clicks && <span className="text-foreground">{formatNumber(challenge.rewards.clicks)} clicks</span>}
          {challenge.rewards.prestigePoints && <span className="text-neon-yellow">+{challenge.rewards.prestigePoints} PP</span>}
        </div>
        
        {challenge.completed && !challenge.claimed && (
          <button
            onClick={onClaim}
            className="px-3 py-1 bg-neon-yellow text-background text-xs font-bold rounded hover:scale-105 transition-transform"
          >
            Claim!
          </button>
        )}
      </div>
    </div>
  );
}

function TimeRemaining({ expiresAt, label }: { expiresAt: number; label: string }) {
  const now = Date.now();
  const remaining = Math.max(0, expiresAt - now);
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));

  return (
    <div className="text-center text-xs text-muted-foreground mb-2">
      {label}: <span className="text-neon-cyan font-bold">{hours}h {minutes}m</span>
    </div>
  );
}
