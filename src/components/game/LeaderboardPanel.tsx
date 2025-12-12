import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Medal, Trophy, Crown, Plus } from 'lucide-react';
import { formatNumber } from '@/lib/formatNumber';
import type { LeaderboardEntry, GameState } from '@/types/types';

interface LeaderboardPanelProps {
  gameState: GameState;
  onAddScore: (name: string, type: LeaderboardEntry['type']) => void;
}

export function LeaderboardPanel({ gameState, onAddScore }: LeaderboardPanelProps) {
  const [activeTab, setActiveTab] = useState<LeaderboardEntry['type']>('lifetime');
  const [showAddForm, setShowAddForm] = useState(false);
  const [playerName, setPlayerName] = useState('');

  const { leaderboard } = gameState.questState;
  
  const filteredEntries = leaderboard
    .filter(e => e.type === activeTab)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10);

  const getCurrentScore = () => {
    switch (activeTab) {
      case 'lifetime': return gameState.lifetimeClicks;
      case 'cps': return gameState.cps;
      case 'prestiges': return gameState.totalPrestiges;
    }
  };

  const handleAddScore = () => {
    if (playerName.trim()) {
      onAddScore(playerName.trim(), activeTab);
      setPlayerName('');
      setShowAddForm(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button 
          className="flex items-center gap-1 px-2 py-1 rounded bg-card border border-neon-pink/50 hover:border-neon-pink text-neon-pink text-[10px] md:text-xs transition-all hover:scale-105"
          title="Leaderboard"
        >
          <Trophy className="w-3 h-3 md:w-4 md:h-4" />
          <span className="hidden sm:inline">Scores</span>
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-md bg-background border-primary neon-border">
        <DialogHeader>
          <DialogTitle className="text-primary font-retro text-lg flex items-center gap-2">
            <Trophy className="w-5 h-5" />
            Leaderboard
          </DialogTitle>
        </DialogHeader>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {(['lifetime', 'cps', 'prestiges'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`flex-1 py-2 px-3 rounded text-xs font-bold transition-all ${
                activeTab === tab
                  ? 'bg-neon-pink text-background'
                  : 'bg-card border border-border hover:border-neon-pink text-foreground'
              }`}
            >
              {tab === 'lifetime' && '💎 Lifetime'}
              {tab === 'cps' && '⚡ Best CPS'}
              {tab === 'prestiges' && '⭐ Prestiges'}
            </button>
          ))}
        </div>

        {/* Current Score */}
        <div className="bg-card border border-neon-cyan/30 rounded-lg p-3 mb-4">
          <div className="flex items-center justify-between">
            <span className="text-muted-foreground text-sm">Your current score:</span>
            <span className="text-neon-cyan font-bold">{formatNumber(getCurrentScore())}</span>
          </div>
          
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="mt-2 w-full flex items-center justify-center gap-1 py-2 bg-neon-cyan/20 border border-neon-cyan/50 text-neon-cyan text-xs rounded hover:bg-neon-cyan/30 transition-colors"
            >
              <Plus className="w-3 h-3" />
              Save to Leaderboard
            </button>
          ) : (
            <div className="mt-2 flex gap-2">
              <input
                type="text"
                value={playerName}
                onChange={(e) => setPlayerName(e.target.value)}
                placeholder="Your name..."
                maxLength={20}
                className="flex-1 px-3 py-2 bg-background border border-border rounded text-xs focus:border-neon-cyan outline-none"
              />
              <button
                onClick={handleAddScore}
                disabled={!playerName.trim()}
                className="px-3 py-2 bg-neon-cyan text-background text-xs font-bold rounded hover:scale-105 transition-transform disabled:opacity-50"
              >
                Save
              </button>
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="space-y-2">
          {filteredEntries.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Trophy className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No scores yet!</p>
              <p className="text-xs">Be the first to add your score.</p>
            </div>
          ) : (
            filteredEntries.map((entry, index) => (
              <LeaderboardRow key={entry.id} entry={entry} rank={index + 1} />
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function LeaderboardRow({ entry, rank }: { entry: LeaderboardEntry; rank: number }) {
  const getRankIcon = () => {
    switch (rank) {
      case 1: return <Crown className="w-4 h-4 text-neon-yellow" />;
      case 2: return <Medal className="w-4 h-4 text-gray-300" />;
      case 3: return <Medal className="w-4 h-4 text-amber-600" />;
      default: return <span className="w-4 text-center text-muted-foreground text-xs">{rank}</span>;
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  return (
    <div className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
      rank <= 3 ? 'bg-card border border-neon-yellow/30' : 'bg-muted/30'
    }`}>
      <div className="w-6 flex justify-center">
        {getRankIcon()}
      </div>
      <div className="flex-1 min-w-0">
        <p className={`font-bold text-sm truncate ${rank === 1 ? 'text-neon-yellow' : 'text-foreground'}`}>
          {entry.name}
        </p>
        <p className="text-[10px] text-muted-foreground">{formatDate(entry.date)}</p>
      </div>
      <div className="text-right">
        <p className="font-bold text-sm text-neon-cyan">{formatNumber(entry.score)}</p>
      </div>
    </div>
  );
}
