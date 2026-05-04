import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Trophy, Target, Shield, TrendingUp, ArrowRight, CheckCircle2, BarChart3, Calendar, Award } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface TierConfig {
  id: string;
  name: string;
  initialBalance: number;
  profitTarget: string;
  maxDailyLoss: string;
  maxDrawdown: string;
  minTradingDays: number;
  maxRiskPct: number;
  color: string;
  borderColor: string;
}

interface LeaderboardEntry {
  username: string;
  tier: string;
  initialBalance: number;
  finalBalance: number;
  profitPct: string;
  tradingDays: number;
  endedAt: string;
}

const TIERS: TierConfig[] = [
  {
    id: 'starter',
    name: 'Starter',
    initialBalance: 10000,
    profitTarget: '+8%',
    maxDailyLoss: '-4%',
    maxDrawdown: '-8%',
    minTradingDays: 3,
    maxRiskPct: 0.02,
    color: '#3b82f6',
    borderColor: 'rgba(59,130,246,0.2)',
  },
  {
    id: 'pro',
    name: 'Pro',
    initialBalance: 50000,
    profitTarget: '+8%',
    maxDailyLoss: '-4%',
    maxDrawdown: '-10%',
    minTradingDays: 5,
    maxRiskPct: 0.02,
    color: '#00ffc8',
    borderColor: 'rgba(0,255,200,0.2)',
  },
  {
    id: 'elite',
    name: 'Elite',
    initialBalance: 100000,
    profitTarget: '+10%',
    maxDailyLoss: '-5%',
    maxDrawdown: '-12%',
    minTradingDays: 7,
    maxRiskPct: 0.02,
    color: '#8b5cf6',
    borderColor: 'rgba(139,92,246,0.2)',
  },
];

export default function SimulatorHome() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeChallenge, setActiveChallenge] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [isLeaderboardLoading, setIsLeaderboardLoading] = useState(true);

  useEffect(() => {
    loadActiveChallenge();
    loadLeaderboard();
  }, [user]);

  const loadActiveChallenge = async () => {
    if (!user) return;

    try {
      const token = localStorage.getItem('edgerift_token');
      const res = await fetch('/api/simulator/challenge', {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        const data = await res.json();
        setActiveChallenge(data.challenge);
      }
    } catch (err) {
      console.error('Failed to load challenge');
    }
  };

  const loadLeaderboard = async () => {
    try {
      const res = await fetch('/api/simulator/leaderboard');
      const data = await res.json();
      setLeaderboard(data.leaderboard || []);
    } catch (err) {
      console.error('Failed to load leaderboard');
    } finally {
      setIsLeaderboardLoading(false);
    }
  };

  const startChallenge = async (tierId: string) => {
    if (!user) {
      navigate('/auth');
      return;
    }

    setIsLoading(true);
    try {
      const token = localStorage.getItem('edgerift_token');
      const res = await fetch('/api/simulator/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ tier: tierId }),
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.error || 'Failed to start challenge');
        return;
      }

      navigate('/simulator/trade');
    } catch (err) {
      alert('Failed to start challenge');
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
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-bold tracking-widest uppercase"
               style={{ background: 'rgba(0,255,200,0.07)', border: '1px solid rgba(0,255,200,0.22)', color: '#00ffc8' }}>
            <Trophy className="h-3.5 w-3.5" />
            <span>Prop Firm Challenge</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Trading{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent">
              Simulator
            </span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm leading-relaxed">
            Prove your trading skills with our realistic prop-firm challenges. Trade historical market data with strict risk management rules.
          </p>
        </div>

        {/* Resume Challenge Banner */}
        {activeChallenge && (
          <div
            className="mb-8 p-4 rounded-xl flex items-center justify-between"
            style={{ background: 'rgba(0,255,200,0.08)', border: '1px solid rgba(0,255,200,0.2)' }}
          >
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary" />
              <div>
                <div className="text-sm font-bold text-foreground">You have an active {activeChallenge.tier} challenge</div>
                <div className="text-xs text-muted-foreground">Balance: ${activeChallenge.current_balance.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</div>
              </div>
            </div>
            <button
              onClick={() => navigate('/simulator/trade')}
              className="px-4 py-2 rounded-lg text-sm font-bold transition-all hover:opacity-90"
              style={{ background: '#00ffc8', color: '#000' }}
            >
              Resume Challenge
            </button>
          </div>
        )}

        {/* Challenge Tiers */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {TIERS.map((tier) => (
            <div
              key={tier.id}
              className="rounded-2xl p-6 relative overflow-hidden transition-all duration-300 hover:scale-[1.02]"
              style={{ background: 'rgba(7,17,31,0.7)', border: `1px solid ${tier.borderColor}`, backdropFilter: 'blur(16px)' }}
            >
              {tier.id === 'pro' && (
                <div
                  className="absolute top-0 right-0 px-3 py-1 text-[9px] font-black tracking-widest uppercase rounded-bl-xl text-primary-foreground"
                  style={{ background: '#00ffc8' }}
                >
                  MOST POPULAR
                </div>
              )}
              <div className="text-sm font-black mb-1 tracking-wide" style={{ color: tier.color }}>
                {tier.name}
              </div>
              <div className="text-3xl font-black text-foreground mb-6">
                ${tier.initialBalance.toLocaleString()}
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <Target className="h-4 w-4 text-primary shrink-0" />
                  <div className="flex-1">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Profit Target</div>
                    <div className="text-sm font-bold text-foreground">{tier.profitTarget}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Shield className="h-4 w-4 text-red-400 shrink-0" />
                  <div className="flex-1">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Max Daily Loss</div>
                    <div className="text-sm font-bold text-foreground">{tier.maxDailyLoss}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <TrendingUp className="h-4 w-4 text-accent shrink-0" />
                  <div className="flex-1">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Max Drawdown</div>
                    <div className="text-sm font-bold text-foreground">{tier.maxDrawdown}</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="h-4 w-4 text-secondary shrink-0" />
                  <div className="flex-1">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Min Trading Days</div>
                    <div className="text-sm font-bold text-foreground">{tier.minTradingDays} days</div>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <BarChart3 className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1">
                    <div className="text-[10px] text-muted-foreground uppercase tracking-wider">Max Risk Per Trade</div>
                    <div className="text-sm font-bold text-foreground">{(tier.maxRiskPct * 100).toFixed(0)}%</div>
                  </div>
                </div>
              </div>

              <button
                onClick={() => startChallenge(tier.id)}
                disabled={isLoading}
                className="w-full py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                style={{ background: `${tier.color}16`, border: `1px solid ${tier.color}40`, color: tier.color }}
              >
                {isLoading ? 'Starting...' : (
                  <>
                    Start Challenge
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          ))}
        </div>

        {/* How It Works */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[
              { icon: Target, title: 'Choose Your Challenge', desc: 'Pick your account size and rules' },
              { icon: TrendingUp, title: 'Trade the Market', desc: 'Buy and sell using real historical price data' },
              { icon: Shield, title: 'Follow the Rules', desc: 'Stay within daily loss and drawdown limits' },
              { icon: Trophy, title: 'Pass & Prove It', desc: 'Hit the profit target to complete your challenge' },
            ].map((step, i) => (
              <div
                key={i}
                className="p-4 rounded-xl text-center"
                style={{ background: 'rgba(7,17,31,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mx-auto mb-3"
                  style={{ background: 'rgba(0,255,200,0.08)', border: '1px solid rgba(0,255,200,0.2)' }}
                >
                  <step.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="text-sm font-bold text-foreground mb-1">{step.title}</div>
                <div className="text-xs text-muted-foreground leading-relaxed">{step.desc}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Leaderboard */}
        <div>
          <h2 className="text-2xl font-bold text-foreground mb-6 text-center">Leaderboard</h2>
          <div className="rounded-2xl overflow-hidden" style={{ background: 'rgba(7,17,31,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}>
            {isLeaderboardLoading ? (
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
                    <th className="px-6 py-4">Account Size</th>
                    <th className="px-6 py-4">Profit %</th>
                    <th className="px-6 py-4">Days</th>
                    <th className="px-6 py-4">Date</th>
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
                        <span className="text-sm text-foreground">${entry.initialBalance.toLocaleString()}</span>
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
                      <td className="px-6 py-4">
                        <span className="text-xs text-muted-foreground">
                          {new Date(entry.endedAt).toLocaleDateString()}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
