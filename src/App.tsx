import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import Navigation from './components/Navigation';
import Hero from './components/Hero';
import Courses from './components/Courses';
import Algos from './components/Algos';
import About from './components/About';
import Auth from './components/Auth';
import SimulatorHome from './components/SimulatorHome';
import SimulatorTrade from './components/SimulatorTrade';
import SimulatorLeaderboard from './components/SimulatorLeaderboard';
import Signals from './components/Signals';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import RiskDisclaimer from './components/RiskDisclaimer';
import Contact from './components/Contact';

function BackgroundImage() {
  return (
    <div className="fixed inset-0 pointer-events-none z-0" aria-hidden="true">
      <img
        src="/1280324.jpg"
        alt=""
        className="w-full h-full object-cover object-center"
        style={{ opacity: 0.4, mixBlendMode: 'luminosity', filter: 'grayscale(40%) blur(1px)' }}
      />
      {/* Vignette so edges fade into the dark bg */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, transparent 20%, rgba(3,10,20,0.72) 65%, rgba(3,10,20,0.97) 100%)',
        }}
      />
    </div>
  );
}

function BackgroundOrbs() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
      {/* Cyan orb — top-left */}
      <div
        className="orb-1 absolute rounded-full"
        style={{
          top: '5%', left: '-5%',
          width: 700, height: 700,
          background: 'radial-gradient(circle, rgba(0,255,200,0.9) 0%, transparent 70%)',
          filter: 'blur(90px)',
          opacity: 0.12,
        }}
      />
      {/* Blue orb — top-right */}
      <div
        className="orb-2 absolute rounded-full"
        style={{
          top: '-8%', right: '-8%',
          width: 650, height: 650,
          background: 'radial-gradient(circle, rgba(59,130,246,0.9) 0%, transparent 70%)',
          filter: 'blur(85px)',
          opacity: 0.10,
        }}
      />
      {/* Purple orb — bottom-center */}
      <div
        className="orb-3 absolute rounded-full"
        style={{
          bottom: '5%', left: '38%',
          width: 550, height: 550,
          background: 'radial-gradient(circle, rgba(139,92,246,0.9) 0%, transparent 70%)',
          filter: 'blur(100px)',
          opacity: 0.07,
        }}
      />
    </div>
  );
}

function Home() {
  return (
    <>
      <Hero />
      {/* Divider banner */}
      <div className="py-14 relative overflow-hidden" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-[10px] font-bold tracking-[0.35em] uppercase mb-2" style={{ color: 'rgba(0,255,200,0.5)' }}>
            The EDGERIFT Ecosystem
          </p>
          <h2 className="text-2xl md:text-3xl font-extrabold tracking-tighter text-foreground">
            FROM LEARNING TO{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              LIVE EXECUTION
            </span>
          </h2>
          <p className="mt-3 text-sm text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Master quantitative finance through structured courses, then deploy proven algorithmic strategies into live markets.
          </p>
        </div>
      </div>
      <Courses />

      {/* Feature Cards: Simulator & Signals */}
      <section className="py-24 relative" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <p className="text-[10px] font-bold tracking-[0.35em] uppercase mb-2.5" style={{ color: 'rgba(59,130,246,0.55)' }}>
              Interactive Tools
            </p>
            <h2 className="text-4xl md:text-5xl font-black tracking-tighter mb-4">
              PRACTICE &{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-accent">
                FOLLOW
              </span>
            </h2>
            <p className="text-muted-foreground max-w-lg mx-auto text-sm leading-relaxed">
              Put your knowledge to the test with our prop-firm simulator, or follow along with live algorithmic signals.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Simulator Card */}
            <div
              className="rounded-2xl p-8 transition-all duration-300 hover:scale-[1.02] cursor-pointer group"
              style={{ background: 'rgba(7,17,31,0.7)', border: '1px solid rgba(0,255,200,0.15)', backdropFilter: 'blur(16px)' }}
              onClick={() => window.location.href = '/simulator'}
            >
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6" style={{ background: 'rgba(0,255,200,0.08)', border: '1px solid rgba(0,255,200,0.2)' }}>
                <svg className="w-7 h-7 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-extrabold text-foreground mb-3">Trading Simulator</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Prove your trading skills with realistic prop-firm challenges. Trade synthetic markets with strict risk management rules and compete on our leaderboard.
              </p>
              <div className="flex items-center gap-2 text-sm font-semibold text-primary group-hover:gap-3 transition-all">
                Start Challenge
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>

            {/* Signals Card */}
            <div
              className="rounded-2xl p-8 transition-all duration-300 hover:scale-[1.02] cursor-pointer group"
              style={{ background: 'rgba(7,17,31,0.7)', border: '1px solid rgba(139,92,246,0.15)', backdropFilter: 'blur(16px)' }}
              onClick={() => window.location.href = '/signals'}
            >
              <div className="w-14 h-14 rounded-xl flex items-center justify-center mb-6" style={{ background: 'rgba(139,92,246,0.08)', border: '1px solid rgba(139,92,246,0.2)' }}>
                <svg className="w-7 h-7 text-accent" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.111 16.404a5.5 5.5 0 017.778 0M12 20h.01m-7.08-7.071c3.904-3.905 10.236-3.905 14.141 0M1.394 9.393c5.857-5.857 15.355-5.857 21.213 0" />
                </svg>
              </div>
              <h3 className="text-2xl font-extrabold text-foreground mb-3">Live Signals</h3>
              <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                Follow real-time trading signals generated by our institutional-grade strategies. Learn systematic trading with momentum breakout and mean reversion setups.
              </p>
              <div className="flex items-center gap-2 text-sm font-semibold text-accent group-hover:gap-3 transition-all">
                View Signals
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      <Algos />
      <About />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="noise min-h-screen bg-background text-foreground font-sans antialiased flex flex-col">
          <BackgroundImage />
          <BackgroundOrbs />
          <Navigation />
          <div className="flex-1 flex flex-col md:pl-64 w-full relative z-10">
            <main className="flex-1 pt-[66px] md:pt-0">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/courses" element={<Courses />} />
                <Route path="/algos" element={<Algos />} />
                <Route path="/about" element={<About />} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/simulator" element={<SimulatorHome />} />
                <Route path="/simulator/trade" element={<SimulatorTrade />} />
                <Route path="/simulator/leaderboard" element={<SimulatorLeaderboard />} />
                <Route path="/signals" element={<Signals />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/privacy" element={<PrivacyPolicy />} />
                <Route path="/terms" element={<TermsOfService />} />
                <Route path="/risk" element={<RiskDisclaimer />} />
              </Routes>
            </main>
            <footer
              className="py-12 border-t mt-auto"
              style={{ borderColor: 'rgba(255,255,255,0.05)', background: 'rgba(3,10,20,0.85)' }}
            >
              <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row justify-between items-center gap-5">
                <div className="flex items-center space-x-1 font-black text-xl tracking-tighter">
                  <span className="text-primary">EDGE</span>
                  <span className="text-secondary">RIFT</span>
                </div>
                <p className="text-muted-foreground text-xs text-center">
                  &copy; {new Date().getFullYear()} EDGERIFT Quant Trading. All rights reserved. For educational purposes only.
                </p>
                <div className="flex gap-6 text-xs text-muted-foreground">
                  <Link to="/contact" className="hover:text-primary cursor-pointer transition-colors">Contact</Link>
                  <Link to="/privacy" className="hover:text-primary cursor-pointer transition-colors">Privacy</Link>
                  <Link to="/terms" className="hover:text-primary cursor-pointer transition-colors">Terms</Link>
                  <Link to="/risk" className="hover:text-[#f87171] cursor-pointer transition-colors">Risk Disclaimer</Link>
                </div>
              </div>
            </footer>
          </div>
        </div>
      </Router>
    </AuthProvider>
  );
}

