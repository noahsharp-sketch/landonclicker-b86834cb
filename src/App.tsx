import { useEffect, useRef } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const audio = new Audio("/audio/theme.wav");
    audioRef.current = audio;
    audio.volume = 0;
    audio.play();

    let fadeDuration = 2000; // fade in/out duration in ms
    let loopDelay = 2000;    // delay between loops in ms

    const fadeIn = () => {
      audio.currentTime = 0;
      audio.play();
      const step = 50;
      let vol = 0;
      const fadeInterval = setInterval(() => {
        vol += step / fadeDuration;
        if (vol >= 1) {
          audio.volume = 1;
          clearInterval(fadeInterval);
          // schedule fade out near the end
          setTimeout(fadeOut, audio.duration * 1000 - fadeDuration);
        } else {
          audio.volume = vol;
        }
      }, step);
    };

    const fadeOut = () => {
      const step = 50;
      let vol = audio.volume;
      const fadeInterval = setInterval(() => {
        vol -= step / fadeDuration;
        if (vol <= 0) {
          audio.volume = 0;
          clearInterval(fadeInterval);
          setTimeout(fadeIn, loopDelay);
        } else {
          audio.volume = vol;
        }
      }, step);
    };

    fadeIn(); // start the first loop

    return () => {
      audio.pause();
      audioRef.current = null;
    };
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
