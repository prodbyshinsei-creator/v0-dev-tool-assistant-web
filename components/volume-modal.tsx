'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Play, Pause, Power } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface WalletType {
  id: number;
  name: string;
  address: string;
  balance: number;
}

interface VolumeSession {
  id: string;
  ca: string;
  status: 'running' | 'paused' | 'stopped';
  txs: number;
  fees_sol: number;
  wallets_count: number;
}

interface VolumeModalProps {
  onClose: () => void;
}

export function VolumeModal({ onClose }: VolumeModalProps) {
  const [step, setStep] = useState<'main' | 'sessions'>('main');
  const [tokenCA, setTokenCA] = useState('');
  const [selectedWallets, setSelectedWallets] = useState<number[]>([]);
  const [minSol, setMinSol] = useState('0.01');
  const [maxSol, setMaxSol] = useState('0.05');
  
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [isLoadingWallets, setIsLoadingWallets] = useState(false);
  const [isStarting, setIsStarting] = useState(false);
  const [sessions, setSessions] = useState<VolumeSession[]>([]);

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async () => {
    try {
      setIsLoadingWallets(true);
      const response = await fetch(`${API_URL}/wallets?user_id=1&wallet_type=volume`);
      
      if (response.ok) {
        const data = await response.json();
        if (data.success && data.wallets) {
          setWallets(data.wallets);
        }
      }
    } catch (error) {
      console.log('Backend unavailable');
    } finally {
      setIsLoadingWallets(false);
    }
  };

  const toggleWallet = (walletId: number) => {
    if (selectedWallets.includes(walletId)) {
      setSelectedWallets(selectedWallets.filter(id => id !== walletId));
    } else {
      setSelectedWallets([...selectedWallets, walletId]);
    }
  };

  const handleStartSession = async () => {
    if (!tokenCA || selectedWallets.length === 0) return;
    
    setIsStarting(true);

    try {
      const walletAddresses = wallets
        .filter(w => selectedWallets.includes(w.id))
        .map(w => w.address);

      const response = await fetch(`${API_URL}/volume/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ca: tokenCA,
          wallet_addresses: walletAddresses,
          min_sol: parseFloat(minSol),
          max_sol: parseFloat(maxSol),
          user_id: 1,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.session_id) {
          const newSession: VolumeSession = {
            id: data.session_id,
            ca: tokenCA,
            status: 'running',
            txs: 0,
            fees_sol: 0,
            wallets_count: selectedWallets.length,
          };
          setSessions([newSession, ...sessions]);
          
          setTokenCA('');
          setSelectedWallets([]);
          setMinSol('0.01');
          setMaxSol('0.05');
          
          setIsStarting(false);
          return;
        }
      }

      throw new Error('API unavailable');
    } catch (error) {
      console.log('Mock session start');
      setTimeout(() => {
        const newSession: VolumeSession = {
          id: `session-${Date.now()}`,
          ca: tokenCA,
          status: 'running',
          txs: 0,
          fees_sol: 0,
          wallets_count: selectedWallets.length,
        };
        setSessions([newSession, ...sessions]);
        
        setTokenCA('');
        setSelectedWallets([]);
        setIsStarting(false);
      }, 1000);
    }
  };

  const toggleSessionPause = async (sessionId: string) => {
    try {
      await fetch(`${API_URL}/volume/pause/${sessionId}`, {
        method: 'POST',
      });
    } catch (error) {}
    
    setSessions(sessions.map(s => 
      s.id === sessionId 
        ? { ...s, status: s.status === 'running' ? 'paused' : 'running' }
        : s
    ));
  };

  const stopSession = async (sessionId: string) => {
    try {
      await fetch(`${API_URL}/volume/stop/${sessionId}`, {
        method: 'POST',
      });
    } catch (error) {}
    
    setSessions(sessions.filter(s => s.id !== sessionId));
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-card border-2 border-volume-blue/30 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-8">
            {/* Header with close button */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <img src="/vamp-blood.png" alt="Volume" className="w-10 h-10" />
                <h2 className="text-2xl font-mono font-bold text-volume-blue">VOLUME</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="hover:bg-volume-blue/10"
              >
                <X className="w-5 h-5" />
              </Button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              <button
                onClick={() => setStep('main')}
                className={cn(
                  'flex-1 py-2 px-4 rounded-lg font-bold transition-all',
                  step === 'main'
                    ? 'bg-volume-blue text-foreground'
                    : 'bg-transparent border border-volume-blue/30 text-muted-foreground hover:border-volume-blue/60'
                )}
              >
                Start Session
              </button>
              <button
                onClick={() => setStep('sessions')}
                className={cn(
                  'flex-1 py-2 px-4 rounded-lg font-bold transition-all',
                  step === 'sessions'
                    ? 'bg-volume-blue text-foreground'
                    : 'bg-transparent border border-volume-blue/30 text-muted-foreground hover:border-volume-blue/60'
                )}
              >
                Active Sessions ({sessions.length})
              </button>
            </div>

            {/* Content */}
            {step === 'main' ? (
              <div className="space-y-5">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Token Contract Address</Label>
                  <Input
                    placeholder="Enter token CA..."
                    value={tokenCA}
                    onChange={(e) => setTokenCA(e.target.value)}
                    className="bg-input border-border focus:border-volume-blue/50 font-mono text-sm h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold">Select Wallets</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border border-border/30 rounded-lg p-3">
                    {isLoadingWallets ? (
                      <div className="text-sm text-muted-foreground">Loading wallets...</div>
                    ) : wallets.length === 0 ? (
                      <div className="text-sm text-muted-foreground">No volume wallets. Create one first.</div>
                    ) : (
                      wallets.map((wallet) => (
                        <label
                          key={wallet.id}
                          className="flex items-center gap-3 p-2 rounded hover:bg-volume-blue/10 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={selectedWallets.includes(wallet.id)}
                            onChange={() => toggleWallet(wallet.id)}
                            className="w-4 h-4"
                          />
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-mono font-bold">{wallet.name}</div>
                            <div className="text-xs text-muted-foreground">{wallet.balance.toFixed(2)} SOL</div>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Min SOL</Label>
                    <Input
                      placeholder="0.01"
                      value={minSol}
                      onChange={(e) => setMinSol(e.target.value)}
                      type="number"
                      step="0.01"
                      className="bg-input border-border font-mono text-sm h-10"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm font-semibold">Max SOL</Label>
                    <Input
                      placeholder="0.05"
                      value={maxSol}
                      onChange={(e) => setMaxSol(e.target.value)}
                      type="number"
                      step="0.01"
                      className="bg-input border-border font-mono text-sm h-10"
                    />
                  </div>
                </div>

                <Button
                  onClick={handleStartSession}
                  disabled={isStarting || !tokenCA || selectedWallets.length === 0}
                  className="w-full bg-volume-blue hover:bg-volume-blue/80 text-foreground font-bold h-11"
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
              <div className="space-y-2">
                {sessions.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground">No active sessions</div>
                ) : (
                  sessions.map((session) => (
                    <div
                      key={session.id}
                      className="flex items-center justify-between p-3 rounded-lg border border-border bg-card/50 hover:border-volume-blue/30"
                    >
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-bold">{session.ca.slice(0, 8)}...</span>
                          <span
                            className={cn(
                              'text-xs px-2 py-0.5 rounded font-mono',
                              session.status === 'running'
                                ? 'bg-wallet-green/20 text-wallet-green'
                                : 'bg-yellow-500/20 text-yellow-400'
                            )}
                          >
                            {session.status.toUpperCase()}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {session.txs} txs • {session.fees_sol.toFixed(4)} SOL • {session.wallets_count} wallets
                        </div>
                      </div>

                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => toggleSessionPause(session.id)}
                          className="border-volume-blue/30 hover:border-volume-blue/60 h-8"
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
                          className="border-destructive/30 hover:border-destructive/60 hover:bg-destructive/10 text-destructive h-8"
                        >
                          <Power className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
