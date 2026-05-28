'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useWallets, usePortfolio } from '@/hooks/storage';

interface VampModalProps {
  onClose: () => void;
}

export function VampModal({ onClose }: VampModalProps) {
  const { wallets } = useWallets();
  const { addToken } = usePortfolio();
  
  const [step, setStep] = useState<'input' | 'config' | 'launch'>('input');
  const [tokenCA, setTokenCA] = useState('');
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [tokenData, setTokenData] = useState<any>(null);
  const [isLaunching, setIsLaunching] = useState(false);

  const devWallets = wallets.filter(w => w.type === 'dev');

  const handleFetchMetadata = async () => {
    if (!tokenCA) return;
    
    setIsLaunching(true);
    // Mock fetch - в реальности здесь будет API call
    setTimeout(() => {
      setTokenData({
        name: 'Test Token',
        symbol: 'TEST',
        supply: '1000000',
        image: null,
      });
      setStep('config');
      setIsLaunching(false);
    }, 1500);
  };

  const handleLaunch = async () => {
    if (!selectedWallet || !tokenData) return;
    
    setIsLaunching(true);
    setTimeout(() => {
      // Add to portfolio
      addToken({
        id: Math.random().toString(),
        ca: tokenCA,
        name: tokenData.name,
        symbol: tokenData.symbol,
        launchPrice: 0.0001,
        currentPrice: 0.0001,
        bought: 0,
        sold: 0,
        profit: 0,
        launchedAt: Date.now(),
      });

      setIsLaunching(false);
      setStep('launch');
      
      // Redirect to token page
      setTimeout(() => {
        window.open(`https://dexscreener.com/solana/${tokenCA}`, '_blank');
        onClose();
      }, 2000);
    }, 2000);
  };

  return (
    <>
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-black/80 backdrop-blur-2xl border-2 border-red-500/30 rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <img src="/vamp-fangs-silver.png" alt="VAMP" className="w-10 h-10" />
                <h2 className="text-3xl font-mono font-bold text-red-500">VAMP</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="hover:bg-red-500/10"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>

            {step === 'input' && (
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label className="text-lg font-semibold text-white/90">Token Contract Address</Label>
                  <Input
                    value={tokenCA}
                    onChange={(e) => setTokenCA(e.target.value)}
                    placeholder="Enter token CA..."
                    className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-11 text-base"
                  />
                </div>

                <Button
                  onClick={handleFetchMetadata}
                  disabled={isLaunching || !tokenCA}
                  className="w-full bg-red-500 hover:bg-red-500/80 text-white font-bold h-12 text-base"
                >
                  {isLaunching ? (
                    <>
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      Fetching...
                    </>
                  ) : (
                    'FETCH METADATA'
                  )}
                </Button>
              </div>
            )}

            {step === 'config' && tokenData && (
              <div className="space-y-6">
                {/* Token Preview */}
                <div className="p-6 rounded-xl border border-red-500/30 bg-red-500/10">
                  <h3 className="text-2xl font-bold text-white mb-2">{tokenData.symbol}</h3>
                  <p className="text-white/70 mb-4">{tokenData.name}</p>
                  <p className="text-sm text-white/60">Supply: {tokenData.supply}</p>
                </div>

                {/* Wallet Selection */}
                <div className="space-y-3">
                  <Label className="text-lg font-semibold text-white/90">
                    Select Dev Wallet ({devWallets.length})
                  </Label>
                  {devWallets.length === 0 ? (
                    <div className="p-4 rounded-lg border border-dashed border-white/20 text-white/50 text-center">
                      No dev wallets. Create one in WALLETS section
                    </div>
                  ) : (
                    <div className="space-y-2 border border-white/10 rounded-xl p-4 max-h-40 overflow-y-auto">
                      {devWallets.map((wallet) => (
                        <button
                          key={wallet.id}
                          onClick={() => setSelectedWallet(wallet.id)}
                          className={cn(
                            'w-full flex items-center justify-between p-3 rounded-lg transition-all',
                            selectedWallet === wallet.id
                              ? 'border-2 border-red-500 bg-red-500/10'
                              : 'border border-white/10 hover:border-white/30 bg-white/5'
                          )}
                        >
                          <div className="text-left">
                            <div className="font-mono font-bold text-white">{wallet.name}</div>
                            <div className="text-sm text-white/50">{wallet.address}</div>
                          </div>
                          {selectedWallet === wallet.id && (
                            <Check className="w-5 h-5 text-red-500" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => setStep('input')}
                    variant="outline"
                    className="flex-1 border-white/20 h-11"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={handleLaunch}
                    disabled={!selectedWallet || isLaunching}
                    className="flex-1 bg-red-500 hover:bg-red-500/80 text-white font-bold h-11"
                  >
                    {isLaunching ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Launching...
                      </>
                    ) : (
                      'FAST LAUNCH'
                    )}
                  </Button>
                </div>
              </div>
            )}

            {step === 'launch' && (
              <div className="text-center space-y-4">
                <div className="text-6xl mb-4">🚀</div>
                <h3 className="text-2xl font-bold text-white">Launch Successful!</h3>
                <p className="text-white/60">Redirecting to token page...</p>
                <div className="flex justify-center gap-2 mt-6">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-bounce"></div>
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
