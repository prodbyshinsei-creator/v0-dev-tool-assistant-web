'use client';

import { useState, useEffect, useCallback } from 'react';
import { X, TrendingUp, TrendingDown, Loader2, ExternalLink, RefreshCw, ArrowUpRight, Download } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { usePortfolio, useWallets, useTrades } from '@/hooks/storage';
import { useWallet } from '@solana/wallet-adapter-react';
import { VersionedTransaction, Transaction } from '@solana/web3.js';

interface PortfolioModalProps { onClose: () => void; onLaunchVolume?: (ca: string) => void; }

const fmt = (v: number, pre = '$') => {
  if (!v) return '—';
  if (v >= 1e6) return `${pre}${(v/1e6).toFixed(2)}M`;
  if (v >= 1e3) return `${pre}${(v/1e3).toFixed(1)}K`;
  return `${pre}${v.toFixed(2)}`;
};
const fmtPrice = (v: number) => {
  if (!v) return '—';
  if (v < 0.000001) return `$${v.toExponential(2)}`;
  if (v < 0.01) return `$${v.toFixed(8)}`;
  return `$${v.toFixed(4)}`;
};
const timeAgo = (ts: number) => {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60)    return `${s}s`;
  if (s < 3600)  return `${Math.floor(s/60)}m`;
  if (s < 86400) return `${Math.floor(s/3600)}h`;
  return `${Math.floor(s/86400)}d`;
};

const COLORS = ['#ef4444','#3b82f6','#22c55e','#f59e0b','#a855f7','#06b6d4'];

export function PortfolioModal({ onClose, onLaunchVolume }: PortfolioModalProps) {
  const { tokens, updateToken }       = usePortfolio();
  const { wallets }                   = useWallets();
  const { trades, addTrade }          = useTrades();
  const { signTransaction: phantomSign, publicKey } = useWallet();

  const [tab, setTab]                  = useState<'overview'|'positions'|'trades'|'wallets'>('overview');
  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [tradeWalletId, setTradeWalletId] = useState('');
  const [buySOL, setBuySOL]            = useState('');
  const [isBuying, setIsBuying]        = useState(false);
  const [isSelling, setIsSelling]      = useState(false);
  const [tradeMsg, setTradeMsg]        = useState('');
  const [tradeErr, setTradeErr]        = useState('');
  const [tokenStats, setTokenStats]    = useState<any>({});
  const [loadingStats, setLoadingStats]= useState(false);
  const [walletBals, setWalletBals]    = useState<Record<string,number>>({});
  const [loadingBals, setLoadingBals]  = useState(false);

  // On-chain trade history
  const [onchainTrades, setOnchainTrades]     = useState<any[]>([]);
  const [fetchingOnchain, setFetchingOnchain] = useState(false);
  const [onchainErr, setOnchainErr]           = useState('');
  const [fetchedWallets, setFetchedWallets]   = useState<string[]>([]);

  const devWallets    = wallets.filter(w => w.type === 'dev');
  const totalBalance  = Object.values(walletBals).reduce((a,b) => a+b, 0);
  const totalProfit   = tokens.reduce((s,t) => s+t.profit, 0);

  const loadBals = useCallback(async () => {
    if (!wallets.length) return;
    setLoadingBals(true);
    const r: Record<string,number> = {};
    await Promise.all(wallets.map(async w => {
      try { const d = await fetch(`/api/solana/balance?address=${w.address}`).then(r=>r.json()); r[w.id]=d.balance||0; }
      catch { r[w.id]=w.balance||0; }
    }));
    setWalletBals(r); setLoadingBals(false);
  }, [wallets]);

  useEffect(() => { if (tab==='overview'||tab==='wallets') loadBals(); }, [tab]);
  useEffect(() => { if (devWallets.length&&!tradeWalletId) setTradeWalletId(devWallets[0].id); }, [devWallets]);

  useEffect(() => {
    if (!selectedToken) return;
    setLoadingStats(true);
    fetch(`/api/solana/token-info?ca=${selectedToken.ca}`)
      .then(r=>r.json()).then(setTokenStats).catch(()=>{}).finally(()=>setLoadingStats(false));
  }, [selectedToken?.ca]);

  // Fetch on-chain trades for all wallets
  const fetchOnchainTrades = async (mintFilter = '') => {
    if (!wallets.length) return;
    setFetchingOnchain(true); setOnchainErr('');
    try {
      const all: any[] = [];
      const seen = new Set<string>();
      await Promise.all(wallets.map(async w => {
        try {
          const url = `/api/solana/tx-history?wallet=${w.address}&limit=50${mintFilter?`&mint=${mintFilter}`:''}`;
          const { trades: wt, error } = await fetch(url).then(r=>r.json());
          if (error) return;
          wt?.forEach((t: any) => {
            if (!seen.has(t.id)) {
              seen.add(t.id);
              all.push({ ...t, walletName: w.name, walletAddress: w.address });
            }
          });
        } catch {}
      }));
      all.sort((a,b) => b.timestamp - a.timestamp);
      setOnchainTrades(all);
      setFetchedWallets(wallets.map(w=>w.id));
    } catch(e:any) { setOnchainErr(e.message); }
    finally { setFetchingOnchain(false); }
  };

  const flash    = (m:string) => { setTradeMsg(m); setTimeout(()=>setTradeMsg(''),5000); };
  const flashErr = (e:string) => { setTradeErr(e); setTimeout(()=>setTradeErr(''),6000); };
  const selWallet = wallets.find(w=>w.id===tradeWalletId);

  // Buy — supports both private key and Phantom
  const handleBuy = async (solAmt: string) => {
    const amt = parseFloat(solAmt);
    if (!selWallet || !amt || !selectedToken) return;
    setIsBuying(true); setTradeErr('');
    try {
      let sig = '';
      const isPhantomWallet = selWallet.connected && publicKey?.toBase58() === selWallet.address;

      if (isPhantomWallet && phantomSign) {
        // ── Phantom / wallet-adapter path ──
        flash('Requesting Phantom signature…');
        const unsignedRes = await fetch('/api/solana/unsigned-trade', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ publicKey: selWallet.address, action:'buy', mint:selectedToken.ca, amount:amt, denominatedInSol:true, slippage:15 }),
        });
        const { transaction: txB64, error: unsignErr } = await unsignedRes.json();
        if (unsignErr || !txB64) throw new Error(unsignErr || 'Failed to build transaction');

        const txBytes = Buffer.from(txB64, 'base64');
        let tx: VersionedTransaction | Transaction;
        try { tx = VersionedTransaction.deserialize(txBytes); }
        catch { tx = Transaction.from(txBytes); }

        const signed = await phantomSign(tx as any);

        const sendRes = await fetch('/api/solana/send-transaction', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ transaction: Buffer.from(signed.serialize()).toString('base64') }),
        });
        const sendData = await sendRes.json();
        if (!sendData.success) throw new Error(sendData.error || 'Send failed');
        sig = sendData.signature || '';
      } else {
        // ── Private key path ──
        const res = await fetch('/api/solana/trade', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ privateKey: selWallet.privateKeyEncrypted, action:'buy', mint:selectedToken.ca, amount:amt, denominatedInSol:true }),
        });
        const d = await res.json();
        if (!d.success) throw new Error(d.error||'Buy failed');
        sig = d.signature||'';
      }
      updateToken(selectedToken.id, { bought: selectedToken.bought+amt });
      addTrade({ id:crypto.randomUUID(), ca:selectedToken.ca, tokenSymbol:selectedToken.symbol,
        tokenName:selectedToken.name, tokenImage:selectedToken.image,
        action:'buy', amountSol:amt, priceUsd:tokenStats.price||0,
        timestamp:Date.now(), signature:sig,
        walletName:selWallet.name, walletAddress:selWallet.address });
      setBuySOL(''); flash(`✅ Buy sent!${sig?' '+sig.slice(0,12)+'…':''}`);
    } catch(e:any) { flashErr(e.message); }
    finally { setIsBuying(false); }
  };

  // Sell — supports both private key and Phantom
  const handleSellPct = async (pct: number) => {
    if (!selWallet || !selectedToken) return;
    setIsSelling(true); setTradeErr('');
    try {
      const balRes = await fetch(`/api/solana/token-balance?wallet=${selWallet.address}&mint=${selectedToken.ca}`);
      const { balance } = await balRes.json();
      const sellAmt = pct===100 ? '100%' : (balance>0 ? balance*pct/100 : null);
      if (sellAmt===null) throw new Error('No tokens in wallet');

      let sig = '';
      const isPhantomWallet = selWallet.connected && publicKey?.toBase58() === selWallet.address;

      if (isPhantomWallet && phantomSign) {
        // ── Phantom / wallet-adapter path ──
        flash('Requesting Phantom signature…');
        const unsignedRes = await fetch('/api/solana/unsigned-trade', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ publicKey: selWallet.address, action:'sell', mint:selectedToken.ca, amount:sellAmt, denominatedInSol:false, slippage:15 }),
        });
        const { transaction: txB64, error: unsignErr } = await unsignedRes.json();
        if (unsignErr || !txB64) throw new Error(unsignErr || 'Failed to build sell tx');

        const txBytes = Buffer.from(txB64, 'base64');
        let tx: VersionedTransaction | Transaction;
        try { tx = VersionedTransaction.deserialize(txBytes); }
        catch { tx = Transaction.from(txBytes); }

        const signed = await phantomSign(tx as any);
        const sendRes = await fetch('/api/solana/send-transaction', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ transaction: Buffer.from(signed.serialize()).toString('base64') }),
        });
        const sendData = await sendRes.json();
        if (!sendData.success) throw new Error(sendData.error || 'Send failed');
        sig = sendData.signature||'';
      } else {
        const res = await fetch('/api/solana/trade', {
          method:'POST', headers:{'Content-Type':'application/json'},
          body: JSON.stringify({ privateKey:selWallet.privateKeyEncrypted, action:'sell', mint:selectedToken.ca, amount:sellAmt, denominatedInSol:false }),
        });
        const d = await res.json();
        if (!d.success) throw new Error(d.error||'Sell failed');
        sig = d.signature||'';
      }

      const soldTokens = typeof sellAmt==='string' ? (balance||0) : sellAmt;
      const profitDelta = soldTokens*(selectedToken.currentPrice-selectedToken.launchPrice);
      updateToken(selectedToken.id, { sold:selectedToken.sold+soldTokens, profit:selectedToken.profit+profitDelta });
      addTrade({ id:crypto.randomUUID(), ca:selectedToken.ca, tokenSymbol:selectedToken.symbol,
        tokenName:selectedToken.name, tokenImage:selectedToken.image,
        action:'sell', amountSol:soldTokens*(tokenStats.price||0),
        priceUsd:tokenStats.price||0, timestamp:Date.now(), signature:sig,
        walletName:selWallet.name, walletAddress:selWallet.address });
      flash(`✅ ${pct}% sold!`);
    } catch(e:any) { flashErr(e.message); }
    finally { setIsSelling(false); }
  };

  const pnlChart = (() => {
    if (trades.length<2) return [];
    let cum=0;
    return [...trades].sort((a,b)=>a.timestamp-b.timestamp).slice(-30).map(t=>{
      cum+=t.action==='sell'?t.amountSol*0.1:0;
      return {time:timeAgo(t.timestamp),pnl:parseFloat(cum.toFixed(4))};
    });
  })();

  const pieData = tokens.slice(0,6).map((t,i)=>({name:t.symbol,value:t.bought||0.001,color:COLORS[i%COLORS.length]}));

  // Merge local + on-chain trades for display
  const allTradesForDisplay = (() => {
    const localSigs = new Set(trades.map(t=>t.signature).filter(Boolean));
    const onchain = onchainTrades.filter(t => !localSigs.has(t.signature));
    return [...trades, ...onchain].sort((a,b)=>b.timestamp-a.timestamp);
  })();

  // ── TOKEN DETAIL ────────────────────────────────────────────────────────
  if (selectedToken) {
    const isPhantomConnected = selWallet?.connected && publicKey?.toBase58() === selWallet?.address;
    return (
      <>
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" onClick={onClose} />
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
          <div className="bg-black/90 border-2 border-white/15 rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto shadow-2xl"
            onClick={e=>e.stopPropagation()}>
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <button onClick={()=>setSelectedToken(null)} className="flex items-center gap-2 text-white/50 hover:text-white text-sm">← Back</button>
                <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-white/40 hover:text-white"><X className="w-5 h-5" /></button>
              </div>

              <div className="flex items-center gap-3 mb-4">
                {selectedToken.image&&<img src={selectedToken.image} alt="" className="w-12 h-12 rounded-full object-cover border border-white/10" onError={e=>{(e.target as any).style.display='none'}}/>}
                <div>
                  <h2 className="text-3xl font-black text-white">{selectedToken.symbol}</h2>
                  <p className="text-white/50 text-sm">{selectedToken.name}</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-4">
                {[
                  {label:'Price',    val:fmtPrice(tokenStats.price||0)},
                  {label:'Mkt Cap',  val:fmt(tokenStats.marketCap||0)},
                  {label:'Liq',      val:fmt(tokenStats.liquidity||0)},
                  {label:'Holders',  val:tokenStats.holders?tokenStats.holders.toLocaleString():'—'},
                ].map(s=>(
                  <div key={s.label} className="p-3 rounded-xl bg-white/5 border border-white/8 text-center">
                    <p className="text-white/40 text-xs mb-1">{s.label}</p>
                    <p className="text-white font-bold text-sm">{loadingStats?<Loader2 className="w-3 h-3 animate-spin mx-auto"/>:s.val}</p>
                  </div>
                ))}
              </div>

              <div className={cn('p-3 rounded-xl border mb-4 flex items-center justify-between',
                selectedToken.profit>=0?'bg-green-500/10 border-green-500/20':'bg-red-500/10 border-red-500/20')}>
                <span className="text-white/50 text-sm">My Profit</span>
                <span className={cn('font-black text-xl',selectedToken.profit>=0?'text-green-400':'text-red-400')}>
                  {selectedToken.profit>=0?'+':''}${selectedToken.profit.toFixed(4)}
                </span>
              </div>

              <div className="mb-4 rounded-2xl overflow-hidden border border-white/10 bg-black/40">
                <iframe src={`https://birdeye.so/tv-widget/${selectedToken.ca}?chain=solana&viewMode=pair&chartType=CANDLE&defaultInterval=15&theme=dark`}
                  className="w-full" style={{height:'320px',border:'none'}} title="Chart" loading="lazy" sandbox="allow-scripts allow-same-origin"/>
              </div>

              {tradeMsg&&<div className="mb-3 px-4 py-2 bg-green-500/15 border border-green-500/30 rounded-xl text-green-400 text-sm">{tradeMsg}</div>}
              {tradeErr&&<div className="mb-3 px-4 py-2 bg-red-500/15 border border-red-500/30 rounded-xl text-red-400 text-sm">{tradeErr}</div>}

              <div className="mb-4">
                <Label className="text-xs text-white/40 mb-1 block">
                  Wallet
                  {isPhantomConnected && <span className="ml-2 text-purple-400 font-bold">⚡ Phantom (no private key needed)</span>}
                </Label>
                <select value={tradeWalletId} onChange={e=>setTradeWalletId(e.target.value)}
                  className="w-full bg-white/5 border border-white/15 text-white rounded-xl px-3 h-9 text-sm focus:outline-none">
                  {wallets.map(w=>(
                    <option key={w.id} value={w.id} className="bg-black">
                      {w.connected?'⚡':''} [{w.type}] {w.name} — {w.address.slice(0,10)}… ({(walletBals[w.id]||w.balance).toFixed(4)} SOL)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* BUY */}
                <div className="p-4 rounded-2xl border border-green-500/20 bg-green-500/5 space-y-3">
                  <h3 className="text-green-400 font-bold text-sm">Buy More</h3>
                  <div className="grid grid-cols-3 gap-1.5">
                    {['0.5','1','2'].map(p=>(
                      <button key={p} onClick={()=>handleBuy(p)} disabled={isBuying||!tradeWalletId}
                        className="h-8 rounded-lg bg-green-500/15 hover:bg-green-500/30 border border-green-500/20 text-green-400 font-bold text-xs transition-all">
                        {p} SOL
                      </button>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input value={buySOL} onChange={e=>setBuySOL(e.target.value)} placeholder="0.00" inputMode="decimal"
                      className="flex-1 bg-black/40 border border-white/15 text-white rounded-xl px-3 h-10 font-mono text-sm focus:outline-none focus:border-green-400/50 placeholder:text-white/20"/>
                    <span className="text-white/40 text-sm self-center">SOL</span>
                  </div>
                  <Button onClick={()=>handleBuy(buySOL)} disabled={!buySOL||isBuying||!tradeWalletId}
                    className="w-full bg-green-500 hover:bg-green-400 text-black font-bold h-10">
                    {isBuying?<Loader2 className="w-4 h-4 animate-spin"/>:'Buy'}
                  </Button>
                </div>

                {/* SELL */}
                <div className="p-4 rounded-2xl border border-red-500/20 bg-red-500/5 space-y-3">
                  <h3 className="text-red-400 font-bold text-sm">Sell</h3>
                  <div className="grid grid-cols-4 gap-1.5">
                    {['25','50','75','100'].map(p=>(
                      <button key={p} onClick={()=>handleSellPct(parseInt(p))} disabled={isSelling||!tradeWalletId}
                        className={cn('h-9 rounded-lg font-bold text-xs border transition-all',
                          p==='100'?'bg-red-500 border-red-500 text-white hover:bg-red-400':
                          'bg-white/5 border-white/15 text-white/70 hover:bg-red-500/20 hover:border-red-500/30')}>
                        {p}%
                      </button>
                    ))}
                  </div>
                  <p className="text-xs text-white/25 text-center">
                    {isSelling?<><Loader2 className="w-3 h-3 animate-spin inline mr-1"/>Selling…</>:'% of wallet balance'}
                  </p>
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <a href={`https://gmgn.ai/sol/token/${selectedToken.ca}`} target="_blank" rel="noopener noreferrer"
                  className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-white font-bold text-sm"
                  style={{background:'#0d9488'}}>
                  <ExternalLink className="w-4 h-4"/> GMGN
                </a>
                {onLaunchVolume&&(
                  <button onClick={()=>{onClose();setTimeout(()=>onLaunchVolume!(selectedToken.ca),150);}}
                    className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-black font-bold text-sm bg-blue-400 hover:bg-blue-300 transition-colors">
                    ⚡ Launch Volume Bot
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }

  // ── MAIN PORTFOLIO VIEW ──────────────────────────────────────────────────
  const TABS = [
    {id:'overview',  label:'Overview'},
    {id:'positions', label:`Positions (${tokens.length})`},
    {id:'trades',    label:`Trades (${allTradesForDisplay.length})`},
    {id:'wallets',   label:`Wallets (${wallets.length})`},
  ] as const;

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" onClick={onClose}/>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl max-w-5xl w-full max-h-[90vh] flex flex-col pointer-events-auto shadow-2xl overflow-hidden"
          onClick={e=>e.stopPropagation()}>

          <div className="flex items-center justify-between px-6 py-4 border-b border-white/8 flex-shrink-0">
            <div className="flex items-center gap-4">
              <span className="text-2xl font-black text-white">Portfolio</span>
              <span className="text-white/30">·</span>
              <span className="text-white/50 text-sm font-mono">{wallets.length} wallets</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="text-right hidden md:block">
                <div className="text-xs text-white/40">PNL</div>
                <div className={cn('font-bold',totalProfit>=0?'text-green-400':'text-red-400')}>
                  {totalProfit>=0?'+':''}${totalProfit.toFixed(2)}
                </div>
              </div>
              <button onClick={loadBals} className="p-2 rounded-xl hover:bg-white/10 text-white/40 hover:text-white" title="Refresh">
                <RefreshCw className={cn('w-4 h-4',loadingBals&&'animate-spin')}/>
              </button>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-white/40 hover:text-white"><X className="w-5 h-5"/></button>
            </div>
          </div>

          <div className="flex border-b border-white/8 flex-shrink-0 px-6">
            {TABS.map(t=>(
              <button key={t.id} onClick={()=>setTab(t.id as any)}
                className={cn('py-3 px-4 text-sm font-medium transition-all border-b-2 -mb-px whitespace-nowrap',
                  tab===t.id?'border-white text-white':'border-transparent text-white/40 hover:text-white/70')}>
                {t.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto">

            {/* OVERVIEW */}
            {tab==='overview'&&(
              <div className="p-6 grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-white/60 text-sm font-bold mb-4">Asset allocation</h3>
                  {tokens.length===0?(
                    <div className="text-center text-white/30 py-16 border border-dashed border-white/10 rounded-2xl">No tokens yet</div>
                  ):(
                    <div>
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={pieData} cx="50%" cy="50%" innerRadius={55} outerRadius={85} paddingAngle={3} dataKey="value">
                            {pieData.map((e,i)=><Cell key={i} fill={e.color}/>)}
                          </Pie>
                          <Tooltip formatter={(v:any)=>[`${v.toFixed(4)} SOL`]} contentStyle={{background:'#0a0a0a',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8}}/>
                        </PieChart>
                      </ResponsiveContainer>
                      <div className="mt-2 space-y-1.5">
                        {pieData.map((d,i)=>(
                          <div key={i} className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-2">
                              <div className="w-2.5 h-2.5 rounded-full" style={{background:d.color}}/>
                              <span className="text-white/70">{d.name}</span>
                            </div>
                            <span className="text-white/50 font-mono">{d.value.toFixed(4)} SOL</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <h3 className="text-white/60 text-sm font-bold mb-4">PNL Chart</h3>
                  {pnlChart.length<2?(
                    <div className="text-center text-white/30 py-16 border border-dashed border-white/10 rounded-2xl">Make trades to see PNL</div>
                  ):(
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={pnlChart}>
                        <XAxis dataKey="time" stroke="#ffffff20" tick={{fill:'#ffffff40',fontSize:10}}/>
                        <YAxis stroke="#ffffff20" tick={{fill:'#ffffff40',fontSize:10}}/>
                        <Tooltip contentStyle={{background:'#0a0a0a',border:'1px solid rgba(255,255,255,0.1)',borderRadius:8}}/>
                        <Line type="monotone" dataKey="pnl" stroke="#ef4444" strokeWidth={2} dot={false}/>
                      </LineChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>
            )}

            {/* POSITIONS */}
            {tab==='positions'&&(
              <div>
                {tokens.length===0?(
                  <div className="p-16 text-center text-white/30">No positions — launch tokens via VAMP!</div>
                ):(
                  <table className="w-full">
                    <thead><tr className="border-b border-white/8">
                      {['Asset','Cost','PNL','PNL %','Actions'].map(h=>(
                        <th key={h} className="text-left px-4 py-3 text-xs text-white/40 font-medium">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {tokens.map(t=>{
                        const pct=t.bought>0?t.profit/(t.bought*t.launchPrice)*100:0;
                        return (
                          <tr key={t.id} className="border-b border-white/5 hover:bg-white/3 cursor-pointer" onClick={()=>setSelectedToken(t)}>
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-2">
                                {t.image&&<img src={t.image} alt="" className="w-7 h-7 rounded-full object-cover" onError={e=>{(e.target as any).style.display='none'}}/>}
                                <div>
                                  <div className="text-white font-bold text-sm">{t.symbol}</div>
                                  <div className="text-white/40 text-xs font-mono">{t.ca.slice(0,8)}…</div>
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 text-white/60 text-sm font-mono">{t.bought.toFixed(4)} SOL</td>
                            <td className={cn('px-4 py-3 text-sm font-mono font-bold',t.profit>=0?'text-green-400':'text-red-400')}>
                              {t.profit>=0?'+':''}${t.profit.toFixed(4)}
                            </td>
                            <td className={cn('px-4 py-3 text-sm font-mono',pct>=0?'text-green-400':'text-red-400')}>
                              {pct>=0?'+':''}{pct.toFixed(1)}%
                            </td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                <button onClick={e=>{e.stopPropagation();setSelectedToken(t);}}
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/40 hover:text-white">
                                  <ArrowUpRight className="w-3.5 h-3.5"/>
                                </button>
                                <a href={`https://gmgn.ai/sol/token/${t.ca}`} target="_blank" rel="noopener noreferrer"
                                  onClick={e=>e.stopPropagation()}
                                  className="p-1.5 rounded-lg bg-white/5 hover:bg-[#0d9488]/20 text-white/40 hover:text-[#0d9488]">
                                  <ExternalLink className="w-3.5 h-3.5"/>
                                </a>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* TRADES — with on-chain fetch */}
            {tab==='trades'&&(
              <div>
                <div className="flex items-center justify-between px-4 py-3 border-b border-white/8">
                  <span className="text-white/50 text-sm">
                    {allTradesForDisplay.length} trades
                    {onchainTrades.length>0&&<span className="ml-2 text-blue-400/60 text-xs">({onchainTrades.length} on-chain)</span>}
                  </span>
                  <div className="flex items-center gap-2">
                    {onchainErr&&<span className="text-red-400 text-xs">{onchainErr}</span>}
                    <button onClick={()=>fetchOnchainTrades()} disabled={fetchingOnchain}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-400/10 hover:bg-blue-400/20 border border-blue-400/20 text-blue-400 text-xs font-bold transition-all">
                      {fetchingOnchain?<Loader2 className="w-3 h-3 animate-spin"/>:<Download className="w-3 h-3"/>}
                      {fetchingOnchain?'Fetching…':'Fetch on-chain history'}
                    </button>
                  </div>
                </div>
                {allTradesForDisplay.length===0?(
                  <div className="p-16 text-center text-white/30">No trades yet — click "Fetch on-chain history"</div>
                ):(
                  <table className="w-full">
                    <thead><tr className="border-b border-white/8">
                      {['Date','Wallet','Token','Side','Amount','Sig'].map(h=>(
                        <th key={h} className="text-left px-4 py-3 text-xs text-white/40 font-medium">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {allTradesForDisplay.slice(0,200).map(t=>(
                        <tr key={t.id} className="border-b border-white/5 hover:bg-white/3">
                          <td className="px-4 py-3 text-white/50 text-xs font-mono">{timeAgo(t.timestamp)}</td>
                          <td className="px-4 py-3 text-white/60 text-xs max-w-[90px] truncate">{t.walletName}</td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5">
                              {t.tokenImage&&<img src={t.tokenImage} alt="" className="w-4 h-4 rounded-full" onError={e=>{(e.target as any).style.display='none'}}/>}
                              <span className="text-white text-xs font-mono">{t.tokenSymbol||t.mint?.slice(0,8)}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full',
                              t.action==='buy'?'bg-green-500/20 text-green-400':'bg-red-500/20 text-red-400')}>
                              {t.action==='buy'?'Buy':'Sell'}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-white/60 text-xs font-mono">{t.amountSol?.toFixed(4)} SOL</td>
                          <td className="px-4 py-3">
                            {t.signature?(
                              <a href={`https://solscan.io/tx/${t.signature}`} target="_blank" rel="noopener noreferrer"
                                className="text-white/25 hover:text-blue-400 text-xs font-mono transition-colors">
                                {t.signature.slice(0,8)}…
                              </a>
                            ):'-'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </div>
            )}

            {/* WALLETS */}
            {tab==='wallets'&&(
              <div className="p-6">
                {wallets.length===0?(
                  <div className="p-12 text-center text-white/30 border border-dashed border-white/10 rounded-2xl">Add wallets in WALLETS section</div>
                ):(
                  <table className="w-full">
                    <thead><tr className="border-b border-white/8">
                      {['Wallet','Address','Type','Balance'].map(h=>(
                        <th key={h} className="text-left px-4 py-3 text-xs text-white/40 font-medium">{h}</th>
                      ))}
                    </tr></thead>
                    <tbody>
                      {wallets.map(w=>(
                        <tr key={w.id} className="border-b border-white/5">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className={cn('w-2 h-2 rounded-full',w.balance>0?'bg-green-400':'bg-white/20')}/>
                              <span className="text-white font-bold text-sm">{w.name}</span>
                              {w.connected&&<span className="text-xs px-1.5 py-0.5 rounded bg-purple-400/20 text-purple-400">CONNECTED</span>}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-white/40 text-xs font-mono">{w.address.slice(0,14)}…</td>
                          <td className="px-4 py-3">
                            <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full',
                              w.type==='dev'?'bg-red-500/20 text-red-400':'bg-blue-400/20 text-blue-400')}>
                              {w.type.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-white font-mono font-bold">
                            {loadingBals?<Loader2 className="w-3 h-3 animate-spin"/>:`${(walletBals[w.id]??w.balance).toFixed(4)} SOL`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t border-white/15">
                        <td colSpan={3} className="px-4 py-3 text-white/60 text-sm font-bold">Total</td>
                        <td className="px-4 py-3 text-white font-black font-mono">{totalBalance.toFixed(4)} SOL</td>
                      </tr>
                    </tfoot>
                  </table>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
