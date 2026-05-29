'use client';

import { useState, useEffect } from 'react';

// ─── Wallets ──────────────────────────────────────────────────────────────────
export interface StoredWallet {
  id: string;
  name: string;
  address: string;
  balance: number;
  type: 'dev' | 'volume';
  privateKeyEncrypted: string;
}

const WALLETS_KEY = 'vamp_wallets';

function readWallets(): StoredWallet[] {
  try { return JSON.parse(localStorage.getItem(WALLETS_KEY) || '[]'); } catch { return []; }
}

export function useWallets() {
  const [wallets, setWallets] = useState<StoredWallet[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setWallets(readWallets());
    setIsLoaded(true);

    // Listen for changes from other modal instances
    const onStorage = (e: StorageEvent) => {
      if (e.key === WALLETS_KEY) setWallets(readWallets());
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const save = (list: StoredWallet[]) => {
    setWallets(list);
    localStorage.setItem(WALLETS_KEY, JSON.stringify(list));
    // Notify other hook instances in the same tab
    window.dispatchEvent(new StorageEvent('storage', { key: WALLETS_KEY }));
  };

  return {
    wallets,
    isLoaded,
    // Always re-read from localStorage to avoid stale-state overwrites
    addWallet: (w: StoredWallet) => save([...readWallets(), w]),
    deleteWallet: (id: string) => save(readWallets().filter(w => w.id !== id)),
    updateWallet: (id: string, u: Partial<StoredWallet>) =>
      save(readWallets().map(w => w.id === id ? { ...w, ...u } : w)),
  };
}

// ─── Volume Sessions ──────────────────────────────────────────────────────────
export interface VolumeSession {
  id: string;
  ca: string;
  preset: 'organic' | 'fast' | 'turbo';
  status: 'running' | 'paused' | 'stopping';
  wallets: string[];
  createdAt: number;
  buySolAmount: number;   // kept for compat; actual range in buySolRange
  buySolRange: string;    // e.g. "0.1-0.5" or "0.05"
}

const SESSIONS_KEY = 'vamp_volume_sessions';
function readSessions(): VolumeSession[] {
  try { return JSON.parse(localStorage.getItem(SESSIONS_KEY) || '[]'); } catch { return []; }
}

export function useVolumeSessions() {
  const [sessions, setSessions] = useState<VolumeSession[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setSessions(readSessions());
    setIsLoaded(true);
  }, []);

  const save = (s: VolumeSession[]) => {
    setSessions(s);
    localStorage.setItem(SESSIONS_KEY, JSON.stringify(s));
  };

  return {
    sessions,
    isLoaded,
    addSession:    (s: VolumeSession)                      => save([...readSessions(), s]),
    deleteSession: (id: string)                            => save(readSessions().filter(s => s.id !== id)),
    updateSession: (id: string, u: Partial<VolumeSession>) =>
      save(readSessions().map(s => s.id === id ? { ...s, ...u } : s)),
  };
}

// ─── Portfolio ────────────────────────────────────────────────────────────────
export interface PortfolioToken {
  id: string;
  ca: string;
  name: string;
  symbol: string;
  launchPrice: number;
  currentPrice: number;
  bought: number;
  sold: number;
  profit: number;
  image?: string;
  launchedAt: number;
}

const PORTFOLIO_KEY = 'vamp_portfolio';
function readPortfolio(): PortfolioToken[] {
  try { return JSON.parse(localStorage.getItem(PORTFOLIO_KEY) || '[]'); } catch { return []; }
}

export function usePortfolio() {
  const [tokens, setTokens] = useState<PortfolioToken[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    setTokens(readPortfolio());
    setIsLoaded(true);
  }, []);

  const save = (t: PortfolioToken[]) => {
    setTokens(t);
    localStorage.setItem(PORTFOLIO_KEY, JSON.stringify(t));
  };

  return {
    tokens,
    isLoaded,
    addToken:    (t: PortfolioToken)                      => save([...readPortfolio(), t]),
    updateToken: (id: string, u: Partial<PortfolioToken>) =>
      save(readPortfolio().map(t => t.id === id ? { ...t, ...u } : t)),
    deleteToken: (id: string)                             => save(readPortfolio().filter(t => t.id !== id)),
  };
}
