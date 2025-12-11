import { useState, useCallback, useEffect } from 'react';
import landonImage from '@/assets/landon.jpeg';

interface FloatingNumber {
  id: number;
  x: number;
  y: number;
  value: number;
}

interface ClickAreaProps {
  clickPower: number;
  onClickAction: () => void;
  playClick: () => void;
}

export function ClickArea({ clickPower, onClickAction, playClick }: ClickAreaProps) {
  const [isClicking, setIsClicking] = useState(false);
  const [floatingNumbers, setFloatingNumbers] = useState<FloatingNumber[]>([]);
  const [nextId, setNextId] = useState(0);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    onClickAction();
    playClick();
    setIsClicking(true);

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    setFloatingNumbers(prev => [...prev, { id: nextId, x, y, value: clickPower }]);
    setNextId(prev => prev + 1);

    setTimeout(() => setIsClicking(false), 150);
  }, [onClickAction, playClick, clickPower, nextId]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !e.repeat) {
        e.preventDefault();
        onClickAction();
        playClick();
        setIsClicking(true);
        setFloatingNumbers(prev => [...prev, { 
          id: nextId, 
          x: 100 + Math.random() * 50, 
          y: 100 + Math.random() * 50, 
          value: clickPower 
        }]);
        setNextId(prev => prev + 1);
        setTimeout(() => setIsClicking(false), 150);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClickAction, playClick, clickPower, nextId]);

  // Clean up old floating numbers
  useEffect(() => {
    if (floatingNumbers.length > 0) {
      const timer = setTimeout(() => {
        setFloatingNumbers(prev => prev.slice(1));
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [floatingNumbers]);

  return (
    <div className="flex flex-col items-center justify-center p-4 md:p-8">
      <button
        onClick={handleClick}
        className={`relative w-48 h-48 md:w-64 md:h-64 rounded-full overflow-hidden border-4 border-primary neon-border 
          transition-transform cursor-pointer select-none pulse-glow
          ${isClicking ? 'click-bounce' : 'hover:scale-105'}`}
        aria-label="Click Landon"
      >
        <img
          src={landonImage}
          alt="Landon"
          className="w-full h-full object-cover"
          draggable={false}
        />
        
        {floatingNumbers.map(num => (
          <span
            key={num.id}
            className="absolute text-primary neon-text text-lg md:text-2xl font-bold pointer-events-none float-up"
            style={{ left: num.x, top: num.y }}
          >
            +{num.value}
          </span>
        ))}
      </button>
      
      <p className="mt-4 text-[10px] md:text-xs text-muted-foreground text-center">
        Click or press SPACE
      </p>
    </div>
  );
}
