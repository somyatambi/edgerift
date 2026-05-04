import { useState } from 'react';
import { Mail, Lock, User, ArrowRight, Activity, AlertCircle, CheckCircle2 } from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

export default function Auth() {
  const { login, register, user } = useAuth();
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });

  // Already authenticated
  if (user) {
    return (
      <div className="min-h-screen flex items-center justify-center py-20 px-4">
        <div className="text-center">
          <CheckCircle2 className="h-14 w-14 text-primary mx-auto mb-4" />
          <h2 className="text-2xl font-extrabold mb-2">You're signed in</h2>
          <p className="text-muted-foreground mb-1">
            Welcome back, <span className="text-primary font-semibold">{user.username}</span>
          </p>
          <p className="text-xs text-muted-foreground mb-6">{user.email}</p>
          <Button onClick={() => navigate('/')}>Back to Home</Button>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setIsLoading(true);
    try {
      const result = isLogin
        ? await login(formData.email, formData.password)
        : await register(formData.username, formData.email, formData.password);

      if (result.error) {
        setError(result.error);
      } else {
        setSuccess(isLogin ? 'Welcome back! Redirecting…' : 'Account created! Redirecting…');
        setTimeout(() => navigate('/'), 900);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
  };

  const switchMode = (login: boolean) => {
    setIsLogin(login);
    setError('');
    setSuccess('');
  };

  return (
    <div className="min-h-screen flex items-center justify-center py-20 px-4 relative">
      <div className="w-full max-w-md relative z-10">

        {/* Main card */}
        <div className="rounded-2xl p-8 card-glass-primary">

          {/* Logo + heading */}
          <div className="text-center mb-7">
            <div
              className="inline-flex items-center justify-center w-14 h-14 rounded-xl mb-4"
              style={{ background: 'rgba(0,255,200,0.08)', border: '1px solid rgba(0,255,200,0.2)' }}
            >
              <Activity className="h-7 w-7 text-primary" />
            </div>
            <h2 className="text-2xl font-extrabold text-foreground tracking-tight">
              {isLogin ? 'Welcome Back' : 'Join EDGERIFT'}
            </h2>
            <p className="mt-1.5 text-sm text-muted-foreground">
              {isLogin
                ? 'Access your strategies and courses'
                : 'Start your systematic trading journey'}
            </p>
          </div>

          {/* Tab toggle */}
          <div
            className="flex rounded-xl p-1 mb-6"
            style={{ background: 'rgba(255,255,255,0.04)' }}
          >
            {[{ label: 'Sign In', active: isLogin }, { label: 'Create Account', active: !isLogin }].map(
              (tab, i) => (
                <button
                  key={tab.label}
                  onClick={() => switchMode(i === 0)}
                  className={`flex-1 py-2.5 rounded-lg text-sm font-bold transition-all ${
                    tab.active
                      ? 'bg-primary text-primary-foreground shadow'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              )
            )}
          </div>

          {/* Feedback banners */}
          {error && (
            <div
              className="flex items-start gap-2.5 p-3.5 rounded-xl mb-5 text-sm"
              style={{ background: 'rgba(239,68,68,0.07)', border: '1px solid rgba(239,68,68,0.2)', color: '#f87171' }}
            >
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}
          {success && (
            <div
              className="flex items-center gap-2.5 p-3.5 rounded-xl mb-5 text-sm"
              style={{ background: 'rgba(0,255,200,0.07)', border: '1px solid rgba(0,255,200,0.2)', color: '#00ffc8' }}
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" />
              {success}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="text-xs font-semibold text-muted-foreground mb-1.5 block" htmlFor="username">
                  Username
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="username" name="username" type="text"
                    required={!isLogin} value={formData.username} onChange={handleChange}
                    className="pl-10" placeholder="trading_pro"
                    autoComplete="username"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block" htmlFor="email">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="email" name="email" type="email"
                  autoComplete="email" required
                  value={formData.email} onChange={handleChange}
                  className="pl-10" placeholder="quant@example.com"
                />
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block" htmlFor="password">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="password" name="password" type="password"
                  autoComplete={isLogin ? 'current-password' : 'new-password'} required
                  value={formData.password} onChange={handleChange}
                  className="pl-10"
                  placeholder={isLogin ? '••••••••' : 'Min. 6 characters'}
                />
              </div>
            </div>

            <Button type="submit" className="w-full mt-1" size="lg" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                  </svg>
                  {isLogin ? 'Signing in…' : 'Creating account…'}
                </span>
              ) : (
                <>
                  {isLogin ? 'Sign In' : 'Create Account'}
                  <ArrowRight className="ml-2 h-4 w-4" />
                </>
              )}
            </Button>
          </form>

          <p className="mt-5 text-center text-[11px] text-muted-foreground">
            By continuing you agree to our{' '}
            <span className="text-primary/80 cursor-pointer hover:text-primary transition-colors">Terms</span>
            {' '}and{' '}
            <span className="text-primary/80 cursor-pointer hover:text-primary transition-colors">Privacy Policy</span>
          </p>
        </div>

        {/* Quick stats below the card */}
        <div className="mt-5 grid grid-cols-3 gap-3">
          {[
            { value: '3+', label: 'Live Strategies' },
            { value: '15+', label: 'Course Modules' },
            { value: '85%', label: 'Backtest Win Rate' },
          ].map((s) => (
            <div key={s.label} className="text-center p-3.5 rounded-xl card-glass">
              <div className="text-base font-black text-primary">{s.value}</div>
              <div className="text-[10px] text-muted-foreground mt-0.5 leading-tight">{s.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

