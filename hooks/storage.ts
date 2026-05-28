'use client';

import { useState, useEffect } from 'react';

// Wallets Storage
export interface StoredWallet {
  id: string;
  name: string;
  address: string;
  balance: number;
  type: 'dev' | 'volume';
  privateKeyEncrypted: string; // We'll store encrypted
}

export function useWallets() {
  const [wallets, setWallets] = useState<StoredWallet[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('vamp_wallets');
    if (stored) {
      try {
        setWallets(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse wallets:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  const addWallet = (wallet: StoredWallet) => {
    const updated = [...wallets, wallet];
    setWallets(updated);
    localStorage.setItem('vamp_wallets', JSON.stringify(updated));
  };

  const deleteWallet = (id: string) => {
    const updated = wallets.filter(w => w.id !== id);
    setWallets(updated);
    localStorage.setItem('vamp_wallets', JSON.stringify(updated));
  };

  const updateWallet = (id: string, updates: Partial<StoredWallet>) => {
    const updated = wallets.map(w => w.id === id ? { ...w, ...updates } : w);
    setWallets(updated);
    localStorage.setItem('vamp_wallets', JSON.stringify(updated));
  };

  return { wallets, addWallet, deleteWallet, updateWallet, isLoaded };
}

// Volume Sessions Storage
export interface VolumeSession {
  id: string;
  ca: string;
  preset: 'organic' | 'fast' | 'turbo';
  status: 'running' | 'paused';
  wallets: string[];
  createdAt: number;
}

export function useVolumeSessions() {
  const [sessions, setSessions] = useState<VolumeSession[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('vamp_volume_sessions');
    if (stored) {
      try {
        setSessions(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse sessions:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  const addSession = (session: VolumeSession) => {
    const updated = [...sessions, session];
    setSessions(updated);
    localStorage.setItem('vamp_volume_sessions', JSON.stringify(updated));
  };

  const updateSession = (id: string, updates: Partial<VolumeSession>) => {
    const updated = sessions.map(s => s.id === id ? { ...s, ...updates } : s);
    setSessions(updated);
    localStorage.setItem('vamp_volume_sessions', JSON.stringify(updated));
  };

  const deleteSession = (id: string) => {
    const updated = sessions.filter(s => s.id !== id);
    setSessions(updated);
    localStorage.setItem('vamp_volume_sessions', JSON.stringify(updated));
  };

  return { sessions, addSession, updateSession, deleteSession, isLoaded };
}

// Portfolio (Launched Tokens)
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
    const stored = localStorage.getItem('vamp_portfolio');
    if (stored) {
      try {
        setTokens(JSON.parse(stored));
      } catch (e) {
        console.error('Failed to parse portfolio:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  const addToken = (token: PortfolioToken) => {
    const updated = [...tokens, token];
    setTokens(updated);
    localStorage.setItem('vamp_portfolio', JSON.stringify(updated));
  };

  const updateToken = (id: string, updates: Partial<PortfolioToken>) => {
    const updated = tokens.map(t => t.id === id ? { ...t, ...updates } : t);
    setTokens(updated);
    localStorage.setItem('vamp_portfolio', JSON.stringify(updated));
  };

  return { tokens, addToken, updateToken, isLoaded };
}
