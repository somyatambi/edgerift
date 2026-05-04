import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp, ChevronRight, Lock, X, Zap, Mail, MessageSquare, Key } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

// ─── Data ─────────────────────────────────────────────────────────────────────

interface Stat { label: string; value: string }
interface Rules { entry: string[]; exit: string[] }

interface Algo {
  id: string;
  badge: string;
  title: string;
  subtitle: string;
  description: string;
  accentColor: string;
  borderColor: string;
  stats: Stat[];
  rules: Rules;
  delivery: string[];
}

const ALGOS: Algo[] = [
  {
    id: 'momentum-breakout',
    badge: 'TREND FOLLOWING',
    title: 'Momentum Breakout',
    subtitle: 'ES / NQ Futures · 5min & 15min',
    description:
      'Captures trend continuation using ATR-based breakouts with dynamic trailing stops. Optimised for high-momentum sessions during NY & London overlap.',
    accentColor: '#00ffc8',
    borderColor: 'rgba(0,255,200,0.15)',
    stats: [
      { label: 'Win Rate',      value: '62.4%' },
      { label: 'Profit Factor', value: '2.10' },
      { label: 'Max DD',        value: '-8.3%' },
      { label: 'Sharpe',        value: '1.84'  },
    ],
    rules: {
      entry: [
        '15-period ATR breakout above/below prior session high/low',
        'Volume confirmation: 1.5× the 20-period average',
        'Trend filter: price above/below 200 EMA',
      ],
      exit: [
        'Trailing stop: 1.5× ATR from entry candle',
        'Fixed target: 3× initial ATR risk',
        'Time exit: flatten before high-impact news events',
      ],
    },
    delivery: ['webhook', 'telegram', 'api'],
  },
  {
    id: 'mean-reversion',
    badge: 'MEAN REVERSION',
    title: 'Mean Reversion Alpha',
    subtitle: 'BTC / ETH · 1hr & 4hr',
    description:
      'Capitalises on overextended price deviations using Bollinger Band squeeze and RSI divergence. High win rate on range-bound crypto markets.',
    accentColor: '#3b82f6',
    borderColor: 'rgba(59,130,246,0.15)',
    stats: [
      { label: 'Win Rate',      value: '71.2%' },
      { label: 'Profit Factor', value: '1.73'  },
      { label: 'Max DD',        value: '-12.1%'},
      { label: 'Sharpe',        value: '2.21'  },
    ],
    rules: {
      entry: [
        'RSI < 30 or > 70 with Bollinger Band touch',
        'Bearish / bullish divergence on MACD histogram',
        'Range filter: ADX < 25',
      ],
      exit: [
        'Mean reversion target: 20-period SMA',
        'Hard stop: 1% beyond the swing structure',
        'Partial close: 50% at 1:1 RR, runner to SMA',
      ],
    },
    delivery: ['webhook', 'email', 'api'],
  },
  {
    id: 'stat-arb-pairs',
    badge: 'STATISTICAL ARB',
    title: 'Stat-Arb Pairs',
    subtitle: 'Sector ETFs & Equities · Daily',
    description:
      'Exploits mean-reverting spread between cointegrated asset pairs using Granger causality and ADF testing. Market-neutral — directional exposure is near zero.',
    accentColor: '#8b5cf6',
    borderColor: 'rgba(139,92,246,0.15)',
    stats: [
      { label: 'Win Rate',      value: '58.9%' },
      { label: 'Profit Factor', value: '2.47'  },
      { label: 'Max DD',        value: '-5.8%' },
      { label: 'Sharpe',        value: '3.12'  },
    ],
    rules: {
      entry: [
        'ADF test p-value < 0.05 (cointegration confirmed)',
        'Z-score of spread > 2.0 or < -2.0',
        'Kalman filter hedge ratio updated daily',
      ],
      exit: [
        'Z-score reverts to 0 ± 0.5',
        'Hard stop: spread z-score beyond ±3.5',
        'Rebalance trigger: hedge ratio drift > 10%',
      ],
    },
    delivery: ['webhook', 'telegram', 'email', 'api'],
  },
];

const DELIVERY_METHODS = [
  { id: 'webhook',  icon: Zap,          label: 'Webhook',    color: '#00ffc8', desc: 'POST signal JSON to your endpoint in milliseconds' },
  { id: 'telegram', icon: MessageSquare, label: 'Telegram',   color: '#3b82f6', desc: 'Private bot sends formatted alerts to your channel' },
  { id: 'email',    icon: Mail,          label: 'Email',      color: '#8b5cf6', desc: 'Structured email alerts with full signal details' },
  { id: 'api',      icon: Key,           label: 'REST API',   color: '#f59e0b', desc: 'Poll the latest signal with your personal API key' },
];

const TIERS = [
  {
    tier: 'Free',
    color: '#5a7394',
    features: ['Strategy descriptions', 'Performance overview', 'Learning resources'],
    cta: 'Current Plan',
    onCta: null,
  },
  {
    tier: 'Member',
    color: '#3b82f6',
    features: ['Full entry / exit rules', 'Backtest reports', 'All course content', 'Community access'],
    cta: 'Sign Up Free',
    onCta: '/auth',
  },
  {
    tier: 'Pro',
    color: '#00ffc8',
    features: ['Live signal delivery', 'All delivery channels', 'Personal API key', 'Priority support', 'Monthly strategy calls'],
    cta: 'Upgrade to Pro',
    onCta: '/auth',
    highlight: true,
  },
];

// ─── Modal ────────────────────────────────────────────────────────────────────

function AlgoModal({ algo, onClose }: { algo: Algo; onClose: () => void }) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const isMember = !!user;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="absolute inset-0"
        style={{ background: 'rgba(3,10,20,0.88)', backdropFilter: 'blur(10px)' }}
      />
      <div
        className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl scrollbar-thin"
        style={{
          background: 'rgba(7,17,31,0.98)',
          border: `1px solid ${algo.borderColor}`,
          backdropFilter: 'blur(24px)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-6" style={{ borderBottom: `1px solid ${algo.borderColor}` }}>
          <div>
            <span
              className="text-[10px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full inline-block mb-2"
              style={{ color: algo.accentColor, background: `${algo.accentColor}14`, border: `1px solid ${algo.accentColor}32` }}
            >
              {algo.badge}
            </span>
            <h3 className="text-xl font-extrabold text-foreground">{algo.title}</h3>
            <p className="text-sm text-muted-foreground mt-0.5">{algo.subtitle}</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-white/5 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Description */}
          <p className="text-sm text-muted-foreground leading-relaxed">{algo.description}</p>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-2.5">
            {algo.stats.map((s) => (
              <div
                key={s.label}
                className="text-center p-3 rounded-xl"
                style={{ background: `${algo.accentColor}08`, border: `1px solid ${algo.accentColor}22` }}
              >
                <div className="text-base font-black" style={{ color: algo.accentColor }}>{s.value}</div>
                <div className="text-[9px] text-muted-foreground mt-0.5 uppercase tracking-wider">{s.label}</div>
              </div>
            ))}
          </div>

          {/* Rules — member-only */}
          {isMember ? (
            <div className="space-y-3">
              {[
                { title: 'Entry Conditions', items: algo.rules.entry, accent: algo.accentColor },
                { title: 'Exit Conditions',  items: algo.rules.exit,  accent: '#5a7394' },
              ].map((block) => (
                <div
                  key={block.title}
                  className="p-4 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <h4
                    className="text-[10px] font-bold tracking-widest uppercase mb-3"
                    style={{ color: block.accent }}
                  >
                    {block.title}
                  </h4>
                  <ul className="space-y-2">
                    {block.items.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <ChevronRight className="h-4 w-4 shrink-0 mt-0.5" style={{ color: block.accent }} />
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="p-5 rounded-xl text-center"
              style={{ background: 'rgba(0,255,200,0.04)', border: '1px solid rgba(0,255,200,0.14)' }}
            >
              <Lock className="h-5 w-5 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground mb-1">Member Content</p>
              <p className="text-xs text-muted-foreground mb-4">Sign in to view full entry / exit rules and strategy details</p>
              <button
                onClick={() => { onClose(); navigate('/auth'); }}
                className="px-6 py-2.5 rounded-xl text-sm font-bold text-primary-foreground transition-all hover:opacity-90"
                style={{ background: '#00ffc8' }}
              >
                Sign In / Register →
              </button>
            </div>
          )}

          {/* Delivery methods */}
          <div>
            <h4 className="text-[10px] font-bold tracking-widest uppercase text-muted-foreground mb-3">
              Signal Delivery
            </h4>
            <div className="grid grid-cols-2 gap-2">
              {DELIVERY_METHODS.filter((d) => algo.delivery.includes(d.id)).map((d) => (
                <div
                  key={d.id}
                  className="flex items-start gap-3 p-3.5 rounded-xl"
                  style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.05)' }}
                >
                  <d.icon className="h-4 w-4 shrink-0 mt-0.5" style={{ color: d.color }} />
                  <div>
                    <div className="text-xs font-bold text-foreground">{d.label}</div>
                    <div className="text-[11px] text-muted-foreground mt-0.5">{d.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* CTA */}
          <button
            onClick={() => { onClose(); navigate('/auth'); }}
            className="w-full py-3 rounded-xl text-sm font-bold transition-all hover:opacity-90"
            style={{ background: `${algo.accentColor}16`, border: `1px solid ${algo.accentColor}40`, color: algo.accentColor }}
          >
            {user ? 'Upgrade to Pro — Get Live Signals →' : 'Sign In to Access Signals →'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main section ─────────────────────────────────────────────────────────────

export default function Algos() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [selected, setSelected] = useState<Algo | null>(null);

  return (
    <section className="py-24 relative" id="algos">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Header */}
        <div className="text-center mb-14">
          <p className="text-[10px] font-bold tracking-[0.35em] uppercase mb-2.5" style={{ color: 'rgba(59,130,246,0.55)' }}>
            Live Strategies
          </p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">
            OUR{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-secondary to-accent">
              ALGOS
            </span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm leading-relaxed">
            Institutional-grade strategies with full backtest transparency. Click any card for complete rules and delivery options.
          </p>
        </div>

        {/* Strategy cards grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-16">
          {ALGOS.map((algo) => (
            <div
              key={algo.id}
              className="group cursor-pointer rounded-2xl p-6 flex flex-col transition-all duration-300 hover:scale-[1.025] hover:-translate-y-0.5"
              style={{ background: 'rgba(7,17,31,0.7)', border: `1px solid ${algo.borderColor}`, backdropFilter: 'blur(16px)' }}
              onClick={() => setSelected(algo)}
            >
              {/* Badge + icon */}
              <div className="flex items-center justify-between mb-4">
                <span
                  className="text-[9px] font-black tracking-widest uppercase px-2.5 py-1 rounded-full"
                  style={{ color: algo.accentColor, background: `${algo.accentColor}12`, border: `1px solid ${algo.accentColor}30` }}
                >
                  {algo.badge}
                </span>
                <TrendingUp
                  className="h-4 w-4 opacity-30 group-hover:opacity-100 transition-opacity"
                  style={{ color: algo.accentColor }}
                />
              </div>

              <h3 className="text-lg font-extrabold text-foreground mb-0.5">{algo.title}</h3>
              <p className="text-xs text-muted-foreground mb-3">{algo.subtitle}</p>
              <p className="text-sm text-muted-foreground/80 leading-relaxed mb-5 flex-1">{algo.description}</p>

              {/* Mini stats */}
              <div className="grid grid-cols-2 gap-2 mb-4">
                {algo.stats.slice(0, 2).map((s) => (
                  <div
                    key={s.label}
                    className="p-2.5 rounded-lg"
                    style={{ background: `${algo.accentColor}07`, border: `1px solid ${algo.accentColor}18` }}
                  >
                    <div className="text-sm font-black" style={{ color: algo.accentColor }}>{s.value}</div>
                    <div className="text-[9px] text-muted-foreground uppercase tracking-wider">{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Delivery pills */}
              <div className="flex flex-wrap gap-1.5 mb-4">
                {DELIVERY_METHODS.filter((d) => algo.delivery.includes(d.id)).map((d) => (
                  <span
                    key={d.id}
                    className="text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider"
                    style={{ color: d.color, background: `${d.color}10`, border: `1px solid ${d.color}28` }}
                  >
                    {d.label}
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: algo.accentColor }}>
                View Strategy <ChevronRight className="h-3.5 w-3.5" />
              </div>
            </div>
          ))}
        </div>

        {/* Access + Delivery model */}
        <div
          className="rounded-2xl p-7 md:p-10"
          style={{ background: 'rgba(7,17,31,0.55)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(14px)' }}
        >
          <div className="text-center mb-8">
            <h3 className="text-2xl font-extrabold tracking-tighter mb-2">How Signal Access Works</h3>
            <p className="text-muted-foreground text-sm max-w-lg mx-auto leading-relaxed">
              Choose your tier, pick your delivery channel. Signals include: asset, direction, entry price, stop loss, and take profit.
            </p>
          </div>

          {/* Delivery channels */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-8">
            {DELIVERY_METHODS.map((d) => (
              <div
                key={d.id}
                className="p-4 rounded-xl flex flex-col gap-3"
                style={{ background: 'rgba(255,255,255,0.025)', border: '1px solid rgba(255,255,255,0.06)' }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center"
                  style={{ background: `${d.color}12` }}
                >
                  <d.icon className="shrink-0" style={{ color: d.color, width: 18, height: 18 }} />
                </div>
                <div>
                  <div className="text-sm font-bold text-foreground mb-0.5">{d.label}</div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{d.desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Tier cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {TIERS.map((t) => (
              <div
                key={t.tier}
                className="p-5 rounded-2xl relative overflow-hidden"
                style={{ background: `${t.color}07`, border: `1px solid ${t.color}28` }}
              >
                {t.highlight && (
                  <div
                    className="absolute top-0 right-0 px-3 py-1 text-[9px] font-black tracking-widest uppercase rounded-bl-xl text-primary-foreground"
                    style={{ background: '#00ffc8' }}
                  >
                    BEST
                  </div>
                )}
                <div className="text-sm font-black mb-0.5 tracking-wide" style={{ color: t.color }}>{t.tier}</div>
                <ul className="mt-3 space-y-2">
                  {t.features.map((f) => (
                    <li key={f} className="flex items-center gap-2 text-xs text-muted-foreground">
                      <Zap className="h-3 w-3 shrink-0" style={{ color: t.color }} />
                      {f}
                    </li>
                  ))}
                </ul>
                <button
                  onClick={() => t.onCta && !user && navigate(t.onCta)}
                  className="mt-5 w-full py-2.5 rounded-xl text-xs font-bold transition-all hover:opacity-90"
                  style={{ background: `${t.color}14`, border: `1px solid ${t.color}38`, color: t.color }}
                >
                  {user && t.tier === 'Member' ? '✓ Active' : t.cta}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Modal */}
      {selected && <AlgoModal algo={selected} onClose={() => setSelected(null)} />}
    </section>
  );
}

