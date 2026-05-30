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

// Animated line chart SVG for Portfolio icon
function PortfolioIcon() {
  return (
    <svg viewBox="0 0 48 36" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <polyline
        points="2,30 10,22 18,26 26,12 34,18 42,6 46,8"
        stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
        fill="none"
        style={{ animation: 'dashDraw 2s ease-in-out infinite alternate' }}
        strokeDasharray="80" strokeDashoffset="0"
      />
      <style>{`
        @keyframes dashDraw {
          0%   { stroke-dashoffset: 80; opacity: 0.4; }
          100% { stroke-dashoffset: 0;  opacity: 1;   }
        }
      `}</style>
    </svg>
  );
}

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

  useEffect(() => {
    setUser(getAuthUser());
    setHydrated(true);
    trackPageView();
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (cabinetRef.current && !cabinetRef.current.contains(e.target as Node))
        { setCabinetOpen(false); setChangingPwd(false); }
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const handleAuthSuccess = () => { setUser(getAuthUser()); setAuthMode(null); };
  const handleLogout = () => { clearAuthUser(); setUser(null); setCabinetOpen(false); setActiveModal(null); };

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

      {/* Header */}
      <div className="relative z-10 border-b border-white/8 bg-black backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/vamp-fangs-silver.png" alt="VAMP" className="w-7 h-7" style={{ mixBlendMode:'screen' }} />
            <span className="text-lg font-mono font-black text-white tracking-widest">DEV TOOL ASSISTANT</span>
          </div>

          {/* Cabinet */}
          <div className="relative" ref={cabinetRef}>
            <button onClick={() => setCabinetOpen(v => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/15 hover:border-white/30 bg-white/5 transition-all">
              <div className={cn('w-6 h-6 rounded-full border flex items-center justify-center',
                user.isAdmin ? 'bg-yellow-400/20 border-yellow-400/40' : 'bg-red-500/20 border-red-500/30')}>
                {user.isAdmin ? <Shield className="w-3 h-3 text-yellow-400" /> : <User className="w-3 h-3 text-red-400" />}
              </div>
              <span className="text-sm text-white/70 font-mono max-w-[150px] truncate">{displayName}</span>
              {user.isAdmin && <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-400/20 text-yellow-400 font-bold">ADMIN</span>}
              <ChevronDown className={cn('w-4 h-4 text-white/40 transition-transform', cabinetOpen && 'rotate-180')} />
            </button>

            {cabinetOpen && (
              <div className="absolute right-0 top-full mt-2 w-76 bg-black border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-50">
                <div className="p-4 border-b border-white/8">
                  <div className="text-xs text-white/40 mb-0.5 flex items-center gap-1.5">
                    Logged in as {user.isAdmin && <span className="text-xs px-1.5 py-0.5 rounded bg-yellow-400/20 text-yellow-400 font-bold">ADMIN</span>}
                  </div>
                  <div className="text-white font-bold text-sm truncate">{displayName}</div>
                </div>
                {!changingPwd ? (
                  <div className="p-3 space-y-1">
                    {user.isAdmin && (
                      <button onClick={() => { setAdminOpen(true); setCabinetOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-yellow-400/10 text-yellow-400/70 hover:text-yellow-400 transition-all text-sm font-bold">
                        <Shield className="w-4 h-4" /> Admin Panel
                      </button>
                    )}
                    {user.authMethod !== 'wallet' && (
                      <button onClick={() => setChangingPwd(true)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/8 text-white/60 hover:text-white transition-all text-sm">
                        <Lock className="w-4 h-4" /> Change Password
                      </button>
                    )}
                    <button onClick={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 text-red-400/60 hover:text-red-400 transition-all text-sm">
                      <LogOut className="w-4 h-4" /> Logout
                    </button>
                  </div>
                ) : (
                  <div className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-bold text-white">Change Password</span>
                      <button onClick={() => setChangingPwd(false)} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
                    </div>
                    {pwdMsg && <div className="text-xs text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3" />{pwdMsg}</div>}
                    {pwdErr && <div className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{pwdErr}</div>}
                    <div className="relative">
                      <input type={showPwd?'text':'password'} value={oldPwd} onChange={e=>setOldPwd(e.target.value)}
                        placeholder="Current password"
                        className="w-full bg-white/5 border border-white/15 text-white rounded-xl px-3 pr-9 h-9 text-sm focus:outline-none" />
                      <button onClick={() => setShowPwd(v=>!v)} className="absolute right-2.5 top-2 text-white/30">
                        {showPwd ? <EyeOff className="w-4 h-4"/> : <Eye className="w-4 h-4"/>}
                      </button>
                    </div>
                    <input type={showPwd?'text':'password'} value={newPwd} onChange={e=>setNewPwd(e.target.value)}
                      placeholder="New password (8+)" className="w-full bg-white/5 border border-white/15 text-white rounded-xl px-3 h-9 text-sm focus:outline-none" />
                    <button onClick={handleChangePwd} disabled={!oldPwd||!newPwd||pwdLoading}
                      className="w-full h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm disabled:opacity-50 transition-all">
                      {pwdLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto"/> : 'Update Password'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Dashboard Grid — Padre-style layout ── */}
      <div className="relative z-10 h-[calc(100vh-64px)] p-5 flex gap-4">

        {/* LEFT: VAMP (full height, ~50%) */}
        <button
          onClick={() => setActiveModal('vamp')}
          className="group flex-[1.2] flex flex-col items-center justify-center rounded-3xl bg-black/50 border border-white/10 hover:border-red-500/40 hover:bg-red-500/5 transition-all duration-300 relative overflow-hidden"
        >
          {/* Glow bg */}
          <div className="absolute inset-0 bg-gradient-to-b from-red-500/0 to-red-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none" />
          <img src="/vamp-fangs-silver.png" alt="VAMP" className="w-20 h-20 mb-5 transition-transform duration-300 group-hover:scale-110 group-hover:drop-shadow-[0_0_20px_rgba(239,68,68,0.6)]"
            style={{ mixBlendMode:'screen' }} />
          <h2 className="text-6xl font-black text-white mb-2 tracking-tight group-hover:text-red-100 transition-colors">VAMP</h2>
          <p className="text-white/40 text-sm group-hover:text-white/60 transition-colors">Launch Tokens</p>
        </button>

        {/* RIGHT: 3-cell grid */}
        <div className="flex-1 flex flex-col gap-4">

          {/* Top row: VOLUME + WALLETS */}
          <div className="flex gap-4 flex-1">
            <button onClick={() => setActiveModal('volume')}
              className="group flex-1 flex flex-col items-center justify-center rounded-3xl bg-black/50 border border-white/10 hover:border-blue-400/40 hover:bg-blue-400/5 transition-all duration-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-blue-400/0 to-blue-400/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <img src="/icon-volume.webp" alt="VOLUME" className="w-12 h-12 mb-3 transition-transform duration-300 group-hover:scale-110 object-contain" />
              <h3 className="text-3xl font-black text-white mb-1 group-hover:text-blue-100 transition-colors">VOLUME</h3>
              <p className="text-white/40 text-xs group-hover:text-white/60 transition-colors">Trading Bot</p>
            </button>
            <button onClick={() => setActiveModal('wallets')}
              className="group flex-1 flex flex-col items-center justify-center rounded-3xl bg-black/50 border border-white/10 hover:border-green-400/40 hover:bg-green-400/5 transition-all duration-300 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-b from-green-400/0 to-green-400/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              <img src="/icon-wallets.png" alt="WALLETS" className="w-12 h-12 mb-3 transition-transform duration-300 group-hover:scale-110 rounded-xl object-cover" />
              <h3 className="text-3xl font-black text-white mb-1 group-hover:text-green-100 transition-colors">WALLETS</h3>
              <p className="text-white/40 text-xs group-hover:text-white/60 transition-colors">Manage Keys</p>
            </button>
          </div>

          {/* Bottom: PORTFOLIO (full width, shorter) */}
          <button onClick={() => setActiveModal('portfolio')}
            className="group flex-[0.65] flex items-center justify-center gap-8 rounded-3xl bg-black/50 border border-white/10 hover:border-white/30 hover:bg-white/3 transition-all duration-300 relative overflow-hidden px-8">
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 to-white/3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
            {/* Animated chart icon */}
            <div className="w-20 h-14 text-white/60 group-hover:text-white/90 transition-colors flex-shrink-0">
              <PortfolioIcon />
            </div>
            <div className="text-left">
              <h3 className="text-4xl font-black text-white mb-1 group-hover:text-white transition-colors">PORTFOLIO</h3>
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
