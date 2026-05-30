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
const THEMES = [
  { id:'crimson' as Theme, label:'Crimson', dot:'bg-red-500'   },
  { id:'void'    as Theme, label:'Void',    dot:'bg-slate-400' },
  { id:'abyss'   as Theme, label:'Abyss',   dot:'bg-blue-500'  },
  { id:'solana'  as Theme, label:'Solana',  dot:'bg-purple-500'},
];

/* ── Icons ── */
function BloodDrop({ className='', style={} }: { className?:string; style?:React.CSSProperties }) {
  return (
    <svg viewBox="0 0 48 64" fill="none" xmlns="http://www.w3.org/2000/svg" className={className} style={style}>
      <style>{`@keyframes dp{0%,100%{transform:scale(1)}50%{transform:scale(1.07)}}
        @keyframes dt{0%{transform:translateY(-3px);opacity:0}20%{opacity:1}80%{transform:translateY(0);opacity:1}100%{transform:translateY(9px);opacity:0}}
        .dm{animation:dp 2.2s ease-in-out infinite}.dtip{animation:dt 2.2s ease-in-out infinite}`}</style>
      <g className="dm">
        <path d="M24 3C24 3 7 23 7 36C7 46.5 14.8 55 24 55C33.2 55 41 46.5 41 36C41 23 24 3 24 3Z" fill="currentColor" opacity="0.92"/>
        <ellipse cx="18" cy="30" rx="4" ry="8" fill="white" opacity="0.15" transform="rotate(-20 18 30)"/>
      </g>
      <g className="dtip">
        <ellipse cx="24" cy="58" rx="3" ry="4.5" fill="currentColor" opacity="0.6"/>
        <ellipse cx="24" cy="64" rx="1.5" ry="2.5" fill="currentColor" opacity="0.35"/>
      </g>
    </svg>
  );
}

function VolumeAnim({ size='md' }: { size?:'sm'|'md'|'lg' }) {
  const bars = [{x:2,h:22,y:14,g:true,d:'0s'},{x:12,h:16,y:18,g:false,d:'.25s'},{x:22,h:26,y:10,g:true,d:'.5s'},
    {x:32,h:14,y:20,g:false,d:'.1s'},{x:42,h:20,y:12,g:true,d:'.35s'},{x:52,h:18,y:16,g:false,d:'.6s'}];
  const cls = size==='sm' ? 'w-10 h-8' : size==='lg' ? 'w-20 h-14' : 'w-14 h-10';
  return (
    <svg viewBox="0 0 64 48" fill="none" xmlns="http://www.w3.org/2000/svg" className={cls}>
      <style>{`@keyframes cg{0%,100%{transform:scaleY(1);opacity:.9}50%{transform:scaleY(.5);opacity:.55}}.cb{transform-box:fill-box;transform-origin:center;}`}</style>
      {bars.map((b,i)=>(
        <g key={i}>
          <line x1={b.x+4} y1={b.y-4} x2={b.x+4} y2={b.y+b.h+4} stroke={b.g?'#22c55e':'#ef4444'} strokeWidth="1.5" opacity="0.45"/>
          <rect className="cb" x={b.x} y={b.y} width="8" height={b.h} rx="1.5"
            fill={b.g?'#22c55e':'#ef4444'} opacity="0.9" style={{animation:`cg 1.8s ease-in-out ${b.d} infinite`}}/>
        </g>
      ))}
    </svg>
  );
}

function WalletsAnim({ size='md' }: { size?:'sm'|'md'|'lg' }) {
  const cls = size==='sm' ? 'w-10 h-8' : size==='lg' ? 'w-16 h-14' : 'w-14 h-12';
  return (
    <svg viewBox="0 0 64 52" fill="none" xmlns="http://www.w3.org/2000/svg" className={cls}>
      <style>{`@keyframes fl{0%,100%{transform:rotate(0deg) translateY(0)}50%{transform:rotate(-14deg) translateY(-4px)}}
        @keyframes fr{0%,100%{transform:rotate(0deg) translateY(0)}50%{transform:rotate(14deg) translateY(-4px)}}
        @keyframes fc{0%,100%{transform:translateY(0)}50%{transform:translateY(-5px)}}
        .wcl{transform-box:fill-box;transform-origin:center bottom;animation:fl 2.4s ease-in-out infinite}
        .wcr{transform-box:fill-box;transform-origin:center bottom;animation:fr 2.4s ease-in-out .1s infinite}
        .wcc{transform-box:fill-box;transform-origin:center bottom;animation:fc 2.4s ease-in-out infinite}`}</style>
      <rect className="wcl" x="4" y="14" width="38" height="26" rx="5" fill="#3b82f6" opacity="0.7"/>
      <rect className="wcr" x="22" y="14" width="38" height="26" rx="5" fill="#22c55e" opacity="0.7"/>
      <rect className="wcc" x="13" y="10" width="38" height="28" rx="5" fill="#f8f8f8" opacity="0.95"/>
      <line x1="13" y1="19" x2="51" y2="19" stroke="#1a1a1a" strokeWidth="4" opacity="0.12"/>
      <rect x="17" y="24" width="14" height="3" rx="1.5" fill="#1a1a1a" opacity="0.15"/>
      <rect x="35" y="24" width="10" height="3" rx="1.5" fill="#22c55e" opacity="0.5"/>
      <rect x="17" y="13" width="8" height="6" rx="1.5" fill="#f59e0b" opacity="0.8"/>
    </svg>
  );
}

function PortfolioAnim({ size='md' }: { size?:'sm'|'md'|'lg' }) {
  const cls = size==='sm' ? 'w-12 h-8' : size==='lg' ? 'w-24 h-14' : 'w-20 h-12';
  return (
    <svg viewBox="0 0 72 44" fill="none" xmlns="http://www.w3.org/2000/svg" className={cls}>
      <style>{`@keyframes dl{0%{stroke-dashoffset:140;opacity:.4}65%{stroke-dashoffset:0;opacity:1}100%{stroke-dashoffset:0;opacity:1}}
        @keyframes fa{0%,25%{opacity:0}80%{opacity:.18}100%{opacity:.18}}
        .cl{stroke-dasharray:140;animation:dl 3s ease-out infinite}
        .ca{animation:fa 3s ease-out infinite}`}</style>
      <line x1="4" y1="36" x2="68" y2="36" stroke="currentColor" strokeWidth="0.5" opacity="0.2"/>
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

/* ── Footer ── */
function Footer({ theme, setTheme }: { theme:Theme; setTheme:(t:Theme)=>void }) {
  const [sol, setSol] = useState<number|null>(null);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const f=()=>fetch('https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd')
      .then(r=>r.json()).then(d=>setSol(d?.solana?.usd||null)).catch(()=>{});
    f(); const id=setInterval(f,30000); return ()=>clearInterval(id);
  },[]);
  useEffect(()=>{
    const h=(e:MouseEvent)=>{ if(ref.current&&!ref.current.contains(e.target as Node))setOpen(false); };
    document.addEventListener('mousedown',h); return ()=>document.removeEventListener('mousedown',h);
  },[]);
  const cur = THEMES.find(t=>t.id===theme)!;
  return (
    <div className="flex-shrink-0 border-t border-white/8 bg-black/90 backdrop-blur-xl px-4 py-2 flex items-center justify-between gap-4 text-xs z-10">
      <div className="flex items-center gap-2">
        <div className="w-3.5 h-3.5 rounded-full bg-gradient-to-br from-purple-400 to-green-400 flex-shrink-0"/>
        <span className="text-white/40">SOL</span>
        <span className="text-white font-bold font-mono">{sol!==null?`$${sol.toFixed(2)}`:'—'}</span>
      </div>
      <div className="flex items-center gap-3 text-white/20">
        {['𝕏','✈','▶','Docs'].map(s=>(
          <span key={s} className="cursor-not-allowed hover:text-white/30 transition-colors select-none text-sm">{s}</span>
        ))}
      </div>
      <div className="relative" ref={ref}>
        <button onClick={()=>setOpen(v=>!v)}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-white/10 hover:border-white/25 bg-white/3 transition-all">
          <div className={cn('w-3 h-3 rounded-full flex-shrink-0', cur.dot)}/>
          <span className="text-white/40 hidden sm:block text-xs">{cur.label}</span>
          <Palette className="w-3 h-3 text-white/25"/>
        </button>
        {open && (
          <>
            <div className="fixed inset-0 z-[290]" onClick={()=>setOpen(false)}/>
            <div className="absolute bottom-full mb-2 right-0 bg-black border border-white/15 rounded-xl p-1.5 z-[300] min-w-[130px] shadow-2xl">
              {THEMES.map(t=>(
                <button key={t.id} onClick={()=>{setTheme(t.id);setOpen(false);}}
                  className={cn('w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs transition-all',
                    theme===t.id?'bg-white/10 text-white':'text-white/50 hover:text-white hover:bg-white/5')}>
                  <div className={cn('w-3 h-3 rounded-full',t.dot)}/>{t.label}
                  {theme===t.id&&<span className="ml-auto text-white/30">✓</span>}
                </button>
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Main ── */
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

  const setTheme = (t:Theme) => { setThemeState(t); localStorage.setItem('vamp_theme',t); };

  useEffect(()=>{
    setUser(getAuthUser()); setHydrated(true); trackPageView();
    const s = localStorage.getItem('vamp_theme') as Theme|null;
    if (s) setThemeState(s);
  },[]);

  useEffect(()=>{
    const h=(e:MouseEvent)=>{
      if(cabinetRef.current&&!cabinetRef.current.contains(e.target as Node))
        {setCabinetOpen(false);setChangingPwd(false);}
    };
    document.addEventListener('mousedown',h); return ()=>document.removeEventListener('mousedown',h);
  },[]);

  const handleAuthSuccess = ()=>{ setUser(getAuthUser()); setAuthMode(null); };
  const handleLogout      = ()=>{ clearAuthUser(); setUser(null); setCabinetOpen(false); };

  const handleChangePwd = async ()=>{
    if(!user||!oldPwd||!newPwd) return;
    if(newPwd.length<8){setPwdErr('Min 8 characters');return;}
    setPwdLoading(true); setPwdErr(''); setPwdMsg('');
    const r=await changePassword(user.id,oldPwd,newPwd);
    setPwdLoading(false);
    if(!r.ok){setPwdErr(r.error||'Error');return;}
    setPwdMsg('Changed!'); setOldPwd(''); setNewPwd('');
    setTimeout(()=>{setChangingPwd(false);setPwdMsg('');},2000);
  };

  const openVolumeWithCA=(ca:string)=>{ setVolumeInitCA(ca); setActiveModal('volume'); };

  if(!hydrated) return null;

  if(!user) return (
    <>
      <LandingPage onLogin={()=>setAuthMode('login')} onRegister={()=>setAuthMode('register')} />
      {authMode&&<AuthModal mode={authMode} onSuccess={handleAuthSuccess} onSwitchMode={m=>setAuthMode(m)} onClose={()=>setAuthMode(null)}/>}
    </>
  );

  const modalOpen = activeModal !== null;

  return (
    <div className="h-[100dvh] flex flex-col overflow-hidden">
      <InteractiveShaderBackground theme={theme} />

      {/* Header — скрыт когда открыта модалка на мобиле */}
      <div className={cn(
        'relative z-[200] border-b border-white/8 bg-black/90 backdrop-blur-xl flex-shrink-0 transition-all duration-200',
        modalOpen ? 'hidden md:flex' : 'flex'
      )}>
        <div className="w-full px-4 md:px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <BloodDrop className="w-6 h-7 flex-shrink-0" style={{color:'#ef4444'}}/>
            <span className="text-base md:text-lg font-mono font-black text-white tracking-widest">VEXOR</span>
          </div>

          <div className="relative" ref={cabinetRef}>
            <button onClick={()=>setCabinetOpen(v=>!v)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl border border-white/15 hover:border-white/30 bg-white/5 transition-all">
              <div className={cn('w-7 h-7 rounded-full border-2 flex items-center justify-center',
                user.isAdmin
                  ? 'bg-yellow-400/20 border-yellow-400/60 shadow-[0_0_10px_rgba(250,204,21,0.4)]'
                  : 'bg-green-400/20 border-green-400/60 shadow-[0_0_10px_rgba(74,222,128,0.3)]')}>
                {user.isAdmin?<Shield className="w-3.5 h-3.5 text-yellow-400"/>:<User className="w-3.5 h-3.5 text-green-400"/>}
              </div>
              <ChevronDown className={cn('w-4 h-4 text-white/40 transition-transform',cabinetOpen&&'rotate-180')}/>
            </button>

            {cabinetOpen&&(
              <>
                <div className="fixed inset-0 z-[290]" onClick={()=>setCabinetOpen(false)}/>
                <div className="absolute right-0 top-full mt-2 w-60 bg-black border border-white/15 rounded-2xl shadow-2xl overflow-hidden z-[300]">
                  <div className="p-4 border-b border-white/8">
                    <div className="flex items-center gap-2 mb-1">
                      <div className={cn('w-2 h-2 rounded-full',user.isAdmin?'bg-yellow-400':'bg-green-400')}/>
                      <span className="text-xs text-white/40">{user.isAdmin?'Admin':'User'}</span>
                    </div>
                    <div className="text-white font-bold text-sm truncate">
                      {user.authMethod==='wallet'&&user.walletAddress
                        ?user.walletAddress.slice(0,10)+'…'+user.walletAddress.slice(-6)
                        :user.email}
                    </div>
                  </div>
                  <div className="p-3 space-y-1">
                    {user.isAdmin&&(
                      <button onMouseDown={()=>{setAdminOpen(true);setCabinetOpen(false);}}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-yellow-400/10 text-yellow-400/70 hover:text-yellow-400 text-sm font-bold transition-all">
                        <Shield className="w-4 h-4"/> Admin Panel
                      </button>
                    )}
                    {user.authMethod!=='wallet'&&(
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
                  {changingPwd&&(
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

      {/* ── Dashboard Grid ─────────────────────────────────────────── */}
      <div className={cn(
        'relative z-10 flex-1 p-3 md:p-4 overflow-hidden',
        // Mobile: vertical stack
        'flex flex-col gap-3',
        // Desktop: CSS grid  
        'md:grid md:flex-none md:gap-4',
        'md:grid-cols-[1.2fr_1fr_1fr]',
        'md:grid-rows-[1fr_0.65fr]'
      )}>

        {/* VAMP — big left */}
        <button onClick={()=>setActiveModal('vamp')}
          className="group rounded-3xl bg-black/50 border border-white/10 hover:border-red-500/40 hover:bg-red-500/5 transition-all duration-300 overflow-hidden relative flex flex-col items-center justify-center
            min-h-[150px] md:min-h-0
            md:row-span-2 md:col-span-1">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-red-500/8 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"/>
          <BloodDrop className="w-14 h-16 md:w-20 md:h-24 mb-3 transition-all" style={{color:'#ef4444'}}/>
          <h2 className="text-4xl md:text-6xl font-black text-white mb-1 group-hover:text-red-50 transition-colors">VAMP</h2>
          <p className="text-white/40 text-xs md:text-sm group-hover:text-white/60 transition-colors">Launch Tokens</p>
        </button>

        {/* VOLUME + WALLETS — side by side on mobile AND desktop top-right */}
        <button onClick={()=>setActiveModal('volume')}
          className="group rounded-3xl bg-black/50 border border-white/10 hover:border-blue-400/40 hover:bg-blue-400/5 transition-all duration-300 overflow-hidden relative flex flex-col items-center justify-center
            flex-1 md:flex-none min-h-[130px] md:min-h-0
            md:col-start-2 md:row-start-1">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-blue-400/6 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"/>
          <VolumeAnim size="md"/>
          <h3 className="text-2xl md:text-3xl font-black text-white mt-2 mb-0.5 group-hover:text-blue-50 transition-colors">VOLUME</h3>
          <p className="text-white/40 text-xs group-hover:text-white/60 transition-colors">Trading Bot</p>
        </button>

        {/* VOLUME + WALLETS share a row on mobile */}
        <button onClick={()=>setActiveModal('wallets')}
          className="group rounded-3xl bg-black/50 border border-white/10 hover:border-green-400/40 hover:bg-green-400/5 transition-all duration-300 overflow-hidden relative flex flex-col items-center justify-center
            flex-1 md:flex-none min-h-[130px] md:min-h-0
            md:col-start-3 md:row-start-1">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-green-400/6 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"/>
          <WalletsAnim size="md"/>
          <h3 className="text-2xl md:text-3xl font-black text-white mt-2 mb-0.5 group-hover:text-green-50 transition-colors">WALLETS</h3>
          <p className="text-white/40 text-xs group-hover:text-white/60 transition-colors">Manage Keys</p>
        </button>

        {/* PORTFOLIO — bottom */}
        <button onClick={()=>setActiveModal('portfolio')}
          className="group rounded-3xl bg-black/50 border border-white/10 hover:border-white/25 hover:bg-white/3 transition-all duration-300 overflow-hidden relative flex items-center justify-center gap-6 px-6
            min-h-[100px] md:min-h-0
            md:col-start-2 md:col-span-2 md:row-start-2">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/3 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"/>
          <PortfolioAnim size="lg"/>
          <div className="text-left">
            <h3 className="text-3xl md:text-4xl font-black text-white mb-0.5">PORTFOLIO</h3>
            <p className="text-white/40 text-xs md:text-sm group-hover:text-white/60 transition-colors">Track Tokens & Positions</p>
          </div>
        </button>
      </div>

      {/* Mobile: VOLUME + WALLETS side by side */}
      {/* ↑ handled inline with flex-1 above */}

      <Footer theme={theme} setTheme={setTheme}/>

      {/* Modals */}
      {activeModal==='vamp'      && <VampModal      onClose={()=>setActiveModal(null)} onOpenPortfolio={()=>setActiveModal('portfolio')}/>}
      {activeModal==='volume'    && <VolumeModal    onClose={()=>setActiveModal(null)} initialCA={volumeInitCA} onSessionStart={()=>setVolumeInitCA('')}/>}
      {activeModal==='wallets'   && <WalletsModal   onClose={()=>setActiveModal(null)}/>}
      {activeModal==='portfolio' && <PortfolioModal onClose={()=>setActiveModal(null)} onLaunchVolume={openVolumeWithCA}/>}
      {adminOpen && <AdminPanel onClose={()=>setAdminOpen(false)}/>}
    </div>
  );
}
