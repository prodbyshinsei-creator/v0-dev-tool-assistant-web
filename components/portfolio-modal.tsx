'use client';

import { useState, useEffect } from 'react';
import { X, TrendingUp, TrendingDown, Loader2, RefreshCw, ExternalLink, Pencil, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { usePortfolio, useWallets } from '@/hooks/storage';

interface PortfolioModalProps { onClose: () => void; }

const fmt = (v: number, prefix = '$') => {
  if (!v) return '—';
  if (v >= 1_000_000) return `${prefix}${(v/1_000_000).toFixed(2)}M`;
  if (v >= 1_000)     return `${prefix}${(v/1_000).toFixed(1)}K`;
  return `${prefix}${v.toFixed(2)}`;
};
const fmtPrice = (v: number) => {
  if (!v) return '—';
  if (v < 0.000001) return `$${v.toExponential(2)}`;
  if (v < 0.01)     return `$${v.toFixed(8)}`;
  return `$${v.toFixed(4)}`;
};

export function PortfolioModal({ onClose }: PortfolioModalProps) {
  const { tokens, updateToken } = usePortfolio();
  const { wallets }             = useWallets();

  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [tradeWalletId, setTradeWalletId] = useState('');
  const [buySOL, setBuySOL]               = useState('');
  const [isBuying, setIsBuying]           = useState(false);
  const [isSelling, setIsSelling]         = useState(false);
  const [tradeMsg, setTradeMsg]           = useState('');
  const [tradeErr, setTradeErr]           = useState('');
  const [loadingStats, setLoadingStats]   = useState(false);

  // Editable buy presets
  const [buyPresets, setBuyPresets]         = useState(['0.5', '1', '2']);
  const [editingPreset, setEditingPreset]   = useState<number|null>(null);
  const [editPresetVal, setEditPresetVal]   = useState('');

  // Editable sell presets  
  const [sellPresets, setSellPresets]       = useState(['25', '50', '75', '100']);
  const [editingSellPreset, setEditingSell] = useState<number|null>(null);
  const [editSellVal, setEditSellVal]       = useState('');

  const [stats, setStats] = useState({
    price: 0, marketCap: 0, liquidity: 0, holders: 0, volume24h: 0
  });

  const totalInvested = tokens.reduce((s, t) => s + (t.bought * t.launchPrice), 0);
  const totalProfit   = tokens.reduce((s, t) => s + t.profit, 0);

  useEffect(() => {
    if (selectedToken && !tradeWalletId) {
      const first = wallets.find(w => w.type === 'dev') || wallets[0];
      if (first) setTradeWalletId(first.id);
    }
  }, [selectedToken]);

  useEffect(() => {
    if (!selectedToken) return;
    setLoadingStats(true);
    fetch(`/api/solana/token-info?ca=${selectedToken.ca}`)
      .then(r => r.json())
      .then(d => setStats({
        price:     d.price     || 0,
        marketCap: d.marketCap || 0,
        liquidity: d.liquidity || 0,
        holders:   d.holders   || 0,
        volume24h: d.volume24h || 0,
      }))
      .catch(()=>{})
      .finally(() => setLoadingStats(false));
  }, [selectedToken?.ca]);

  const flash    = (m: string) => { setTradeMsg(m); setTimeout(() => setTradeMsg(''), 5000); };
  const flashErr = (e: string) => { setTradeErr(e); setTimeout(() => setTradeErr(''), 6000); };
  const selectedWallet = wallets.find(w => w.id === tradeWalletId);

  const handleBuy = async (solAmt: string) => {
    const amt = parseFloat(solAmt);
    if (!selectedWallet || !amt || !selectedToken) return;
    setIsBuying(true); setTradeErr('');
    try {
      const res = await fetch('/api/solana/trade', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ privateKey: selectedWallet.privateKeyEncrypted, action:'buy', mint: selectedToken.ca, amount: amt, denominatedInSol: true }),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error||'Buy failed');
      updateToken(selectedToken.id, { bought: selectedToken.bought + amt });
      setBuySOL('');
      flash(`✅ Buy sent! ${d.signature?.slice(0,12)}…`);
    } catch(e:any) { flashErr(e.message); }
    finally { setIsBuying(false); }
  };

  const handleSellPct = async (pct: number) => {
    if (!selectedWallet || !selectedToken) return;
    setIsSelling(true); setTradeErr('');
    try {
      const balRes = await fetch(`/api/solana/token-balance?wallet=${selectedWallet.address}&mint=${selectedToken.ca}`);
      const { balance } = await balRes.json();
      const sellAmount = pct === 100 ? '100%' : (balance > 0 ? balance * pct / 100 : null);
      if (sellAmount === null) throw new Error('No tokens in wallet');

      const res = await fetch('/api/solana/trade', {
        method:'POST', headers:{'Content-Type':'application/json'},
        body: JSON.stringify({ privateKey: selectedWallet.privateKeyEncrypted, action:'sell', mint: selectedToken.ca, amount: sellAmount, denominatedInSol: false }),
      });
      const d = await res.json();
      if (!d.success) throw new Error(d.error||'Sell failed');
      const soldTokens = typeof sellAmount === 'string' ? (balance||0) : sellAmount;
      updateToken(selectedToken.id, {
        sold:   selectedToken.sold + soldTokens,
        profit: selectedToken.profit + soldTokens * (selectedToken.currentPrice - selectedToken.launchPrice),
      });
      flash(`✅ ${pct}% sold! ${d.signature?.slice(0,12)}…`);
    } catch(e:any) { flashErr(e.message); }
    finally { setIsSelling(false); }
  };

  // ── TOKEN DETAIL ──────────────────────────────────────────────────────
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
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {selectedToken.image && (
                    <img src={selectedToken.image} alt="" className="w-10 h-10 rounded-full object-cover border border-white/10"
                      onError={e=>{(e.target as HTMLImageElement).style.display='none'}} />
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

              {/* Stats: Price / MC / Liquidity / Holders */}
              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  { label: 'Price',      val: fmtPrice(stats.price)      },
                  { label: 'Market Cap', val: fmt(stats.marketCap)       },
                  { label: 'Liquidity',  val: fmt(stats.liquidity)       },
                  { label: 'Holders',    val: stats.holders ? stats.holders.toLocaleString() : '—' },
                ].map(s => (
                  <div key={s.label} className="p-3 rounded-xl bg-white/5 border border-white/10 text-center">
                    <p className="text-white/40 text-xs mb-1">{s.label}</p>
                    <p className="text-white font-bold text-sm">
                      {loadingStats ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : s.val}
                    </p>
                  </div>
                ))}
              </div>

              {/* P&L */}
              <div className={cn('p-3 rounded-xl border mb-4 flex items-center justify-between',
                selectedToken.profit >= 0 ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20')}>
                <span className="text-white/50 text-sm">My Profit</span>
                <span className={cn('font-black text-xl', selectedToken.profit >= 0 ? 'text-green-400' : 'text-red-400')}>
                  {selectedToken.profit >= 0 ? '+' : ''}${selectedToken.profit.toFixed(4)}
                </span>
              </div>

              {/* Chart — Birdeye TV widget (dark, no GMGN X-Frame block) */}
              <div className="mb-4 rounded-2xl overflow-hidden border border-white/10 bg-black/40">
                <iframe
                  src={`https://birdeye.so/tv-widget/${selectedToken.ca}?chain=solana&viewMode=pair&chartType=CANDLE&defaultInterval=15&theme=dark`}
                  className="w-full"
                  style={{ height: '340px', border: 'none' }}
                  title="Chart"
                  loading="lazy"
                  sandbox="allow-scripts allow-same-origin"
                />
              </div>

              {/* Feedback */}
              {tradeMsg && <div className="mb-3 px-4 py-2 bg-green-500/15 border border-green-500/30 rounded-xl text-green-400 text-sm">{tradeMsg}</div>}
              {tradeErr && <div className="mb-3 px-4 py-2 bg-red-500/15 border border-red-500/30 rounded-xl text-red-400 text-sm">{tradeErr}</div>}

              {/* Wallet selector */}
              <div className="mb-4">
                <Label className="text-xs text-white/40 mb-1 block">Wallet</Label>
                <select value={tradeWalletId} onChange={e => setTradeWalletId(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 text-white rounded-xl px-3 h-9 text-sm focus:outline-none focus:border-white/30">
                  {wallets.map(w => (
                    <option key={w.id} value={w.id} className="bg-black">
                      [{w.type}] {w.name} — {w.address.slice(0,10)}… ({w.balance.toFixed(4)} SOL)
                    </option>
                  ))}
                  {wallets.length === 0 && <option disabled>No wallets</option>}
                </select>
              </div>

              {/* Buy + Sell side by side */}
              <div className="grid grid-cols-2 gap-4">

                {/* BUY */}
                <div className="p-4 rounded-2xl border border-green-500/20 bg-green-500/5 space-y-3">
                  <h3 className="text-green-400 font-bold text-sm">Buy More</h3>

                  {/* Editable presets */}
                  <div className="grid grid-cols-3 gap-1.5">
                    {buyPresets.map((p, i) => (
                      <div key={i} className="relative group">
                        {editingPreset === i ? (
                          <div className="flex gap-1">
                            <input value={editPresetVal} onChange={e => setEditPresetVal(e.target.value)}
                              className="w-full bg-black/60 border border-green-400/40 text-white rounded-lg px-2 h-8 text-xs font-mono focus:outline-none"
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  const updated = [...buyPresets]; updated[i] = editPresetVal || p; setBuyPresets(updated); setEditingPreset(null);
                                }
                                if (e.key === 'Escape') setEditingPreset(null);
                              }}
                              autoFocus />
                            <button onClick={() => { const u=[...buyPresets]; u[i]=editPresetVal||p; setBuyPresets(u); setEditingPreset(null); }}
                              className="text-green-400 flex-shrink-0"><Check className="w-3 h-3" /></button>
                          </div>
                        ) : (
                          <button onClick={() => handleBuy(p)} disabled={isBuying||!tradeWalletId}
                            className="w-full h-8 rounded-lg bg-green-500/15 hover:bg-green-500/30 border border-green-500/20 text-green-400 font-bold text-xs transition-all flex items-center justify-center gap-1">
                            {p} SOL
                            <Pencil className="w-2.5 h-2.5 opacity-0 group-hover:opacity-60 transition-opacity"
                              onClick={e => { e.stopPropagation(); setEditingPreset(i); setEditPresetVal(p); }} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Manual input */}
                  <div className="flex gap-2">
                    <input value={buySOL} onChange={e => setBuySOL(e.target.value)}
                      placeholder="0.00" inputMode="decimal"
                      className="flex-1 bg-black/40 border border-white/15 text-white rounded-xl px-3 h-10 font-mono text-sm focus:outline-none focus:border-green-400/50 placeholder:text-white/20" />
                    <span className="text-white/40 text-sm self-center">SOL</span>
                  </div>
                  <Button onClick={() => handleBuy(buySOL)} disabled={!buySOL || isBuying || !tradeWalletId}
                    className="w-full bg-green-500 hover:bg-green-400 text-black font-bold h-10">
                    {isBuying ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Buy'}
                  </Button>
                </div>

                {/* SELL */}
                <div className="p-4 rounded-2xl border border-red-500/20 bg-red-500/5 space-y-3">
                  <h3 className="text-red-400 font-bold text-sm">Sell</h3>

                  {/* Editable % presets */}
                  <div className="grid grid-cols-4 gap-1.5">
                    {sellPresets.map((p, i) => (
                      <div key={i} className="relative group">
                        {editingSellPreset === i ? (
                          <div className="flex flex-col gap-1">
                            <input value={editSellVal} onChange={e => setEditSellVal(e.target.value)}
                              className="w-full bg-black/60 border border-red-400/40 text-white rounded-lg px-1 h-8 text-xs font-mono focus:outline-none text-center"
                              onKeyDown={e => {
                                if (e.key==='Enter') { const u=[...sellPresets]; u[i]=editSellVal||p; setSellPresets(u); setEditingSell(null); }
                                if (e.key==='Escape') setEditingSell(null);
                              }}
                              autoFocus />
                          </div>
                        ) : (
                          <button onClick={() => handleSellPct(parseInt(p))} disabled={isSelling||!tradeWalletId}
                            className={cn('w-full h-9 rounded-lg font-bold text-xs border transition-all flex items-center justify-center gap-1',
                              p==='100' ? 'bg-red-500 border-red-500 text-white hover:bg-red-400' : 'bg-white/5 border-white/15 text-white/70 hover:bg-red-500/20 hover:border-red-500/30')}>
                            {p}%
                            <Pencil className="w-2 h-2 opacity-0 group-hover:opacity-50 transition-opacity"
                              onClick={e => { e.stopPropagation(); setEditingSell(i); setEditSellVal(p); }} />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>

                  <p className="text-xs text-white/25 text-center pt-1">
                    {isSelling ? <><Loader2 className="w-3 h-3 animate-spin inline mr-1" />Selling…</> : 'Нажми % → продаёт с выбранного кошелька'}
                  </p>
                  <p className="text-xs text-white/20 text-center">
                    Зажми иконку карандаша чтобы изменить %
                  </p>
                </div>
              </div>

              {/* GMGN button */}
              <a href={gmgnUrl} target="_blank" rel="noopener noreferrer"
                className="mt-4 flex items-center justify-center gap-2 w-full py-3 rounded-xl text-white font-bold transition-colors text-sm"
                style={{ background: '#0d9488' }}>
                <ExternalLink className="w-4 h-4" /> View on GMGN
              </a>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── LIST VIEW ──────────────────────────────────────────────────────────
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

            {tokens.length === 0 ? (
              <div className="p-12 text-center text-white/30 border border-dashed border-white/10 rounded-2xl">
                Нет токенов — лаунчни первый через VAMP!
              </div>
            ) : (
              <div className="space-y-2">
                {tokens.map(token => (
                  <button key={token.id} onClick={() => setSelectedToken(token)}
                    className="w-full flex items-center gap-4 p-4 rounded-xl border border-white/10 bg-white/3 hover:border-white/25 hover:bg-white/5 transition-all text-left">
                    {token.image && (
                      <img src={token.image} alt="" className="w-10 h-10 rounded-full object-cover border border-white/10 flex-shrink-0"
                        onError={e=>{(e.target as HTMLImageElement).style.display='none'}} />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-white text-lg">{token.symbol}</span>
                        <span className="text-white/50 text-sm truncate">{token.name}</span>
                      </div>
                      <div className="text-xs text-white/25 font-mono">{token.ca.slice(0,14)}…</div>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className={cn('font-bold text-sm', token.profit >= 0 ? 'text-green-400' : 'text-red-400')}>
                        {token.profit >= 0 ? '+' : ''}${token.profit.toFixed(2)}
                      </div>
                      {token.profit >= 0
                        ? <TrendingUp  className="w-4 h-4 text-green-400 ml-auto" />
                        : <TrendingDown className="w-4 h-4 text-red-400   ml-auto" />}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
