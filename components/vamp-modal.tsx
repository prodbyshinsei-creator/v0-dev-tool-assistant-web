'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Globe, Twitter, Send, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { VampPanel } from '@/components/vamp-panel';
import { cn } from '@/lib/utils';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

interface VampModalProps {
  onClose: () => void;
}

interface TokenMetadata {
  name: string;
  ticker: string;
  description: string;
  image_url: string;
  twitter?: string;
  telegram?: string;
  website?: string;
}

interface WalletType {
  id: number;
  name: string;
  address: string;
  balance: number;
}

const multiLaunchOptions = [1, 3, 5, 10];

export function VampModal({ onClose }: VampModalProps) {
  const [step, setStep] = useState<'input' | 'preview' | 'fastLaunch' | 'fullEdit'>('input');
  const [tokenCA, setTokenCA] = useState('');
  const [tokenMetadata, setTokenMetadata] = useState<TokenMetadata | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Fast Launch state
  const [selectedWallet, setSelectedWallet] = useState('');
  const [launchCount, setLaunchCount] = useState(1);
  const [wallets, setWallets] = useState<WalletType[]>([]);
  const [isLoadingWallets, setIsLoadingWallets] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);

  useEffect(() => {
    loadWallets();
  }, []);

  const loadWallets = async () => {
    try {
      setIsLoadingWallets(true);
      const response = await fetch(`${API_URL}/wallets?user_id=1&wallet_type=dev`);
      
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

  const handleFetchMetadata = async () => {
    const trimmedCA = tokenCA.trim();
    
    if (trimmedCA.length < 32 || trimmedCA.length > 44) {
      setError('Invalid contract address length');
      return;
    }

    setIsFetching(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/vamp/metadata`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ca: trimmedCA }),
      });
      
      const data = await response.json();
      
      if (data.success && data.data) {
        setTokenMetadata(data.data);
        setStep('preview');
      } else {
        setError(data.error || 'Failed to fetch token metadata');
      }
    } catch (err) {
      setError('Failed to fetch token metadata');
    } finally {
      setIsFetching(false);
    }
  };

  const handleFastLaunch = async () => {
    if (!selectedWallet) return;
    
    setIsLaunching(true);

    try {
      const response = await fetch(`${API_URL}/vamp/launch`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ca: tokenCA,
          dev_wallet_address: wallets.find(w => w.id.toString() === selectedWallet)?.address || '',
          dev_wallet_privkey: 'DEMO_KEY',
          dev_buy_sol: 0.5,
          launch_count: launchCount,
          name: tokenMetadata?.name,
          ticker: tokenMetadata?.ticker,
          description: tokenMetadata?.description,
          website: tokenMetadata?.website,
          twitter: tokenMetadata?.twitter,
          telegram: tokenMetadata?.telegram,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          alert(`Launched ${launchCount}x successfully!`);
          onClose();
          return;
        }
      }

      throw new Error('API unavailable');
    } catch (error) {
      console.log('Mock launch');
      setTimeout(() => {
        alert(`Mock: Launched ${launchCount}x!`);
        onClose();
      }, 1500);
    } finally {
      setIsLaunching(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      {/* Modal Content */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-card border-2 border-vamp-red/30 rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {step === 'fullEdit' ? (
            <div className="relative">
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="absolute top-4 right-4 z-10 hover:bg-vamp-red/10"
              >
                <X className="w-5 h-5" />
              </Button>
              <VampPanel onBack={onClose} />
            </div>
          ) : (
            <div className="p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <img src="/vamp-fangs-silver.png" alt="Vamp" className="w-10 h-10" />
                  <h2 className="text-2xl font-mono font-bold text-vamp-red">VAMP</h2>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="hover:bg-vamp-red/10"
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* CA Input Step */}
              {step === 'input' && (
                <div className="space-y-6">
                  <div className="space-y-3">
                    <Label className="text-base font-semibold">Contract Address</Label>
                    <Input
                      placeholder="Enter Solana token CA..."
                      value={tokenCA}
                      onChange={(e) => setTokenCA(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleFetchMetadata()}
                      className="bg-input border-border focus:border-vamp-red/50 font-mono h-12"
                    />
                  </div>

                  {error && (
                    <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                      <span className="text-sm text-destructive">{error}</span>
                    </div>
                  )}

                  <Button
                    onClick={handleFetchMetadata}
                    disabled={isFetching || !tokenCA.trim()}
                    className="w-full bg-vamp-red hover:bg-vamp-red-hover h-12 font-bold"
                  >
                    {isFetching ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Fetching...
                      </>
                    ) : (
                      'FETCH TOKEN'
                    )}
                  </Button>
                </div>
              )}

              {/* Token Preview Step */}
              {step === 'preview' && tokenMetadata && (
                <div className="space-y-6">
                  <div className="flex gap-6 p-6 rounded-xl border border-vamp-red/20 bg-vamp-red/5">
                    <div className="w-24 h-24 rounded-xl overflow-hidden border-2 border-vamp-red/30 flex-shrink-0">
                      <img
                        src={tokenMetadata.image_url}
                        alt={tokenMetadata.name}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'data:image/svg+xml,%3Csvg xmlns="http://www.w3.org/2000/svg" width="96" height="96"%3E%3Crect fill="%23333" width="96" height="96"/%3E%3C/svg%3E';
                        }}
                      />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-mono font-bold text-foreground">
                          {tokenMetadata.name}
                        </h3>
                        <span className="text-lg font-mono text-vamp-red">
                          ${tokenMetadata.ticker}
                        </span>
                      </div>

                      <p className="text-sm text-muted-foreground mb-4 line-clamp-3">
                        {tokenMetadata.description}
                      </p>

                      <div className="flex gap-3">
                        {tokenMetadata.website && (
                          <a
                            href={tokenMetadata.website}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg border border-border/50 hover:border-vamp-red/50 hover:bg-vamp-red/10 transition-colors"
                          >
                            <Globe className="w-5 h-5 text-muted-foreground" />
                          </a>
                        )}
                        {tokenMetadata.twitter && (
                          <a
                            href={tokenMetadata.twitter}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg border border-border/50 hover:border-vamp-red/50 hover:bg-vamp-red/10 transition-colors"
                          >
                            <Twitter className="w-5 h-5 text-muted-foreground" />
                          </a>
                        )}
                        {tokenMetadata.telegram && (
                          <a
                            href={tokenMetadata.telegram}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 rounded-lg border border-border/50 hover:border-vamp-red/50 hover:bg-vamp-red/10 transition-colors"
                          >
                            <Send className="w-5 h-5 text-muted-foreground" />
                          </a>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <Button
                      onClick={() => setStep('fullEdit')}
                      variant="outline"
                      className="h-12 border-vamp-red/30 hover:border-vamp-red/60 hover:bg-vamp-red/10 font-bold"
                    >
                      EDIT
                    </Button>
                    <Button
                      onClick={() => setStep('fastLaunch')}
                      className="h-12 bg-vamp-red hover:bg-vamp-red-hover font-bold"
                    >
                      <Rocket className="w-5 h-5 mr-2" />
                      FAST LAUNCH
                    </Button>
                  </div>
                </div>
              )}

              {/* Fast Launch Step */}
              {step === 'fastLaunch' && (
                <div className="space-y-6">
                  <Button
                    variant="ghost"
                    onClick={() => setStep('preview')}
                    className="mb-4 hover:bg-vamp-red/10"
                  >
                    ← Back
                  </Button>

                  <div className="space-y-4">
                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Wallet</Label>
                      <Select value={selectedWallet} onValueChange={setSelectedWallet} disabled={isLoadingWallets}>
                        <SelectTrigger className="bg-input border-border h-12">
                          <SelectValue placeholder={isLoadingWallets ? "Loading..." : "Select wallet"} />
                        </SelectTrigger>
                        <SelectContent>
                          {wallets.map((wallet) => (
                            <SelectItem key={wallet.id} value={wallet.id.toString()}>
                              {wallet.name} ({wallet.balance.toFixed(2)} SOL)
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-3">
                      <Label className="text-base font-semibold">Launch Count</Label>
                      <div className="grid grid-cols-4 gap-2">
                        {multiLaunchOptions.map((count) => (
                          <Button
                            key={count}
                            variant={launchCount === count ? 'default' : 'outline'}
                            onClick={() => setLaunchCount(count)}
                            className={cn(
                              'h-12',
                              launchCount === count
                                ? 'bg-vamp-red hover:bg-vamp-red-hover'
                                : 'border-vamp-red/30 hover:border-vamp-red/60 hover:bg-vamp-red/10'
                            )}
                          >
                            {count}x
                          </Button>
                        ))}
                      </div>
                    </div>

                    <Button
                      onClick={handleFastLaunch}
                      disabled={isLaunching || !selectedWallet}
                      className="w-full bg-vamp-red hover:bg-vamp-red-hover h-14 text-lg font-bold"
                    >
                      {isLaunching ? (
                        <>
                          <Loader2 className="w-6 h-6 mr-2 animate-spin" />
                          Launching {launchCount}x...
                        </>
                      ) : (
                        <>
                          <Rocket className="w-6 h-6 mr-2" />
                          LAUNCH {launchCount}x
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
