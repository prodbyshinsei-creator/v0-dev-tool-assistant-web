'use client';

import { useState, useEffect, useRef } from 'react';
import { X, Loader2, Play, Pause, Power, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { useWallets, useVolumeSessions, VolumeSession, StoredWallet } from '@/hooks/storage';

interface VolumeModalProps { onClose: () => void; }

// Module-level loop tracking
const runningLoops = new Set<string>();

const DELAYS = {
  organic: { min: 30_000, max: 90_000 },
  fast:    { min: 5_000,  max: 20_000 },
  turbo:   { min: 2_000,  max: 5_000  },
};

const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
const rand  = (a: number, b: number) => a + Math.random() * (b - a);

// Parse range string like "0.1-0.5" or "0.05" → random amount in range
function parseRange(s: string): number {
  const clean = s.trim().replace(',', '.');
  if (clean.includes('-')) {
    const [a, b] = clean.split('-').map(Number);
    if (!isNaN(a) && !isNaN(b) && b > a) return rand(a, b);
    if (!isNaN(a)) return a;
  }
  const v = parseFloat(clean);
  return isNaN(v) ? 0.002 : v;
}

async function runWalletLoop(
  sessionId: string,
  wallet:    StoredWallet,
  ca:        string,
  preset:    keyof typeof DELAYS,
  buySolRange: string,
  onTx:      () => void,
) {
  const key = `${sessionId}:${wallet.id}`;
  const { min, max } = DELAYS[preset] ?? DELAYS.organic;

  while (runningLoops.has(key)) {
    try {
      const buyAmt = parseRange(buySolRange);

      // BUY
      const buyRes = await fetch('/api/solana/trade', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privateKey: wallet.privateKeyEncrypted, action: 'buy', mint: ca, amount: buyAmt, denominatedInSol: true }),
      });
      if (buyRes.ok) onTx();

      if (!runningLoops.has(key)) break;
      await sleep(rand(500, 1500));
      if (!runningLoops.has(key)) break;

      // SELL 100%
      const sellRes = await fetch('/api/solana/trade', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ privateKey: wallet.privateKeyEncrypted, action: 'sell', mint: ca, amount: '100%', denominatedInSol: false }),
      });
      if (sellRes.ok) onTx();

      if (!runningLoops.has(key)) break;
      await sleep(rand(min, max));
    } catch (err) {
      console.error(`Volume loop [${wallet.name}]:`, err);
      if (!runningLoops.has(key)) break;
      await sleep(5_000);
    }
  }
}

// SOL range presets (matching the bot)
const SOL_PRESETS = [
  '0.005–0.1',
  '0.1–0.15',
  '0.15–0.25',
  '0.25–0.5',
  '0.5–1.0',
  '1–5',
];

export function VolumeModal({ onClose }: VolumeModalProps) {
  const { wallets }                                            = useWallets();
  const { sessions, addSession, updateSession, deleteSession } = useVolumeSessions();

  const [tab, setTab]                 = useState<'start'|'sessions'>('start');
  const [tokenCA, setTokenCA]         = useState('');
  const [selectedWallets, setSelectedWallets] = useState<string[]>([]);
  const [preset, setPreset]           = useState<'organic'|'fast'|'turbo'>('organic');
  const [buySolRange, setBuySolRange] = useState('0.1–0.15');  // range string
  const [isStarting, setIsStarting]   = useState(false);
  const [stoppingId, setStoppingId]   = useState<string|null>(null);

  const statsRef = useRef<Record<string, { tx: number; fees: number }>>({});
  const [stats, setStats] = useState<Record<string, { tx: number; fees: number }>>({});

  const volumeWallets = wallets.filter(w => w.type === 'volume');

  useEffect(() => {
    sessions.filter(s => s.status === 'running').forEach(s => launchLoops(s));
    return () => { runningLoops.clear(); };
  }, []); // eslint-disable-line

  const launchLoops = (session: VolumeSession) => {
    wallets.filter(w => session.wallets.includes(w.id)).forEach(wallet => {
      const key = `${session.id}:${wallet.id}`;
      if (runningLoops.has(key)) return;
      runningLoops.add(key);
      runWalletLoop(
        session.id, wallet, session.ca, session.preset,
        session.buySolRange || String(session.buySolAmount),
        () => {
          statsRef.current[session.id] = {
            tx:   (statsRef.current[session.id]?.tx   || 0) + 1,
            fees: (statsRef.current[session.id]?.fees || 0) + 0.00003,
          };
          setStats({ ...statsRef.current });
        },
      );
    });
  };

  const handleStart = async () => {
    if (!tokenCA || selectedWallets.length === 0) return;
    setIsStarting(true);
    await sleep(300);
    const buyAmt = parseRange(buySolRange);
    const session: VolumeSession = {
      id: crypto.randomUUID(), ca: tokenCA, preset,
      status: 'running', wallets: selectedWallets,
      createdAt: Date.now(),
      buySolAmount: buyAmt,
      buySolRange,
    };
    addSession(session);
    launchLoops(session);
    setTokenCA(''); setSelectedWallets([]);
    setIsStarting(false); setTab('sessions');
  };

  const togglePause = (session: VolumeSession) => {
    if (session.status === 'running') {
      wallets.filter(w => session.wallets.includes(w.id)).forEach(w => runningLoops.delete(`${session.id}:${w.id}`));
      updateSession(session.id, { status: 'paused' });
    } else {
      updateSession(session.id, { status: 'running' });
      launchLoops({ ...session, status: 'running' });
    }
  };

  const handleStop = async (session: VolumeSession) => {
    setStoppingId(session.id);
    wallets.filter(w => session.wallets.includes(w.id)).forEach(w => runningLoops.delete(`${session.id}:${w.id}`));
    updateSession(session.id, { status: 'stopping' });
    await sleep(2000);

    await Promise.all(
      wallets.filter(w => session.wallets.includes(w.id)).map(async wallet => {
        try {
          await fetch('/api/solana/trade', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ privateKey: wallet.privateKeyEncrypted, action: 'sell', mint: session.ca, amount: '100%', denominatedInSol: false }),
          });
        } catch (e) { console.error('Stop-sell:', wallet.name, e); }
      })
    );

    deleteSession(session.id);
    setStoppingId(null);
  };

  const toggleWallet = (id: string) =>
    setSelectedWallets(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const activeSessions = sessions.filter(s => s.status !== 'stopping');

  const PRESETS = [
    { key: 'organic', icon: '🌱', label: 'ORGANIC', delay: '30–90s', txh: '2–4' },
    { key: 'fast',    icon: '⚡', label: 'FAST',    delay: '5–20s',  txh: '8–12' },
    { key: 'turbo',   icon: '🔥', label: 'TURBO',   delay: '2–5s',   txh: '20–30' },
  ] as const;

  return (
    <>
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50" onClick={onClose} />
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div className="bg-black/85 backdrop-blur-2xl border-2 border-blue-400/30 rounded-3xl max-w-3xl w-full max-h-[90vh] overflow-y-auto pointer-events-auto shadow-2xl"
          onClick={e => e.stopPropagation()}>
          <div className="p-7">

            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <img src="/vamp-blood.png" alt="" className="w-9 h-9" style={{ mixBlendMode: 'screen' }} />
                <h2 className="text-3xl font-mono font-bold text-blue-400">VOLUME</h2>
              </div>
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/10 text-white/60 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            {/* Tabs */}
            <div className="flex gap-2 mb-6">
              {(['start', 'sessions'] as const).map(t => (
                <button key={t} onClick={() => setTab(t)}
                  className={cn('flex-1 py-2.5 rounded-xl font-bold text-base transition-all',
                    tab === t ? 'bg-blue-400 text-black' : 'bg-white/5 border border-white/15 text-white/70 hover:border-white/30')}>
                  {t === 'start' ? 'Start Session' : `Active (${activeSessions.length})`}
                </button>
              ))}
            </div>

            {/* ── START TAB ── */}
            {tab === 'start' && (
              <div className="space-y-5">

                {/* Token CA */}
                <div>
                  <Label className="text-base font-semibold text-white/90 mb-2 block">Token CA</Label>
                  <Input value={tokenCA} onChange={e => setTokenCA(e.target.value)}
                    placeholder="Token contract address…"
                    className="bg-white/5 border-white/15 text-white placeholder:text-white/30 h-11 font-mono" />
                </div>

                {/* Speed preset */}
                <div>
                  <Label className="text-base font-semibold text-white/90 mb-2 block">Speed</Label>
                  <div className="grid grid-cols-3 gap-3">
                    {PRESETS.map(p => (
                      <button key={p.key} onClick={() => setPreset(p.key)}
                        className={cn('p-4 rounded-xl border-2 text-center transition-all',
                          preset === p.key ? 'border-blue-400 bg-blue-400/10' : 'border-white/10 hover:border-white/25')}>
                        <div className="text-3xl mb-1">{p.icon}</div>
                        <div className="font-bold text-white text-sm">{p.label}</div>
                        <div className="text-xs text-white/50 mt-0.5">{p.delay}</div>
                        <div className="text-xs text-blue-400/80 mt-1">~{p.txh} tx/h</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* SOL amount — presets like the bot + manual */}
                <div>
                  <Label className="text-base font-semibold text-white/90 mb-2 block">SOL per trade</Label>

                  {/* Preset buttons */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {SOL_PRESETS.map(p => (
                      <button key={p}
                        onClick={() => setBuySolRange(p)}
                        className={cn(
                          'py-2 px-3 rounded-xl text-sm font-mono font-bold border transition-all',
                          buySolRange === p
                            ? 'bg-blue-400 border-blue-400 text-black'
                            : 'bg-white/5 border-white/15 text-white/70 hover:border-blue-400/40 hover:text-white'
                        )}>
                        {p} SOL
                      </button>
                    ))}
                  </div>

                  {/* Manual range input */}
                  <div className="flex items-center gap-3">
                    <input
                      value={buySolRange}
                      onChange={e => setBuySolRange(e.target.value)}
                      placeholder="e.g. 0.1–1  or  0.05"
                      className="flex-1 bg-white/5 border border-white/15 text-white rounded-xl px-3 h-10 font-mono text-sm focus:outline-none focus:border-blue-400/50 placeholder:text-white/20"
                    />
                    <span className="text-white/40 text-sm font-mono">SOL</span>
                  </div>
                  <p className="text-xs text-white/30 mt-1.5">
                    Диапазон: <span className="text-white/50 font-mono">0.1–0.5</span> = случайная сумма между 0.1 и 0.5 SOL каждый трейд
                  </p>
                </div>

                {/* Wallet selection */}
                <div>
                  <Label className="text-base font-semibold text-white/90 mb-2 block">
                    Volume Wallets ({volumeWallets.length})
                  </Label>
                  {volumeWallets.length === 0 ? (
                    <div className="p-4 text-center text-white/40 border border-dashed border-white/15 rounded-xl text-sm">
                      Создай Volume кошельки в WALLETS
                    </div>
                  ) : (
                    <div className="space-y-2 border border-white/10 rounded-xl p-3 max-h-44 overflow-y-auto">
                      {volumeWallets.map(w => (
                        <label key={w.id} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-white/5 cursor-pointer">
                          <input type="checkbox" checked={selectedWallets.includes(w.id)}
                            onChange={() => toggleWallet(w.id)} className="w-4 h-4 accent-blue-400" />
                          <div className="flex-1 min-w-0">
                            <div className="font-mono font-bold text-white text-sm">{w.name}</div>
                            <div className="text-xs text-white/40">{w.address.slice(0,14)}…</div>
                          </div>
                          <div className="text-sm text-white/50 font-mono">{w.balance.toFixed(4)} SOL</div>
                        </label>
                      ))}
                    </div>
                  )}
                  <p className="text-xs text-white/40 mt-1">{selectedWallets.length} selected</p>
                </div>

                <Button onClick={handleStart}
                  disabled={isStarting || !tokenCA || selectedWallets.length === 0}
                  className="w-full bg-blue-400 hover:bg-blue-500 text-black font-bold h-12">
                  {isStarting
                    ? <><Loader2 className="w-5 h-5 mr-2 animate-spin" />Starting…</>
                    : <><Play className="w-5 h-5 mr-2" />START SESSION</>}
                </Button>
              </div>
            )}

            {/* ── SESSIONS TAB ── */}
            {tab === 'sessions' && (
              <div className="space-y-3">
                {activeSessions.length === 0 ? (
                  <div className="p-10 text-center text-white/40">Нет активных сессий</div>
                ) : activeSessions.map(session => {
                  const s       = stats[session.id] || { tx: 0, fees: 0 };
                  const elapsed = Math.floor((Date.now() - session.createdAt) / 60000);
                  const stopping = stoppingId === session.id;
                  const range   = session.buySolRange || String(session.buySolAmount);
                  return (
                    <div key={session.id} className="p-4 rounded-xl border border-white/10 bg-white/3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2 flex-wrap">
                            <span className="font-mono text-white font-bold text-sm">
                              {session.ca.slice(0,8)}…{session.ca.slice(-6)}
                            </span>
                            <span className={cn('text-xs font-bold px-2 py-0.5 rounded-full',
                              session.preset==='organic' ? 'bg-green-500/20 text-green-400' :
                              session.preset==='fast'    ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400')}>
                              {session.preset.toUpperCase()}
                            </span>
                            <span className={cn('text-xs px-2 py-0.5 rounded-full',
                              stopping ? 'bg-orange-500/20 text-orange-400' :
                              session.status==='running' ? 'bg-blue-400/20 text-blue-400' :
                              'bg-yellow-500/20 text-yellow-400')}>
                              {stopping ? '⏳ SELLING…' : session.status==='running' ? '🟢 RUNNING' : '🟡 PAUSED'}
                            </span>
                          </div>
                          <div className="grid grid-cols-4 gap-2 text-xs">
                            <div><div className="text-white/40">Wallets</div><div className="text-white font-mono">{session.wallets.length}</div></div>
                            <div><div className="text-white/40">Txs</div><div className="text-white font-mono">{s.tx}</div></div>
                            <div><div className="text-white/40">Fees</div><div className="text-white font-mono">{s.fees.toFixed(5)}</div></div>
                            <div><div className="text-white/40">Time</div><div className="text-white font-mono">{elapsed}m</div></div>
                          </div>
                          <div className="text-xs text-white/30 mt-1 font-mono">{range} SOL/trade · sell 100% each</div>
                        </div>
                        <div className="flex gap-2 ml-3">
                          {!stopping && (
                            <Button variant="outline" size="sm" onClick={() => togglePause(session)}
                              className="border-white/20 hover:border-blue-400/50 h-9 w-9 p-0">
                              {session.status==='running' ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                            </Button>
                          )}
                          <Button variant="outline" size="sm"
                            onClick={() => !stopping && handleStop(session)} disabled={!!stoppingId}
                            className="border-red-500/30 hover:border-red-500/60 hover:bg-red-500/10 text-red-400 h-9 w-9 p-0">
                            {stopping ? <Loader2 className="w-4 h-4 animate-spin" /> : <Power className="w-4 h-4" />}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
                {activeSessions.length > 0 && (
                  <div className="flex items-center gap-2 px-3 py-2 bg-blue-400/10 rounded-xl text-blue-400 text-xs">
                    <AlertCircle className="w-4 h-4" />
                    Держи окно открытым — бот работает пока модалка открыта
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
