'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { VampModal } from '@/components/vamp-modal';
import { VolumeModal } from '@/components/volume-modal';
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
              }\n            }\n          }\n        }\n      }\n\n      ctx.putImageData(imageData, 0, 0);\n      animationFrameId = requestAnimationFrame(render);\n    };\n\n    render();\n\n    return () => {\n      window.removeEventListener('resize', resize);\n      window.removeEventListener('mousemove', handleMouseMove);\n      cancelAnimationFrame(animationFrameId);\n    };\n  }, [theme]);\n\n  const themes = ['green', 'blue', 'red', 'purple', 'cyan'] as const;\n\n  return (\n    <>\n      <canvas\n        ref={canvasRef}\n        className=\"fixed inset-0 w-full h-full\"\n        style={{ opacity: 0.8 }}\n      />\n\n      {/* Theme Switcher Button */}\n      <div className=\"fixed bottom-8 right-8 z-40\">\n        <button\n          onClick={() => setShowColorPicker(!showColorPicker)}\n          className=\"w-12 h-12 rounded-full bg-white/20 backdrop-blur-xl border-2 border-white/40 hover:border-white/80 flex items-center justify-center transition-all hover:scale-110 hover:bg-white/30\"\n          title=\"Change theme\"\n        >\n          <Palette className=\"w-6 h-6 text-white\" />\n        </button>\n\n        {showColorPicker && (\n          <div className=\"absolute bottom-16 right-0 bg-black/80 backdrop-blur-2xl border border-white/20 rounded-2xl p-4 flex gap-3 shadow-2xl animate-in fade-in duration-200\">\n            {themes.map((t) => {\n              const colors = {\n                green: '#00ff64',\n                blue: '#0064ff',\n                red: '#ff3264',\n                purple: '#c864ff',\n                cyan: '#64c8ff',\n              };\n              return (\n                <button\n                  key={t}\n                  onClick={() => {\n                    setTheme(t);\n                    setShowColorPicker(false);\n                  }}\n                  className={`w-8 h-8 rounded-full border-2 transition-all ${\n                    theme === t ? 'border-white scale-125' : 'border-white/30 hover:border-white/60'\n                  }`}\n                  style={{\n                    backgroundColor: colors[t],\n                  }}\n                  title={`${t.charAt(0).toUpperCase() + t.slice(1)} theme`}\n                />\n              );\n            })}\n          </div>\n        )}\n      </div>\n    </>\n  );\n}\n\nexport default function Home() {\n  const [selectedTool, setSelectedTool] = useState<string | null>(null);\n  const [showWalletsModal, setShowWalletsModal] = useState(false);\n\n  const handleToolClick = (toolId: string, enabled: boolean) => {\n    if (!enabled) return;\n    \n    if (toolId === 'vamp') {\n      setSelectedTool('vamp');\n    } else if (toolId === 'volume') {\n      setSelectedTool('volume');\n    } else if (toolId === 'wallets') {\n      setShowWalletsModal(true);\n    }\n  };\n\n  return (\n    <div className=\"min-h-screen bg-black relative overflow-hidden\">\n      {/* Interactive Shader Background */}\n      <InteractiveShaderBackground />\n\n      {/* Content */}\n      <div className=\"relative z-10\">\n        {/* Header */}\n        <header className=\"fixed top-0 left-0 right-0 z-50 border-b border-white/10 bg-black/60 backdrop-blur-2xl\">\n          <div className=\"container mx-auto flex h-16 items-center justify-center px-6\">\n            <div className=\"flex items-center gap-3 absolute left-1/2 -translate-x-1/2\">\n              <img src=\"/vamp-blood.png\" alt=\"Blood\" className=\"w-8 h-8\" />\n              <h1 className=\"text-xl font-mono font-bold tracking-wider text-foreground\">\n                DEV TOOL ASSISTANT\n              </h1>\n            </div>\n            \n            <Button\n              variant=\"outline\"\n              className=\"border-white/20 bg-white/5 hover:bg-white/10 backdrop-blur-xl absolute right-6\"\n              disabled\n            >\n              LOGIN\n            </Button>\n          </div>\n        </header>\n\n        {/* Main Content */}\n        <main className=\"pt-24 pb-12 px-6\">\n          <div className=\"container mx-auto max-w-7xl\">\n            {/* Tool Blocks Grid */}\n            <div className=\"grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16\">\n              {tools.map((tool) => (\n                <button\n                  key={tool.id}\n                  onClick={() => handleToolClick(tool.id, tool.enabled)}\n                  disabled={!tool.enabled}\n                  className={cn(\n                    'relative group p-8 rounded-3xl border-2 transition-all duration-300',\n                    'bg-white/5 backdrop-blur-2xl border-white/10',\n                    tool.enabled\n                      ? cn('cursor-pointer', tool.hoverColor)\n                      : 'cursor-not-allowed opacity-50'\n                  )}\n                >\n                  <div className=\"flex flex-col items-center gap-6 text-center\">\n                    {tool.icon ? (\n                      <img src={tool.icon} alt={tool.name} className=\"w-16 h-16\" />\n                    ) : (\n                      <div className=\"w-16 h-16 flex items-center justify-center\">\n                        <span className=\"text-3xl font-mono font-bold text-white/60 group-hover:text-white/80 transition-colors\">\n                          {tool.name[0]}\n                        </span>\n                      </div>\n                    )}\n                    \n                    <div>\n                      <h3 className={cn(\n                        'text-5xl font-mono font-bold mb-3 transition-colors duration-300',\n                        tool.textColor,\n                        'text-white'\n                      )}>\n                        {tool.name}\n                      </h3>\n                      <p className=\"text-base text-white/50 group-hover:text-white/70 transition-colors\">\n                        {tool.description}\n                      </p>\n                    </div>\n                  </div>\n                </button>\n              ))}\n            </div>\n\n            {/* Coming Soon Blocks */}\n            <div className=\"flex justify-center gap-8\">\n              {comingSoonBlocks.map((block) => (\n                <div\n                  key={block.id}\n                  className=\"w-40 h-40 rounded-3xl border-2 border-white/10 bg-white/5 backdrop-blur-2xl flex items-center justify-center hover:border-white/20 transition-all\"\n                >\n                  <span className=\"text-5xl font-mono font-bold text-white/20\">\n                    {block.label}\n                  </span>\n                </div>\n              ))}\n            </div>\n          </div>\n        </main>\n      </div>\n\n      {/* VAMP Modal */}\n      {selectedTool === 'vamp' && (\n        <VampModal onClose={() => setSelectedTool(null)} />\n      )}\n\n      {/* Volume Modal */}\n      {selectedTool === 'volume' && (\n        <VolumeModal onClose={() => setSelectedTool(null)} />\n      )}\n\n      {/* Wallets Modal */}\n      {showWalletsModal && (\n        <div className=\"fixed inset-0 z-50 flex items-center justify-center p-4\">\n          <div\n            className=\"absolute inset-0 bg-black/80 backdrop-blur-sm\"\n            onClick={() => setShowWalletsModal(false)}\n          />\n          <div className=\"relative bg-black/80 backdrop-blur-2xl border-2 border-green-400/30 rounded-3xl max-w-md w-full p-8 shadow-2xl\">\n            <button\n              onClick={() => setShowWalletsModal(false)}\n              className=\"absolute top-4 right-4 text-white/60 hover:text-white/90 transition-colors\"\n            >\n              ✕\n            </button>\n            <div className=\"flex items-center gap-3 mb-6\">\n              <img src=\"/vamp-blood.png\" alt=\"Wallets\" className=\"w-10 h-10\" />\n              <h2 className=\"text-2xl font-mono font-bold text-green-400\">WALLETS</h2>\n            </div>\n            <div className=\"space-y-4\">\n              <p className=\"text-white/70\">Manage and monitor your Solana wallets</p>\n              <div className=\"p-4 rounded-2xl bg-green-400/10 border border-green-400/30\">\n                <p className=\"text-sm text-white/90 mb-3 font-semibold\">Features:</p>\n                <ul className=\"text-sm text-white/60 space-y-2\">\n                  <li>✓ Create & import wallets</li>\n                  <li>✓ Real-time balance tracking</li>\n                  <li>✓ Transaction history</li>\n                  <li>✓ Multi-signature support</li>\n                  <li>✓ Token portfolio overview</li>\n                </ul>\n              </div>\n              <button\n                onClick={() => setShowWalletsModal(false)}\n                className=\"w-full bg-green-400 hover:bg-green-400/80 text-black font-bold py-3 px-4 rounded-xl transition-colors\"\n              >\n                Coming Soon\n              </button>\n            </div>\n          </div>\n        </div>\n      )}\n    </div>\n  );\n}\nENDOFFILE
echo "Homepage fixed created"
