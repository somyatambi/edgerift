import { ArrowRight, Activity, TrendingUp, ChevronDown } from 'lucide-react';
import { Button } from './ui/button';

const STATS = [
  { value: '85%',  label: 'Backtest Win Rate'   },
  { value: '3.1×', label: 'Avg Profit Factor'   },
  { value: '24/7', label: 'Auto Execution'       },
  { value: '3',    label: 'Live Strategies'      },
];

export default function Hero() {
  const scrollTo = (id: string) =>
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

  return (
    <section
      id="home"
      className="relative min-h-screen flex flex-col items-center justify-center pt-24 pb-16 overflow-hidden"
    >
      {/* ── Radial grid fade ────────────────────────────────────────────── */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            'linear-gradient(rgba(0,255,200,0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(0,255,200,0.07) 1px, transparent 1px)',
          backgroundSize: '80px 80px',
          maskImage: 'radial-gradient(ellipse 85% 65% at 50% 50%, black 30%, transparent 100%)',
          WebkitMaskImage: 'radial-gradient(ellipse 85% 65% at 50% 50%, black 30%, transparent 100%)',
          opacity: 0.28,
        }}
      />

      {/* ── Content ─────────────────────────────────────────────────────── */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 relative z-10 flex flex-col items-center text-center">

        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-8 text-xs font-bold tracking-widest uppercase"
          style={{ background: 'rgba(0,255,200,0.07)', border: '1px solid rgba(0,255,200,0.22)', color: '#00ffc8' }}
        >
          <Activity className="h-3.5 w-3.5" />
          <span>Institutional-Grade Algo Trading</span>
          <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
        </div>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[5.25rem] font-black tracking-tight leading-[0.94] mb-6">
          <span className="text-foreground">Data-Driven</span>
          <br />
          <span
            className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-secondary to-accent"
          >
            Precision.
          </span>
        </h1>

        {/* Sub-headline */}
        <p className="text-lg md:text-xl text-muted-foreground max-w-xl mx-auto mb-10 leading-relaxed">
          Institutional-grade signals, prop-firm challenges, and quant education — all in one platform.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center gap-4 mb-16">
          <Button
            onClick={() => scrollTo('courses')}
            size="lg"
            className="w-full sm:w-auto min-w-[190px] group"
          >
            View Courses
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
          <Button
            variant="outline"
            size="lg"
            onClick={() => scrollTo('algos')}
            className="w-full sm:w-auto min-w-[190px]"
          >
            <TrendingUp className="mr-2 h-4 w-4 text-secondary" />
            Explore Algos
          </Button>
        </div>

        {/* Stats strip */}
        <div className="w-full grid grid-cols-2 md:grid-cols-4 gap-3">
          {STATS.map((s) => (
            <div
              key={s.label}
              className="p-4 rounded-xl text-center"
              style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
            >
              <div
                className="text-2xl font-black text-foreground mb-0.5"
                style={{ textShadow: '0 0 24px rgba(0,255,200,0.3)' }}
              >
                {s.value}
              </div>
              <div className="text-[10px] font-medium text-muted-foreground uppercase tracking-widest">{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Scroll cue ──────────────────────────────────────────────────── */}
      <button
        onClick={() => scrollTo('courses')}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors z-10"
      >
        <span className="text-[9px] tracking-widest uppercase">Scroll</span>
        <ChevronDown className="h-4 w-4 animate-bounce" />
      </button>
    </section>
  );
}

