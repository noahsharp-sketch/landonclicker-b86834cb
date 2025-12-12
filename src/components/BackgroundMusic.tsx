import { useEffect, useRef, useState } from "react";

export default function BackgroundMusic() {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [muted, setMuted] = useState(() => {
    return localStorage.getItem("bgm-muted") === "true";
  });

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = 0.4; // volume between 0 and 1
    audio.loop = true;

    if (!muted) {
      audio.play().catch(() => {
        // Some browsers require user interaction first — no error needed
      });
    } else {
      audio.pause();
    }
  }, [muted]);

  const toggleMute = () => {
    const newValue = !muted;
    setMuted(newValue);
    localStorage.setItem("bgm-muted", String(newValue));
  };

  return (
    <div className="absolute top-2 right-2 z-50">
      <audio ref={audioRef} src="/audio/theme.wav" />

      <button
        onClick={toggleMute}
        className="bg-card border border-border text-xs px-2 py-1 rounded hover:scale-105 transition-all"
      >
        {muted ? "Unmute Music" : "Mute Music"}
      </button>
    </div>
  );
}
