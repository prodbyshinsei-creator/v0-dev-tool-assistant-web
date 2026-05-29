/**
 * volume-engine.ts
 * Module-level singleton — lives as long as the browser tab is open.
 * Survives React component mount/unmount cycles.
 * Loops keep running even when VolumeModal is closed.
 */

import type { VolumeSession, StoredWallet } from '@/hooks/storage';

// ── Types ─────────────────────────────────────────────────────────────────────
export interface SessionStats {
  tx: number;
  fees: number;
  startedAt: number;
}

type Listener = () => void;

// ── Module-level state (never reset by React) ─────────────────────────────────
const runningLoops  = new Set<string>();          // "sessionId:walletId"
const sessionStats  = new Map<string, SessionStats>();
const listeners     = new Set<Listener>();

// Persist stats so they survive modal close/reopen (but not page reload)
const STATS_KEY = 'vamp_volume_stats';

function loadStats() {
  try {
    const raw = sessionStorage.getItem(STATS_KEY);   // sessionStorage: tab-scoped
    if (raw) {
      const obj = JSON.parse(raw) as Record<string, SessionStats>;
      for (const [k, v] of Object.entries(obj)) sessionStats.set(k, v);
    }
  } catch {}
}

function saveStats() {
  try {
    const obj: Record<string, SessionStats> = {};
    sessionStats.forEach((v, k) => { obj[k] = v; });
    sessionStorage.setItem(STATS_KEY, JSON.stringify(obj));
  } catch {}
}

// Load on first import
if (typeof window !== 'undefined') loadStats();

function notify() { listeners.forEach(fn => fn()); }

function bumpStat(sessionId: string) {
  const cur = sessionStats.get(sessionId) || { tx: 0, fees: 0, startedAt: Date.now() };
  sessionStats.set(sessionId, { ...cur, tx: cur.tx + 1, fees: cur.fees + 0.00003 });
  saveStats();
  notify();
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const sleep = (ms: number) => new Promise<void>(r => setTimeout(r, ms));
const rand  = (a: number, b: number) => a + Math.random() * (b - a);

function parseRange(s: string): number {
  const clean = (s || '0.002').trim().replace(',', '.').replace('–', '-').replace('—', '-');
  if (clean.includes('-')) {
    const [a, b] = clean.split('-').map(Number);
    if (!isNaN(a) && !isNaN(b) && b > a) return rand(a, b);
    if (!isNaN(a)) return a;
  }
  const v = parseFloat(clean);
  return isNaN(v) ? 0.002 : v;
}

const DELAYS = {
  organic: { min: 30_000, max: 90_000 },
  fast:    { min: 5_000,  max: 20_000 },
  turbo:   { min: 2_000,  max: 5_000  },
};

async function walletLoop(
  sessionId:  string,
  wallet:     StoredWallet,
  ca:         string,
  preset:     keyof typeof DELAYS,
  buySolRange: string,
) {
  const key   = `${sessionId}:${wallet.id}`;
  const delay = DELAYS[preset] ?? DELAYS.organic;

  while (runningLoops.has(key)) {
    const buyAmt = parseRange(buySolRange);
    try {
      // BUY
      const buyRes = await fetch('/api/solana/trade', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          privateKey: wallet.privateKeyEncrypted,
          action: 'buy', mint: ca,
          amount: buyAmt, denominatedInSol: true,
        }),
      });
      if (buyRes.ok) bumpStat(sessionId);

      if (!runningLoops.has(key)) break;
      await sleep(rand(500, 1500));
      if (!runningLoops.has(key)) break;

      // SELL 100%
      const sellRes = await fetch('/api/solana/trade', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          privateKey: wallet.privateKeyEncrypted,
          action: 'sell', mint: ca,
          amount: '100%', denominatedInSol: false,
        }),
      });
      if (sellRes.ok) bumpStat(sessionId);

      if (!runningLoops.has(key)) break;
      await sleep(rand(delay.min, delay.max));
    } catch (err) {
      console.error(`[volume-engine] loop ${wallet.name}:`, err);
      if (!runningLoops.has(key)) break;
      await sleep(5_000);
    }
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

export function startLoops(session: VolumeSession, wallets: StoredWallet[]) {
  // Init stats if first time
  if (!sessionStats.has(session.id)) {
    sessionStats.set(session.id, { tx: 0, fees: 0, startedAt: Date.now() });
    saveStats();
  }
  wallets.forEach(wallet => {
    const key = `${session.id}:${wallet.id}`;
    if (runningLoops.has(key)) return; // already running
    runningLoops.add(key);
    walletLoop(session.id, wallet, session.ca, session.preset,
      session.buySolRange || String(session.buySolAmount));
  });
}

export function pauseLoops(sessionId: string, wallets: StoredWallet[]) {
  wallets.forEach(w => runningLoops.delete(`${sessionId}:${w.id}`));
}

export async function stopLoops(
  session: VolumeSession,
  wallets: StoredWallet[],
): Promise<void> {
  // Kill loops
  wallets.forEach(w => runningLoops.delete(`${session.id}:${w.id}`));
  await sleep(2000); // let in-flight trades finish

  // Sell all simultaneously
  await Promise.all(wallets.map(async wallet => {
    try {
      await fetch('/api/solana/trade', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          privateKey: wallet.privateKeyEncrypted,
          action: 'sell', mint: session.ca,
          amount: '100%', denominatedInSol: false,
        }),
      });
    } catch (e) { console.error('[volume-engine] stop-sell:', wallet.name, e); }
  }));

  // Cleanup stats
  sessionStats.delete(session.id);
  saveStats();
  notify();
}

export function getStats(sessionId: string): SessionStats {
  return sessionStats.get(sessionId) || { tx: 0, fees: 0, startedAt: Date.now() };
}

export function isLoopRunning(sessionId: string, walletId: string): boolean {
  return runningLoops.has(`${sessionId}:${walletId}`);
}

export function subscribe(fn: Listener)   { listeners.add(fn);    }
export function unsubscribe(fn: Listener) { listeners.delete(fn); }
