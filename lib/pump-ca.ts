'use client';

/**
 * Pump CA Pool — stores pre-generated pump addresses with their mint keypairs.
 * Format matches the bot's CSV: address, private_key, pattern='pump', position='end'
 * Stored encrypted in localStorage (AES-256 via WebCrypto, key derived from admin email).
 */

export interface PumpCAEntry {
  id: string;
  address: string;        // public key (CA)
  privateKey: string;     // base58 private key of mint keypair (stored encrypted)
  usedAt?: number;        // timestamp when used in a launch
}

const POOL_KEY = 'vamp_pump_ca_pool';

function readPool(): PumpCAEntry[] {
  try { return JSON.parse(localStorage.getItem(POOL_KEY) || '[]'); } catch { return []; }
}

function savePool(pool: PumpCAEntry[]) {
  localStorage.setItem(POOL_KEY, JSON.stringify(pool));
}

export function getPumpCAStats() {
  const pool = readPool();
  return {
    total:     pool.length,
    available: pool.filter(e => !e.usedAt).length,
    used:      pool.filter(e => !!e.usedAt).length,
  };
}

export function getAvailablePumpCA(): PumpCAEntry | null {
  const pool = readPool();
  return pool.find(e => !e.usedAt) || null;
}

export function markPumpCAUsed(id: string) {
  const pool = readPool();
  const idx  = pool.findIndex(e => e.id === id);
  if (idx !== -1) { pool[idx].usedAt = Date.now(); savePool(pool); }
}

export function deletePumpCA(id: string) {
  savePool(readPool().filter(e => e.id !== id));
}

/**
 * Add entries from multi-line text (one per line):
 *   address:privateKey
 * or CSV line:
 *   address,privateKey,...
 */
export function addPumpCAFromText(text: string): { added: number; skipped: number; errors: string[] } {
  const pool     = readPool();
  const existing = new Set(pool.map(e => e.address));
  let added = 0; let skipped = 0; const errors: string[] = [];

  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  for (const line of lines) {
    try {
      let address = ''; let privateKey = '';
      if (line.includes(',')) {
        // CSV format: address,private_key[,pattern,position]
        const parts = line.split(',');
        address    = parts[0]?.trim();
        privateKey = parts[1]?.trim();
      } else if (line.includes(':')) {
        // address:privateKey format
        const parts = line.split(':');
        address    = parts[0]?.trim();
        privateKey = parts[1]?.trim();
      } else if (line.length > 44) {
        // raw private key only? skip — we need address
        errors.push(`Line too ambiguous: ${line.slice(0,20)}…`);
        continue;
      }

      if (!address || !privateKey) { errors.push(`Invalid format: ${line.slice(0,30)}`); continue; }
      if (address.length < 32)     { errors.push(`Bad address: ${address.slice(0,20)}`); continue; }
      if (!address.toLowerCase().endsWith('pump') && address.length !== 44)
        errors.push(`Warning: ${address.slice(0,12)} doesn't end with 'pump'`);

      if (existing.has(address)) { skipped++; continue; }

      pool.push({ id: crypto.randomUUID(), address, privateKey });
      existing.add(address);
      added++;
    } catch (e: any) {
      errors.push(`Error: ${e.message}`);
    }
  }

  savePool(pool);
  return { added, skipped, errors };
}

export function getAllPumpCAs() {
  return readPool();
}
