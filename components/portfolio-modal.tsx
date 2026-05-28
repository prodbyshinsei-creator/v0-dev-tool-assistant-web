'use client';

import { useState } from 'react';
import { X, TrendingUp, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePortfolio, PortfolioToken } from '@/hooks/storage';

interface PortfolioModalProps {
  onClose: () => void;
}

export function PortfolioModal({ onClose }: PortfolioModalProps) {
  const { tokens } = usePortfolio();
  const [selectedToken, setSelectedToken] = useState<PortfolioToken | null>(null);

  const totalProfit = tokens.reduce((sum, t) => sum + t.profit, 0);
  const totalInvested = tokens.reduce((sum, t) => sum + (t.bought * t.launchPrice), 0);

  if (selectedToken) {
    return (
      <>
        <div
          className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50"
          onClick={onClose}
        />

        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div
            className="bg-black/80 backdrop-blur-2xl border-2 border-white/20 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto shadow-2xl p-8"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                {selectedToken.image && (
                  <img src={selectedToken.image} alt={selectedToken.name} className="w-12 h-12 rounded-full" />
                )}
                <div>
                  <h2 className="text-4xl font-bold text-white">{selectedToken.symbol}</h2>
                  <p className="text-white/60">{selectedToken.name}</p>
                </div>
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

            {/* Token Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                <p className="text-white/60 text-sm mb-1">Launch Price</p>
                <p className="text-2xl font-bold text-white">${selectedToken.launchPrice}</p>
              </div>
              <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                <p className="text-white/60 text-sm mb-1">Current Price</p>
                <p className="text-2xl font-bold text-white">${selectedToken.currentPrice}</p>
              </div>
              <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                <p className="text-white/60 text-sm mb-1">Bought</p>
                <p className="text-2xl font-bold text-white">{selectedToken.bought}</p>
              </div>
              <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                <p className="text-white/60 text-sm mb-1">Profit</p>
                <p className={cn(
                  'text-2xl font-bold',
                  selectedToken.profit >= 0 ? 'text-green-400' : 'text-red-500'
                )}>
                  ${selectedToken.profit.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Chart Placeholder */}
            <div className="h-96 border border-white/10 rounded-xl bg-black/40 mb-6 flex items-center justify-center">
              <div className="text-center">
                <TrendingUp className="w-16 h-16 text-white/30 mx-auto mb-3" />
                <p className="text-white/50">Chart powered by TradingView</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mb-6">
              <Button
                className="flex-1 bg-green-400 hover:bg-green-400/80 text-black font-bold h-12 text-base"
              >
                BUY MORE
              </Button>
              <Button
                className="flex-1 bg-red-500 hover:bg-red-500/80 text-white font-bold h-12 text-base"
              >
                SELL
              </Button>
              <a
                href={`https://dexscreener.com/solana/${selectedToken.ca}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1"
              >
                <Button
                  variant="outline"
                  className="w-full border-white/20 h-12"
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  View on DEXScreener
                </Button>
              </a>
            </div>

            <Button
              onClick={() => setSelectedToken(null)}
              variant="outline"
              className="w-full border-white/20 h-11"
            >
              Back to Portfolio
            </Button>
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
          className="bg-black/80 backdrop-blur-2xl border-2 border-white/20 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="p-8">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
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

            {/* Portfolio Stats */}
            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="p-4 rounded-xl border border-white/10 bg-white/5">
                <p className="text-white/60 text-sm mb-1">Total Invested</p>
                <p className="text-2xl font-bold text-white">${totalInvested.toFixed(2)}</p>
              </div>
              <div className={cn(
                'p-4 rounded-xl border bg-white/5',
                totalProfit >= 0 ? 'border-green-400/30' : 'border-red-500/30'
              )}>
                <p className="text-white/60 text-sm mb-1">Total Profit</p>
                <p className={cn(
                  'text-2xl font-bold',
                  totalProfit >= 0 ? 'text-green-400' : 'text-red-500'
                )}>
                  ${totalProfit.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Tokens List */}
            <div className="space-y-3">
              {tokens.length === 0 ? (
                <div className="p-8 text-center text-white/50 border border-dashed border-white/20 rounded-2xl">
                  No tokens in portfolio yet
                </div>
              ) : (
                tokens.map((token) => (
                  <button
                    key={token.id}
                    onClick={() => setSelectedToken(token)}
                    className="w-full flex items-center justify-between p-4 rounded-xl border border-white/10 bg-white/5 hover:border-white/30 hover:bg-white/10 transition-all text-left"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        {token.image && (
                          <img src={token.image} alt={token.symbol} className="w-8 h-8 rounded-full" />
                        )}
                        <div>
                          <p className="font-bold text-white text-lg">{token.symbol}</p>
                          <p className="text-sm text-white/60">{token.name}</p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono text-white font-bold">{token.bought} bought</p>
                      <p className={cn(
                        'text-sm font-bold',
                        token.profit >= 0 ? 'text-green-400' : 'text-red-500'
                      )}>
                        ${token.profit.toFixed(2)}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
