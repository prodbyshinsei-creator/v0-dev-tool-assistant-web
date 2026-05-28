'use client';

import { useState } from 'react';
import { X, TrendingUp, TrendingDown, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { usePortfolio } from '@/hooks/storage';

interface PortfolioModalProps {
  onClose: () => void;
}

export function PortfolioModal({ onClose }: PortfolioModalProps) {
  const { tokens, updateToken } = usePortfolio();
  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [buyAmount, setBuyAmount] = useState('');
  const [sellAmount, setSellAmount] = useState('');

  const totalInvested = tokens.reduce((sum, t) => sum + (t.bought * t.launchPrice), 0);
  const totalProfit = tokens.reduce((sum, t) => sum + t.profit, 0);

  const handleBuy = () => {
    if (!selectedToken || !buyAmount) return;
    const amount = parseFloat(buyAmount);
    updateToken(selectedToken.id, {
      bought: selectedToken.bought + amount,
    });
    setBuyAmount('');
  };

  const handleSell = () => {
    if (!selectedToken || !sellAmount) return;
    const amount = parseFloat(sellAmount);
    const soldValue = amount * selectedToken.currentPrice;
    updateToken(selectedToken.id, {
      sold: selectedToken.sold + amount,
      profit: selectedToken.profit + (soldValue - (amount * selectedToken.launchPrice)),
    });
    setSellAmount('');
  };

  if (selectedToken) {
    return (
      <>
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          onClick={onClose}
        />

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div
            className="bg-black/80 backdrop-blur-2xl border-2 border-white/30 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8">
              {/* Header */}
              <div className="flex items-center justify-between mb-8">
                <div>
                  <h2 className="text-4xl font-bold text-white mb-1">{selectedToken.symbol}</h2>
                  <p className="text-white/60">{selectedToken.name}</p>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setSelectedToken(null)}
                  className="hover:bg-white/10"
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-white/60 text-sm mb-1">Launch Price</p>
                  <p className="text-white font-bold text-lg">${selectedToken.launchPrice.toFixed(6)}</p>
                </div>
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-white/60 text-sm mb-1">Current Price</p>
                  <p className="text-white font-bold text-lg">${selectedToken.currentPrice.toFixed(6)}</p>
                </div>
                <div className="p-4 rounded-lg bg-white/5 border border-white/10">
                  <p className="text-white/60 text-sm mb-1">Bought</p>
                  <p className="text-white font-bold text-lg">{selectedToken.bought}</p>
                </div>
                <div className={cn(
                  'p-4 rounded-lg border border-white/10',
                  selectedToken.profit >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'
                )}>
                  <p className="text-white/60 text-sm mb-1">Profit</p>
                  <p className={cn(
                    'font-bold text-lg',
                    selectedToken.profit >= 0 ? 'text-green-400' : 'text-red-400'
                  )}>
                    ${selectedToken.profit.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Chart Placeholder */}
              <div className="mb-8 p-8 rounded-xl border-2 border-white/20 bg-white/5 text-center">
                <TrendingUp className="w-16 h-16 mx-auto opacity-30 mb-3" />
                <p className="text-white/60">Chart integration coming soon</p>
                <p className="text-white/40 text-sm">Real-time price data from DEXScreener</p>
              </div>

              {/* Buy/Sell Panel */}
              <div className="grid grid-cols-2 gap-6 mb-8">
                {/* Buy Section */}
                <div className="p-6 rounded-xl border border-green-400/30 bg-green-400/5">
                  <h3 className="text-lg font-bold text-green-400 mb-4">Buy More</h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm text-white/90 mb-2 block">Amount</Label>
                      <Input
                        type="number"
                        value={buyAmount}
                        onChange={(e) => setBuyAmount(e.target.value)}
                        placeholder="0.0"
                        className="bg-white/10 border-white/20 text-white h-10"
                      />
                    </div>
                    <div className="text-sm text-white/60">
                      ≈ ${(parseFloat(buyAmount || '0') * selectedToken.currentPrice).toFixed(2)}
                    </div>
                    <Button
                      onClick={handleBuy}
                      disabled={!buyAmount}
                      className="w-full bg-green-400 hover:bg-green-400/80 text-black font-bold h-10"
                    >
                      Buy
                    </Button>
                  </div>
                </div>

                {/* Sell Section */}
                <div className="p-6 rounded-xl border border-red-400/30 bg-red-400/5">
                  <h3 className="text-lg font-bold text-red-400 mb-4">Sell</h3>
                  <div className="space-y-3">
                    <div>
                      <Label className="text-sm text-white/90 mb-2 block">Amount</Label>
                      <Input
                        type="number"
                        value={sellAmount}
                        onChange={(e) => setSellAmount(e.target.value)}
                        placeholder="0.0"
                        className="bg-white/10 border-white/20 text-white h-10"
                      />
                    </div>
                    <div className="text-sm text-white/60">
                      ≈ ${(parseFloat(sellAmount || '0') * selectedToken.currentPrice).toFixed(2)}
                    </div>
                    <Button
                      onClick={handleSell}
                      disabled={!sellAmount}
                      className="w-full bg-red-400 hover:bg-red-400/80 text-black font-bold h-10"
                    >
                      Sell
                    </Button>
                  </div>
                </div>
              </div>

              {/* Info & Links */}
              <div className="flex gap-2">
                <Button
                  asChild
                  className="flex-1 bg-blue-400 hover:bg-blue-400/80 text-black font-bold h-10"
                >
                  <a href={`https://dexscreener.com/solana/${selectedToken.ca}`} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="w-4 h-4 mr-2" />
                    View on DEXScreener
                  </a>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
        onClick={onClose}
      />

      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-black/80 backdrop-blur-2xl border-2 border-white/30 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <img src="/vamp-blood.png" alt="Portfolio" className="w-10 h-10" />
                <h2 className="text-3xl font-mono font-bold text-white">PORTFOLIO</h2>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="hover:bg-white/10"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="p-4 rounded-lg border border-white/10 bg-white/5">
                <p className="text-white/60 text-sm mb-1">Total Invested</p>
                <p className="text-white font-bold text-2xl">${totalInvested.toFixed(2)}</p>
              </div>
              <div className={cn(
                'p-4 rounded-lg border border-white/10',
                totalProfit >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'
              )}>
                <p className="text-white/60 text-sm mb-1">Total Profit</p>
                <p className={cn(
                  'font-bold text-2xl',
                  totalProfit >= 0 ? 'text-green-400' : 'text-red-400'
                )}>
                  {totalProfit >= 0 ? '+' : ''}{totalProfit >= 0 ? '$' : '-$'}{Math.abs(totalProfit).toFixed(2)}
                </p>
              </div>
            </div>

            {/* Tokens List */}
            {tokens.length === 0 ? (
              <div className="text-center py-12 text-white/50">
                <p className="text-lg mb-2">No tokens yet</p>
                <p className="text-sm">Launch a token in VAMP to see it here</p>
              </div>
            ) : (
              <div className="space-y-2 border border-white/10 rounded-xl overflow-hidden">
                {tokens.map((token, idx) => {
                  const profit = (token.bought - token.sold) * token.currentPrice - (token.bought * token.launchPrice);
                  return (
                    <button
                      key={token.id}
                      onClick={() => setSelectedToken(token)}
                      className={cn(
                        'w-full p-4 flex items-center justify-between hover:bg-white/10 transition-all border-b border-white/5 text-left',
                        idx === tokens.length - 1 && 'border-b-0'
                      )}
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-bold text-white text-lg">{token.symbol}</h3>
                          <p className="text-sm text-white/60">{token.name}</p>
                        </div>
                        <div className="text-sm text-white/50">
                          Bought: {token.bought} | Sold: {token.sold} | Launch: ${token.launchPrice.toFixed(6)}
                        </div>
                      </div>
                      <div className="text-right min-w-32">
                        <div className="text-sm text-white/60 mb-1">Price: ${token.currentPrice.toFixed(6)}</div>
                        <div className={cn(
                          'font-bold text-lg flex items-center justify-end gap-1',
                          profit >= 0 ? 'text-green-400' : 'text-red-400'
                        )}>
                          {profit >= 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                          {profit >= 0 ? '+' : '-'}${Math.abs(profit).toFixed(2)}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
