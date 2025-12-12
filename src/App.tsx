import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PrestigePanel from "@/components/game/PrestigePanel";
import { useGameState } from "@/hooks/useGameState";

const queryClient = new QueryClient();

const App = () => {
  const {
    gameState,
    handleClick,
    buyUpgrade,
    buySkillNode,
    buyAscensionNode,
    prestige,
    ascend,
    setFormula,
    saveGame,
    resetGame,
    calculatePrestigeGain,
    calculateAscensionGain,
  } = useGameState();

  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <div className="app-container">
            {/* Example usage of PrestigePanel */}
            <PrestigePanel
              gameState={gameState}
              calculatePrestigeGain={calculatePrestigeGain}
              calculateAscensionGain={calculateAscensionGain}
              onPrestige={prestige}
              onAscend={ascend}
              onBuySkillNode={buySkillNode}
              onBuyAscensionNode={buyAscensionNode}
              onSetFormula={(index) => setFormula(String(index))}
              onSave={saveGame}
              onReset={resetGame}
              playPrestige={() => console.log("Prestige sound")}
              playAscension={() => console.log("Ascension sound")}
              playPurchase={() => console.log("Purchase sound")}
            />
            <Routes>
              <Route path="*" element={<div>404 - Not Found</div>} />
            </Routes>
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  );
};

export default App;
