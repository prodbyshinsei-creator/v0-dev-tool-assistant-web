// AES-256-GCM encryption for private keys
// Node.js built-in crypto — no extra deps
import { createCipheriv, createDecipheriv, randomBytes, createHash } from 'crypto';

const ALGO = 'aes-256-gcm';

// Derive 32-byte key from server secret + user ID
function deriveKey(userId: string): Buffer {
  const secret = process.env.ENCRYPTION_SECRET || 'vexor-default-secret-change-in-prod-32b';
  return createHash('sha256').update(secret + ':' + userId).digest();
}

export interface Encrypted {
  ciphertext: string;  // base64
  iv:         string;  // base64, 12 bytes
  authTag:    string;  // base64, 16 bytes
}

export function encrypt(plaintext: string, userId: string): Encrypted {
  const key = deriveKey(userId);
  const iv  = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  return {
    ciphertext: enc.toString('base64'),
    iv:         iv.toString('base64'),
    authTag:    cipher.getAuthTag().toString('base64'),
  };
}

export function decrypt(enc: Encrypted, userId: string): string {
  const key     = deriveKey(userId);
  const iv      = Buffer.from(enc.iv,      'base64');
  const authTag = Buffer.from(enc.authTag, 'base64');
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(authTag);
  const dec = Buffer.concat([
    decipher.update(Buffer.from(enc.ciphertext, 'base64')),
    decipher.final(),
  ]);
  return dec.toString('utf8');
}
