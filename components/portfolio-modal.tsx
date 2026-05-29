'use client';

import { useState, useEffect, useRef } from 'react';
import { X, TrendingUp, TrendingDown, Loader2, RefreshCw, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { usePortfolio, useWallets } from '@/hooks/storage';

interface PortfolioModalProps { onClose: () => void; }

const fmtMC = (v: number) => {
  if (!v) return '—';
  if (v >= 1_000_000) return `$${(v/1_000_000).toFixed(2)}M`;
  if (v >= 1_000)     return `$${(v/1_000).toFixed(1)}K`;
  return `$${v.toFixed(0)}`;
};

export function PortfolioModal({ onClose }: PortfolioModalProps) {
  const { tokens, updateToken } = usePortfolio();
  const { wallets }             = useWallets();

  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [tradeWalletId, setTradeWalletId] = useState('');
  const [buySOL, setBuySOL]               = useState('');
  const [isBuying, setIsBuying]           = useState(false);
  const [isSelling, setIsSelling]         = useState(false);
  const [tradeError, setTradeError]       = useState('');
  const [tradeOk, setTradeOk]             = useState('');
  const [stats, setStats]                 = useState<{ marketCap: number; holders: number; volume24h: number }>({ marketCap: 0, holders: 0, volume24h: 0 });
  const [loadingStats, setLoadingStats]   = useState(false);

  const totalInvested = tokens.reduce((s, t) => s + (t.bought * t.launchPrice), 0);
  const totalProfit   = tokens.reduce((s, t) => s + t.profit, 0);

  // Auto-select first dev wallet when token selected
  useEffect(() => {
    if (selectedToken && !tradeWalletId) {
      const first = wallets.find(w => w.type === 'dev');
      if (first) setTradeWalletId(first.id);
    }
  }, [selectedToken]);

  // Fetch market stats on token select
  useEffect(() => {
    if (!selectedToken) return;
    setLoadingStats(true);
    fetch(`/api/solana/token-info?ca=${selectedToken.ca}`)
      .then(r => r.json())
      .then(d => setStats({ marketCap: d.marketCap || 0, holders: 0, volume24h: d.volume24h || 0 }))
      .catch(() => {})
      .finally(() => setLoadingStats(false));
  }, [selectedToken?.ca]);

  const flash = (ok: string) => { setTradeOk(ok); setTimeout(() => setTradeOk(''), 4000); };
  const flashErr = (e: string) => { setTradeError(e); setTimeout(() => setTradeError(''), 5000); };

  const selectedWallet = wallets.find(w => w.id === tradeWalletId);

  // ── Buy more ───────────────────────────────────────────────────────────
  const handleBuy = async () => {
    if (!selectedWallet || !buySOL || !selectedToken) return;
    setIsBuying(true); setTradeError('');
    try {
      const res = await fetch('/api/solana/trade', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privateKey: selectedWallet.privateKeyEncrypted, action: 'buy', mint: selectedToken.ca, amount: parseFloat(buySOL), denominatedInSol: true }),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error || 'Buy failed');
      updateToken(selectedToken.id, { bought: selectedToken.bought + parseFloat(buySOL) });
      setBuySOL('');
      flash(`Buy sent! Sig: ${d.signature?.slice(0,12)}…`);
    } catch (e: any) { flashErr(e.message); }
    finally { setIsBuying(false); }
  };

  // ── Sell by % ──────────────────────────────────────────────────────────
  const handleSellPct = async (pct: number) => {
    if (!selectedWallet || !selectedToken) return;
    setIsSelling(true); setTradeError('');
    try {
      // Get real on-chain balance for this wallet
      const balRes  = await fetch(`/api/solana/token-balance?wallet=${selectedWallet.address}&mint=${selectedToken.ca}`);
      const { balance } = await balRes.json();

      let sellAmount: number | string;
      if (pct === 100) {
        sellAmount = '100%';          // pumpportal.fun native % sell
      } else {
        if (!balance || balance === 0) throw new Error('No tokens in selected wallet');
        sellAmount = balance * pct / 100;
      }

      const res = await fetch('/api/solana/trade', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          privateKey: selectedWallet.privateKeyEncrypted,
          action: 'sell', mint: selectedToken.ca,
          amount: sellAmount, denominatedInSol: false,
        }),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error || 'Sell failed');
      const soldTokens = pct === 100 ? (balance || selectedToken.bought) : (balance * pct / 100);
      const profit = soldTokens * (selectedToken.currentPrice - selectedToken.launchPrice);
      updateToken(selectedToken.id, {
        sold:   selectedToken.sold   + soldTokens,
        profit: selectedToken.profit + profit,
      });
      flash(`${pct}% sold! Sig: ${d.signature?.slice(0,12)}…`);
    } catch (e: any) { flashErr(e.message); }
    finally { setIsSelling(false); }
  };

  // ────────────────────────────────────────────────────────────────────────
  // TOKEN DETAIL VIEW
  // ────────────────────────────────────────────────────────────────────────
  if (selectedToken) {
    const gmgnUrl = `https://gmgn.ai/sol/token/${selectedToken.ca}`;
    return (
      <>
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" onClick={onClose} />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div className="bg-black/85 backdrop-blur-2xl border-2 border-white/20 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto shadow-2xl"
            onClick={e => e.stopPropagation()}>
            <div className="p-6">

              {/* Header */}
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-3">
                  {selectedToken.image && (
                    <img src={selectedToken.image} alt="" className="w-10 h-10 rounded-full object-cover border border-white/10" />
                  )}
                  <div>
                    <h2 className="text-3xl font-black text-white">{selectedToken.symbol}</h2>
                    <p className="text-white/50 text-sm">{selectedToken.name}</p>
                  </div>
                </div>
                <button onClick={() => setSelectedToken(null)} className="p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-white/40 text-xs mb-1">Market Cap</p>
                  <p className="text-white font-bold">
                    {loadingStats ? <Loader2 className="w-4 h-4 animate-spin" /> : fmtMC(stats.marketCap)}
                  </p>
                </div>
                <div className="p-3 rounded-xl bg-white/5 border border-white/10">
                  <p className="text-white/40 text-xs mb-1">Volume 24h</p>
                  <p className="text-white font-bold">
                    {loadingStats ? <Loader2 className="w-4 h-4 animate-spin" /> : fmtMC(stats.volume24h)}
                  </p>
                </div>
                <div className={cn('p-3 rounded-xl border', selectedToken.profit >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20')}>
                  <p className="text-white/40 text-xs mb-1">My Profit</p>
                  <p className={cn('font-black text-lg', selectedToken.profit >= 0 ? 'text-green-400' : 'text-red-400')}>
                    ${selectedToken.profit.toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Chart — DEXScreener embed */}
              <div className="mb-4 rounded-2xl overflow-hidden border border-white/10 bg-black/40">
                <iframe
                  src={`https://dexscreener.com/solana/${selectedToken.ca}?embed=1&theme=dark&info=0&trades=0`}
                  className="w-full"
                  style={{ height: '340px', border: 'none' }}
                  title="Chart"
                  loading="lazy"
                />
              </div>

              {/* Trade feedback */}
              {tradeOk && (
                <div className="mb-3 px-4 py-2 bg-green-500/15 border border-green-500/30 rounded-xl text-green-400 text-sm">{tradeOk}</div>
              )}
              {tradeError && (
                <div className="mb-3 px-4 py-2 bg-red-500/15 border border-red-500/30 rounded-xl text-red-400 text-sm">{tradeError}</div>
              )}

              {/* Wallet selector */}
              <div className="mb-4">
                <Label className="text-xs text-white/50 mb-1 block">Wallet for trades</Label>
                <select value={tradeWalletId} onChange={e => setTradeWalletId(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 text-white rounded-xl px-3 h-9 text-sm focus:outline-none focus:border-white/30">
                  {wallets.filter(w => w.type === 'dev').map(w => (
                    <option key={w.id} value={w.id} className="bg-black">
                      {w.name} — {w.address.slice(0,10)}… ({w.balance.toFixed(4)} SOL)
                    </option>
                  ))}
                  {wallets.filter(w => w.type === 'dev').length === 0 && (
                    <option disabled>No dev wallets</option>
                  )}
                </select>
              </div>

              {/* Buy + Sell */}
              <div className="grid grid-cols-2 gap-4">
                {/* BUY */}
                <div className="p-4 rounded-2xl border border-green-500/20 bg-green-500/5">
                  <h3 className="text-green-400 font-bold mb-3">Buy More</h3>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Input value={buySOL} onChange={e => setBuySOL(e.target.value)}
                        type="number" step="0.01" placeholder="0.00"
                        className="bg-black/40 border-white/15 text-white h-10 font-mono flex-1" />
                      <span className="text-white/50 text-sm font-mono">SOL</span>
                    </div>
                    <Button onClick={handleBuy} disabled={!buySOL || isBuying || !tradeWalletId}
                      className="w-full bg-green-500 hover:bg-green-400 text-black font-bold h-10">
                      {isBuying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buy'}
                    </Button>
                  </div>
                </div>

                {/* SELL */}
                <div className="p-4 rounded-2xl border border-red-500/20 bg-red-500/5">
                  <h3 className="text-red-400 font-bold mb-3">Sell</h3>
                  <div className="grid grid-cols-4 gap-1.5 mb-2">
                    {[10, 25, 50, 100].map(pct => (
                      <button key={pct}
                        onClick={() => handleSellPct(pct)}
                        disabled={isSelling || !tradeWalletId}
                        className={cn(
                          'h-9 rounded-lg text-sm font-bold border transition-all',
                          pct === 100
                            ? 'bg-red-500 border-red-500 text-white hover:bg-red-400'
                            : 'bg-white/5 border-white/15 text-white/70 hover:bg-red-500/20 hover:border-red-500/40 hover:text-white',
                          (isSelling || !tradeWalletId) && 'opacity-50 cursor-not-allowed'
                        )}>
                        {isSelling ? '…' : `${pct}%`}
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-white/30 text-center">
                    {isSelling ? 'Selling…' : '% of wallet balance'}
                  </p>
                </div>
              </div>

              {/* GMGN button */}
              <a href={gmgnUrl} target="_blank" rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-[#0d9488] hover:bg-[#0f766e] text-white font-bold transition-colors">
                <ExternalLink className="w-4 h-4" />
                View on GMGN
              </a>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ────────────────────────────────────────────────────────────────────────
  // TOKEN LIST VIEW
  // ────────────────────────────────────────────────────────────────────────
  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-black/85 backdrop-blur-2xl border-2 border-white/20 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto shadow-2xl"
          onClick={e => e.stopPropagation()}>
          <div className="p-7">

            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <img src="/vamp-blood.png" alt="" className="w-9 h-9" style={{ mixBlendMode: 'screen' }} />
                <h2 className="text-3xl font-mono font-bold text-white">PORTFOLIO</h2>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Summary */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                <p className="text-white/40 text-xs mb-1">Total Invested</p>
                <p className="text-white font-bold text-xl">${totalInvested.toFixed(2)}</p>
              </div>
              <div className={cn('p-4 rounded-xl border', totalProfit >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20')}>
                <p className="text-white/40 text-xs mb-1">Total Profit</p>
                <p className={cn('font-black text-xl', totalProfit >= 0 ? 'text-green-400' : 'text-red-400')}>
                  {totalProfit >= 0 ? '+' : ''}${totalProfit.toFixed(2)}
                </p>
              </div>
            </div>

            {/* Token list */}
            {tokens.length === 0 ? (
              <div className="p-12 text-center text-white/30 border border-dashed border-white/10 rounded-2xl">
                Нет токенов — лаунчни первый через VAMP!
              </div>
            ) : (
              <div className="space-y-2">
                {tokens.map(token => {
                  const pnlPos = token.profit >= 0;
                  return (
                    <button key={token.id} onClick={() => setSelectedToken(token)}
                      className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/3 hover:border-white/25 hover:bg-white/5 transition-all text-left">
                      {token.image && (
                        <img src={token.image} alt="" className="w-10 h-10 rounded-full object-cover border border-white/10 flex-shrink-0"
                          onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-white text-lg">{token.symbol}</span>
                          <span className="text-white/50 text-sm truncate">{token.name}</span>
                        </div>
                        <div className="text-xs text-white/30 font-mono">{token.ca.slice(0,12)}…</div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className={cn('font-bold text-sm', pnlPos ? 'text-green-400' : 'text-red-400')}>
                          {pnlPos ? '+' : ''}${token.profit.toFixed(2)}
                        </div>
                        {pnlPos
                          ? <TrendingUp  className="w-4 h-4 text-green-400 ml-auto" />
                          : <TrendingDown className="w-4 h-4 text-red-400   ml-auto" />}
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
