import { useState } from 'react';
import { Mail, MessageSquare, Send, CheckCircle, MapPin, Clock } from 'lucide-react';

const Github = ({ size = 24, ...props }: { size?: number; [key: string]: unknown }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
  </svg>
);

const Twitter = ({ size = 24, ...props }: { size?: number; [key: string]: unknown }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.747l7.73-8.835L1.254 2.25H8.08l4.259 5.63 5.905-5.63zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);
import { Button } from './ui/button';

const CONTACT_DETAILS = [
  {
    icon: Mail,
    color: '#00ffc8',
    label: 'Email',
    value: 'support@edgerift.com',
    href: 'mailto:support@edgerift.com',
  },
  {
    icon: Twitter,
    color: '#3b82f6',
    label: 'Twitter / X',
    value: '@EdgeRiftQuant',
    href: 'https://twitter.com/EdgeRiftQuant',
  },
  {
    icon: Github,
    color: '#8b5cf6',
    label: 'GitHub',
    value: 'github.com/edgerift',
    href: 'https://github.com/edgerift',
  },
  {
    icon: MessageSquare,
    color: '#f59e0b',
    label: 'Discord Community',
    value: 'Join our server',
    href: 'https://discord.gg/edgerift',
  },
];

const FAQ = [
  {
    q: 'How quickly do you respond to emails?',
    a: 'We aim to respond within 24–48 hours on business days. For urgent technical issues, Discord is the fastest channel.',
  },
  {
    q: 'I found a bug or data issue — how do I report it?',
    a: 'Open an issue on our GitHub repo or send a detailed email with steps to reproduce. Screenshots are very welcome.',
  },
  {
    q: 'Can I request a new course or strategy topic?',
    a: 'Absolutely. Use the contact form or reach out on Discord. Community-requested content gets prioritised.',
  },
  {
    q: 'Do you offer partnership or collaboration opportunities?',
    a: 'Yes — we are open to collaborations with quant developers, educators, and fintech products. Email us with details.',
  },
];

export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.message.trim()) return;
    setLoading(true);
    // Simulate network delay — replace with real API call
    await new Promise(r => setTimeout(r, 1200));
    setLoading(false);
    setSubmitted(true);
  };

  return (
    <section id="contact" className="py-24 relative min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        {/* ── Section header ── */}
        <div className="text-center mb-16">
          <p
            className="text-[10px] font-bold tracking-[0.35em] uppercase mb-2.5"
            style={{ color: 'rgba(0,255,200,0.55)' }}
          >
            Get In Touch
          </p>
          <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4">
            CONTACT{' '}
            <span
              className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-secondary"
            >
              US
            </span>
          </h1>
          <p className="text-muted-foreground max-w-lg mx-auto text-sm leading-relaxed">
            Questions about courses, strategies, or the platform? We read every message and reply as quickly as we can.
          </p>
        </div>

        {/* ── Main grid ── */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8 mb-16">

          {/* Contact details column */}
          <div className="lg:col-span-2 flex flex-col gap-5">
            <div
              className="rounded-2xl p-6"
              style={{ background: 'rgba(7,17,31,0.75)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)' }}
            >
              <h2 className="text-sm font-black tracking-widest uppercase text-muted-foreground mb-5">Direct Channels</h2>
              <div className="flex flex-col gap-4">
                {CONTACT_DETAILS.map(({ icon: Icon, color, label, value, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-4 p-3 rounded-xl transition-all duration-200 hover:bg-white/5 group"
                  >
                    <div
                      className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: `${color}14`, border: `1px solid ${color}30` }}
                    >
                      <Icon className="w-5 h-5" style={{ color }} />
                    </div>
                    <div>
                      <p className="text-[11px] text-muted-foreground font-semibold uppercase tracking-widest">{label}</p>
                      <p className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{value}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>

            {/* Availability notice */}
            <div
              className="rounded-2xl p-5 flex gap-4"
              style={{ background: 'rgba(0,255,200,0.04)', border: '1px solid rgba(0,255,200,0.12)' }}
            >
              <Clock className="w-5 h-5 text-primary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black text-primary uppercase tracking-wider mb-1">Response Times</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Email: 24–48 h &bull; Discord: usually same day &bull; GitHub issues: within 72 h
                </p>
              </div>
            </div>

            {/* Location */}
            <div
              className="rounded-2xl p-5 flex gap-4"
              style={{ background: 'rgba(7,17,31,0.75)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)' }}
            >
              <MapPin className="w-5 h-5 text-secondary shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-black text-secondary uppercase tracking-wider mb-1">Based</p>
                <p className="text-xs text-muted-foreground leading-relaxed">
                  Fully remote team &mdash; serving traders worldwide across all time zones.
                </p>
              </div>
            </div>
          </div>

          {/* Contact form column */}
          <div className="lg:col-span-3">
            <div
              className="rounded-2xl p-8"
              style={{ background: 'rgba(7,17,31,0.75)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)' }}
            >
              {submitted ? (
                <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                  <CheckCircle className="w-14 h-14 text-primary" />
                  <h3 className="text-xl font-black text-foreground">Message Sent!</h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    Thanks for reaching out. We&apos;ll get back to you within 24–48 hours.
                  </p>
                  <button
                    onClick={() => { setSubmitted(false); setForm({ name: '', email: '', subject: '', message: '' }); }}
                    className="mt-2 text-xs text-primary underline underline-offset-4 hover:opacity-80 transition-opacity"
                  >
                    Send another message
                  </button>
                </div>
              ) : (
                <>
                  <h2 className="text-sm font-black tracking-widest uppercase text-muted-foreground mb-6">Send a Message</h2>
                  <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Name *</label>
                        <input
                          type="text"
                          name="name"
                          value={form.name}
                          onChange={handleChange}
                          required
                          placeholder="Your name"
                          className="w-full px-4 py-2.5 rounded-xl text-sm text-foreground placeholder-muted-foreground/50 outline-none focus:ring-1 transition-all"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)', focusRingColor: '#00ffc8' } as React.CSSProperties}
                          onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,255,200,0.45)')}
                          onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)')}
                        />
                      </div>
                      <div className="flex flex-col gap-1.5">
                        <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Email *</label>
                        <input
                          type="email"
                          name="email"
                          value={form.email}
                          onChange={handleChange}
                          required
                          placeholder="you@example.com"
                          className="w-full px-4 py-2.5 rounded-xl text-sm text-foreground placeholder-muted-foreground/50 outline-none transition-all"
                          style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
                          onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,255,200,0.45)')}
                          onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)')}
                        />
                      </div>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Subject</label>
                      <select
                        name="subject"
                        value={form.subject}
                        onChange={handleChange}
                        className="w-full px-4 py-2.5 rounded-xl text-sm text-foreground outline-none transition-all appearance-none cursor-pointer"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
                        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,255,200,0.45)')}
                        onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)')}
                      >
                        <option value="" style={{ background: '#070f1e' }}>Select a topic…</option>
                        <option value="general" style={{ background: '#070f1e' }}>General Enquiry</option>
                        <option value="courses" style={{ background: '#070f1e' }}>Courses & Content</option>
                        <option value="simulator" style={{ background: '#070f1e' }}>Simulator / Platform</option>
                        <option value="signals" style={{ background: '#070f1e' }}>Signals & Strategies</option>
                        <option value="bug" style={{ background: '#070f1e' }}>Bug Report</option>
                        <option value="partnership" style={{ background: '#070f1e' }}>Partnership</option>
                        <option value="billing" style={{ background: '#070f1e' }}>Billing</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1.5">
                      <label className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Message *</label>
                      <textarea
                        name="message"
                        value={form.message}
                        onChange={handleChange}
                        required
                        rows={5}
                        placeholder="Tell us how we can help…"
                        className="w-full px-4 py-2.5 rounded-xl text-sm text-foreground placeholder-muted-foreground/50 outline-none resize-none transition-all"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.09)' }}
                        onFocus={e => (e.currentTarget.style.borderColor = 'rgba(0,255,200,0.45)')}
                        onBlur={e => (e.currentTarget.style.borderColor = 'rgba(255,255,255,0.09)')}
                      />
                    </div>

                    <button
                      type="submit"
                      disabled={loading}
                      className="mt-1 flex items-center justify-center gap-2 w-full py-3 rounded-xl font-black text-sm uppercase tracking-widest transition-all duration-200 disabled:opacity-60"
                      style={{ background: 'linear-gradient(135deg, #00ffc8, #3b82f6)', color: '#030a14' }}
                    >
                      {loading ? (
                        <>
                          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                          </svg>
                          Sending…
                        </>
                      ) : (
                        <>
                          <Send className="w-4 h-4" />
                          Send Message
                        </>
                      )}
                    </button>
                  </form>
                </>
              )}
            </div>
          </div>
        </div>

        {/* ── FAQ accordion ── */}
        <div
          className="rounded-2xl p-8"
          style={{ background: 'rgba(7,17,31,0.75)', border: '1px solid rgba(255,255,255,0.07)', backdropFilter: 'blur(16px)' }}
        >
          <h2 className="text-sm font-black tracking-widest uppercase text-muted-foreground mb-6">Frequently Asked Questions</h2>
          <div className="flex flex-col divide-y" style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
            {FAQ.map((item, i) => (
              <div key={i} className="py-4">
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="flex items-center justify-between w-full text-left gap-4 group"
                >
                  <span className="text-sm font-bold text-foreground group-hover:text-primary transition-colors">{item.q}</span>
                  <span
                    className="text-muted-foreground transition-transform duration-200 shrink-0 text-lg leading-none"
                    style={{ transform: openFaq === i ? 'rotate(45deg)' : 'rotate(0deg)' }}
                  >
                    +
                  </span>
                </button>
                {openFaq === i && (
                  <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{item.a}</p>
                )}
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
