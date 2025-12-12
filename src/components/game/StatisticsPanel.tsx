import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import type { GameStats } from '@/hooks/useGameState';
import { formatNumber } from '@/lib/formatNumber';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { BarChart3 } from 'lucide-react';

interface StatisticsPanelProps {
  stats: GameStats;
  currentCPS: number;
  lifetimeClicks: number;
}

export function StatisticsPanel({ stats, currentCPS, lifetimeClicks }: StatisticsPanelProps) {
  const formatPlaytime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${secs}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${secs}s`;
    }
    return `${secs}s`;
  };

  // Prepare chart data with relative time labels
  const cpsChartData = stats.cpsHistory.map((item, index) => ({
    name: `${index * 10}s`,
    cps: Math.floor(item.cps),
  }));

  const clicksChartData = stats.clicksHistory.map((item, index) => ({
    name: `${index * 10}s`,
    clicks: Math.floor(item.clicks),
  }));

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="p-2 rounded-lg bg-card border border-border hover:border-primary transition-colors" title="Statistics">
          <BarChart3 className="w-4 h-4 text-neon-cyan" />
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto bg-background border-primary neon-border">
        <DialogHeader>
          <DialogTitle className="text-primary font-retro text-lg">📊 Statistics</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Stats Overview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard label="Total Playtime" value={formatPlaytime(stats.totalPlaytime)} color="cyan" />
            <StatCard label="Best CPS" value={formatNumber(stats.bestCPS)} color="yellow" />
            <StatCard label="Current CPS" value={formatNumber(currentCPS)} color="pink" />
            <StatCard label="Lifetime Clicks" value={formatNumber(lifetimeClicks)} color="purple" />
          </div>

          {/* CPS History Chart */}
          {cpsChartData.length > 1 && (
            <div className="bg-card p-4 rounded-lg border border-border">
              <h3 className="text-neon-cyan font-retro text-sm mb-4">CPS History</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={cpsChartData}>
                    <defs>
                      <linearGradient id="cpsGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#00ffff" stopOpacity={0.8}/>
                        <stop offset="95%" stopColor="#00ffff" stopOpacity={0.1}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#666" fontSize={10} />
                    <YAxis stroke="#666" fontSize={10} tickFormatter={(v) => formatNumber(v)} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1a1a2e', 
                        border: '1px solid #00ffff',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: '#00ffff' }}
                      formatter={(value: number) => [formatNumber(value), 'CPS']}
                    />
                    <Area type="monotone" dataKey="cps" stroke="#00ffff" fillOpacity={1} fill="url(#cpsGradient)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Clicks History Chart */}
          {clicksChartData.length > 1 && (
            <div className="bg-card p-4 rounded-lg border border-border">
              <h3 className="text-neon-pink font-retro text-sm mb-4">Total Clicks Over Time</h3>
              <div className="h-48">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={clicksChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                    <XAxis dataKey="name" stroke="#666" fontSize={10} />
                    <YAxis stroke="#666" fontSize={10} tickFormatter={(v) => formatNumber(v)} />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: '#1a1a2e', 
                        border: '1px solid #ff007f',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: '#ff007f' }}
                      formatter={(value: number) => [formatNumber(value), 'Clicks']}
                    />
                    <Line type="monotone" dataKey="clicks" stroke="#ff007f" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {cpsChartData.length <= 1 && (
            <div className="text-center text-muted-foreground py-8">
              <p className="font-retro text-sm">Keep playing to see progress graphs!</p>
              <p className="text-xs mt-2">Data is recorded every 10 seconds</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatCard({ label, value, color }: { label: string; value: string; color: 'cyan' | 'yellow' | 'pink' | 'purple' }) {
  const colorClasses = {
    cyan: 'text-neon-cyan border-neon-cyan/30',
    yellow: 'text-neon-yellow border-neon-yellow/30',
    pink: 'text-neon-pink border-neon-pink/30',
    purple: 'text-neon-purple border-neon-purple/30',
  };

  return (
    <div className={`bg-card p-3 rounded-lg border ${colorClasses[color]}`}>
      <div className="text-muted-foreground text-xs">{label}</div>
      <div className={`font-bold text-lg ${colorClasses[color].split(' ')[0]}`}>{value}</div>
    </div>
  );
}