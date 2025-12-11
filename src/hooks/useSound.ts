import { useCallback, useRef, useState, useEffect } from 'react';

const AUDIO_STORAGE_KEY = 'landon-clicker-audio';

interface AudioSettings {
  volume: number;
  sfxEnabled: boolean;
  musicEnabled: boolean;
}

export function useSound() {
  const audioContextRef = useRef<AudioContext | null>(null);
  const musicOscillatorRef = useRef<OscillatorNode | null>(null);
  const musicGainRef = useRef<GainNode | null>(null);
  const masterGainRef = useRef<GainNode | null>(null);

  const [settings, setSettings] = useState<AudioSettings>(() => {
    const saved = localStorage.getItem(AUDIO_STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { volume: 0.5, sfxEnabled: true, musicEnabled: false };
      }
    }
    return { volume: 0.5, sfxEnabled: true, musicEnabled: false };
  });

  // Save settings when they change
  useEffect(() => {
    localStorage.setItem(AUDIO_STORAGE_KEY, JSON.stringify(settings));
  }, [settings]);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      masterGainRef.current = audioContextRef.current.createGain();
      masterGainRef.current.connect(audioContextRef.current.destination);
      masterGainRef.current.gain.value = settings.volume;
    }
    return audioContextRef.current;
  }, []);

  const setVolume = useCallback((volume: number) => {
    setSettings(prev => ({ ...prev, volume }));
    if (masterGainRef.current) {
      masterGainRef.current.gain.value = volume;
    }
    if (musicGainRef.current) {
      musicGainRef.current.gain.value = volume * 0.15;
    }
  }, []);

  const setSfxEnabled = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, sfxEnabled: enabled }));
  }, []);

  const setMusicEnabled = useCallback((enabled: boolean) => {
    setSettings(prev => ({ ...prev, musicEnabled: enabled }));
  }, []);

  // Background music using oscillators
  const startMusic = useCallback(() => {
    try {
      const ctx = getAudioContext();
      if (musicOscillatorRef.current) return;

      musicGainRef.current = ctx.createGain();
      musicGainRef.current.connect(masterGainRef.current!);
      musicGainRef.current.gain.value = settings.volume * 0.15;

      // Simple arpeggio-based ambient music
      const notes = [130.81, 164.81, 196.00, 261.63, 196.00, 164.81]; // C3, E3, G3, C4, G3, E3
      let noteIndex = 0;

      const playNote = () => {
        if (!settings.musicEnabled || !musicGainRef.current) return;

        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        
        osc.connect(noteGain);
        noteGain.connect(musicGainRef.current);

        osc.type = 'sine';
        osc.frequency.value = notes[noteIndex];
        
        noteGain.gain.setValueAtTime(0.3, ctx.currentTime);
        noteGain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);

        noteIndex = (noteIndex + 1) % notes.length;
      };

      const musicInterval = setInterval(playNote, 500);
      (musicOscillatorRef as any).intervalId = musicInterval;
      musicOscillatorRef.current = {} as OscillatorNode; // Marker that music is playing
    } catch (e) {
      // Audio not supported
    }
  }, [getAudioContext, settings.volume, settings.musicEnabled]);

  const stopMusic = useCallback(() => {
    if ((musicOscillatorRef as any).intervalId) {
      clearInterval((musicOscillatorRef as any).intervalId);
    }
    musicOscillatorRef.current = null;
    if (musicGainRef.current) {
      musicGainRef.current.disconnect();
      musicGainRef.current = null;
    }
  }, []);

  // Toggle music
  useEffect(() => {
    if (settings.musicEnabled) {
      startMusic();
    } else {
      stopMusic();
    }
    return () => stopMusic();
  }, [settings.musicEnabled, startMusic, stopMusic]);

  const playClick = useCallback(() => {
    if (!settings.sfxEnabled) return;
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(masterGainRef.current!);

      oscillator.type = 'square';
      oscillator.frequency.setValueAtTime(800 + Math.random() * 200, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(400, ctx.currentTime + 0.05);

      gainNode.gain.setValueAtTime(0.1 * settings.volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.05);
    } catch (e) {
      // Audio not supported
    }
  }, [getAudioContext, settings.sfxEnabled, settings.volume]);

  const playPurchase = useCallback(() => {
    if (!settings.sfxEnabled) return;
    try {
      const ctx = getAudioContext();
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(masterGainRef.current!);

      oscillator.type = 'triangle';
      oscillator.frequency.setValueAtTime(300 + Math.random() * 200, ctx.currentTime);
      oscillator.frequency.exponentialRampToValueAtTime(600 + Math.random() * 200, ctx.currentTime + 0.1);

      gainNode.gain.setValueAtTime(0.15 * settings.volume, ctx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

      oscillator.start(ctx.currentTime);
      oscillator.stop(ctx.currentTime + 0.15);
    } catch (e) {
      // Audio not supported
    }
  }, [getAudioContext, settings.sfxEnabled, settings.volume]);

  const playPrestige = useCallback(() => {
    if (!settings.sfxEnabled) return;
    try {
      const ctx = getAudioContext();
      
      [0, 0.1, 0.2, 0.3].forEach((delay, i) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(masterGainRef.current!);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(400 + i * 100, ctx.currentTime + delay);

        gainNode.gain.setValueAtTime(0.1 * settings.volume, ctx.currentTime + delay);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.2);

        oscillator.start(ctx.currentTime + delay);
        oscillator.stop(ctx.currentTime + delay + 0.2);
      });
    } catch (e) {
      // Audio not supported
    }
  }, [getAudioContext, settings.sfxEnabled, settings.volume]);

  const playAscension = useCallback(() => {
    if (!settings.sfxEnabled) return;
    try {
      const ctx = getAudioContext();
      
      // More dramatic sound for ascension
      [0, 0.15, 0.3, 0.45, 0.6].forEach((delay, i) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(masterGainRef.current!);

        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(300 + i * 150, ctx.currentTime + delay);

        gainNode.gain.setValueAtTime(0.15 * settings.volume, ctx.currentTime + delay);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + delay + 0.3);

        oscillator.start(ctx.currentTime + delay);
        oscillator.stop(ctx.currentTime + delay + 0.3);
      });
    } catch (e) {
      // Audio not supported
    }
  }, [getAudioContext, settings.sfxEnabled, settings.volume]);

  const playAchievement = useCallback(() => {
    if (!settings.sfxEnabled) return;
    try {
      const ctx = getAudioContext();
      
      // Celebratory fanfare
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, i) => {
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(masterGainRef.current!);

        oscillator.type = 'square';
        oscillator.frequency.value = freq;

        gainNode.gain.setValueAtTime(0.12 * settings.volume, ctx.currentTime + i * 0.08);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + i * 0.08 + 0.2);

        oscillator.start(ctx.currentTime + i * 0.08);
        oscillator.stop(ctx.currentTime + i * 0.08 + 0.2);
      });
    } catch (e) {
      // Audio not supported
    }
  }, [getAudioContext, settings.sfxEnabled, settings.volume]);

  return { 
    playClick, 
    playPurchase, 
    playPrestige, 
    playAscension,
    playAchievement,
    settings,
    setVolume,
    setSfxEnabled,
    setMusicEnabled,
  };
}
