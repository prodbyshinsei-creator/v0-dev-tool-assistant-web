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
import { LogOut, Lock, ChevronDown, X, Eye, EyeOff, CheckCircle, AlertCircle, Loader2, Shield, User, Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

type Theme = 'crimson'|'void'|'abyss'|'solana';
const THEMES: { id: Theme; label: string; color: string; dot: string }[] = [
  { id:'crimson', label:'Crimson',  color:'#ef4444', dot:'bg-red-500'    },
  { id:'void',    label:'Void',     color:'#94a3b8', dot:'bg-slate-400'  },
  { id:'abyss',   label:'Abyss',    color:'#3b82f6', dot:'bg-blue-500'   },
  { id:'solana',  label:'Solana',   color:'#a855f7', dot:'bg-purple-500' },
];

/* ─── Icons ──────────────────────────────────────────────────────── */
function BloodDropIcon() {
  return (
    <svg viewBox="0 0 48 60" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <style>{`
        @keyframes drip{0%{transform:translateY(-4px);opacity:0}20%{opacity:1}80%{transform:translateY(0);opacity:1}100%{transform:translateY(8px);opacity:0}}
        @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.06)}}
        @keyframes dropFall{0%{transform:translateY(0);opacity:0}20%{opacity:1}100%{transform:translateY(18px);opacity:0}}
        .drop-main{animation:pulse 2s ease-in-out infinite}
        .drop-tip{animation:drip 1.8s ease-in-out infinite}
        .drop-fall{animation:dropFall 1.8s ease-in-out 0.6s infinite}
      `}</style>
      {/* Main drop */}
      <g className="drop-main">
        <path d="M24 4 C24 4 8 22 8 34 C8 43.9 15.2 52 24 52 C32.8 52 40 43.9 40 34 C40 22 24 4 24 4Z"
          fill="currentColor" opacity="0.9"/>
        {/* Shine */}
        <ellipse cx="18" cy="28" rx="4" ry="7" fill="white" opacity="0.18" transform="rotate(-20 18 28)"/>
      </g>
      {/* Drip tip */}
      <g className="drop-tip">
        <ellipse cx="24" cy="53" rx="2.5" ry="4" fill="currentColor" opacity="0.7"/>
      </g>
      {/* Falling drop */}
      <g className="drop-fall">
        <ellipse cx="24" cy="58" rx="1.5" ry="2.5" fill="currentColor" opacity="0.5"/>
      </g>
    </svg>
  );
}

function VolumeIcon() {
  const bars=[
    {x:2, h:22,y:14,g:true, wt:10,wb:38,d:'0s'},
    {x:12,h:16,y:18,g:false,wt:12,wb:38,d:'0.25s'},
    {x:22,h:26,y:10,g:true, wt:6, wb:38,d:'0.5s'},
    {x:32,h:14,y:20,g:false,wt:14,wb:38,d:'0.1s'},
    {x:42,h:20,y:12,g:true, wt:8, wb:38,d:'0.35s'},
    {x:52,h:18,y:16,g:false,wt:12,wb:38,d:'0.6s'},
  ];
  return (
    <svg viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <style>{`@keyframes cg{0%,100%{transform:scaleY(1);opacity:.9}50%{transform:scaleY(.55);opacity:.6}}.cb{transform-box:fill-box;transform-origin:center;}`}</style>
      {bars.map((b,i)=>(
        <g key={i}>
          <line x1={b.x+4} y1={b.wt} x2={b.x+4} y2={b.wb} stroke={b.g?'#22c55e':'#ef4444'} strokeWidth="1.5" opacity="0.5"/>
          <rect className="cb" x={b.x} y={b.y} width="8" height={b.h} rx="1.5"
            fill={b.g?'#22c55e':'#ef4444'} opacity="0.9"
            style={{animation:`cg 1.8s ease-in-out ${b.d} infinite`}}/>
        </g>
      ))}
    </svg>
  );
}

function WalletsIcon() {
  return (
    <svg viewBox="0 0 64 52" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <style>{`
        @keyframes fl{0%,100%{transform:rotate(0deg) translateY(0)}50%{transform:rotate(-14deg) translateY(-4px)}}
        @keyframes fr{0%,100%{transform:rotate(0deg) translateY(0)}50%{transform:rotate(14deg) translateY(-4px)}}
        @keyframes fc{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
        .cl{transform-box:fill-box;transform-origin:center bottom;animation:fl 2.4s ease-in-out infinite}
        .cr{transform-box:fill-box;transform-origin:center bottom;animation:fr 2.4s ease-in-out .1s infinite}
        .cc{transform-box:fill-box;transform-origin:center bottom;animation:fc 2.4s ease-in-out infinite}
      `}</style>
      <rect className="cl" x="4" y="14" width="38" height="26" rx="5" fill="#3b82f6" opacity="0.7"/>
      <rect className="cr" x="22" y="14" width="38" height="26" rx="5" fill="#22c55e" opacity="0.7"/>
      <rect className="cc" x="13" y="10" width="38" height="28" rx="5" fill="#f8f8f8" opacity="0.95"/>
      <line x1="13" y1="19" x2="51" y2="19" stroke="#1a1a1a" strokeWidth="4" opacity="0.12"/>
      <rect x="17" y="24" width="14" height="3" rx="1.5" fill="#1a1a1a" opacity="0.15"/>
      <rect x="35" y="24" width="10" height="3" rx="1.5" fill="#22c55e" opacity="0.5"/>
      <rect x="17" y="13" width="8" height="6" rx="1.5" fill="#f59e0b" opacity="0.8"/>
    </svg>
  );
}

function PortfolioIcon() {
  return (
    <svg viewBox="0 0 72 44" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <style>{`
        @keyframes dl{0%{stroke-dashoffset:140;opacity:.4}70%{stroke-dashoffset:0;opacity:1}100%{stroke-dashoffset:0;opacity:1}}
        @keyframes fa{0%,25%{opacity:0}85%{opacity:.2}100%{opacity:.2}}
        .cl{stroke-dasharray:140;animation:dl 3s ease-out infinite}
        .ca{animation:fa 3s ease-out infinite}
      `}</style>
      <line x1="4" y1="36" x2="68" y2="36" stroke="currentColor" strokeWidth="0.5" opacity="0.2"/>
      <line x1="4" y1="24" x2="68" y2="24" stroke="currentColor" strokeWidth="0.5" opacity="0.1"/>
      <path className="ca" d="M4,32 L14,28 L24,30 L34,18 L44,22 L54,10 L64,14 L64,36 L4,36Z" fill="currentColor"/>
      <polyline className="cl" points="4,32 14,28 24,30 34,18 44,22 54,10 64,14"
        stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="64" cy="14" r="3" fill="currentColor" opacity="0.9">
        <animate attributeName="r" values="3;4.5;3" dur="2s" repeatCount="indefinite"/>
        <animate attributeName="opacity" values="0.9;0.5;0.9" dur="2s" repeatCount="indefinite"/>
      </circle>
    </svg>
  );
}

/* ─── SOL Price Footer ───────────────────────────────────────────── */
function Footer({ theme, setTheme }: { theme: Theme; setTheme:(t:Theme)=>void }) {
  const [sol, setSol] = useState<number|null>(null);
  const [themeOpen, setThemeOpen] = useState(false);
  const themeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchSol = () =>
      fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd')
        .then(r=>r.json()).then(d=>setSol(d?.solana?.usd||null)).catch(()=>{});
    fetchSol();
    const interval = setInterval(fetchSol, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) setThemeOpen(false);
    };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, []);

  const currentTheme = THEMES.find(t=>t.id===theme)!;
  const socials = [
    { label:'Twitter', icon:'𝕏' }, { label:'Telegram', icon:'✈' },
    { label:'YouTube', icon:'▶' }, { label:'Docs', icon:'📄' },
  ];

  return (
    <div className="relative z-[200] border-t border-white/8 bg-black/80 backdrop-blur-xl px-6 py-2 flex items-center justify-between gap-4 text-xs">
      {/* SOL Price */}
      <div className="flex items-center gap-2">
        <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-400 to-green-400 flex-shrink-0"/>
        <span className="text-white/50">SOL</span>
        <span className="text-white font-bold font-mono">
          {sol !== null ? `$${sol.toFixed(2)}` : '—'}
        </span>
      </div>

      {/* Social links — gray disabled */}
      <div className="flex items-center gap-3">
        {socials.map(s=>(
          <span key={s.label} title={s.label}
            className="text-white/20 cursor-not-allowed select-none hover:text-white/30 transition-colors text-sm">
            {s.icon}
          </span>
        ))}
        <span className="text-white/15 mx-1">|</span>
        <span className="text-white/20 text-[10px] cursor-not-allowed">Docs</span>
      </div>

      {/* Theme picker */}
      <div className="relative" ref={themeRef}>
        <button onClick={() => setThemeOpen(v=>!v)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/10 hover:border-white/25 bg-white/3 transition-all">
          <div className={cn('w-3 h-3 rounded-full', currentTheme.dot)}/>
          <span className="text-white/50 hidden sm:block">{currentTheme.label}</span>
          <Palette className="w-3 h-3 text-white/30"/>
        </button>
        {themeOpen && (
          <>
            <div className="fixed inset-0 z-[290]" onClick={()=>setThemeOpen(false)}/>
            <div className="absolute bottom-full mb-2 right-0 bg-black border border-white/15 rounded-2xl p-2 z-[300] min-w-[140px] shadow-2xl">
              {THEMES.map(t=>(
                <button key={t.id} onClick={()=>{setTheme(t.id);setThemeOpen(false);}}
                  className={cn('w-full flex items-center gap-2.5 px-3 py-2 rounded-xl transition-all text-sm',
                    theme===t.id ? 'bg-white/10 text-white' : 'text-white/50 hover:text-white hover:bg-white/5')}>
                  <div className={cn('w-3 h-3 rounded-full',t.dot)}/>
                  {t.label}
                  {theme===t.id && <span className="ml-auto text-white/40 text-xs">✓</span>}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Main ───────────────────────────────────────────────────────── */
export default function Home() {
  const [user, setUser]               = useState<AuthUser|null>(null);
  const [authMode, setAuthMode]       = useState<'login'|'register'|null>(null);
  const [activeModal, setActiveModal] = useState<'vamp'|'volume'|'wallets'|'portfolio'|null>(null);
  const [volumeInitCA, setVolumeInitCA] = useState('');
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
  const [theme, setThemeState]        = useState<Theme>('crimson');
  const cabinetRef                    = useRef<HTMLDivElement>(null);

  const setTheme = (t: Theme) => { setThemeState(t); localStorage.setItem('vamp_theme',t); };

  useEffect(() => {
    setUser(getAuthUser());
    setHydrated(true);
    trackPageView();
    const saved = localStorage.getItem('vamp_theme') as Theme|null;
    if (saved) setThemeState(saved);
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
  const handleLogout      = () => { clearAuthUser(); setUser(null); setCabinetOpen(false); };

  const handleChangePwd = async () => {
    if (!user||!oldPwd||!newPwd) return;
    if (newPwd.length<8) { setPwdErr('Min 8 characters'); return; }
    setPwdLoading(true); setPwdErr(''); setPwdMsg('');
    const r = await changePassword(user.id,oldPwd,newPwd);
    setPwdLoading(false);
    if (!r.ok) { setPwdErr(r.error||'Error'); return; }
    setPwdMsg('Changed!'); setOldPwd(''); setNewPwd('');
    setTimeout(()=>{ setChangingPwd(false); setPwdMsg(''); },2000);
  };

  const openVolumeWithCA = (ca: string) => {
    setVolumeInitCA(ca);
    setActiveModal('volume');
  };

  if (!hydrated) return null;

  if (!user) return (
    <>
      <LandingPage onLogin={()=>setAuthMode('login')} onRegister={()=>setAuthMode('register')} />
      {authMode && <AuthModal mode={authMode} onSuccess={handleAuthSuccess}
        onSwitchMode={m=>setAuthMode(m)} onClose={()=>setAuthMode(null)} />}
    </>
  );

  const themeColor = THEMES.find(t=>t.id===theme)!.color;
  const themeColorClass = { crimson:'bg-red-500', void:'bg-slate-400', abyss:'bg-blue-500', solana:'bg-purple-500' }[theme];

  return (
    <div className="h-screen flex flex-col overflow-hidden">
      <InteractiveShaderBackground theme={theme} />

      {/* Header */}
      <div className="relative z-[200] border-b border-white/8 bg-black/90 backdrop-blur-xl flex-shrink-0">
        <div className="px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6" style={{color:'#ef4444',mixBlendMode:'screen' as any}}>
              <BloodDropIcon />
            </div>
            <span className="text-base font-mono font-black text-white tracking-widest hidden sm:block">DEV TOOL ASSISTANT</span>
            <span className="text-base font-mono font-black text-white tracking-widest sm:hidden">DTA</span>
          </div>

          {/* Cabinet — compact icon button */}
          <div className="relative" ref={cabinetRef}>
            <button onClick={()=>setCabinetOpen(v=>!v)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/15 hover:border-white/30 bg-white/5 transition-all">
              {/* Colored dot: yellow=admin, green=user */}
              <div className={cn('w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all',
                user.isAdmin
                  ? 'bg-yellow-400/20 border-yellow-400/60 shadow-[0_0_10px_rgba(250,204,21,0.4)]'
                  : 'bg-green-400/20 border-green-400/60 shadow-[0_0_10px_rgba(74,222,128,0.3)]')}>
                {user.isAdmin ? <Shield className="w-3.5 h-3.5 text-yellow-400"/> : <User className="w-3.5 h-3.5 text-green-400"/>}
              </div>
              <ChevronDown className={cn('w-4 h-4 text-white/40 transition-transform',cabinetOpen&&'rotate-180')}/>
            </button>

            {cabinetOpen && (
              <>
                <div className="fixed inset-0 z-[290]" onClick={()=>setCabinetOpen(false)}/>
                <div className="absolute right-0 top-full mt-2 w-64 bg-black border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-[300]">
                  <div className="p-4 border-b border-white/8">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={cn('w-2 h-2 rounded-full', user.isAdmin ? 'bg-yellow-400' : 'bg-green-400')}/>
                      <span className="text-xs text-white/40 font-mono">{user.isAdmin ? 'Admin' : 'User'}</span>
                    </div>
                    <div className="text-white font-bold text-sm truncate">
                      {user.authMethod==='wallet'&&user.walletAddress
                        ? user.walletAddress.slice(0,10)+'…'+user.walletAddress.slice(-6)
                        : user.email}
                    </div>
                  </div>
                  <div className="p-3 space-y-1">
                    {user.isAdmin && (
                      <button onMouseDown={()=>{setAdminOpen(true);setCabinetOpen(false);}}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-yellow-400/10 text-yellow-400/70 hover:text-yellow-400 text-sm font-bold transition-all">
                        <Shield className="w-4 h-4"/> Admin Panel
                      </button>
                    )}
                    {user.authMethod!=='wallet' && (
                      <button onMouseDown={()=>setChangingPwd(true)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/8 text-white/60 hover:text-white text-sm transition-all">
                        <Lock className="w-4 h-4"/> Change Password
                      </button>
                    )}
                    <button onMouseDown={handleLogout}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 text-red-400/60 hover:text-red-400 text-sm transition-all">
                      <LogOut className="w-4 h-4"/> Logout
                    </button>
                  </div>
                  {changingPwd && (
                    <div className="p-4 border-t border-white/8 space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-bold text-white">Change Password</span>
                        <button onClick={()=>setChangingPwd(false)} className="text-white/30 hover:text-white"><X className="w-4 h-4"/></button>
                      </div>
                      {pwdMsg&&<div className="text-xs text-green-400 flex items-center gap-1"><CheckCircle className="w-3 h-3"/>{pwdMsg}</div>}
                      {pwdErr&&<div className="text-xs text-red-400 flex items-center gap-1"><AlertCircle className="w-3 h-3"/>{pwdErr}</div>}
                      <div className="relative">
                        <input type={showPwd?'text':'password'} value={oldPwd} onChange={e=>setOldPwd(e.target.value)}
                          placeholder="Current password" className="w-full bg-white/5 border border-white/15 text-white rounded-xl px-3 pr-9 h-9 text-sm focus:outline-none"/>
                        <button onClick={()=>setShowPwd(v=>!v)} className="absolute right-2.5 top-2 text-white/30">
                          {showPwd?<EyeOff className="w-4 h-4"/>:<Eye className="w-4 h-4"/>}
                        </button>
                      </div>
                      <input type={showPwd?'text':'password'} value={newPwd} onChange={e=>setNewPwd(e.target.value)}
                        placeholder="New password (8+)" className="w-full bg-white/5 border border-white/15 text-white rounded-xl px-3 h-9 text-sm focus:outline-none"/>
                      <button onClick={handleChangePwd} disabled={!oldPwd||!newPwd||pwdLoading}
                        className="w-full h-9 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm disabled:opacity-50 transition-all">
                        {pwdLoading?<Loader2 className="w-4 h-4 animate-spin mx-auto"/>:'Update'}
                      </button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Grid — responsive ── */}
      <div className="relative z-10 flex-1 p-3 md:p-4 overflow-hidden
        grid grid-cols-1 gap-3
        md:grid-cols-[1.2fr_1fr] md:grid-rows-[1fr_0.65fr]">

        {/* VAMP — full height left on desktop, top on mobile */}
        <button onClick={()=>setActiveModal('vamp')}
          className="group rounded-3xl bg-black/50 border border-white/10 hover:border-red-500/40 hover:bg-red-500/5 transition-all duration-300 overflow-hidden relative flex flex-col items-center justify-center
            md:row-span-2 min-h-[140px] md:min-h-0">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-red-500/8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"/>
          <div className="w-16 h-20 md:w-20 md:h-24 mb-3 md:mb-4 transition-all duration-300"
            style={{color:'#ef4444',filter:'drop-shadow(0 0 0px rgba(239,68,68,0)) group-hover:drop-shadow(0 0 24px rgba(239,68,68,0.7))'}}>
            <BloodDropIcon />
          </div>
          <h2 className="text-4xl md:text-6xl font-black text-white mb-1 group-hover:text-red-50 transition-colors">VAMP</h2>
          <p className="text-white/40 text-xs md:text-sm group-hover:text-white/60 transition-colors">Launch Tokens</p>
        </button>

        {/* Right top: VOLUME + WALLETS side by side */}
        <div className="flex gap-3 md:contents">
          <button onClick={()=>setActiveModal('volume')}
            className="group flex-1 rounded-3xl bg-black/50 border border-white/10 hover:border-blue-400/40 hover:bg-blue-400/5 transition-all duration-300 overflow-hidden relative flex flex-col items-center justify-center min-h-[130px]
              md:col-start-2 md:row-start-1">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-400/6 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"/>
            <div className="w-14 h-10 md:w-16 md:h-12 mb-2 md:mb-3"><VolumeIcon/></div>
            <h3 className="text-2xl md:text-3xl font-black text-white mb-1 group-hover:text-blue-50 transition-colors">VOLUME</h3>
            <p className="text-white/40 text-[10px] md:text-xs group-hover:text-white/60 transition-colors">Trading Bot</p>
          </button>
          <button onClick={()=>setActiveModal('wallets')}
            className="group flex-1 rounded-3xl bg-black/50 border border-white/10 hover:border-green-400/40 hover:bg-green-400/5 transition-all duration-300 overflow-hidden relative flex flex-col items-center justify-center min-h-[130px]
              md:col-start-3 md:row-start-1">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-green-400/6 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"/>
            <div className="w-12 h-10 md:w-14 md:h-12 mb-2 md:mb-3"><WalletsIcon/></div>
            <h3 className="text-2xl md:text-3xl font-black text-white mb-1 group-hover:text-green-50 transition-colors">WALLETS</h3>
            <p className="text-white/40 text-[10px] md:text-xs group-hover:text-white/60 transition-colors">Manage Keys</p>
          </button>
        </div>

        {/* PORTFOLIO — bottom right */}
        <button onClick={()=>setActiveModal('portfolio')}
          className="group rounded-3xl bg-black/50 border border-white/10 hover:border-white/25 hover:bg-white/3 transition-all duration-300 overflow-hidden relative flex items-center justify-center gap-6 md:gap-8 px-6 md:px-8 min-h-[100px]
            md:col-start-2 md:col-span-2 md:row-start-2">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"/>
          <div className="w-20 h-12 md:w-24 md:h-14 text-white/70 group-hover:text-white/95 transition-colors flex-shrink-0">
            <PortfolioIcon/>
          </div>
          <div className="text-left">
            <h3 className="text-3xl md:text-4xl font-black text-white mb-0.5">PORTFOLIO</h3>
            <p className="text-white/40 text-xs md:text-sm group-hover:text-white/60 transition-colors">Track Tokens & Positions</p>
          </div>
        </button>
      </div>

      {/* Footer */}
      <Footer theme={theme} setTheme={setTheme} />

      {/* Modals */}
      {activeModal==='vamp'      && <VampModal      onClose={()=>setActiveModal(null)} onOpenPortfolio={()=>setActiveModal('portfolio')} />}
      {activeModal==='volume'    && <VolumeModal    onClose={()=>setActiveModal(null)} initialCA={volumeInitCA} onSessionStart={()=>setVolumeInitCA('')} />}
      {activeModal==='wallets'   && <WalletsModal   onClose={()=>setActiveModal(null)} />}
      {activeModal==='portfolio' && <PortfolioModal onClose={()=>setActiveModal(null)} onLaunchVolume={openVolumeWithCA} />}
      {adminOpen && <AdminPanel onClose={()=>setAdminOpen(false)} />}
    </div>
  );
}
