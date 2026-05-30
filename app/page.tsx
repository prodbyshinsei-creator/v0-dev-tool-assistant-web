'use client';

import { useState, useEffect, useRef } from 'react';
import { InteractiveShaderBackground } from '@/components/interactive-shader';
import { VampModal }      from '@/components/vamp-modal';
import { VolumeModal }    from '@/components/volume-modal';
import { WalletsModal }   from '@/components/wallets-modal';
import { PortfolioModal } from '@/components/portfolio-modal';
import { LandingPage }    from '@/components/landing-page';
import { AuthModal }      from '@/components/auth-modal';
import { AdminPanel }     from '@/components/admin-panel';
import { getAuthUser, clearAuthUser, changePassword, AuthUser, trackPageView } from '@/lib/auth';
import { LogOut, User, Lock, ChevronDown, X, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

/* ─── Animated SVG Icons ─────────────────────────────────────────── */

function VampIcon() {
  return (
    <svg viewBox="0 0 64 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <style>{`
        @keyframes bite {
          0%,100% { transform: translateY(0px); }
          40%,60% { transform: translateY(8px); }
        }
        @keyframes jawOpen {
          0%,100% { transform: translateY(0px); }
          40%,60% { transform: translateY(-6px); }
        }
        @keyframes glowPulse {
          0%,100% { opacity:0.4; }
          50%      { opacity:1; }
        }
        .fang-top { animation: bite 2.2s ease-in-out infinite; transform-origin: center top; }
        .fang-bot { animation: jawOpen 2.2s ease-in-out infinite; transform-origin: center bottom; }
        .glow     { animation: glowPulse 2.2s ease-in-out infinite; }
      `}</style>
      {/* Glow */}
      <ellipse cx="32" cy="28" rx="20" ry="14" fill="currentColor" className="glow" opacity="0.12"/>
      {/* Top jaw */}
      <g className="fang-top">
        <rect x="10" y="18" width="44" height="6" rx="3" fill="currentColor" opacity="0.9"/>
        {/* Main fangs */}
        <polygon points="20,24 24,38 28,24" fill="currentColor"/>
        <polygon points="36,24 40,38 44,24" fill="currentColor"/>
        {/* Small teeth */}
        <polygon points="13,24 15,30 17,24" fill="currentColor" opacity="0.7"/>
        <polygon points="47,24 49,30 51,24" fill="currentColor" opacity="0.7"/>
        <polygon points="28,24 30,29 32,24" fill="currentColor" opacity="0.6"/>
        <polygon points="32,24 34,29 36,24" fill="currentColor" opacity="0.6"/>
      </g>
      {/* Bottom jaw */}
      <g className="fang-bot">
        <rect x="10" y="32" width="44" height="6" rx="3" fill="currentColor" opacity="0.7"/>
        {/* Bottom teeth (shorter) */}
        <polygon points="16,32 18,26 20,32" fill="currentColor" opacity="0.6"/>
        <polygon points="22,32 24,27 26,32" fill="currentColor" opacity="0.5"/>
        <polygon points="38,32 40,27 42,32" fill="currentColor" opacity="0.5"/>
        <polygon points="44,32 46,26 48,32" fill="currentColor" opacity="0.6"/>
      </g>
      {/* Blood drips */}
      <ellipse cx="26" cy="41" rx="2" ry="3" fill="currentColor" opacity="0.5"/>
      <ellipse cx="40" cy="43" rx="1.5" ry="2.5" fill="currentColor" opacity="0.4"/>
    </svg>
  );
}

function VolumeIcon() {
  // Animated candlestick bars
  const bars = [
    { x: 4,  h: 24, y: 12, green: true,  wick_top: 8,  wick_bot: 40, delay: '0s'    },
    { x: 14, h: 18, y: 18, green: false, wick_top: 12, wick_bot: 40, delay: '0.2s'  },
    { x: 24, h: 28, y: 8,  green: true,  wick_top: 4,  wick_bot: 40, delay: '0.4s'  },
    { x: 34, h: 16, y: 16, green: false, wick_top: 10, wick_bot: 36, delay: '0.1s'  },
    { x: 44, h: 22, y: 10, green: true,  wick_top: 6,  wick_bot: 36, delay: '0.3s'  },
    { x: 54, h: 20, y: 14, green: false, wick_top: 10, wick_bot: 38, delay: '0.5s'  },
  ];
  return (
    <svg viewBox="0 0 68 52" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <style>{`
        @keyframes candleGrow {
          0%,100% { transform: scaleY(1);   opacity: 0.9; }
          50%      { transform: scaleY(0.6); opacity: 0.6; }
        }
        .candle { transform-box: fill-box; transform-origin: center; }
      `}</style>
      {bars.map((b, i) => (
        <g key={i}>
          {/* Wick */}
          <line x1={b.x+4} y1={b.wick_top} x2={b.x+4} y2={b.wick_bot}
            stroke={b.green ? '#22c55e' : '#ef4444'} strokeWidth="1.5" opacity="0.6"/>
          {/* Body */}
          <rect className="candle" x={b.x} y={b.y} width="8" height={b.h} rx="1.5"
            fill={b.green ? '#22c55e' : '#ef4444'} opacity="0.9"
            style={{ animation: `candleGrow 1.8s ease-in-out ${b.delay} infinite` }}/>
        </g>
      ))}
    </svg>
  );
}

function WalletsIcon() {
  // Animated cards fanning out
  return (
    <svg viewBox="0 0 64 52" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <style>{`
        @keyframes fanCard1 {
          0%,100% { transform: rotate(0deg) translateY(0px); }
          50%      { transform: rotate(-14deg) translateY(-4px); }
        }
        @keyframes fanCard3 {
          0%,100% { transform: rotate(0deg) translateY(0px); }
          50%      { transform: rotate(14deg) translateY(-4px); }
        }
        @keyframes floatCard2 {
          0%,100% { transform: translateY(0px); }
          50%      { transform: translateY(-5px); }
        }
        .card1 { transform-box: fill-box; transform-origin: center bottom; animation: fanCard1 2.4s ease-in-out infinite; }
        .card2 { transform-box: fill-box; transform-origin: center bottom; animation: floatCard2 2.4s ease-in-out infinite; }
        .card3 { transform-box: fill-box; transform-origin: center bottom; animation: fanCard3 2.4s ease-in-out 0.1s infinite; }
      `}</style>
      {/* Card 1 — left/back */}
      <rect className="card1" x="4" y="14" width="38" height="26" rx="5" fill="#3b82f6" opacity="0.7"/>
      <line x1="4" y1="22" x2="42" y2="22" stroke="white" strokeWidth="4" opacity="0.2" className="card1"/>
      {/* Card 3 — right/back */}
      <rect className="card3" x="22" y="14" width="38" height="26" rx="5" fill="#22c55e" opacity="0.7"/>
      {/* Card 2 — front/center */}
      <rect className="card2" x="13" y="10" width="38" height="28" rx="5" fill="#f8f8f8" opacity="0.95"/>
      <line x1="13" y1="19" x2="51" y2="19" stroke="#1a1a1a" strokeWidth="4" opacity="0.12"/>
      <rect x="17" y="24" width="14" height="3" rx="1.5" fill="#1a1a1a" opacity="0.15" className="card2"/>
      <rect x="35" y="24" width="10" height="3" rx="1.5" fill="#22c55e" opacity="0.5" className="card2"/>
      {/* Chip */}
      <rect x="17" y="13" width="8" height="6" rx="1.5" fill="#f59e0b" opacity="0.8" className="card2"/>
    </svg>
  );
}

function PortfolioIcon() {
  return (
    <svg viewBox="0 0 72 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <style>{`
        @keyframes drawLine {
          0%   { stroke-dashoffset: 140; opacity:0.5; }
          60%  { stroke-dashoffset: 0;   opacity:1;   }
          100% { stroke-dashoffset: 0;   opacity:1;   }
        }
        @keyframes fadeArea {
          0%,30% { opacity:0; }
          80%    { opacity:0.18; }
          100%   { opacity:0.18; }
        }
        .chart-line { stroke-dasharray:140; animation: drawLine 3s ease-out infinite; }
        .chart-area { animation: fadeArea 3s ease-out infinite; }
      `}</style>
      {/* Grid lines */}
      <line x1="4" y1="36" x2="68" y2="36" stroke="currentColor" strokeWidth="0.5" opacity="0.2"/>
      <line x1="4" y1="24" x2="68" y2="24" stroke="currentColor" strokeWidth="0.5" opacity="0.1"/>
      <line x1="4" y1="12" x2="68" y2="12" stroke="currentColor" strokeWidth="0.5" opacity="0.1"/>
      {/* Area fill */}
      <path className="chart-area"
        d="M4,32 L14,28 L24,30 L34,18 L44,22 L54,10 L64,14 L64,36 L4,36 Z"
        fill="currentColor"/>
      {/* Line */}
      <polyline className="chart-line"
        points="4,32 14,28 24,30 34,18 44,22 54,10 64,14"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      {/* Dot at end */}
      <circle cx="64" cy="14" r="3" fill="currentColor" opacity="0.9">
        <animate attributeName="r" values="3;4.5;3" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.9;0.5;0.9" dur="2s" repeatCount="indefinite"/>
      </circle>
    </svg>
  );
}

/* ─── Main Component ──────────────────────────────────────────────── */
export default function Home() {
  const [user, setUser]               = useState<AuthUser | null>(null);
  const [authMode, setAuthMode]       = useState<'login'|'register'|null>(null);
  const [activeModal, setActiveModal] = useState<'vamp'|'volume'|'wallets'|'portfolio'|null>(null);
  const [hydrated, setHydrated]       = useState(false);
  const [adminOpen, setAdminOpen]     = useState(false);
  const [cabinetOpen, setCabinetOpen] = useState(false);
  const [changingPwd, setChangingPwd] = useState(false);
  const [oldPwd, setOldPwd]           = useState('');
  const [newPwd, setNewPwd]           = useState('');
  const [showPwd, setShowPwd]         = useState(false);
  const [pwdMsg, setPwdMsg]           = useState('');
  const [pwdErr, setPwdErr]           = useState('');
  const [pwdLoading, setPwdLoading]   = useState(false);
  const cabinetRef                    = useRef<HTMLDivElement>(null);

  useEffect(() => { setUser(getAuthUser()); setHydrated(true); trackPageView(); }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (cabinetRef.current && !cabinetRef.current.contains(e.target as Node))
        { setCabinetOpen(false); setChangingPwd(false); }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleAuthSuccess = () => { setUser(getAuthUser()); setAuthMode(null); };
  const handleLogout = () => { clearAuthUser(); setUser(null); setCabinetOpen(false); };

  const handleChangePwd = async () => {
    if (!user || !oldPwd || !newPwd) return;
    if (newPwd.length < 8) { setPwdErr('Min 8 characters'); return; }
    setPwdLoading(true); setPwdErr(''); setPwdMsg('');
    const r = await changePassword(user.id, oldPwd, newPwd);
    setPwdLoading(false);
    if (!r.ok) { setPwdErr(r.error || 'Error'); return; }
    setPwdMsg('Password changed!'); setOldPwd(''); setNewPwd('');
    setTimeout(() => { setChangingPwd(false); setPwdMsg(''); }, 2000);
  };

  if (!hydrated) return null;

  if (!user) {
    return (
      <>
        <LandingPage onLogin={() => setAuthMode('login')} onRegister={() => setAuthMode('register')} />
        {authMode && <AuthModal mode={authMode} onSuccess={handleAuthSuccess}
          onSwitchMode={m => setAuthMode(m)} onClose={() => setAuthMode(null)} />}
      </>
    );
  }

  const displayName = user.authMethod === 'wallet' && user.walletAddress
    ? user.walletAddress.slice(0,6) + '…' + user.walletAddress.slice(-4)
    : user.email;

  return (
    <div className="min-h-screen overflow-hidden">
      <InteractiveShaderBackground />

      {/* Header — z-[200] so dropdown is always on top of grid */}
      <div className="relative z-[200] border-b border-white/8 bg-black backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 text-white/80" style={{ mixBlendMode: 'screen' }}>
              <VampIcon />
            </div>
            <span className="text-lg font-mono font-black text-white tracking-widest">DEV TOOL ASSISTANT</span>
          </div>

          {/* Cabinet — entire component at z-[200] */}
          <div className="relative" ref={cabinetRef}>
            <button onClick={() => setCabinetOpen(v => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/15 hover:border-white/30 bg-white/5 transition-all">
              <div className={cn('w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0',
                user.isAdmin ? 'bg-yellow-400/20 border-yellow-400/40' : 'bg-red-500/20 border-red-500/30')}>
                {user.isAdmin ? <Shield className="w-3 h-3 text-yellow-400" /> : <User className="w-3 h-3 text-red-400" />}
              </div>
              <span className="text-sm text-white/70 font-mono max-w-[150px] truncate">{displayName}</span>
              {user.isAdmin && <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-400/20 text-yellow-400 font-bold flex-shrink-0">ADMIN</span>}
              <ChevronDown className={cn('w-4 h-4 text-white/40 transition-transform flex-shrink-0', cabinetOpen && 'rotate-180')} />
            </button>

            {/* Dropdown — z-[300] guarantees it's above everything */}
            {cabinetOpen && (
              <>
                {/* Invisible backdrop catches clicks outside */}
                <div className="fixed inset-0 z-[290]" onClick={() => setCabinetOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-72 bg-black border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-[300]">
                  <div className="p-4 border-b border-white/8">
                    <div className="text-xs text-white/40 mb-1 flex items-center gap-1.5">
                      Logged in as
                      {user.isAdmin && <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-400/20 text-yellow-400 font-bold">ADMIN</span>}
                    </div>
                    <div className="text-white font-bold text-sm truncate">{displayName}</div>
                  </div>

                  {!changingPwd ? (
                    <div className="p-3 space-y-1">
                      {user.isAdmin && (
                        <button
                          onMouseDown={e => { e.stopPropagation(); setAdminOpen(true); setCabinetOpen(false); }}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-yellow-400/10 text-yellow-400/70 hover:text-yellow-400 transition-all text-sm font-bold cursor-pointer">
                          <Shield className="w-4 h-4" /> Admin Panel
                        </button>
                      )}
                      {user.authMethod !== 'wallet' && (
                        <button onMouseDown={() => setChangingPwd(true)}
                          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/8 text-white/60 hover:text-white transition-all text-sm cursor-pointer">
                          <Lock className="w-4 h-4" /> Change Password
                        </button>
                      )}
                      <button onMouseDown={handleLogout}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 text-red-400/60 hover:text-red-400 transition-all text-sm cursor-pointer">
                        <LogOut className="w-4 h-4" /> Logout
                      </button>
                    </div>
                  ) : (
                    <div className="p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">Change Password</span>
                        <button onClick={() => setChangingPwd(false)} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
                      </div>
                      {pwdMsg && <div className="text-xs text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3"/>{pwdMsg}</div>}
                      {pwdErr && <div className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{pwdErr}</div>}
                      <div className="relative">
                        <input type={showPwd?'text':'password'} value={oldPwd} onChange={e=>setOldPwd(e.target.value)}
                          placeholder="Current password"
                          className="w-full bg-white/5 border border-white/15 text-white rounded-xl px-3 pr-9 h-9 text-sm focus:outline-none"/>
                        <button onClick={()=>setShowPwd(v=>!v)} className="absolute right-2.5 top-2 text-white/30">
                          {showPwd?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
                        </button>
                      </div>
                      <input type={showPwd?'text':'password'} value={newPwd} onChange={e=>setNewPwd(e.target.value)}
                        placeholder="New password (8+)"
                        className="w-full bg-white/5 border border-white/15 text-white rounded-xl px-3 h-9 text-sm focus:outline-none"/>
                      <button onClick={handleChangePwd} disabled={!oldPwd||!newPwd||pwdLoading}
                        className="w-full h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm disabled:opacity-50 transition-all">
                        {pwdLoading?<Loader2 className="w-4 h-4 animate-spin mx-auto"/>:'Update Password'}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Dashboard Grid ── */}
      <div className="relative z-10 h-[calc(100vh-64px)] p-4 flex gap-4">

        {/* LEFT: VAMP */}
        <button onClick={() => setActiveModal('vamp')}
          className="group flex-[1.2] flex flex-col items-center justify-center rounded-3xl bg-black/50 border border-white/10 hover:border-red-500/40 hover:bg-red-500/5 transition-all duration-300 overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-red-500/8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"/>
          <div className="w-24 h-20 text-red-400 mb-4 transition-all duration-300 group-hover:drop-shadow-[0_0_24px_rgba(239,68,68,0.7)]">
            <VampIcon />
          </div>
          <h2 className="text-6xl font-black text-white mb-2 tracking-tight group-hover:text-red-50 transition-colors">VAMP</h2>
          <p className="text-white/40 text-sm group-hover:text-white/60 transition-colors">Launch Tokens</p>
        </button>

        {/* RIGHT grid */}
        <div className="flex-1 flex flex-col gap-4">

          {/* Top: VOLUME + WALLETS */}
          <div className="flex gap-4 flex-1">
            <button onClick={() => setActiveModal('volume')}
              className="group flex-1 flex flex-col items-center justify-center rounded-3xl bg-black/50 border border-white/10 hover:border-blue-400/40 hover:bg-blue-400/5 transition-all duration-300 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-400/6 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"/>
              <div className="w-16 h-12 text-blue-400 mb-3 transition-all duration-300">
                <VolumeIcon />
              </div>
              <h3 className="text-3xl font-black text-white mb-1 group-hover:text-blue-50 transition-colors">VOLUME</h3>
              <p className="text-white/40 text-xs group-hover:text-white/60 transition-colors">Trading Bot</p>
            </button>
            <button onClick={() => setActiveModal('wallets')}
              className="group flex-1 flex flex-col items-center justify-center rounded-3xl bg-black/50 border border-white/10 hover:border-green-400/40 hover:bg-green-400/5 transition-all duration-300 overflow-hidden relative">
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-green-400/6 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"/>
              <div className="w-14 h-12 text-green-400 mb-3 transition-all duration-300">
                <WalletsIcon />
              </div>
              <h3 className="text-3xl font-black text-white mb-1 group-hover:text-green-50 transition-colors">WALLETS</h3>
              <p className="text-white/40 text-xs group-hover:text-white/60 transition-colors">Manage Keys</p>
            </button>
          </div>

          {/* Bottom: PORTFOLIO */}
          <button onClick={() => setActiveModal('portfolio')}
            className="group flex-[0.65] flex items-center justify-center gap-8 rounded-3xl bg-black/50 border border-white/10 hover:border-white/25 hover:bg-white/3 transition-all duration-300 overflow-hidden relative px-8">
            <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"/>
            <div className="w-24 h-14 text-white/70 group-hover:text-white/95 transition-colors flex-shrink-0">
              <PortfolioIcon />
            </div>
            <div className="text-left">
              <h3 className="text-4xl font-black text-white mb-1">PORTFOLIO</h3>
              <p className="text-white/40 text-sm group-hover:text-white/60 transition-colors">Track Tokens & Positions</p>
            </div>
          </button>
        </div>
      </div>

      {activeModal==='vamp'      && <VampModal      onClose={()=>setActiveModal(null)} onOpenPortfolio={()=>setActiveModal('portfolio')} />}
      {activeModal==='volume'    && <VolumeModal    onClose={()=>setActiveModal(null)} />}
      {activeModal==='wallets'   && <WalletsModal   onClose={()=>setActiveModal(null)} />}
      {activeModal==='portfolio' && <PortfolioModal onClose={()=>setActiveModal(null)} />}
      {adminOpen && <AdminPanel onClose={() => setAdminOpen(false)} />}
    </div>
  );
}
