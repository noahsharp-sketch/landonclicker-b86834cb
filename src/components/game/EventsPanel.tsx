import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Sparkles, Check, Gift, Clock } from 'lucide-react';
import { formatNumber } from '@/lib/formatNumber';
import type { SpecialEvent, GameState } from '@/types/types';

interface EventsPanelProps {
  gameState: GameState;
  onClaimEventReward: (eventId: string) => void;
}

export function EventsPanel({ gameState, onClaimEventReward }: EventsPanelProps) {
  const [timeLeft, setTimeLeft] = useState('');
  
  const activeEvents = gameState.questState.events.filter(e => e.active && !e.claimed);
  const hasActiveEvent = activeEvents.length > 0;
  const currentEvent = activeEvents[0];

  // Update countdown timer
  useEffect(() => {
    if (!currentEvent) return;
    
    const updateTimer = () => {
      const now = Date.now();
      const remaining = Math.max(0, currentEvent.endsAt - now);
      const hours = Math.floor(remaining / (1000 * 60 * 60));
      const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
      setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);
    return () => clearInterval(interval);
  }, [currentEvent]);

  const getThemeColors = (theme: SpecialEvent['theme']) => {
    switch (theme) {
      case 'gold': return { border: 'border-neon-yellow', bg: 'bg-neon-yellow/10', text: 'text-neon-yellow', glow: 'shadow-neon-yellow/30' };
      case 'cosmic': return { border: 'border-neon-purple', bg: 'bg-neon-purple/10', text: 'text-neon-purple', glow: 'shadow-neon-purple/30' };
      case 'speed': return { border: 'border-neon-cyan', bg: 'bg-neon-cyan/10', text: 'text-neon-cyan', glow: 'shadow-neon-cyan/30' };
      case 'power': return { border: 'border-neon-pink', bg: 'bg-neon-pink/10', text: 'text-neon-pink', glow: 'shadow-neon-pink/30' };
      case 'lucky': return { border: 'border-green-400', bg: 'bg-green-400/10', text: 'text-green-400', glow: 'shadow-green-400/30' };
    }
  };

  if (!hasActiveEvent) {
    return (
      <button 
        className="flex items-center gap-1 px-2 py-1 rounded bg-card border border-muted/50 text-muted-foreground text-[10px] md:text-xs opacity-60 cursor-not-allowed"
        title="No active events"
        disabled
      >
        <Sparkles className="w-3 h-3 md:w-4 md:h-4" />
        <span className="hidden sm:inline">Events</span>
      </button>
    );
  }

  const theme = getThemeColors(currentEvent.theme);
  const allChallengesComplete = currentEvent.challenges.every(c => c.completed);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button 
          className={`relative flex items-center gap-1 px-2 py-1 rounded bg-card ${theme.border} ${theme.text} text-[10px] md:text-xs transition-all hover:scale-105 animate-pulse`}
          title="Active Event!"
        >
          <Sparkles className="w-3 h-3 md:w-4 md:h-4" />
          <span className="hidden sm:inline">Event!</span>
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-current rounded-full animate-ping" />
        </button>
      </DialogTrigger>
      <DialogContent className={`max-w-md bg-background ${theme.border} border-2 shadow-lg ${theme.glow}`}>
        <DialogHeader>
          <DialogTitle className={`font-retro text-lg flex items-center gap-2 ${theme.text}`}>
            <span className="text-2xl">{currentEvent.icon}</span>
            {currentEvent.name}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Timer */}
          <div className={`flex items-center justify-center gap-2 py-2 rounded-lg ${theme.bg}`}>
            <Clock className={`w-4 h-4 ${theme.text}`} />
            <span className={`font-bold ${theme.text}`}>{timeLeft}</span>
            <span className="text-muted-foreground text-sm">remaining</span>
          </div>

          {/* Description */}
          <p className="text-muted-foreground text-sm text-center">{currentEvent.description}</p>

          {/* Active Multipliers */}
          <div className={`p-3 rounded-lg ${theme.bg} border ${theme.border}`}>
            <h4 className={`font-bold text-xs mb-2 ${theme.text}`}>🎯 Active Bonuses</h4>
            <div className="flex flex-wrap gap-2">
              {currentEvent.multipliers.clicks && (
                <span className="px-2 py-1 bg-background rounded text-xs font-bold">
                  {currentEvent.multipliers.clicks}x Clicks
                </span>
              )}
              {currentEvent.multipliers.cps && (
                <span className="px-2 py-1 bg-background rounded text-xs font-bold">
                  {currentEvent.multipliers.cps}x CPS
                </span>
              )}
              {currentEvent.multipliers.prestigeGain && (
                <span className="px-2 py-1 bg-background rounded text-xs font-bold">
                  {currentEvent.multipliers.prestigeGain}x Prestige
                </span>
              )}
            </div>
          </div>

          {/* Challenges */}
          <div className="space-y-2">
            <h4 className={`font-bold text-xs ${theme.text}`}>📋 Event Challenges</h4>
            {currentEvent.challenges.map(challenge => (
              <div 
                key={challenge.id}
                className={`flex items-center justify-between p-2 rounded-lg border ${
                  challenge.completed ? `${theme.bg} ${theme.border}` : 'bg-card border-border'
                }`}
              >
                <div className="flex items-center gap-2">
                  {challenge.completed ? (
                    <Check className={`w-4 h-4 ${theme.text}`} />
                  ) : (
                    <div className="w-4 h-4 rounded-full border-2 border-muted" />
                  )}
                  <span className={`text-xs ${challenge.completed ? theme.text : 'text-foreground'}`}>
                    {challenge.description}
                  </span>
                </div>
                <span className={`text-xs ${challenge.completed ? theme.text : 'text-muted-foreground'}`}>
                  {formatNumber(challenge.current)}/{formatNumber(challenge.target)}
                </span>
              </div>
            ))}
          </div>

          {/* Rewards */}
          <div className={`p-3 rounded-lg border ${allChallengesComplete ? `${theme.bg} ${theme.border}` : 'bg-muted/30 border-muted'}`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gift className={`w-4 h-4 ${allChallengesComplete ? theme.text : 'text-muted-foreground'}`} />
                <span className="text-xs text-muted-foreground">Event Rewards:</span>
                <div className="flex gap-2 text-xs">
                  {currentEvent.rewards.clicks && (
                    <span className="font-bold">{formatNumber(currentEvent.rewards.clicks)} clicks</span>
                  )}
                  {currentEvent.rewards.prestigePoints && (
                    <span className="text-neon-yellow font-bold">+{currentEvent.rewards.prestigePoints} PP</span>
                  )}
                  {currentEvent.rewards.ascensionPoints && (
                    <span className="text-neon-purple font-bold">+{currentEvent.rewards.ascensionPoints} AP</span>
                  )}
                </div>
              </div>
            </div>
            
            {allChallengesComplete && !currentEvent.claimed && (
              <button
                onClick={() => onClaimEventReward(currentEvent.id)}
                className={`mt-2 w-full py-2 ${theme.text.replace('text-', 'bg-')} text-background font-bold rounded text-sm hover:scale-105 transition-transform`}
              >
                🎉 Claim Rewards!
              </button>
            )}
            
            {!allChallengesComplete && (
              <div className="mt-2 w-full h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className={`h-full ${theme.text.replace('text-', 'bg-')} transition-all duration-300`}
                  style={{ width: `${(currentEvent.challenges.filter(c => c.completed).length / currentEvent.challenges.length) * 100}%` }}
                />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
