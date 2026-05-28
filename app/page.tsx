'use client';

import { useState } from 'react';
import { InteractiveShaderBackground } from '@/components/interactive-shader';
import { VampModal } from '@/components/vamp-modal';
import { VolumeModal } from '@/components/volume-modal';
import { WalletsModal } from '@/components/wallets-modal';
import { PortfolioModal } from '@/components/portfolio-modal';

export default function Home() {
  const [activeModal, setActiveModal] = useState<'vamp' | 'volume' | 'wallets' | 'portfolio' | null>(null);

  const tools = [
    {
      id: 'vamp',
      title: 'VAMP',
      icon: '/vamp-fangs-silver.png',
      desc: 'Launch Tokens',
      color: 'hover:text-red-500',
    },
    {
      id: 'volume',
      title: 'VOLUME',
      icon: '/vamp-blood.png',
      desc: 'Trading Bot',
      color: 'hover:text-blue-400',
    },
    {
      id: 'wallets',
      title: 'WALLETS',
      icon: '/vamp-blood.png',
      desc: 'Manage Keys',
      color: 'hover:text-green-400',
    },
    {
      id: 'portfolio',
      title: 'PORTFOLIO',
      icon: '/vamp-blood.png',
      desc: 'Track Tokens',
      color: 'hover:text-white',
    },
  ];

  return (
    <div className="min-h-screen bg-black overflow-hidden">
      <InteractiveShaderBackground />

      {/* Header */}
      <div className="relative z-10 border-b border-white/10 bg-black/60 backdrop-blur-2xl">
        <div className="max-w-7xl mx-auto px-4 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img src="/vamp-fangs-silver.png" alt="VAMP" className="w-8 h-8" />
            <h1 className="text-2xl font-mono font-black text-white">VAMP ECOSYSTEM</h1>
          </div>
          <div className="text-sm text-white/50">v0 Dev Tools</div>
        </div>
      </div>

      {/* Main Content */}
      <div className="relative z-10 min-h-[calc(100vh-80px)] flex items-center justify-center">
        <div className="max-w-6xl mx-auto px-4 py-16">
          {/* Title */}
          <div className="text-center mb-16">
            <h2 className="text-5xl md:text-6xl font-black text-white mb-4">
              VAMPIRE PROTOCOL
            </h2>
            <p className="text-xl text-white/60">
              Advanced Solana Token Tools
            </p>
          </div>

          {/* Tools Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => setActiveModal(tool.id as any)}
                className={cn(
                  'group relative p-8 rounded-2xl',
                  'bg-white/5 backdrop-blur-2xl border border-white/10',
                  'hover:border-white/30 transition-all duration-300',
                  'flex flex-col items-center justify-center text-center',
                  'hover:bg-white/10'
                )}
              >
                {/* Icon */}
                <img
                  src={tool.icon}
                  alt={tool.title}
                  className={cn(
                    'w-12 h-12 mb-4 transition-transform duration-300',
                    'group-hover:scale-110'
                  )}
                />

                {/* Title */}
                <h3 className={cn(
                  'text-3xl md:text-4xl font-black mb-2 transition-colors duration-300',
                  'text-white',
                  tool.color
                )}>
                  {tool.title}
                </h3>

                {/* Description */}
                <p className="text-sm text-white/60 group-hover:text-white/80 transition-colors">
                  {tool.desc}
                </p>
              </button>
            ))}
          </div>

          {/* Footer Info */}
          <div className="mt-16 text-center text-white/40 text-sm">
            <p>Connected to Railway Backend • Vercel Frontend</p>
          </div>
        </div>
      </div>

      {/* Modals */}
      {activeModal === 'vamp' && <VampModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'volume' && <VolumeModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'wallets' && <WalletsModal onClose={() => setActiveModal(null)} />}
      {activeModal === 'portfolio' && <PortfolioModal onClose={() => setActiveModal(null)} />}
    </div>
  );
}

function cn(...classes: any[]) {
  return classes.filter(Boolean).join(' ');
}
