'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { VampModal } from '@/components/vamp-modal';
import { VolumeModal } from '@/components/volume-modal';
import { WalletsModal } from '@/components/wallets-modal';
import { PortfolioModal } from '@/components/portfolio-modal';
import { Palette } from 'lucide-react';
import { cn } from '@/lib/utils';

const tools = [
  { id: 'vamp', name: 'VAMP', description: 'Token Launch', icon: '/vamp-fangs-silver.png', hoverColor: 'hover:border-red-500/80 hover:bg-red-500/10', textColor: 'group-hover:text-red-500', enabled: true },
  { id: 'volume', name: 'VOLUME', description: 'Volume Bot', icon: '/vamp-blood.png', hoverColor: 'hover:border-blue-400/80 hover:bg-blue-400/10', textColor: 'group-hover:text-blue-400', enabled: true },
  { id: 'wallets', name: 'WALLETS', description: 'Manage Wallets', icon: '/vamp-blood.png', hoverColor: 'hover:border-green-400/80 hover:bg-green-400/10', textColor: 'group-hover:text-green-400', enabled: true },
  { id: 'portfolio', name: 'PORTFOLIO', description: 'Your Tokens', icon: '/vamp-blood.png', hoverColor: 'hover:border-white/60 hover:bg-white/10', textColor: 'group-hover:text-white/90', enabled: true },
];

function InteractiveShaderBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mouseX, setMouseX] = useState(0);
  const [mouseY, setMouseY] = useState(0);
  const [theme, setTheme] = useState<'green' | 'blue' | 'red' | 'purple' | 'cyan'>('green');
  const [showColorPicker, setShowColorPicker] = useState(false);

  const getColorConfig = (currentTheme: typeof theme) => {
    const colors = { green: { r: 0, g: 255, b: 100 }, blue: { r: 0, g: 100, b: 255 }, red: { r: 255, g: 50, b: 100 }, purple: { r: 200, g: 100, b: 255 }, cyan: { r: 100, g: 200, b: 255 } };
    return colors[currentTheme] || colors.green;
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    let time = 0;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    const handleMouseMove = (e: MouseEvent) => { setMouseX(e.clientX); setMouseY(e.clientY); };

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
      const { r: baseR, g: baseG, b: baseB } = colorConfig;

      for (let y = 0; y < height; y += 2) {
        for (let x = 0; x < width; x += 2) {
          const dx = (x - mouseX) / width;
          const dy = (y - mouseY) / height;
          const distToMouse = Math.sqrt(dx * dx + dy * dy);
          const mouseInfluence = Math.max(0, 1 - distToMouse * 2) * 0.8;

          const wave1 = Math.sin((x + time * 150) * 0.015 + y * 0.008) * Math.cos((y + time * 120 + mouseX * 0.01) * 0.012) * 0.85;
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
              if (i < data.length) { data[i] = Math.min(255, r); data[i + 1] = Math.min(255, g); data[i + 2] = Math.min(255, b); data[i + 3] = 255; }
            }
          }
        }
      }

      ctx.putImageData(imageData, 0, 0);
      animationFrameId = requestAnimationFrame(render);
    };

    render();
    return () => { window.removeEventListener('resize', resize); window.removeEventListener('mousemove', handleMouseMove); cancelAnimationFrame(animationFrameId); };
  }, [theme]);

  const themes = ['green', 'blue', 'red', 'purple', 'cyan'] as const;

  return (
    <>
      <canvas ref={canvasRef} className="fixed inset-0 w-full h-full" style={{ opacity: 0.8 }} />
      <div className="fixed bottom-8 right-8 z-40">
        <button onClick={() => setShowColorPicker(!showColorPicker)} className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-xl border-2 border-white/40 hover:border-white/80 flex items-center justify-center transition-all hover:scale-110 hover:bg-white/30">
          <Palette className="w-6 h-6 text-white" />
        </button>
        {showColorPicker && (
          <div className="absolute bottom-16 right-0 bg-black/80 backdrop-blur-2xl border border-white/20 rounded-2xl p-4 flex gap-3 shadow-2xl">
            {themes.map((t) => {
              const colors = { green: '#00ff64', blue: '#0064ff', red: '#ff3264', purple: '#c864ff', cyan: '#64c8ff' };
              return (
                <button key={t} onClick={() => { setTheme(t); setShowColorPicker(false); }} className={`w-8 h-8 rounded-full border-2 transition-all ${theme === t ? 'border-white scale-125' : 'border-white/30 hover:border-white/60'}`} style={{ backgroundColor: colors[t] }} />
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

  return (
    <div className="min-h-screen bg-black relative overflow-hidden">
      <InteractiveShaderBackground />
      <div className="relative z-10">
        <header className="fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur-2xl">
          <div className="flex h-16 items-center justify-center px-6">
            <div className="flex items-center gap-2"><img src="/vamp-blood.png" alt="Blood" className="w-7 h-7" /><h1 className="text-sm font-mono font-bold tracking-wider">DEV TOOL ASSISTANT</h1></div>
            <Button variant="outline" className="border-white/20 bg-white/5 absolute right-6" disabled>LOGIN</Button>
          </div>
        </header>
        <main className="pt-24 pb-12 px-4">
          <div className="flex flex-col items-center gap-8">
            <div className="grid grid-cols-2 gap-4 w-full max-w-2xl">
              {tools.map((tool) => (
                <button key={tool.id} onClick={() => setSelectedTool(tool.id)} className={cn('relative group p-6 rounded-2xl border-2 transition-all duration-300 bg-white/5 backdrop-blur-2xl border-white/10 min-h-48', tool.enabled ? cn('cursor-pointer', tool.hoverColor) : 'cursor-not-allowed opacity-50')}>
                  <div className="flex flex-col items-center gap-3 h-full justify-center text-center">
                    {tool.icon && <img src={tool.icon} alt={tool.name} className="w-10 h-10" />}
                    <div><h3 className={cn('text-4xl font-mono font-black transition-colors duration-300 leading-tight', tool.textColor, 'text-white')}>{tool.name}</h3><p className="text-xs text-white/50 group-hover:text-white/70">{tool.description}</p></div>
                  </div>
                </button>
              ))}\n            </div>
            <div className="flex gap-4 flex-wrap justify-center">
              {[1, 2, 3].map((i) => (<div key={i} className="w-24 h-24 rounded-2xl border-2 border-white/10 bg-white/5 flex items-center justify-center"><span className="text-3xl font-mono font-bold text-white/20">?</span></div>))}
            </div>
          </div>
        </main>
      </div>
      {selectedTool === 'vamp' && <VampModal onClose={() => setSelectedTool(null)} />}
      {selectedTool === 'volume' && <VolumeModal onClose={() => setSelectedTool(null)} />}
      {selectedTool === 'wallets' && <WalletsModal onClose={() => setSelectedTool(null)} />}
      {selectedTool === 'portfolio' && <PortfolioModal onClose={() => setSelectedTool(null)} />}
    </div>
  );
}
