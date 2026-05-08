'use client';

import { useState, useEffect, useRef } from 'react';
import { Activity, Play, Pause, Square, Zap, Clock, Leaf } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Header } from '@/components/header';
import { useWalletStore, shortenAddress } from '@/lib/wallet-store';
import { cn } from '@/lib/utils';

interface VolumePanelProps {
  onBack: () => void;
}

type VolumeMode = 'speed' | 'classic' | 'organic';
type BotStatus = 'idle' | 'running' | 'paused';

const modeConfig = {
  speed: { icon: Zap, label: 'Speed Mode', description: 'Fast transactions' },
  classic: { icon: Clock, label: 'Classic', description: 'Balanced approach' },
  organic: { icon: Leaf, label: 'Organic', description: 'Natural patterns' },
};

export function VolumePanel({ onBack }: VolumePanelProps) {
  const { wallets } = useWalletStore();
  const [tokenCA, setTokenCA] = useState('');
  const [selectedWallets, setSelectedWallets] = useState<string[]>([]);
  const [mode, setMode] = useState<VolumeMode>('classic');
  const [status, setStatus] = useState<BotStatus>('idle');
  const [stats, setStats] = useState({ txCount: 0, feesSpent: 0 });
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const toggleWallet = (walletId: string) => {
    setSelectedWallets((prev) =>
      prev.includes(walletId)
        ? prev.filter((id) => id !== walletId)
        : [...prev, walletId]
    );
  };

  const selectAll = () => {
    if (selectedWallets.length === wallets.length) {
      setSelectedWallets([]);
    } else {
      setSelectedWallets(wallets.map((w) => w.id));
    }
  };

  const handleStart = () => {
    if (!tokenCA || selectedWallets.length === 0) return;
    setStatus('running');
  };

  const handlePause = () => {
    setStatus('paused');
  };

  const handleResume = () => {
    setStatus('running');
  };

  const handleStop = () => {
    setStatus('idle');
    setStats({ txCount: 0, feesSpent: 0 });
  };

  // Simulate running stats
  useEffect(() => {
    if (status === 'running') {
      intervalRef.current = setInterval(() => {
        const txIncrement = mode === 'speed' ? 3 : mode === 'classic' ? 2 : 1;
        const feeIncrement = mode === 'speed' ? 0.002 : mode === 'classic' ? 0.001 : 0.0005;
        
        setStats((prev) => ({
          txCount: prev.txCount + txIncrement,
          feesSpent: prev.feesSpent + feeIncrement,
        }));
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [status, mode]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header title="VOLUME BOT" showBack onBack={onBack} variant="volume" />

      <main className="flex-1 container max-w-2xl mx-auto px-4 py-6 space-y-6">
        {/* Config Section */}
        <section className="p-4 rounded-lg border border-volume-blue/30 bg-card space-y-4">
          <div className="flex items-center gap-2 text-volume-blue">
            <Activity className="w-5 h-5" />
            <h2 className="font-mono font-bold">Configuration</h2>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="vol-token-ca" className="text-sm text-muted-foreground">
                Token CA
              </Label>
              <Input
                id="vol-token-ca"
                placeholder="Enter token contract address..."
                value={tokenCA}
                onChange={(e) => setTokenCA(e.target.value)}
                disabled={status !== 'idle'}
                className="bg-input border-border focus:border-volume-blue/50 font-mono text-sm"
              />
            </div>

            {/* Wallet Selection */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm text-muted-foreground">Select Wallets</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAll}
                  disabled={status !== 'idle'}
                  className="text-xs text-volume-blue hover:text-volume-blue-glow"
                >
                  {selectedWallets.length === wallets.length ? 'Deselect All' : 'Select All'}
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {wallets.map((wallet) => (
                  <label
                    key={wallet.id}
                    className={cn(
                      'flex items-center gap-2 p-2 rounded border cursor-pointer transition-colors',
                      selectedWallets.includes(wallet.id)
                        ? 'border-volume-blue/60 bg-volume-blue/10'
                        : 'border-border hover:border-volume-blue/30',
                      status !== 'idle' && 'opacity-50 cursor-not-allowed'
                    )}
                  >
                    <Checkbox
                      checked={selectedWallets.includes(wallet.id)}
                      onCheckedChange={() => toggleWallet(wallet.id)}
                      disabled={status !== 'idle'}
                      className="data-[state=checked]:bg-volume-blue data-[state=checked]:border-volume-blue"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{wallet.label}</div>
                      <div className="text-xs text-muted-foreground font-mono">
                        {shortenAddress(wallet.publicKey)}
                      </div>
                    </div>
                    <div className="text-xs text-volume-blue font-mono">
                      {wallet.balance?.toFixed(2) ?? '0.00'}
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Mode Selection */}
            <div className="space-y-2">
              <Label className="text-sm text-muted-foreground">Mode</Label>
              <div className="grid grid-cols-3 gap-2">
                {(Object.keys(modeConfig) as VolumeMode[]).map((m) => {
                  const { icon: Icon, label, description } = modeConfig[m];
                  return (
                    <button
                      key={m}
                      onClick={() => setMode(m)}
                      disabled={status !== 'idle'}
                      className={cn(
                        'flex flex-col items-center gap-1 p-3 rounded border transition-colors',
                        mode === m
                          ? 'border-volume-blue/60 bg-volume-blue/10'
                          : 'border-border hover:border-volume-blue/30',
                        status !== 'idle' && 'opacity-50 cursor-not-allowed'
                      )}
                    >
                      <Icon className={cn('w-5 h-5', mode === m ? 'text-volume-blue' : 'text-muted-foreground')} />
                      <span className={cn('text-sm font-medium', mode === m && 'text-volume-blue')}>{label}</span>
                      <span className="text-[10px] text-muted-foreground">{description}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Controls */}
            <div className="flex gap-2">
              {status === 'idle' && (
                <Button
                  onClick={handleStart}
                  disabled={!tokenCA || selectedWallets.length === 0}
                  className="flex-1 bg-volume-blue hover:bg-volume-blue-hover text-foreground font-bold"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start
                </Button>
              )}
              {status === 'running' && (
                <Button
                  onClick={handlePause}
                  variant="outline"
                  className="flex-1 border-yellow-500/50 hover:bg-yellow-500/10 text-yellow-500"
                >
                  <Pause className="w-4 h-4 mr-2" />
                  Pause
                </Button>
              )}
              {status === 'paused' && (
                <Button
                  onClick={handleResume}
                  className="flex-1 bg-volume-blue hover:bg-volume-blue-hover text-foreground font-bold"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Resume
                </Button>
              )}
              {status !== 'idle' && (
                <Button
                  onClick={handleStop}
                  variant="outline"
                  className="border-vamp-red/50 hover:bg-vamp-red/10 text-vamp-red"
                >
                  <Square className="w-4 h-4 mr-2" />
                  Stop
                </Button>
              )}
            </div>
          </div>
        </section>

        {/* Live Stats */}
        <section className="p-4 rounded-lg border border-volume-blue/30 bg-card">
          <div className="flex items-center gap-2 text-volume-blue mb-4">
            <Activity className="w-5 h-5" />
            <h2 className="font-mono font-bold">Live Stats</h2>
            <div
              className={cn(
                'ml-auto px-2 py-0.5 rounded text-xs font-mono',
                status === 'running' && 'bg-wallet-green/20 text-wallet-green',
                status === 'paused' && 'bg-yellow-500/20 text-yellow-500',
                status === 'idle' && 'bg-muted text-muted-foreground'
              )}
            >
              {status.toUpperCase()}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded bg-secondary/50">
              <div className="text-2xl font-mono font-bold text-volume-blue">
                {stats.txCount}
              </div>
              <div className="text-xs text-muted-foreground">TX Count</div>
            </div>
            <div className="text-center p-3 rounded bg-secondary/50">
              <div className="text-2xl font-mono font-bold text-foreground">
                {status === 'idle' ? '—' : status === 'running' ? '●' : '||'}
              </div>
              <div className="text-xs text-muted-foreground">Status</div>
            </div>
            <div className="text-center p-3 rounded bg-secondary/50">
              <div className="text-2xl font-mono font-bold text-vamp-red">
                {stats.feesSpent.toFixed(4)}
              </div>
              <div className="text-xs text-muted-foreground">SOL Spent</div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
