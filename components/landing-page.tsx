'use client';

import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface LandingPageProps {
  onLogin:    () => void;
  onRegister: () => void;
}

// Words cycling in the hero — each with its color + background tint
const WORDS = [
  { text: 'VAMP',      color: '#ef4444', bg: 'rgba(239,68,68,0.06)'   },
  { text: 'VOLUME',    color: '#3b82f6', bg: 'rgba(59,130,246,0.06)'  },
  { text: 'WALLETS',   color: '#22c55e', bg: 'rgba(34,197,94,0.06)'   },
  { text: 'PORTFOLIO', color: '#f59e0b', bg: 'rgba(245,158,11,0.06)'  },
];

export function LandingPage({ onLogin, onRegister }: LandingPageProps) {
  const [wordIdx, setWordIdx]   = useState(0);
  const [displayed, setDisplayed] = useState('');
  const [phase, setPhase]       = useState<'typing'|'hold'|'erasing'>('typing');
  const timerRef                = useRef<ReturnType<typeof setTimeout>>();

  const currentWord  = WORDS[wordIdx];
  const fullText     = currentWord.text;

  // Typewriter engine
  useEffect(() => {
    clearTimeout(timerRef.current);

    if (phase === 'typing') {
      if (displayed.length < fullText.length) {
        timerRef.current = setTimeout(() => setDisplayed(fullText.slice(0, displayed.length + 1)), 80);
      } else {
        timerRef.current = setTimeout(() => setPhase('hold'), 1800);
      }
    } else if (phase === 'hold') {
      timerRef.current = setTimeout(() => setPhase('erasing'), 600);
    } else if (phase === 'erasing') {
      if (displayed.length > 0) {
        timerRef.current = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 45);
      } else {
        const next = (wordIdx + 1) % WORDS.length;
        setWordIdx(next);
        setPhase('typing');
      }
    }
    return () => clearTimeout(timerRef.current);
  }, [phase, displayed, fullText, wordIdx]);

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#000' }}>

      {/* Animated gradient bg — shifts color with the word */}
      <div
        className="fixed inset-0 transition-all duration-1000 pointer-events-none"
        style={{ background: `radial-gradient(ellipse 80% 60% at 50% 30%, ${currentWord.bg}, transparent 70%)` }}
      />

      {/* Subtle grid */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.03]"
        style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '60px 60px' }} />

      {/* Header */}
      <header className="relative z-10 px-8 py-6 flex items-center justify-between border-b border-white/5">
        <div className="flex items-center gap-3">
          <img src="/vamp-fangs-silver.png" alt="" className="w-7 h-7" style={{ mixBlendMode: 'screen' }} />
          <span className="text-lg font-mono font-black text-white tracking-widest">DEV TOOL ASSISTANT</span>
        </div>
        <nav className="flex items-center gap-3">
          <button onClick={onLogin}
            className="px-5 py-2 rounded-xl border border-white/20 text-white/70 text-sm font-mono font-bold hover:border-white/40 hover:text-white transition-all">
            Login
          </button>
          <button onClick={onRegister}
            className="px-5 py-2 rounded-xl bg-white text-black text-sm font-mono font-bold hover:bg-white/90 transition-all">
            Register
          </button>
        </nav>
      </header>

      {/* Hero */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 -mt-16">

        {/* Badge */}
        <div className="mb-8 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-white/50 text-xs font-mono tracking-widest">
          Advanced Solana Dev Tools
        </div>

        {/* Main headline */}
        <h1 className="text-6xl md:text-8xl font-black text-white leading-tight mb-4 select-none">
          Deploy & Scale
        </h1>

        {/* Animated word */}
        <div className="h-20 md:h-28 flex items-center justify-center mb-6">
          <span
            className="text-6xl md:text-8xl font-black transition-colors duration-500 font-mono"
            style={{ color: currentWord.color, textShadow: `0 0 60px ${currentWord.color}55` }}
          >
            {displayed}
            {/* Cursor */}
            <span
              className="inline-block w-1 ml-1 align-middle animate-pulse"
              style={{ background: currentWord.color, height: '0.85em', verticalAlign: 'middle' }}
            />
          </span>
        </div>

        <p className="text-white/40 text-lg md:text-xl max-w-lg mx-auto mb-12 leading-relaxed">
          Launch tokens, simulate volume, manage wallets and track positions — all in one place.
        </p>

        {/* CTA Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-4">
          <button
            onClick={onRegister}
            className="px-10 py-4 rounded-2xl text-black font-black text-lg transition-all hover:scale-105 active:scale-95"
            style={{ background: currentWord.color, boxShadow: `0 0 40px ${currentWord.color}55` }}
          >
            Get Started
          </button>
          <button
            onClick={onLogin}
            className="px-10 py-4 rounded-2xl border-2 border-white/20 text-white font-bold text-lg hover:border-white/40 hover:bg-white/5 transition-all"
          >
            Login
          </button>
          {/* Docs — disabled */}
          <button
            disabled
            title="Coming soon"
            className="px-10 py-4 rounded-2xl border border-white/8 text-white/25 font-bold text-lg cursor-not-allowed select-none"
          >
            Docs
          </button>
        </div>

        {/* Stats row */}
        <div className="mt-20 flex flex-col sm:flex-row items-center gap-8 text-center">
          {[
            { label: 'Tokens Launched', value: '—' },
            { label: 'Volume Sessions', value: '—' },
            { label: 'Active Users', value: '—' },
          ].map(s => (
            <div key={s.label}>
              <div className="text-3xl font-black text-white">{s.value}</div>
              <div className="text-white/30 text-sm mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-6 text-white/15 text-xs font-mono">
        © 2026 Dev Tool Assistant
      </footer>
    </div>
  );
}
