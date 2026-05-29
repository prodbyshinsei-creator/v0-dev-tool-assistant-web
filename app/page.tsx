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
import { getAuthUser, clearAuthUser, changePassword, AuthUser } from '@/lib/auth';
import { LogOut, User, Lock, ChevronDown, X, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';

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
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (cabinetRef.current && !cabinetRef.current.contains(e.target as Node)) {
        setCabinetOpen(false); setChangingPwd(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleAuthSuccess = () => { setUser(getAuthUser()); setAuthMode(null); };

  const handleLogout = () => {
    clearAuthUser(); setUser(null);
    setCabinetOpen(false); setActiveModal(null);
  };

  const handleChangePwd = async () => {
    if (!user || !oldPwd || !newPwd) return;
    if (newPwd.length < 8) { setPwdErr('Min 8 characters'); return; }
    setPwdLoading(true); setPwdErr(''); setPwdMsg('');
    const result = await changePassword(user.id, oldPwd, newPwd);
    setPwdLoading(false);
    if (!result.ok) { setPwdErr(result.error || 'Error'); return; }
    setPwdMsg('Password changed!');
    setOldPwd(''); setNewPwd('');
    setTimeout(() => { setChangingPwd(false); setPwdMsg(''); }, 2000);
  };

  if (!hydrated) return null;

  if (!user) {
    return (
      <>
        <LandingPage onLogin={() => setAuthMode('login')} onRegister={() => setAuthMode('register')} />
        {authMode && (
          <AuthModal mode={authMode} onSuccess={handleAuthSuccess}
            onSwitchMode={m => setAuthMode(m)} onClose={() => setAuthMode(null)} />
        )}
      </>
    );
  }

  const tools = [
    { id:'vamp',      title:'VAMP',      icon:'/vamp-fangs-silver.png', desc:'Launch Tokens', hoverBorder:'hover:border-red-500/40',   hoverBg:'hover:bg-red-500/5'   },
    { id:'volume',    title:'VOLUME',    icon:'/vamp-blood.png',         desc:'Trading Bot',  hoverBorder:'hover:border-blue-400/40',  hoverBg:'hover:bg-blue-400/5'  },
    { id:'wallets',   title:'WALLETS',   icon:'/vamp-blood.png',         desc:'Manage Keys',  hoverBorder:'hover:border-green-400/40', hoverBg:'hover:bg-green-400/5' },
    { id:'portfolio', title:'PORTFOLIO', icon:'/vamp-blood.png',         desc:'Track Tokens', hoverBorder:'hover:border-white/40',     hoverBg:'hover:bg-white/5'     },
  ];

  return (
    <div className="min-h-screen overflow-hidden">
      <InteractiveShaderBackground />

      {/* Header */}
      <div className="relative z-10 border-b border-white/8 bg-black backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/vamp-fangs-silver.png" alt="VAMP" className="w-7 h-7" style={{ mixBlendMode: 'screen' }} />
            <span className="text-lg font-mono font-black text-white tracking-widest">DEV TOOL ASSISTANT</span>
          </div>

          {/* User cabinet */}
          <div className="relative" ref={cabinetRef}>
            <button onClick={() => setCabinetOpen(v => !v)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl border border-white/15 hover:border-white/30 bg-white/5 hover:bg-white/8 transition-all">
              <div className={cn(
                'w-6 h-6 rounded-full border flex items-center justify-center',
                user.isAdmin ? 'bg-yellow-400/20 border-yellow-400/40' : 'bg-red-500/20 border-red-500/30'
              )}>
                {user.isAdmin
                  ? <Shield className="w-3 h-3 text-yellow-400" />
                  : <User   className="w-3 h-3 text-red-400" />}
              </div>
              <span className="text-sm text-white/70 font-mono max-w-[160px] truncate">
                {user.authMethod === 'wallet' && user.walletAddress
                  ? user.walletAddress.slice(0,6) + '…' + user.walletAddress.slice(-4)
                  : user.email}
              </span>
              {user.isAdmin && <span className="text-xs px-1.5 py-0.5 rounded-md bg-yellow-400/20 text-yellow-400 font-bold">ADMIN</span>}
              <ChevronDown className={cn('w-4 h-4 text-white/40 transition-transform', cabinetOpen && 'rotate-180')} />
            </button>

            {cabinetOpen && (
              <div className="absolute right-0 top-full mt-2 w-80 bg-black border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-50">
                <div className="p-4 border-b border-white/8">
                  <div className="flex items-center gap-2 mb-0.5">
                    <div className="text-xs text-white/40 font-mono">Logged in as</div>
                    {user.isAdmin && <span className="text-xs px-1.5 py-0.5 rounded-md bg-yellow-400/20 text-yellow-400 font-bold">ADMIN</span>}
                  </div>
                  <div className="text-white font-bold text-sm truncate">
                    {user.authMethod === 'wallet' && user.walletAddress
                      ? user.walletAddress.slice(0,8) + '…' + user.walletAddress.slice(-6)
                      : user.email}
                  </div>
                </div>

                {!changingPwd ? (
                  <div className="p-3 space-y-1">
                    {/* Admin panel button — only for admin */}
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
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-bold text-white">Change Password</span>
                      <button onClick={() => setChangingPwd(false)} className="text-white/30 hover:text-white"><X className="w-4 h-4" /></button>
                    </div>
                    {pwdMsg && <div className="flex items-center gap-2 text-xs text-green-400"><CheckCircle className="w-3 h-3" />{pwdMsg}</div>}
                    {pwdErr && <div className="flex items-center gap-2 text-xs text-red-400"><AlertCircle className="w-3 h-3" />{pwdErr}</div>}
                    <div className="relative">
                      <input type={showPwd ? 'text' : 'password'} value={oldPwd} onChange={e => setOldPwd(e.target.value)}
                        placeholder="Current password"
                        className="w-full bg-white/5 border border-white/15 text-white rounded-xl px-3 pr-9 h-9 text-sm focus:outline-none focus:border-white/30" />
                      <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-2.5 top-2 text-white/30">
                        {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                    <input type={showPwd ? 'text' : 'password'} value={newPwd} onChange={e => setNewPwd(e.target.value)}
                      placeholder="New password (8+ chars)"
                      className="w-full bg-white/5 border border-white/15 text-white rounded-xl px-3 h-9 text-sm focus:outline-none focus:border-white/30" />
                    <button onClick={handleChangePwd} disabled={!oldPwd || !newPwd || pwdLoading}
                      className="w-full h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm transition-all disabled:opacity-50">
                      {pwdLoading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : 'Update Password'}
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tools grid */}
      <div className="relative z-10 min-h-[calc(100vh-64px)] flex items-center justify-center">
        <div className="w-full max-w-5xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {tools.map(tool => (
              <button key={tool.id} onClick={() => setActiveModal(tool.id as any)} data-modal={tool.id}
                className={`group relative p-8 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10 transition-all duration-300 flex flex-col items-center justify-center text-center ${tool.hoverBorder} ${tool.hoverBg}`}>
                <img src={tool.icon} alt={tool.title} className="w-10 h-10 mb-4 transition-transform duration-300 group-hover:scale-110"
                  style={{ mixBlendMode: 'screen' }} />
                <h3 className="text-3xl md:text-4xl font-black mb-1 text-white">{tool.title}</h3>
                <p className="text-xs text-white/50 group-hover:text-white/70 transition-colors">{tool.desc}</p>
              </button>
            ))}
          </div>
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


