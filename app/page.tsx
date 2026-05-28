'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { VampModal } from '@/components/vamp-modal';
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

// Shader Background Component
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

    // Simple perlin-like noise animation
    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      time += 0.0015;

      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;

      for (let y = 0; y < height; y += 4) {
        for (let x = 0; x < width; x += 4) {
          const index = (y * width + x) * 4;
          
          // Multi-octave noise with more variation
          const noise1 = Math.sin(x * 0.01 + time * 2.5) * Math.cos(y * 0.01 + time * 1.3);
          const noise2 = Math.sin(x * 0.005 - time * 1.8) * Math.cos(y * 0.005 + time * 0.7);
          const noise3 = Math.sin(x * 0.002 + time * 0.5) * Math.cos(y * 0.002 + time);
          
          const combined = (noise1 + noise2 * 0.6 + noise3 * 0.4) / 2.0;
          const value = Math.floor((combined + 1) * 20);
          
          // Dark red/crimson tones
          const r = Math.min(255, value + 25);
          const g = Math.min(255, value + 5);
          const b = Math.min(255, value + 15);

          // Fill 4x4 block for performance
          for (let dy = 0; dy < 4; dy++) {
            for (let dx = 0; dx < 4; dx++) {
              const i = ((y + dy) * width + (x + dx)) * 4;
              if (i < data.length) {
                data[i] = r;
                data[i + 1] = g;
                data[i + 2] = b;
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
      style={{ opacity: 0.4 }}
    />
  );
}

export default function Home() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  const [showVolumeModal, setShowVolumeModal] = useState(false);
  const [showWalletsModal, setShowWalletsModal] = useState(false);

  const handleToolClick = (toolId: string, enabled: boolean) => {
    if (!enabled) return;
    
    if (toolId === 'vamp') {
      setSelectedTool('vamp');
    } else if (toolId === 'volume') {
      setShowVolumeModal(true);
    } else if (toolId === 'wallets') {
      setShowWalletsModal(true);
    }
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Shader Background */}
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
      {showVolumeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => setShowVolumeModal(false)}
          />
          <div className="relative bg-card border-2 border-volume-blue/30 rounded-2xl max-w-md w-full p-8 shadow-2xl">
            <button
              onClick={() => setShowVolumeModal(false)}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground"
            >
              ✕
            </button>
            <div className="flex items-center gap-3 mb-6">
              <img src="/vamp-blood.png" alt="Volume" className="w-10 h-10" />
              <h2 className="text-2xl font-mono font-bold text-volume-blue">VOLUME</h2>
            </div>
            <div className="space-y-4">
              <p className="text-muted-foreground">Volume Bot - Generate trading volume for your token</p>
              <div className="p-4 rounded-lg bg-volume-blue/10 border border-volume-blue/30">
                <p className="text-sm text-foreground mb-3">Features:</p>
                <ul className="text-sm text-muted-foreground space-y-2">
                  <li>✓ Multi-wallet volume generation</li>
                  <li>✓ Customizable amounts (0.01 - 100 SOL)</li>
                  <li>✓ Real-time transaction monitoring</li>
                  <li>✓ Pause/Resume sessions</li>
                </ul>
              </div>
              <button
                onClick={() => setShowVolumeModal(false)}
                className="w-full bg-volume-blue hover:bg-volume-blue/80 text-foreground font-bold py-2 px-4 rounded-lg transition-colors"
              >
                Coming Soon
              </button>
            </div>
          </div>
        </div>
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
