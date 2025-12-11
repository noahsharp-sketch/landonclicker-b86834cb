import { useState, useEffect, useRef } from 'react';
import { Trophy, X } from 'lucide-react';
import type { Achievement } from '@/hooks/useGameState';

interface AchievementsPanelProps {
  achievements: Achievement[];
  playAchievement: () => void;
}

export function AchievementsPanel({ achievements, playAchievement }: AchievementsPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [newUnlock, setNewUnlock] = useState<Achievement | null>(null);
  const prevUnlockedRef = useRef<Set<string>>(new Set());

  const unlockedCount = achievements.filter(a => a.unlocked).length;
  const totalCount = achievements.length;

  // Detect new unlocks
  useEffect(() => {
    const currentUnlocked = new Set(achievements.filter(a => a.unlocked).map(a => a.id));
    
    achievements.forEach(a => {
      if (a.unlocked && !prevUnlockedRef.current.has(a.id)) {
        setNewUnlock(a);
        playAchievement();
        setTimeout(() => setNewUnlock(null), 3000);
      }
    });

    prevUnlockedRef.current = currentUnlocked;
  }, [achievements, playAchievement]);

  return (
    <>
      {/* Achievement Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-1 px-2 py-1 rounded bg-card border border-neon-yellow/50 hover:border-neon-yellow text-neon-yellow text-[10px] md:text-xs transition-all hover:scale-105"
        title="View Achievements"
      >
        <Trophy className="w-3 h-3 md:w-4 md:h-4" />
        <span>{unlockedCount}/{totalCount}</span>
      </button>

      {/* New Unlock Toast */}
      {newUnlock && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-scale-in">
          <div className="bg-card border-2 border-neon-yellow neon-border px-4 py-3 rounded-lg flex items-center gap-3">
            <span className="text-2xl">{newUnlock.icon}</span>
            <div>
              <p className="text-neon-yellow font-bold text-sm">Achievement Unlocked!</p>
              <p className="text-foreground text-xs">{newUnlock.name}</p>
            </div>
          </div>
        </div>
      )}

      {/* Achievements Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="bg-card border-2 border-primary neon-border rounded-lg w-full max-w-lg max-h-[80vh] m-4 overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h2 className="text-primary neon-text font-bold flex items-center gap-2">
                <Trophy className="w-5 h-5" />
                Achievements ({unlockedCount}/{totalCount})
              </h2>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-muted rounded transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 overflow-y-auto max-h-[60vh] grid grid-cols-1 sm:grid-cols-2 gap-2">
              {achievements.map(achievement => (
                <div
                  key={achievement.id}
                  className={`p-3 rounded border transition-all ${
                    achievement.unlocked
                      ? 'bg-neon-yellow/10 border-neon-yellow/50'
                      : 'bg-muted/30 border-muted opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-xl ${achievement.unlocked ? '' : 'grayscale'}`}>
                      {achievement.icon}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-xs truncate ${
                        achievement.unlocked ? 'text-neon-yellow' : 'text-muted-foreground'
                      }`}>
                        {achievement.name}
                      </p>
                      <p className="text-[10px] text-muted-foreground truncate">
                        {achievement.description}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
