'use client';

import { useState } from 'react';
import { X, Loader2, Play, Pause, Power, TrendingUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useWallets, useVolumeSessions } from '@/hooks/storage';

interface VolumeModalProps { onClose: () => void; }

export function VolumeModal({ onClose }: VolumeModalProps) {
  const { wallets } = useWallets();
  const { sessions, addSession, updateSession, deleteSession } = useVolumeSessions();
  const [step, setStep] = useState<'main' | 'sessions'>('main');
  const [tokenCA, setTokenCA] = useState('');
  const [selectedWallets, setSelectedWallets] = useState<string[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<'organic' | 'fast' | 'turbo'>('organic');
  const [isStarting, setIsStarting] = useState(false);
  const [sessionStats, setSessionStats] = useState<Record<string, { txCount: number; feeSol: number }>>({});

  const volumeWallets = wallets.filter(w => w.type === 'volume');

  const presets = {\n    organic: { label: 'ORGANIC', desc: 'Natural delays (30s-2m)', color: 'text-green-400 border-green-400/30 hover:bg-green-400/10', icon: '🌱' },
    fast: { label: 'FAST', desc: 'Fast delays (5s-30s)', color: 'text-yellow-400 border-yellow-400/30 hover:bg-yellow-400/10', icon: '⚡' },
    turbo: { label: 'TURBO', desc: 'Minimal delays (1s-5s)', color: 'text-red-500 border-red-500/30 hover:bg-red-500/10', icon: '🔥' },
  };

  const toggleWallet = (id: string) => setSelectedWallets(prev => prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]);

  const handleStartSession = () => {
    if (!tokenCA || selectedWallets.length === 0) return;
    setIsStarting(true);
    setTimeout(() => {
      const newSession = { id: Math.random().toString(), ca: tokenCA, preset: selectedPreset, status: 'running' as const, wallets: selectedWallets, createdAt: Date.now() };
      addSession(newSession);
      setSessionStats(prev => ({ ...prev, [newSession.id]: { txCount: 0, feeSol: 0 } }));
      setTokenCA('');
      setSelectedWallets([]);
      setIsStarting(false);
      setStep('sessions');
    }, 1000);
  };

  const toggleSessionPause = (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) updateSession(id, { status: session.status === 'running' ? 'paused' : 'running' });
  };

  const stopSession = (id: string) => deleteSession(id);
  const getSessionStats = (sessionId: string) => sessionStats[sessionId] || { txCount: 0, feeSol: 0 };
  const activeSessions = sessions.filter(s => s.status === 'running' || s.status === 'paused');

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-black/80 backdrop-blur-2xl border-2 border-blue-400/30 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <div className="p-8">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3"><img src="/vamp-blood.png" alt="Volume" className="w-10 h-10" /><h2 className="text-3xl font-mono font-bold text-blue-400">VOLUME</h2></div>
              <Button variant="ghost" size="icon" onClick={onClose} className="hover:bg-blue-400/10"><X className="w-6 h-6" /></Button>
            </div>
            <div className="flex gap-2 mb-6">
              <button onClick={() => setStep('main')} className={cn('flex-1 py-3 px-6 rounded-xl font-bold transition-all text-lg', step === 'main' ? 'bg-blue-400 text-black' : 'bg-white/10 border border-white/20 text-white hover:border-white/40')}>Start Session</button>
              <button onClick={() => setStep('sessions')} className={cn('flex-1 py-3 px-6 rounded-xl font-bold transition-all text-lg', step === 'sessions' ? 'bg-blue-400 text-black' : 'bg-white/10 border border-white/20 text-white hover:border-white/40')}>Active ({activeSessions.length})</button>
            </div>
            {step === 'main' ? (
              <div className="space-y-6">
                <div className="space-y-2"><Label className="text-lg font-semibold text-white/90">Token CA</Label><Input value={tokenCA} onChange={(e) => setTokenCA(e.target.value)} placeholder="Enter token contract address..." className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-11 text-base" /></div>
                <div className="space-y-3"><Label className="text-lg font-semibold text-white/90">Trading Preset</Label><div className="grid grid-cols-3 gap-3">{(Object.entries(presets) as [keyof typeof presets, any][]).map(([key, preset]) => (<button key={key} onClick={() => setSelectedPreset(key)} className={cn('p-4 rounded-xl border-2 transition-all text-center', selectedPreset === key ? `${preset.color} bg-white/10 border-current` : `${preset.color} border-current hover:bg-white/5`)}><div className="text-3xl mb-2">{preset.icon}</div><div className="font-bold text-lg">{preset.label}</div><div className="text-xs opacity-80">{preset.desc}</div></button>))}</div></div>
                <div className="space-y-3"><Label className="text-lg font-semibold text-white/90">Select Wallets ({volumeWallets.length})</Label>{volumeWallets.length === 0 ? (<div className="p-4 rounded-lg border border-dashed border-white/20 text-white/50 text-center">No volume wallets</div>) : (<div className="space-y-2 border border-white/10 rounded-xl p-4 max-h-40 overflow-y-auto">{volumeWallets.map((wallet) => (<label key={wallet.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"><input type="checkbox" checked={selectedWallets.includes(wallet.id)} onChange={() => toggleWallet(wallet.id)} className="w-5 h-5" /><div className="flex-1 min-w-0"><div className="font-mono font-bold text-white">{wallet.name}</div><div className="text-sm text-white/50">{wallet.address}</div></div><div className="text-sm text-white/60">{wallet.balance} SOL</div></label>))}</div>)}<div className="text-sm text-white/60">{selectedWallets.length} selected</div></div>
                <Button onClick={handleStartSession} disabled={isStarting || !tokenCA || selectedWallets.length === 0} className="w-full bg-blue-400 hover:bg-blue-400/80 text-black font-bold h-12 text-base">{isStarting ? (<><Loader2 className="w-5 h-5 mr-2 animate-spin" />Starting...</>) : (<><Play className="w-5 h-5 mr-2" />START SESSION</>)}</Button>
              </div>
            ) : (
              <div className="space-y-3">
                {activeSessions.length === 0 ? (<div className="p-8 text-center text-white/50">No active sessions</div>) : (activeSessions.map((session) => {
                  const stats = getSessionStats(session.id);
                  return (
                    <div key={session.id} className="p-4 rounded-xl border border-white/10 bg-white/5 hover:border-white/30 transition-all">
                      <div className="flex items-start justify-between mb-3">
                        <div><div className="flex items-center gap-3 mb-2"><span className="font-mono text-white font-bold">{session.ca.slice(0, 8)}...</span><span className="text-sm font-bold px-3 py-1 rounded-full" style={{backgroundColor: session.preset === 'organic' ? '#22c55e20' : session.preset === 'fast' ? '#eab30820' : '#ef444420', color: session.preset === 'organic' ? '#22c55e' : session.preset === 'fast' ? '#eab308' : '#ef4444'}}>{session.preset.toUpperCase()}</span><span className="text-xs px-2 py-1 bg-green-400/20 text-green-400 rounded">{session.status === 'running' ? '🟢 RUNNING' : '🟡 PAUSED'}</span></div></div>
                        <div className="flex gap-2"><Button variant="outline" size="sm" onClick={() => toggleSessionPause(session.id)} className="border-white/20 h-9">{session.status === 'running' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}</Button><Button variant="outline" size="sm" onClick={() => stopSession(session.id)} className="border-destructive/30 text-destructive h-9"><Power className="w-4 h-4" /></Button></div>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="p-2 rounded-lg bg-white/5 border border-white/10"><div className="text-xs text-white/60">Wallets</div><div className="text-lg font-bold text-white">{session.wallets.length}</div></div>
                        <div className="p-2 rounded-lg bg-white/5 border border-white/10"><div className="text-xs text-white/60 flex items-center gap-1"><TrendingUp className="w-3 h-3" />Txs</div><div className="text-lg font-bold text-white">{stats.txCount}</div></div>
                        <div className="p-2 rounded-lg bg-white/5 border border-white/10"><div className="text-xs text-white/60">Fee (SOL)</div><div className="text-lg font-bold text-white">{stats.feeSol.toFixed(4)}</div></div>
                      </div>
                    </div>
                  );
                }))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
