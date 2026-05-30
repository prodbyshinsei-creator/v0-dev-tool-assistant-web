'use client';
// Phase 2 wallet hook — syncs with backend API
// Falls back to localStorage if API unavailable
import { useState, useEffect, useCallback } from 'react';
import type { StoredWallet } from './storage';

const LS_KEY = 'vamp_wallets';

function fromLS(): StoredWallet[] {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '[]'); } catch { return []; }
}
function toLS(w: StoredWallet[]) {
  localStorage.setItem(LS_KEY, JSON.stringify(w));
  window.dispatchEvent(new StorageEvent('storage', { key: LS_KEY }));
}

export function useWalletsV2() {
  const [wallets, setWallets]     = useState<StoredWallet[]>([]);
  const [isLoaded, setIsLoaded]   = useState(false);
  const [useBackend, setUseBackend] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch('/api/wallets', { credentials: 'include' });
      if (r.ok) {
        const { wallets: serverWallets } = await r.json();
        setWallets(serverWallets);
        toLS(serverWallets); // keep localStorage in sync as cache
        setUseBackend(true);
      } else { throw new Error('Not authenticated'); }
    } catch {
      // Fallback to localStorage
      setWallets(fromLS());
      setUseBackend(false);
    }
    setIsLoaded(true);
  }, []);

  useEffect(() => {
    load();
    const onStorage = (e: StorageEvent) => { if (e.key === LS_KEY && !useBackend) setWallets(fromLS()); };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const addWallet = async (w: StoredWallet) => {
    if (useBackend) {
      const r = await fetch('/api/wallets', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, credentials: 'include',
        body: JSON.stringify({ name: w.name, address: w.address, privateKey: w.privateKeyEncrypted, type: w.type, connected: w.connected, adapterName: w.adapterName }),
      });
      if (r.ok) { const { id } = await r.json(); w = { ...w, id }; }
    }
    const updated = [...fromLS(), w];
    toLS(updated); setWallets(updated);
  };

  const deleteWallet = async (id: string) => {
    if (useBackend) {
      await fetch('/api/wallets', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ id }) });
    }
    const updated = fromLS().filter(w => w.id !== id);
    toLS(updated); setWallets(updated);
  };

  const updateWallet = async (id: string, upd: Partial<StoredWallet>) => {
    if (useBackend) {
      await fetch('/api/wallets', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, credentials: 'include', body: JSON.stringify({ id, ...upd }) });
    }
    const updated = fromLS().map(w => w.id === id ? { ...w, ...upd } : w);
    toLS(updated); setWallets(updated);
  };

  return { wallets, isLoaded, useBackend, load, addWallet, deleteWallet, updateWallet };
}
