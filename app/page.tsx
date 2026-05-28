'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { VampModal } from '@/components/vamp-modal';
import { VolumeModal } from '@/components/volume-modal';
import { cn } from '@/lib/utils';

const tools = [
  {
    id: 'vamp',
    name: 'VAMP',
    description: 'Token Launch Platform',
    icon: '/vamp-fangs-silver.png',
    hoverColor: 'hover:border-vamp-red/60 hover:bg-vamp-red/5',
    enabled: true,
  },
  {
    id: 'volume',
    name: 'VOLUME',
    description: 'Volume Bot',
    icon: '/vamp-blood.png',
    hoverColor: 'hover:border-volume-blue/60 hover:bg-volume-blue/5',
    enabled: true,
  },
  {
    id: 'wallets',
    name: 'WALLETS',
    description: 'Wallet Management',
    icon: '/vamp-blood.png',
    hoverColor: 'hover:border-wallet-green/60 hover:bg-wallet-green/5',
    enabled: true,
  },
  {
    id: 'portfolio',
    name: 'PORTFOLIO',
    description: 'Portfolio Tracking',
    icon: '/vamp-blood.png',
    hoverColor: 'hover:border-white/40 hover:bg-white/5',
    enabled: false,
  },
  {
    id: 'web3',
    name: 'WEB3 ПРОЕКТЫ',
    description: 'Coming Soon',
    icon: null,
    hoverColor: 'hover:border-white/40 hover:bg-white/5',
    enabled: false,
  },
];

const comingSoonBlocks = [
  { id: 1, label: '?' },
  { id: 2, label: '?' },
  { id: 3, label: '?' },
];

// Blue Shader Background like maxy.tools with bright flowing waves
function ShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resize();
    window.addEventListener('resize', resize);

    // Blue and black flowing waves
    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      time += 0.004;

      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;

      for (let y = 0; y < height; y += 2) {
        for (let x = 0; x < width; x += 2) {
          // Multiple flowing wave layers for complex animation
          const wave1 = Math.sin((x + time * 150) * 0.015 + y * 0.008) * Math.cos((y + time * 120) * 0.012) * 0.85;
          const wave2 = Math.sin((x - time * 100) * 0.008 + y * 0.01 + time * 0.5) * 0.7;
          const wave3 = Math.cos((x + y) * 0.004 + time * 1.2) * 0.6;
          const wave4 = Math.sin(time * 2 - (x + y) * 0.006) * 0.5;
          
          const combined = (wave1 + wave2 + wave3 + wave4) / 2.75;
          const value = Math.floor((combined + 1) * 80);
          
          // Bright blue with black shadows - like maxy.tools
          const brightness = Math.sin(x * 0.001 + time * 0.1) * 0.3 + 0.7;
          const r = Math.floor(value * 0.3 * brightness);
          const g = Math.floor((value * 0.8 + 60) * brightness);
          const b = Math.floor((value + 100) * brightness);

          for (let dy = 0; dy < 2; dy++) {
            for (let dx = 0; dx < 2; dx++) {
              const i = ((y + dy) * width + (x + dx)) * 4;
              if (i < data.length) {
                data[i] = Math.min(255, r);
                data[i + 1] = Math.min(255, g);
                data[i + 2] = Math.min(255, b);
                data[i + 3] = 255;
              }
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      animationFrameId = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 w-full h-full"
      style={{ opacity: 0.7 }}
    />
  );
}

export default function Home() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [showWalletsModal, setShowWalletsModal] = useState(false);

  const handleToolClick = (toolId: string, enabled: boolean) => {
    if (!enabled) return;
    
    if (toolId === 'vamp') {
      setSelectedTool('vamp');
    } else if (toolId === 'volume') {
      setSelectedTool('volume');
    } else if (toolId === 'wallets') {
      setShowWalletsModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Blue Shader Background */}
      <ShaderBackground />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/30 bg-black/80 backdrop-blur-sm">
          <div className="container mx-auto flex h-16 items-center justify-center px-6">
            <div className="flex items-center gap-3 absolute left-1/2 -translate-x-1/2">
              <img src="/vamp-blood.png" alt="Blood" className="w-8 h-8" />
              <h1 className="text-xl font-mono font-bold tracking-wider text-foreground">
                DEV TOOL ASSISTANT
              </h1>
            </div>
            
            <Button
              variant="outline"
              className="border-border/50 bg-black/40 hover:bg-white/10 backdrop-blur-sm absolute right-6"
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
      </div>

      {/* VAMP Modal */}
      {selectedTool === 'vamp' && (
        <VampModal onClose={() => setSelectedTool(null)} />
      )}

      {/* Volume Modal */}
      {selectedTool === 'volume' && (
        <VolumeModal onClose={() => setSelectedTool(null)} />
      )}

      {/* Wallets Modal */}
      {showWalletsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowWalletsModal(false)}
          />
          <div className="relative bg-card border-2 border-wallet-green/30 rounded-2xl max-w-md w-full p-8 shadow-2xl">
            <button
              onClick={() => setShowWalletsModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
            <div className="flex items-center gap-3 mb-6">
              <img src="/vamp-blood.png" alt="Wallets" className="w-10 h-10" />
              <h2 className="text-2xl font-mono font-bold text-wallet-green">WALLETS</h2>
            </div>
            <div className="space-y-4">
              <p className="text-muted-foreground">Manage and monitor your Solana wallets</p>
              <div className="p-4 rounded-lg bg-wallet-green/10 border border-wallet-green/30">
                <p className="text-sm text-foreground mb-3">Features:</p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>✓ Create & import wallets</li>
                  <li>✓ Real-time balance tracking</li>
                  <li>✓ Transaction history</li>
                  <li>✓ Multi-signature support</li>
                  <li>✓ Token portfolio overview</li>
                </ul>
              </div>
              <button
                onClick={() => setShowWalletsModal(false)}
                className="w-full bg-wallet-green hover:bg-wallet-green/80 text-black font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Coming Soon
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
