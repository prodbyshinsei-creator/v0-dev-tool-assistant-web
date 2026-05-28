'use client';

import { useState, useEffect } from 'react';
import { X, Loader2, Check, Edit2, Zap } from 'lucide-react';
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
  
  const [step, setStep] = useState<'input' | 'preview' | 'edit' | 'launch'>('input');
  const [tokenCA, setTokenCA] = useState('');
  const [selectedWallet, setSelectedWallet] = useState<string | null>(null);
  const [isFetching, setIsFetching] = useState(false);
  const [isLaunching, setIsLaunching] = useState(false);
  
  // Edit form state
  const [formData, setFormData] = useState({
    name: '',
    symbol: '',
    supply: '',
    description: '',
    image: null as string | null,
  });

  const [tokenData, setTokenData] = useState<any>(null);
  const devWallets = wallets.filter(w => w.type === 'dev');

  // Auto-fetch when CA is entered
  useEffect(() => {
    const timer = setTimeout(() => {
      if (tokenCA && tokenCA.length > 20) {
        handleAutoFetch();
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [tokenCA]);

  const handleAutoFetch = async () => {
    if (!tokenCA || isFetching) return;
    
    setIsFetching(true);
    // Mock fetch
    setTimeout(() => {
      const newTokenData = {
        name: 'Test Token',
        symbol: 'TEST',
        supply: '1000000',
        description: 'Test token description',
        image: null,
      };
      setTokenData(newTokenData);
      setFormData(newTokenData);
      setStep('preview');
      setIsFetching(false);
    }, 1200);
  };

  const handleLaunch = async () => {
    if (!selectedWallet || !tokenData) return;
    
    setIsLaunching(true);
    setTimeout(() => {
      // Add to portfolio
      addToken({
        id: Math.random().toString(),
        ca: tokenCA,
        name: formData.name,
        symbol: formData.symbol,
        launchPrice: 0.0001,
        currentPrice: 0.0001,
        bought: 0,
        sold: 0,
        profit: 0,
        launchedAt: Date.now(),
      });

      setIsLaunching(false);
      setStep('launch');
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
                  <div className="relative">
                    <Input
                      value={tokenCA}
                      onChange={(e) => setTokenCA(e.target.value)}
                      placeholder="Enter token CA..."
                      className="bg-white/10 border-white/20 text-white placeholder:text-white/40 h-12 text-base"
                    />
                    {isFetching && (
                      <Loader2 className="absolute right-4 top-3.5 w-5 h-5 animate-spin text-red-500" />
                    )}
                  </div>
                  <p className="text-sm text-white/50">Paste CA and we'll fetch metadata automatically</p>
                </div>
              </div>
            )}

            {step === 'preview' && tokenData && (
              <div className="space-y-6">
                {/* Token Preview Card */}
                <div className="p-6 rounded-xl border border-red-500/30 bg-red-500/10">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-2xl font-bold text-white">{formData.symbol}</h3>
                      <p className="text-white/70">{formData.name}</p>
                    </div>
                    <Button
                      onClick={() => setStep('edit')}
                      variant="outline"
                      size="sm"
                      className="border-red-500/30 text-red-500 hover:bg-red-500/10"
                    >
                      <Edit2 className="w-4 h-4 mr-1" />
                      EDIT
                    </Button>
                  </div>
                  <p className="text-sm text-white/60 mb-3">{formData.description}</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between text-white/80">
                      <span>Supply:</span>
                      <span className="font-mono">{formData.supply}</span>
                    </div>
                    <div className="flex justify-between text-white/80">
                      <span>Contract:</span>
                      <span className="font-mono text-xs">{tokenCA.slice(0, 10)}...{tokenCA.slice(-8)}</span>
                    </div>
                  </div>
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
                            'w-full flex items-center justify-between p-3 rounded-lg transition-all text-left',
                            selectedWallet === wallet.id
                              ? 'border-2 border-red-500 bg-red-500/10'
                              : 'border border-white/10 hover:border-white/30 bg-white/5'
                          )}
                        >
                          <div>
                            <div className="font-mono font-bold text-white">{wallet.name}</div>
                            <div className="text-sm text-white/50">{wallet.address.slice(0, 12)}...</div>
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
                    onClick={() => {
                      setStep('input');
                      setTokenCA('');
                      setTokenData(null);
                    }}
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
                      <>
                        <Zap className="w-4 h-4 mr-2" />
                        FAST LAUNCH
                      </>
                    )}
                  </Button>
                </div>
              </div>
            )}

            {step === 'edit' && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-white/90">Token Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="bg-white/10 border-white/20 text-white h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-white/90">Symbol</Label>
                  <Input
                    value={formData.symbol}
                    onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                    className="bg-white/10 border-white/20 text-white h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-white/90">Supply</Label>
                  <Input
                    value={formData.supply}
                    onChange={(e) => setFormData({ ...formData, supply: e.target.value })}
                    className="bg-white/10 border-white/20 text-white h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-white/90">Description</Label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="bg-white/10 border border-white/20 text-white rounded-lg p-3 h-20 resize-none"
                  />
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={() => setStep('preview')}
                    variant="outline"
                    className="flex-1 border-white/20 h-10"
                  >
                    Back
                  </Button>
                  <Button
                    onClick={() => setStep('preview')}
                    className="flex-1 bg-red-500 hover:bg-red-500/80 text-white font-bold h-10"
                  >
                    Save
                  </Button>
                </div>
              </div>
            )}

            {step === 'launch' && (
              <div className="text-center space-y-4">
                <div className="text-6xl mb-4">🚀</div>
                <h3 className="text-2xl font-bold text-white">Launch Successful!</h3>
                <p className="text-white/60">{formData.symbol} added to portfolio</p>
                <div className="flex justify-center gap-2 mt-6">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-bounce"></div>
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
                <Button
                  onClick={onClose}
                  className="w-full mt-6 bg-red-500 hover:bg-red-500/80 text-white font-bold h-10"
                >
                  Close
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
