'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { VampModal } from '@/components/vamp-modal';
import { VolumeModal } from '@/components/volume-modal';
import { WalletsModal } from '@/components/wallets-modal';
import { Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

const tools = [
  {
    id: 'vamp',
    name: 'VAMP',
    description: 'Token Launch Platform',
    icon: '/vamp-fangs-silver.png',
    hoverColor: 'hover:border-red-500/80 hover:bg-red-500/10',
    textColor: 'group-hover:text-red-500',
    enabled: true,
  },
  {
    id: 'volume',
    name: 'VOLUME',
    description: 'Volume Bot',
    icon: '/vamp-blood.png',
    hoverColor: 'hover:border-blue-400/80 hover:bg-blue-400/10',
    textColor: 'group-hover:text-blue-400',
    enabled: true,
  },
  {
    id: 'wallets',
    name: 'WALLETS',
    description: 'Wallet Management',
    icon: '/vamp-blood.png',
    hoverColor: 'hover:border-green-400/80 hover:bg-green-400/10',
    textColor: 'group-hover:text-green-400',
    enabled: true,
  },
  {
    id: 'portfolio',
    name: 'PORTFOLIO',
    description: 'Portfolio Tracking',
    icon: '/vamp-blood.png',
    hoverColor: 'hover:border-white/60 hover:bg-white/10',
    textColor: 'group-hover:text-white/90',
    enabled: false,
  },
  {
    id: 'web3',
    name: 'WEB3 ПРОЕКТЫ',
    description: 'Coming Soon',
    icon: null,
    hoverColor: 'hover:border-white/60 hover:bg-white/10',
    textColor: 'group-hover:text-white/90',
    enabled: false,
  },
];

const comingSoonBlocks = [
  { id: 1, label: '?' },
  { id: 2, label: '?' },
  { id: 3, label: '?' },
];

// Interactive Shader with Mouse Tracking
function InteractiveShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [theme, setTheme] = useState<'green' | 'blue' | 'red' | 'purple' | 'cyan'>('green');
  const [showColorPicker, setShowColorPicker] = useState(false);

  const getColorConfig = (currentTheme: typeof theme) => {
    switch (currentTheme) {
      case 'green':
        return { r: 0, g: 255, b: 100 };
      case 'blue':
        return { r: 0, g: 100, b: 255 };
      case 'red':
        return { r: 255, g: 50, b: 100 };
      case 'purple':
        return { r: 200, g: 100, b: 255 };
      case 'cyan':
        return { r: 100, g: 200, b: 255 };
      default:
        return { r: 0, g: 255, b: 100 };
    }
  };

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

    const handleMouseMove = (e: MouseEvent) => {
      setMouseX(e.clientX);
      setMouseY(e.clientY);
    };

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('mousemove', handleMouseMove);

    const render = () => {
      const width = canvas.width;
      const height = canvas.height;
      
      time += 0.005;

      const imageData = ctx.createImageData(width, height);
      const data = imageData.data;

      const colorConfig = getColorConfig(theme);
      const baseR = colorConfig.r;
      const baseG = colorConfig.g;
      const baseB = colorConfig.b;

      for (let y = 0; y < height; y += 2) {
        for (let x = 0; x < width; x += 2) {
          const dx = (x - mouseX) / width;
          const dy = (y - mouseY) / height;
          const distToMouse = Math.sqrt(dx * dx + dy * dy);
          const mouseInfluence = Math.max(0, 1 - distToMouse * 2) * 0.8;

          const wave1 = Math.sin((x + time * 150) * 0.015 + y * 0.008) * 
                       Math.cos((y + time * 120 + mouseX * 0.01) * 0.012) * 0.85;
          
          const wave2 = Math.sin((x - time * 100) * 0.008 + y * 0.01 + time * 0.5 + mouseY * 0.005) * 0.7;
          const wave3 = Math.cos((x + y) * 0.004 + time * 1.2) * 0.6;
          const wave4 = Math.sin(time * 2 - (x + y) * 0.006 + mouseInfluence * 5) * 0.5;

          const cursorWave = mouseInfluence * Math.sin(time * 8 + distToMouse * 20);

          const combined = (wave1 + wave2 + wave3 + wave4 + cursorWave * 0.5) / 2.85;
          const value = Math.floor((combined + 1) * 80);

          const brightness = Math.sin(x * 0.001 + time * 0.1) * 0.3 + 0.7 + mouseInfluence * 0.3;

          const r = Math.floor(value * (baseR / 255) * brightness);
          const g = Math.floor((value * 0.8 + 60) * (baseG / 255) * brightness);
          const b = Math.floor((value + 100) * (baseB / 255) * brightness);

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
      window.removeEventListener('mousemove', handleMouseMove);
      cancelAnimationFrame(animationFrameId);
    };
  }, [theme]);

  const themes = ['green', 'blue', 'red', 'purple', 'cyan'] as const;

  return (
    <>
      <canvas
        ref={canvasRef}
        className="fixed inset-0 w-full h-full"
        style={{ opacity: 0.8 }}
      />

      {/* Theme Switcher Button */}
      <div className="fixed bottom-8 right-8 z-40">
        <button
          onClick={() => setShowColorPicker(!showColorPicker)}
          className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xl border-2 border-white/40 hover:border-white/80 flex items-center justify-center transition-all hover:scale-110 hover:bg-white/30"
          title="Change theme"
        >
          <Palette className="w-6 h-6 text-white" />
        </button>

        {showColorPicker && (
          <div className="absolute bottom-16 right-0 bg-black/80 backdrop-blur-2xl border border-white/20 rounded-2xl p-4 flex gap-3 shadow-2xl animate-in fade-in duration-200">
            {themes.map((t) => {
              const colors = {
                green: '#00ff64',
                blue: '#0064ff',
                red: '#ff3264',
                purple: '#c864ff',
                cyan: '#64c8ff',
              };
              return (
                <button
                  key={t}
                  onClick={() => {
                    setTheme(t);
                    setShowColorPicker(false);
                  }}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    theme === t ? 'border-white scale-125' : 'border-white/30 hover:border-white/60'
                  }`}
                  style={{
                    backgroundColor: colors[t],
                  }}
                  title={`${t.charAt(0).toUpperCase() + t.slice(1)} theme`}
                />
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

export default function Home() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);

  const handleToolClick = (toolId: string, enabled: boolean) => {
    if (!enabled) return;
    setSelectedTool(toolId);
  };

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      {/* Interactive Shader Background */}
      <InteractiveShaderBackground />

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur-2xl">
          <div className="container mx-auto flex h-16 items-center justify-center px-6">
            <div className="flex items-center gap-3 absolute left-1/2 -translate-x-1/2">
              <img src="/vamp-blood.png" alt="Blood" className="w-8 h-8" />
              <h1 className="text-xl font-mono font-bold tracking-wider text-foreground">
                DEV TOOL ASSISTANT
              </h1>
            </div>
            
            <Button
              variant="outline"
              className="border-white/20 bg-white/5 hover:bg-white/10 backdrop-blur-xl absolute right-6"
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
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
              {tools.map((tool) => (
                <button
                  key={tool.id}
                  onClick={() => handleToolClick(tool.id, tool.enabled)}
                  disabled={!tool.enabled}
                  className={cn(
                    'relative group p-8 rounded-3xl border-2 transition-all duration-300',
                    'bg-white/5 backdrop-blur-2xl border-white/10',
                    tool.enabled
                      ? cn('cursor-pointer', tool.hoverColor)
                      : 'cursor-not-allowed opacity-50'
                  )}
                >
                  <div className="flex flex-col items-center gap-6 text-center">
                    {tool.icon ? (
                      <img src={tool.icon} alt={tool.name} className="w-12 h-12" />
                    ) : (
                      <div className="w-12 h-12 flex items-center justify-center">
                        <span className="text-2xl font-mono font-bold text-white/60 group-hover:text-white/80 transition-colors">
                          {tool.name[0]}
                        </span>
                      </div>
                    )}
                    
                    <div>
                      <h3 className={cn(
                        'text-7xl font-mono font-black mb-4 transition-colors duration-300 leading-tight',
                        tool.textColor,
                        'text-white'
                      )}>
                        {tool.name}
                      </h3>
                      <p className="text-lg text-white/50 group-hover:text-white/70 transition-colors">
                        {tool.description}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            {/* Coming Soon Blocks */}
            <div className="flex justify-center gap-8">
              {comingSoonBlocks.map((block) => (
                <div
                  key={block.id}
                  className="w-40 h-40 rounded-3xl border-2 border-white/10 bg-white/5 backdrop-blur-2xl flex items-center justify-center hover:border-white/20 transition-all"
                >
                  <span className="text-5xl font-mono font-bold text-white/20">
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
      {selectedTool === 'wallets' && (
        <WalletsModal onClose={() => setSelectedTool(null)} />
      )}
    </div>
  );
}
