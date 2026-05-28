'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Play, Pause, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useWallets, useVolumeSessions } from '@/hooks/storage';

interface VolumeModalProps {
  onClose: () => void;
}

export function VolumeModal({ onClose }: VolumeModalProps) {
  const { wallets } = useWallets();
  const { sessions, addSession, updateSession, deleteSession } = useVolumeSessions();
  const [step, setStep] = useState<'main' | 'sessions'>('main');
  const [tokenCA, setTokenCA] = useState('');
  const [selectedWallets, setSelectedWallets] = useState<string[]>([]);
  const [selectedPreset, setSelectedPreset] = useState<'organic' | 'fast' | 'turbo'>('organic');
  const [isStarting, setIsStarting] = useState(false);

  const volumeWallets = wallets.filter(w => w.type === 'volume');

  const presets = {
    organic: {
      label: 'ORGANIC',
      desc: 'Natural trading pattern',
      color: 'text-green-400 border-green-400/30 hover:bg-green-400/10',
      icon: '🌱',
      delay: '30s - 2m',
      txPerHour: '2-4',
    },
    fast: {
      label: 'FAST',
      desc: 'Faster than organic',
      color: 'text-yellow-400 border-yellow-400/30 hover:bg-yellow-400/10',
      icon: '⚡',
      delay: '5s - 30s',
      txPerHour: '8-12',
    },
    turbo: {
      label: 'TURBO',
      desc: 'Maximum speed',
      color: 'text-red-500 border-red-500/30 hover:bg-red-500/10',
      icon: '🔥',
      delay: '1s - 5s',
      txPerHour: '20-30',
    },
  };

  const getSessionStats = (session: any) => {
    const sessionHours = (Date.now() - session.createdAt) / 3600000;
    const txCount = Math.floor(sessionHours * (
      session.preset === 'organic' ? 3 :
      session.preset === 'fast' ? 10 :
      25
    ));
    const estFees = txCount * 0.00025; // Approx SOL fees
    
    return { txCount, estFees };
  };

  const toggleWallet = (id: string) => {
    setSelectedWallets(prev =>
      prev.includes(id) ? prev.filter(w => w !== id) : [...prev, id]
    );
  };

  const handleStartSession = () => {
    if (!tokenCA || selectedWallets.length === 0) return;
    
    setIsStarting(true);
    setTimeout(() => {
      const newSession = {
        id: Math.random().toString(),
        ca: tokenCA,
        preset: selectedPreset,
        status: 'running' as const,
        wallets: selectedWallets,
        createdAt: Date.now(),
      };
      addSession(newSession);
      
      setTokenCA('');
      setSelectedWallets([]);
      setIsStarting(false);
      setStep('sessions');
    }, 1000);
  };

  const toggleSessionPause = (id: string) => {
    const session = sessions.find(s => s.id === id);
    if (session) {
      updateSession(id, {
        status: session.status === 'running' ? 'paused' : 'running'
      });
    }
  };

  const stopSession = (id: string) => {
    deleteSession(id);
  };

  const activeSessions = sessions.filter(s => s.status === 'running' || s.status === 'paused');

  return (
    <>
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-black/80 backdrop-blur-2xl border-2 border-blue-400/30 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <img src="/vamp-blood.png" alt="Volume" className="w-10 h-10" />
                <h2 className="text-3xl font-mono font-bold text-blue-400">VOLUME</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="hover:bg-blue-400/10"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setStep('main')}
                className={cn(
                  'flex-1 py-3 px-6 rounded-xl font-bold transition-all text-lg',
                  step === 'main'
                    ? 'bg-blue-400 text-black'
                    : 'bg-white/10 border border-white/20 text-white hover:border-white/40'
                )}
              >
                Start Session
              </button>
              <button
                onClick={() => setStep('sessions')}
                className={cn(
                  'flex-1 py-3 px-6 rounded-xl font-bold transition-all text-lg',
                  step === 'sessions'
                    ? 'bg-blue-400 text-black'
                    : 'bg-white/10 border border-white/20 text-white hover:border-white/40'
                )}
              >
                Active Sessions ({activeSessions.length})
              </button>
            </div>

            {step === 'main' ? (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-lg font-semibold text-white/90">Token CA</Label>
                  <Input
                    value={tokenCA}
                    onChange={(e) => setTokenCA(e.target.value)}
                    placeholder="Enter token contract address..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-11 text-base"
                  />
                </div>

                {/* Preset Selection with Stats */}
                <div className="space-y-3">
                  <Label className="text-lg font-semibold text-white/90">Trading Preset</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {(Object.entries(presets) as [keyof typeof presets, any][]).map(([key, preset]) => (
                      <button
                        key={key}
                        onClick={() => setSelectedPreset(key)}
                        className={cn(
                          'p-4 rounded-xl border-2 transition-all text-center',
                          selectedPreset === key
                            ? `${preset.color} bg-white/10 border-current`
                            : `${preset.color} border-current hover:bg-white/5`
                        )}
                      >
                        <div className="text-3xl mb-2">{preset.icon}</div>
                        <div className="font-bold text-lg">{preset.label}</div>
                        <div className="text-xs opacity-70 mb-2">{preset.delay}</div>
                        <div className="text-xs opacity-60 border-t border-current/20 pt-2 mt-2">
                          ~{preset.txPerHour} tx/h
                        </div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Wallet Selection */}
                <div className="space-y-3">
                  <Label className="text-lg font-semibold text-white/90">
                    Select Wallets ({volumeWallets.length})
                  </Label>
                  {volumeWallets.length === 0 ? (
                    <div className="p-4 rounded-lg border border-dashed border-white/20 text-white/50 text-center">
                      No volume wallets yet. Create one in WALLETS section
                    </div>
                  ) : (
                    <div className="space-y-2 border border-white/10 rounded-xl p-4 max-h-40 overflow-y-auto">
                      {volumeWallets.map((wallet) => (
                        <label
                          key={wallet.id}
                          className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedWallets.includes(wallet.id)}
                            onChange={() => toggleWallet(wallet.id)}
                            className="w-5 h-5"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="font-mono font-bold text-white">{wallet.name}</div>
                            <div className="text-sm text-white/50">{wallet.address.slice(0, 12)}...</div>
                          </div>
                          <div className="text-sm text-white/60">{wallet.balance} SOL</div>
                        </label>
                      ))}
                    </div>
                  )}
                  <div className="text-sm text-white/60">{selectedWallets.length} selected</div>
                </div>

                {/* Start Button */}
                <Button
                  onClick={handleStartSession}
                  disabled={isStarting || !tokenCA || selectedWallets.length === 0}
                  className="w-full bg-blue-400 hover:bg-blue-400/80 text-black font-bold h-12 text-base"
                >
                  {isStarting ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <Play className="w-5 h-5 mr-2" />
                      START SESSION
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {activeSessions.length === 0 ? (
                  <div className="p-8 text-center text-white/50">No active sessions</div>
                ) : (
                  activeSessions.map((session) => {
                    const { txCount, estFees } = getSessionStats(session);
                    return (
                      <div
                        key={session.id}
                        className="flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5 hover:border-white/30 transition-all"
                      >
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="font-mono text-white font-bold text-sm">{session.ca.slice(0, 8)}...</span>
                            <span className="text-xs font-bold px-3 py-1 rounded-full"
                              style={{
                                backgroundColor: session.preset === 'organic' ? '#22c55e20' : 
                                               session.preset === 'fast' ? '#eab30820' :
                                               '#ef444420',
                                color: session.preset === 'organic' ? '#22c55e' :
                                      session.preset === 'fast' ? '#eab308' :
                                      '#ef4444'
                              }}
                            >
                              {session.preset.toUpperCase()}
                            </span>
                            <span className="text-xs px-2 py-1 bg-blue-400/20 text-blue-400 rounded">
                              {session.status === 'running' ? '🟢 RUNNING' : '🟡 PAUSED'}
                            </span>
                          </div>
                          <div className="flex gap-4 text-xs text-white/60">
                            <span>Wallets: {session.wallets.length}</span>
                            <span>Txs: ~{txCount}</span>
                            <span>Fees: ~{estFees.toFixed(6)} SOL</span>
                          </div>
                        </div>

                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleSessionPause(session.id)}
                            className="border-white/20 h-9"
                          >
                            {session.status === 'running' ? (
                              <Pause className="w-4 h-4" />
                            ) : (
                              <Play className="w-4 h-4" />
                            )}
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => stopSession(session.id)}
                            className="border-destructive/30 hover:border-destructive/60 text-destructive h-9"
                          >
                            <Power className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
