'use client';

import { useState } from 'react';
import { Droplet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { VampModal } from '@/components/vamp-modal';
import { cn } from '@/lib/utils';

const tools = [
  {
    id: 'vamp',
    name: 'VAMP',
    description: 'Token Launch Platform',
    icon: '/vamp-fangs-silver.png',
    color: 'vamp',
    hoverColor: 'hover:border-vamp-red/60 hover:bg-vamp-red/5',
    enabled: true,
  },
  {
    id: 'volume',
    name: 'VOLUME',
    description: 'Volume Bot',
    icon: null,
    color: 'volume',
    hoverColor: 'hover:border-volume-blue/60 hover:bg-volume-blue/5',
    enabled: true,
  },
  {
    id: 'wallet',
    name: 'Wallet Portfolio',
    description: 'Wallet Management',
    icon: null,
    color: 'wallet',
    hoverColor: 'hover:border-wallet-green/60 hover:bg-wallet-green/5',
    enabled: true,
  },
  {
    id: 'web3',
    name: 'WEB3 ПРОЕКТЫ',
    description: 'Coming Soon',
    icon: null,
    color: 'default',
    hoverColor: 'hover:border-white/40 hover:bg-white/5',
    enabled: false,
  },
];

const comingSoonBlocks = [
  { id: 1, label: '?' },
  { id: 2, label: '?' },
  { id: 3, label: '?' },
];

export default function Home() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  const handleToolClick = (toolId: string, enabled: boolean) => {
    if (!enabled) return;
    
    if (toolId === 'vamp') {
      setSelectedTool('vamp');
    }
    // Volume, Wallet - добавим позже
  };

  return (
    <div className="min-h-screen bg-black relative">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/30 bg-black/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <Droplet className="w-8 h-8 text-red-500" fill="currentColor" />
            <h1 className="text-xl font-mono font-bold tracking-wider text-foreground">
              DEV TOOL ASSISTANT
            </h1>
          </div>
          
          <Button
            variant="outline"
            className="border-border/50 bg-black/40 hover:bg-white/10 backdrop-blur-sm"
            disabled
          >
            LOGIN
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="pt-24 pb-12 px-6">
        <div className="container mx-auto max-w-7xl">
          {/* Tool Blocks Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
            {tools.map((tool) => (
              <button
                key={tool.id}
                onClick={() => handleToolClick(tool.id, tool.enabled)}
                disabled={!tool.enabled}
                className={cn(
                  'relative group p-8 rounded-2xl border-2 transition-all duration-300',
                  'bg-black/40 backdrop-blur-sm',
                  tool.enabled
                    ? cn('border-border/30 cursor-pointer', tool.hoverColor)
                    : 'border-border/20 cursor-not-allowed opacity-60'
                )}
              >
                <div className="flex flex-col items-center gap-4 text-center">
                  {tool.icon ? (
                    <img src={tool.icon} alt={tool.name} className="w-16 h-16" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-border/20 flex items-center justify-center">
                      <span className="text-3xl font-mono font-bold text-muted-foreground">
                        {tool.name[0]}
                      </span>
                    </div>
                  )}
                  
                  <div>
                    <h3 className="text-2xl font-mono font-bold mb-1 text-foreground">
                      {tool.name}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {tool.description}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>

          {/* Coming Soon Blocks */}
          <div className="flex justify-center gap-6">
            {comingSoonBlocks.map((block) => (
              <div
                key={block.id}
                className="w-32 h-32 rounded-xl border-2 border-dashed border-border/30 bg-black/40 backdrop-blur-sm flex items-center justify-center"
              >
                <span className="text-4xl font-mono font-bold text-muted-foreground/40">
                  {block.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* VAMP Modal */}
      {selectedTool === 'vamp' && (
        <VampModal onClose={() => setSelectedTool(null)} />
      )}
    </div>
  );
}
