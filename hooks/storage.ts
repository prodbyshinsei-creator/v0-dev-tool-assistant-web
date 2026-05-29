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

export function useWallets() {
  const [wallets, setWallets] = useState<StoredWallet[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('vamp_wallets');
      if (stored) setWallets(JSON.parse(stored));
    } catch {}
    setIsLoaded(true);
  }, []);

  const save = (w: StoredWallet[]) => {
    setWallets(w);
    localStorage.setItem('vamp_wallets', JSON.stringify(w));
  };

  return {
    wallets,
    isLoaded,
    addWallet:    (w: StoredWallet)                      => save([...wallets, w]),
    deleteWallet: (id: string)                           => save(wallets.filter(w => w.id !== id)),
    updateWallet: (id: string, u: Partial<StoredWallet>) => save(wallets.map(w => w.id === id ? { ...w, ...u } : w)),
  };
}

// ─── Volume Sessions ──────────────────────────────────────────────────────────
export interface VolumeSession {
  id: string;
  ca: string;
  preset: 'organic' | 'fast' | 'turbo';
  status: 'running' | 'paused' | 'stopping';
  wallets: string[]; // wallet ids
  createdAt: number;
  buySolAmount: number;
}

export function useVolumeSessions() {
  const [sessions, setSessions] = useState<VolumeSession[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('vamp_volume_sessions');
      if (stored) setSessions(JSON.parse(stored));
    } catch {}
    setIsLoaded(true);
  }, []);

  const save = (s: VolumeSession[]) => {
    setSessions(s);
    localStorage.setItem('vamp_volume_sessions', JSON.stringify(s));
  };

  return {
    sessions,
    isLoaded,
    addSession:    (s: VolumeSession)                      => save([...sessions, s]),
    deleteSession: (id: string)                            => save(sessions.filter(s => s.id !== id)),
    updateSession: (id: string, u: Partial<VolumeSession>) => save(sessions.map(s => s.id === id ? { ...s, ...u } : s)),
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

export function usePortfolio() {
  const [tokens, setTokens] = useState<PortfolioToken[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem('vamp_portfolio');
      if (stored) setTokens(JSON.parse(stored));
    } catch {}
    setIsLoaded(true);
  }, []);

  const save = (t: PortfolioToken[]) => {
    setTokens(t);
    localStorage.setItem('vamp_portfolio', JSON.stringify(t));
  };

  return {
    tokens,
    isLoaded,
    addToken:    (t: PortfolioToken)                      => save([...tokens, t]),
    updateToken: (id: string, u: Partial<PortfolioToken>) => save(tokens.map(t => t.id === id ? { ...t, ...u } : t)),
    deleteToken: (id: string)                             => save(tokens.filter(t => t.id !== id)),
  };
}
