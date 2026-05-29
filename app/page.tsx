'use client';

import { useState } from 'react';
import { InteractiveShaderBackground } from '@/components/interactive-shader';
import { VampModal }      from '@/components/vamp-modal';
import { VolumeModal }    from '@/components/volume-modal';
import { WalletsModal }   from '@/components/wallets-modal';
import { PortfolioModal } from '@/components/portfolio-modal';

export default function Home() {
  const [activeModal, setActiveModal] = useState<'vamp'|'volume'|'wallets'|'portfolio'|null>(null);

  const tools = [
    { id:'vamp',      title:'VAMP',      icon:'/vamp-fangs-silver.png', desc:'Launch Tokens',  hoverBorder:'hover:border-red-500/40',   hoverBg:'hover:bg-red-500/5'   },
    { id:'volume',    title:'VOLUME',    icon:'/vamp-blood.png',         desc:'Trading Bot',   hoverBorder:'hover:border-blue-400/40',  hoverBg:'hover:bg-blue-400/5'  },
    { id:'wallets',   title:'WALLETS',   icon:'/vamp-blood.png',         desc:'Manage Keys',   hoverBorder:'hover:border-green-400/40', hoverBg:'hover:bg-green-400/5' },
    { id:'portfolio', title:'PORTFOLIO', icon:'/vamp-blood.png',         desc:'Track Tokens',  hoverBorder:'hover:border-white/40',     hoverBg:'hover:bg-white/5'     },
  ];

  return (
    <div className="min-h-screen overflow-hidden">
      <InteractiveShaderBackground />

      <div className="relative z-10 border-b border-white/8 bg-black backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/vamp-fangs-silver.png" alt="VAMP" className="w-7 h-7" style={{ mixBlendMode: 'screen' }} />
            <span className="text-lg font-mono font-bold text-white tracking-widest">DEV TOOL ASSISTANT</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-xs text-white/30 font-mono hidden md:block">v0.4 MVP</span>
            <button className="px-5 py-2 rounded-lg border border-red-500/50 text-red-400 text-sm font-mono font-bold hover:bg-red-500/10 hover:border-red-500 transition-all"
              onClick={() => alert('Auth в Phase 2')}>LOGIN</button>
          </div>
        </div>
      </div>

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
          <div className="mt-10 text-center text-white/20 text-xs font-mono">Railway Backend · Vercel Frontend</div>
        </div>
      </div>

      {activeModal==='vamp'      && <VampModal      onClose={()=>setActiveModal(null)} />}
      {activeModal==='volume'    && <VolumeModal    onClose={()=>setActiveModal(null)} />}
      {activeModal==='wallets'   && <WalletsModal   onClose={()=>setActiveModal(null)} />}
      {activeModal==='portfolio' && <PortfolioModal onClose={()=>setActiveModal(null)} />}
    </div>
  );
}



