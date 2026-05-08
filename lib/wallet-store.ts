'use client';

import { useState, useEffect, useCallback } from 'react';

export interface BurnerWallet {
  id: string;
  label: string;
  address: string;
  privateKey: string;
  balance: number;
  createdAt: number;
}

const STORAGE_KEY = 'devtool_wallets';

// Generate a fake Solana keypair (for UI demo purposes)
function generateFakeKeypair(): { address: string; privateKey: string } {
  const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
  let address = '';
  let privateKey = '';
  
  for (let i = 0; i < 44; i++) {
    address += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  // Private key is base58 encoded, typically 64-88 chars
  for (let i = 0; i < 88; i++) {
    privateKey += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  
  return { address, privateKey };
}

// Load wallets from localStorage
function loadWallets(): BurnerWallet[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (e) {
    console.error('Failed to load wallets:', e);
  }
  
  return [];
}

// Save wallets to localStorage
function saveWallets(wallets: BurnerWallet[]): void {
  if (typeof window === 'undefined') return;
  
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(wallets));
  } catch (e) {
    console.error('Failed to save wallets:', e);
  }
}

// Custom hook for wallet management
export function useWalletStore() {
  const [wallets, setWallets] = useState<BurnerWallet[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const loaded = loadWallets();
    setWallets(loaded);
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever wallets change
  useEffect(() => {
    if (isLoaded) {
      saveWallets(wallets);
    }
  }, [wallets, isLoaded]);

  // Generate a new wallet
  const generateWallet = useCallback((label: string): BurnerWallet => {
    const { address, privateKey } = generateFakeKeypair();
    const newWallet: BurnerWallet = {
      id: `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      label,
      address,
      privateKey,
      balance: 0,
      createdAt: Date.now(),
    };
    
    setWallets((prev) => [...prev, newWallet]);
    return newWallet;
  }, []);

  // Import wallet from private key
  const importWallet = useCallback((label: string, privateKey: string): BurnerWallet | null => {
    // Validate private key format (basic check)
    if (privateKey.length < 32) {
      return null;
    }
    
    // Generate fake address from private key (in real app, derive from key)
    const chars = '123456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz';
    let address = '';
    for (let i = 0; i < 44; i++) {
      const seed = privateKey.charCodeAt(i % privateKey.length) + i;
      address += chars.charAt(seed % chars.length);
    }
    
    const newWallet: BurnerWallet = {
      id: `wallet_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      label,
      address,
      privateKey,
      balance: Math.random() * 5, // Fake balance
      createdAt: Date.now(),
    };
    
    setWallets((prev) => [...prev, newWallet]);
    return newWallet;
  }, []);

  // Update wallet label
  const updateLabel = useCallback((id: string, label: string): void => {
    setWallets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, label } : w))
    );
  }, []);

  // Delete wallet
  const deleteWallet = useCallback((id: string): void => {
    setWallets((prev) => prev.filter((w) => w.id !== id));
  }, []);

  // Get wallet by ID
  const getWallet = useCallback((id: string): BurnerWallet | undefined => {
    return wallets.find((w) => w.id === id);
  }, [wallets]);

  // Update balance (for demo purposes)
  const updateBalance = useCallback((id: string, balance: number): void => {
    setWallets((prev) =>
      prev.map((w) => (w.id === id ? { ...w, balance } : w))
    );
  }, []);

  return {
    wallets,
    isLoaded,
    generateWallet,
    importWallet,
    updateLabel,
    deleteWallet,
    getWallet,
    updateBalance,
  };
}

// Helper functions
export function shortenAddress(address: string): string {
  if (!address) return '';
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

export function shortenPrivateKey(key: string): string {
  if (!key) return '';
  return `${key.slice(0, 8)}...${key.slice(-8)}`;
}
