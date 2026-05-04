import { useState, useEffect } from 'react';
import { Trophy, TrendingUp, Calendar, Award } from 'lucide-react';

interface LeaderboardEntry {
  username: string;
  tier: string;
  profitPct: string;
  tradingDays: number;
}

export default function SimulatorLeaderboard() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const res = await fetch('/api/simulator/leaderboard');
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
    } catch (err) {
      console.error('Failed to load leaderboard');
    } finally {
      setIsLoading(false);
    }
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'starter': return '#3b82f6';
      case 'pro': return '#00ffc8';
      case 'elite': return '#8b5cf6';
      default: return '#5a7394';
    }
  };

  const getMedal = (index: number) => {
    if (index === 0) return <Trophy className="h-5 w-5 text-yellow-400" />;
    if (index === 1) return <Award className="h-5 w-5 text-gray-300" />;
    if (index === 2) return <Award className="h-5 w-5 text-amber-600" />;
    return null;
  };

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-bold tracking-widest uppercase"
               style={{ background: 'rgba(0,255,200,0.07)', border: '1px solid rgba(0,255,200,0.22)', color: '#00ffc8' }}>
            <Trophy className="h-3.5 w-3.5" />
            <span>Hall of Fame</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Trading{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
              Leaderboard
            </span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm leading-relaxed">
            Top performers who have successfully passed their prop-firm challenges. Compete, prove your skills, and join the elite.
          </p>
        </div>

        {/* Leaderboard Table */}
        <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(7,17,31,0.7)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(16px)' }}>
          {isLoading ? (
            <div className="p-12 text-center">
              <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full mx-auto mb-4" />
              <p className="text-muted-foreground">Loading leaderboard...</p>
            </div>
          ) : leaderboard.length === 0 ? (
            <div className="p-12 text-center">
              <Trophy className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">No challenges passed yet. Be the first!</p>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-[10px] text-muted-foreground uppercase tracking-wider border-b border-white/5">
                  <th className="px-6 py-4">Rank</th>
                  <th className="px-6 py-4">Trader</th>
                  <th className="px-6 py-4">Tier</th>
                  <th className="px-6 py-4">Profit</th>
                  <th className="px-6 py-4">Days</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((entry, index) => (
                  <tr
                    key={index}
                    className="border-b border-white/5 hover:bg-white/5 transition-colors"
                    style={index === 0 ? { background: 'rgba(0,255,200,0.03)' } : undefined}
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        {getMedal(index)}
                        <span className="text-sm font-bold text-foreground">#{index + 1}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm font-semibold text-foreground">{entry.username}</span>
                    </td>
                    <td className="px-6 py-4">
                      <span
                        className="inline-block px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider"
                        style={{ color: getTierColor(entry.tier), background: `${getTierColor(entry.tier)}15` }}
                      >
                        {entry.tier}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        <span className="text-sm font-bold text-primary">+{entry.profitPct}%</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm text-foreground">{entry.tradingDays}</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* CTA */}
        <div className="mt-8 text-center">
          <p className="text-sm text-muted-foreground mb-4">
            Think you have what it takes? Start your challenge today.
          </p>
          <button
            onClick={() => window.location.href = '/simulator'}
            className="px-6 py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90"
            style={{ background: '#00ffc8', color: '#000' }}
          >
            Start Challenge →
          </button>
        </div>
      </div>
    </div>
  );
}
