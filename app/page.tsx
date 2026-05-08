'use client';

import { useState } from 'react';
import { Skull, Activity, Wallet } from 'lucide-react';
import { Header } from '@/components/header';
import { ToolCard } from '@/components/tool-card';
import { VampPanel } from '@/components/vamp-panel';
import { VolumePanel } from '@/components/volume-panel';
import { WalletsPanel } from '@/components/wallets-panel';

type ActivePanel = 'home' | 'vamp' | 'volume' | 'wallets';

export default function Home() {
  const [activePanel, setActivePanel] = useState<ActivePanel>('home');

  if (activePanel === 'vamp') {
    return <VampPanel onBack={() => setActivePanel('home')} />;
  }

  if (activePanel === 'volume') {
    return <VolumePanel onBack={() => setActivePanel('home')} />;
  }

  if (activePanel === 'wallets') {
    return <WalletsPanel onBack={() => setActivePanel('home')} />;
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-4xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
            <ToolCard
              title="VAMP"
              description="Token launcher with dev buy"
              icon={Skull}
              variant="vamp"
              onClick={() => setActivePanel('vamp')}
            />
            <ToolCard
              title="Volume Bot"
              description="Automated volume generation"
              icon={Activity}
              variant="volume"
              onClick={() => setActivePanel('volume')}
            />
            <ToolCard
              title="Wallets"
              description="Manage your wallets"
              icon={Wallet}
              variant="wallet"
              onClick={() => setActivePanel('wallets')}
            />
          </div>
        </div>
      </main>

      <footer className="py-4 text-center text-xs text-muted-foreground font-mono">
        DEV TOOL ASSISTANT v1.0
      </footer>
    </div>
  );
}
