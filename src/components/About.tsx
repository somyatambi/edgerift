import { Award, TrendingUp, Target, Cpu, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const PILLARS = [
  {
    icon: Award,
    color: '#00ffc8',
    value: '8+ Years',
    label: 'Market Experience',
    desc: 'Trading futures, crypto, and equities across multiple market cycles.',
  },
  {
    icon: Target,
    color: '#3b82f6',
    value: '100%',
    label: 'Data-Driven Focus',
    desc: 'Every decision backed by statistics, backtests, and quantified edge.',
  },
  {
    icon: Cpu,
    color: '#8b5cf6',
    value: '24/7',
    label: 'Automated Execution',
    desc: 'Strategies run with no emotional interference, even while you sleep.',
  },
  {
    icon: TrendingUp,
    color: '#f59e0b',
    value: '3+',
    label: 'Live Strategies',
    desc: 'Continuously refined, stress-tested, and deployed in real markets.',
  },
];

export default function About() {
  const navigate = useNavigate();

  return (
    <section id="about" className="py-24 relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* Section header */}
        <div className="text-center mb-14">
          <p
            className="text-[10px] font-bold tracking-[0.35em] uppercase mb-2.5"
            style={{ color: 'rgba(139,92,246,0.55)' }}
          >
            About
          </p>
          <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">
            TRADING{' '}
            <span
              className="text-transparent bg-clip-text"
              style={{ backgroundImage: 'linear-gradient(135deg,#8b5cf6,#3b82f6)' }}
            >
              PHILOSOPHY
            </span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm leading-relaxed">
            Built on the belief that markets are winnable — if you approach them with data, discipline, and a systematic edge.
          </p>
        </div>

        {/* Main content */}
        <div className="flex flex-col lg:flex-row gap-10 items-start">

          {/* Left — image card */}
          <div
            className="relative w-full lg:w-5/12 aspect-[4/5] rounded-2xl overflow-hidden shrink-0"
            style={{ border: '1px solid rgba(255,255,255,0.06)' }}
          >
            <img
              src="https://images.unsplash.com/photo-1542744094-3a31f272c490?auto=format&fit=crop&q=80&w=800"
              alt="Trading Setup"
              className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-700"
            />
            {/* Gradient overlay */}
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(to top, rgba(3,10,20,0.95) 0%, rgba(3,10,20,0.3) 50%, transparent 100%)' }}
            />
            {/* Profile tag */}
            <div className="absolute bottom-0 left-0 right-0 p-7 flex items-end gap-4">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: 'rgba(0,255,200,0.10)', border: '1px solid rgba(0,255,200,0.25)', backdropFilter: 'blur(12px)' }}
              >
                <Award className="h-7 w-7 text-primary" />
              </div>
              <div>
                <div className="text-xl font-black text-foreground">E. Trader</div>
                <div className="text-xs font-semibold tracking-widest uppercase mt-0.5" style={{ color: '#3b82f6' }}>
                  Full-Stack Quant
                </div>
              </div>
            </div>
          </div>

          {/* Right — text + pillars */}
          <div className="flex-1">
            <div
              className="p-7 rounded-2xl mb-6 leading-relaxed"
              style={{ background: 'rgba(7,17,31,0.65)', border: '1px solid rgba(255,255,255,0.06)', backdropFilter: 'blur(14px)' }}
            >
              <p className="text-base text-muted-foreground mb-5">
                True trading success isn't about gut feelings or drawing arbitrary lines on a chart. It's about{' '}
                <span className="text-primary font-semibold">edge</span> — identifiable, verifiable, and repeatable edges
                built on probabilities and hard data.
              </p>
              <p className="text-base text-muted-foreground">
                My mission is to transition traders from chaotic, emotional decision-making into the systematic execution
                of high-grade algorithms and quantified playbooks.{' '}
                <span className="text-foreground font-medium">What you can't measure, you can't improve.</span>
              </p>
            </div>

            {/* Pillar grid */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {PILLARS.map(({ icon: Icon, color, value, label, desc }) => (
                <div
                  key={label}
                  className="p-5 rounded-2xl transition-all duration-300 hover:scale-[1.025]"
                  style={{
                    background: `${color}07`,
                    border: `1px solid ${color}20`,
                    backdropFilter: 'blur(14px)',
                  }}
                >
                  <Icon className="h-5 w-5 mb-3" style={{ color }} />
                  <div className="text-2xl font-black text-foreground mb-0.5" style={{ textShadow: `0 0 20px ${color}40` }}>
                    {value}
                  </div>
                  <div className="text-[10px] font-bold uppercase tracking-widest mb-2" style={{ color }}>
                    {label}
                  </div>
                  <div className="text-xs text-muted-foreground leading-relaxed">{desc}</div>
                </div>
              ))}
            </div>

            {/* CTA row */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => navigate('/courses')}
                className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                style={{ background: 'rgba(0,255,200,0.1)', border: '1px solid rgba(0,255,200,0.25)', color: '#00ffc8' }}
              >
                Explore Courses <ArrowRight className="h-4 w-4" />
              </button>
              <button
                onClick={() => navigate('/algos')}
                className="flex items-center justify-center gap-2 py-3 px-6 rounded-xl text-sm font-bold transition-all hover:opacity-90"
                style={{ background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', color: '#3b82f6' }}
              >
                View Strategies <TrendingUp className="h-4 w-4" />
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
