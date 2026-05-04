import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronDown, Lock, CheckCircle2, Clock, BarChart2, BookOpen, Layers } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface Module {
  title: string;
  duration: string;
  tier: 'free' | 'member' | 'premium';
  desc: string;
  youtubeId?: string;
}

interface Course {
  id: string;
  badge: string;
  badgeColor: string;
  title: string;
  subtitle: string;
  description: string;
  duration: string;
  level: string;
  accentColor: string;
  borderColor: string;
  curriculum: Module[];
}

const COURSES: Course[] = [
  {
    id: 'quant-intro',
    badge: 'FOUNDATION',
    badgeColor: '#00ffc8',
    title: 'Intro to Quant Finance',
    subtitle: 'From zero to systematic trader',
    description:
      'Build a solid foundation in quantitative finance. Learn to think statistically, understand markets through data, and code your first trading signals.',
    duration: '8 weeks',
    level: 'Beginner',
    accentColor: '#00ffc8',
    borderColor: 'rgba(0,255,200,0.15)',
    curriculum: [
      { title: 'Markets & Instruments',       duration: '1.5h', tier: 'free',    desc: 'Futures, equities, crypto — understanding market microstructure.', youtubeId: '4CQzOXbkLqY' },
      { title: 'Statistical Foundations',      duration: '2h',   tier: 'free',    desc: 'Distributions, mean/variance, why they drive edge in trading.' },
      { title: 'Time Series & Returns',        duration: '2.5h', tier: 'member',  desc: 'Log returns, rolling stats, autocorrelation, regime detection.' },
      { title: 'Alpha Generation Frameworks',  duration: '3h',   tier: 'member',  desc: 'Systematic research: hypothesis → backtest → validate → deploy.' },
      { title: 'Python Quant Toolkit',         duration: '4h',   tier: 'premium', desc: 'Pandas, NumPy, vectorbt — the complete quant research stack.' },
    ],
  },
  {
    id: 'algo-systems',
    badge: 'ENGINEERING',
    badgeColor: '#3b82f6',
    title: 'Algorithmic Systems',
    subtitle: 'Design, build, and deploy automated strategies',
    description:
      'Connect to live data feeds, build execution engines, and deploy strategies that run 24/7 with full risk controls and monitoring pipelines.',
    duration: '10 weeks',
    level: 'Intermediate',
    accentColor: '#3b82f6',
    borderColor: 'rgba(59,130,246,0.15)',
    curriculum: [
      { title: 'API Connectivity & Data Feeds',   duration: '2h',   tier: 'free',    desc: 'REST & WebSocket APIs: Binance, Interactive Brokers, Alpaca.' },
      { title: 'Order Management Systems',        duration: '2.5h', tier: 'free',    desc: 'Order types, fill simulation, slippage modelling, execution logic.' },
      { title: 'Backtesting Frameworks',          duration: '3h',   tier: 'member',  desc: 'Event-driven vs vectorized backtesting. Avoiding look-ahead bias.' },
      { title: 'Live Deployment & Monitoring',    duration: '3.5h', tier: 'member',  desc: 'Docker, cloud VPS, real-time dashboards, alerting systems.' },
      { title: 'Latency & HFT Considerations',   duration: '2h',   tier: 'premium', desc: 'Co-location, order book dynamics, latency benchmarking.' },
    ],
  },
  {
    id: 'risk-mgmt',
    badge: 'ADVANCED',
    badgeColor: '#8b5cf6',
    title: 'Risk Management',
    subtitle: 'Protect capital and maximise risk-adjusted returns',
    description:
      'The edge that separates professionals from amateurs. Learn position sizing, intelligent risk limits, and portfolio construction that survives drawdowns.',
    duration: '6 weeks',
    level: 'All Levels',
    accentColor: '#8b5cf6',
    borderColor: 'rgba(139,92,246,0.15)',
    curriculum: [
      { title: 'Position Sizing Fundamentals',   duration: '1.5h', tier: 'free',    desc: 'Kelly Criterion, fixed fractional, and volatility-based sizing.' },
      { title: 'Drawdown Limits & Circuit Breakers', duration: '2h', tier: 'free',  desc: 'Daily/weekly loss limits, auto-pause logic, capital preservation.' },
      { title: 'VaR, CVaR & Tail Risk',          duration: '2.5h', tier: 'member',  desc: 'Value at Risk, Expected Shortfall, Monte Carlo simulations.' },
      { title: 'Portfolio Optimisation',         duration: '3h',   tier: 'member',  desc: 'Mean-variance, risk parity, correlation matrices, diversification.' },
      { title: 'Stress Testing & Scenario Analysis', duration: '2.5h', tier: 'premium', desc: 'Historical crash simulations, regime shifts, black-swan prep.' },
    ],
  },
];

function TierBadge({ tier }: { tier: 'free' | 'member' | 'premium' }) {
  return (
    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest badge-${tier}`}>
      {tier === 'premium' ? 'Pro' : tier}
    </span>
  );
}

export default function Courses() {
  const navigate = useNavigate();
  const { user, token } = useAuth();
  const [expanded, setExpanded] = useState<string | null>(null);

  const handleEnroll = async (courseId: string) => {
    if (!user) { navigate('/auth'); return; }
    await fetch('/api/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ courseId }),
    });
  };

  const canAccess = (tier: 'free' | 'member' | 'premium') => {
    if (tier === 'free') return true;
    if (tier === 'member' && user) return true;
    if (tier === 'premium' && user?.plan === 'premium') return true;
    return false;
  };

  return (
    <section className="py-24 relative" id="courses">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-[10px] font-bold tracking-[0.35em] uppercase mb-2.5" style={{ color: 'rgba(0,255,200,0.5)' }}>
            Education
          </p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">
            OUR{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              COURSES
            </span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm leading-relaxed">
            Structured learning paths from concept to live execution. Free modules let you start immediately — no card required.
          </p>
        </div>

        {/* Course cards */}
        <div className="space-y-5">
          {COURSES.map((course) => {
            const isOpen = expanded === course.id;
            return (
              <div
                key={course.id}
                className="rounded-2xl overflow-hidden transition-all duration-300"
                style={{ background: 'rgba(7,17,31,0.7)', border: `1px solid ${course.borderColor}`, backdropFilter: 'blur(16px)' }}
              >
                {/* Card header row */}
                <div className="p-6 md:p-8">
                  <div className="flex flex-col md:flex-row md:items-start gap-6">

                    {/* Left: metadata + description */}
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span
                          className="text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest"
                          style={{ color: course.accentColor, background: `${course.accentColor}14`, border: `1px solid ${course.accentColor}32` }}
                        >
                          {course.badge}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" /> {course.duration}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <BarChart2 className="h-3 w-3" /> {course.level}
                        </span>
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Layers className="h-3 w-3" /> {course.curriculum.length} modules
                        </span>
                      </div>
                      <h3 className="text-xl font-extrabold text-foreground mb-0.5">{course.title}</h3>
                      <p className="text-sm font-medium mb-3" style={{ color: course.accentColor }}>{course.subtitle}</p>
                      <p className="text-sm text-muted-foreground leading-relaxed max-w-2xl">{course.description}</p>
                    </div>

                    {/* Right: action buttons */}
                    <div className="flex flex-col gap-2.5 shrink-0 md:min-w-[155px]">
                      <button
                        onClick={() => handleEnroll(course.id)}
                        className="w-full flex items-center justify-center py-2.5 px-5 rounded-xl text-xs font-bold text-[#020817] transition-all bg-primary hover:bg-primary/90"
                      >
                        {user ? '✓ Enrolled' : 'Enroll Now'}
                      </button>
                      <button
                        onClick={() => setExpanded(isOpen ? null : course.id)}
                        className="w-full flex items-center justify-center gap-1.5 py-2.5 px-5 rounded-xl text-xs font-semibold text-muted-foreground hover:text-foreground transition-all"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.06)' }}
                      >
                        <BookOpen className="h-3.5 w-3.5" />
                        {isOpen ? 'Hide Curriculum' : 'View Curriculum'}
                        <ChevronDown className={`h-3.5 w-3.5 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expandable curriculum */}
                {isOpen && (
                  <div
                    className="px-6 md:px-8 py-6"
                    style={{ borderTop: `1px solid ${course.borderColor}` }}
                  >
                    <h4 className="text-[10px] font-bold tracking-[0.25em] text-muted-foreground uppercase mb-4">
                      Course Curriculum
                    </h4>
                    <div className="space-y-2">
                      {course.curriculum.map((mod, i) => {
                        const accessible = canAccess(mod.tier);
                        return (
                          <div
                            key={i}
                            className={`flex items-start gap-3.5 p-4 rounded-xl transition-all ${
                              accessible ? 'hover:bg-white/[0.03]' : 'opacity-55'
                            }`}
                            style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.04)' }}
                          >
                            <div className="shrink-0 mt-0.5">
                              {accessible
                                ? <CheckCircle2 className="h-4 w-4 text-primary" />
                                : <Lock className="h-4 w-4 text-muted-foreground" />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex flex-wrap items-center gap-2 mb-1">
                                <span className="text-sm font-semibold text-foreground">{mod.title}</span>
                                <TierBadge tier={mod.tier} />
                                <span className="text-[11px] text-muted-foreground">{mod.duration}</span>
                              </div>
                              <p className="text-xs text-muted-foreground leading-relaxed">{mod.desc}</p>
                              {accessible && mod.youtubeId && (
                                <div className="mt-3 relative w-full overflow-hidden rounded-xl" style={{ paddingTop: '56.25%' }}>
                                  <iframe
                                    className="absolute top-0 left-0 w-full h-full border-0"
                                    src={`https://www.youtube.com/embed/${mod.youtubeId}`}
                                    title={mod.title}
                                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                    allowFullScreen
                                  />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {!user && (
                      <div
                        className="mt-4 p-4 rounded-xl text-sm text-center"
                        style={{ background: 'rgba(0,255,200,0.04)', border: '1px solid rgba(0,255,200,0.12)' }}
                      >
                        <span className="text-muted-foreground">Sign in to unlock </span>
                        <button onClick={() => navigate('/auth')} className="text-primary font-semibold hover:underline">
                          Member &amp; Pro modules
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

