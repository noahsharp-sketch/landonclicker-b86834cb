import { Volume2, VolumeX, Music } from 'lucide-react';

interface AudioControlsProps {
  volume: number;
  sfxEnabled: boolean;
  musicEnabled: boolean;
  onVolumeChange: (volume: number) => void;
  onSfxToggle: (enabled: boolean) => void;
  onMusicToggle: (enabled: boolean) => void;
}

export function AudioControls({
  volume,
  sfxEnabled,
  musicEnabled,
  onVolumeChange,
  onSfxToggle,
  onMusicToggle,
}: AudioControlsProps) {
  return (
    <div className="flex items-center gap-2 md:gap-3">
      {/* SFX Toggle */}
      <button
        onClick={() => onSfxToggle(!sfxEnabled)}
        className={`p-1.5 rounded transition-all ${
          sfxEnabled 
            ? 'text-primary hover:bg-primary/20' 
            : 'text-muted-foreground hover:bg-muted'
        }`}
        title={sfxEnabled ? 'Mute SFX' : 'Enable SFX'}
      >
        {sfxEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
      </button>

      {/* Music Toggle */}
      <button
        onClick={() => onMusicToggle(!musicEnabled)}
        className={`p-1.5 rounded transition-all ${
          musicEnabled 
            ? 'text-secondary hover:bg-secondary/20' 
            : 'text-muted-foreground hover:bg-muted'
        }`}
        title={musicEnabled ? 'Stop Music' : 'Play Music'}
      >
        <Music className="w-4 h-4" />
      </button>

      {/* Volume Slider */}
      <input
        type="range"
        min="0"
        max="1"
        step="0.1"
        value={volume}
        onChange={(e) => onVolumeChange(Number(e.target.value))}
        className="w-16 md:w-20 h-1 bg-muted rounded-lg appearance-none cursor-pointer accent-primary"
        title={`Volume: ${Math.round(volume * 100)}%`}
      />
    </div>
  );
}
