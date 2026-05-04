import { Shield, Database, Cookie, Trash2, CheckCircle2, Send, TrendingUp } from 'lucide-react';

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full mb-6 text-xs font-bold tracking-widest uppercase"
               style={{ background: 'rgba(0,255,200,0.07)', border: '1px solid rgba(0,255,200,0.22)', color: '#00ffc8' }}>
            <Shield className="h-3.5 w-3.5" />
            <span>Legal</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-4">
            Privacy{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary">
              Policy
            </span>
          </h1>
          <p className="text-muted-foreground max-w-xl mx-auto text-sm leading-relaxed">
            Last updated: May 2026
          </p>
        </div>

        {/* Content */}
        <div className="space-y-8">
          <section className="rounded-2xl p-8" style={{ background: 'rgba(7,17,31,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}>
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              1. Data We Collect
            </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-foreground mb-1">Account data</div>
                <p className="text-sm text-muted-foreground">username, email address, encrypted password</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-foreground mb-1">Usage data</div>
                <p className="text-sm text-muted-foreground">pages visited, simulator activity, trades placed (simulated only)</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-foreground mb-1">No payment information</div>
                <p className="text-sm text-muted-foreground">is collected or stored</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl p-8" style={{ background: 'rgba(7,17,31,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-secondary" />
            2. How We Use Your Data
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-foreground mb-1">To operate your account and provide platform features</div>
                <p className="text-sm text-muted-foreground">We use your data to authenticate you, save your progress, and deliver the features you request.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="text font-semibold text-foreground mb-1">To track simulator challenge progress and leaderboard rankings</div>
                <p className="text-sm text-muted-foreground">Your simulator performance data is used to calculate rankings and show your position on the leaderboard.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-foreground mb-1">To send trading signals if you opt in to Telegram alerts</div>
                <p className="text-sm text-muted-foreground">If you enable Telegram notifications, we send signals to your Telegram channel via our bot.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-foreground mb-1">We do not sell your data to third parties</div>
                <p className="text-sm text-muted-foreground">Your data is never sold, rented, or shared with advertisers or data brokers.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl p-8" style={{ background: 'rgba(7,17,31,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Database className="h-5 w-5 text-primary" />
            3. Data Storage
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-foreground mb-1">Your data is stored in a secured database</div>
                <p className="text-sm text-muted-foreground">We use industry-standard encryption and security practices to protect your information.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-foreground mb-1">Passwords are hashed using bcrypt</div>
                <p className="text-sm text-muted-foreground">Your password is never stored in plain text. We use bcrypt with 12 rounds of hashing.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-foreground mb-1">JWTs expire after 7 days</div>
                <p className="text-sm text-muted-foreground">Your session tokens automatically expire after 7 days for security.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl p-8" style={{ background: 'rgba(7,17,31,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Cookie className="h-5 w-5 text-accent" />
            4. Cookies
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-foreground mb-1">We use localStorage to store your session token</div>
                <p className="text-sm text-muted-foreground">Your authentication token is stored locally in your browser so you stay logged in between sessions.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-foreground mb-1">We do not use tracking cookies or third-party advertising cookies</div>
                <p className="text-sm text-muted-foreground">We do not track your browsing behavior or serve targeted advertisements.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl p-8" style={{ background: 'rgba(7,17,31,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Send className="h-5 w-5 text-secondary" />
            5. Third-Party Services
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-foreground mb-1">If you subscribe to Telegram alerts</div>
                <p className="text-sm text-muted-foreground">Your Telegram channel membership is governed by Telegram's own privacy policy.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl p-8" style={{ background: 'rgba(7,17,31,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Trash2 className="h-5 w-5 text-red-400" />
            6. Your Rights
          </h2>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-foreground mb-1">You may request deletion of your account and all associated data at any time</div>
                <p className="text-sm text-muted-foreground">Contact us via the platform's contact page to request account deletion. Simulator trade history will be permanently deleted upon request.</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle2 className="h-5 w-5 text-primary shrink-0 mt-0.5" />
              <div>
                <div className="text-sm font-semibold text-foreground mb-1">You can export your data</div>
                <p className="text-sm text-muted-foreground">We provide a way to export all your personal data in a machine-readable format upon request.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-2xl p-8" style={{ background: 'rgba(7,17,31,0.7)', border: '1px solid rgba(255,255,255,0.06)' }}>
          <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
            <Send className="h-5 w-5 text-secondary" />
            7. Contact
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            For privacy concerns, contact us via the platform's contact page or email us at privacy@edgerift.com
          </p>
        </section>
        </div>
      </div>
    </div>
  );
}
