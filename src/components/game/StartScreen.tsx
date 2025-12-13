import { useState, useEffect } from 'react';

interface StartScreenProps {
  onComplete: () => void;
}

type AnimationPhase = 'idle' | 'fadeToBlack' | 'showIntroducing' | 'fadeOutIntroducing' | 'showMadeBy' | 'fadeOutMadeBy' | 'blackPause' | 'showTitle' | 'complete';

export function StartScreen({ onComplete }: StartScreenProps) {
  const [phase, setPhase] = useState<AnimationPhase>('idle');
  const [started, setStarted] = useState(false);

  useEffect(() => {
    if (!started) return;

    const timeline = [
      { phase: 'fadeToBlack' as const, delay: 0 },
      { phase: 'showIntroducing' as const, delay: 500 },
      { phase: 'fadeOutIntroducing' as const, delay: 1500 },
      { phase: 'showMadeBy' as const, delay: 2000 },
      { phase: 'fadeOutMadeBy' as const, delay: 3200 },
      { phase: 'blackPause' as const, delay: 3700 },
      { phase: 'showTitle' as const, delay: 4000 },
      { phase: 'complete' as const, delay: 5000 },
    ];

    const timeouts = timeline.map(({ phase, delay }) => 
      setTimeout(() => {
        if (phase === 'complete') {
          onComplete();
        } else {
          setPhase(phase);
        }
      }, delay)
    );

    return () => timeouts.forEach(clearTimeout);
  }, [started, onComplete]);

  const handleStart = () => {
    setStarted(true);
  };

  if (phase === 'complete') return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-background">
      {/* Idle - Start Button */}
      {phase === 'idle' && !started && (
        <div className="text-center animate-fade-in">
          <h1 className="text-4xl md:text-6xl font-retro text-primary neon-text mb-8">
            LANDON CLICKER
          </h1>
          <button
            onClick={handleStart}
            className="px-8 py-4 text-xl font-retro bg-primary text-primary-foreground rounded-lg hover:scale-110 transition-transform neon-border animate-pulse"
          >
            START
          </button>
        </div>
      )}

      {/* Fade to Black */}
      {phase === 'fadeToBlack' && (
        <div className="absolute inset-0 bg-black animate-fade-in" />
      )}

      {/* Introducing */}
      {phase === 'showIntroducing' && (
        <div className="text-center animate-fade-in">
          <span className="text-2xl md:text-4xl font-retro text-muted-foreground italic">
            Introducing...
          </span>
        </div>
      )}

      {/* Fade out Introducing */}
      {phase === 'fadeOutIntroducing' && (
        <div className="text-center animate-fade-out">
          <span className="text-2xl md:text-4xl font-retro text-muted-foreground italic">
            Introducing...
          </span>
        </div>
      )}

      {/* Made by DMT PM */}
      {phase === 'showMadeBy' && (
        <div className="text-center animate-fade-in">
          <span className="text-xl md:text-3xl font-retro text-secondary neon-text-pink">
            Made by DMT PM
          </span>
        </div>
      )}

      {/* Fade out Made by */}
      {phase === 'fadeOutMadeBy' && (
        <div className="text-center animate-fade-out">
          <span className="text-xl md:text-3xl font-retro text-secondary neon-text-pink">
            Made by DMT PM
          </span>
        </div>
      )}

      {/* Black Pause */}
      {phase === 'blackPause' && (
        <div className="absolute inset-0 bg-black" />
      )}

      {/* Show Title - Landon Clicker */}
      {phase === 'showTitle' && (
        <div className="text-center animate-scale-in">
          <h1 className="text-4xl md:text-7xl font-retro text-primary neon-text tracking-wider">
            LANDON
          </h1>
          <h1 className="text-3xl md:text-5xl font-retro text-secondary neon-text-pink mt-2">
            CLICKER
          </h1>
        </div>
      )}
    </div>
  );
}
