import { useState } from 'react';
import { LandonClicker } from '@/components/game/LandonClicker';
import { StartScreen } from '@/components/game/StartScreen';
import BackgroundMusic from '@/components/BackgroundMusic';

const Index = () => {
  const [gameStarted, setGameStarted] = useState(false);

  return (
    <>
      {!gameStarted && (
        <StartScreen onComplete={() => setGameStarted(true)} />
      )}
      {gameStarted && (
        <>
          <LandonClicker />
          <BackgroundMusic />
        </>
      )}
    </>
  );
};

export default Index;
