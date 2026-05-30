-- VEXOR Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users table
CREATE TABLE IF NOT EXISTS users (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email         TEXT UNIQUE,
  password_hash TEXT,
  wallet_address TEXT UNIQUE,
  auth_method   TEXT DEFAULT 'email',  -- 'email' | 'phantom' | 'solflare'
  is_admin      BOOLEAN DEFAULT FALSE,
  banned        BOOLEAN DEFAULT FALSE,
  banned_at     TIMESTAMPTZ,
  banned_reason TEXT,
  last_login    TIMESTAMPTZ,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Sessions table
CREATE TABLE IF NOT EXISTS sessions (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  token      TEXT NOT NULL UNIQUE,
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(token);
CREATE INDEX IF NOT EXISTS idx_sessions_user  ON sessions(user_id);

-- Wallets table (private keys AES-256-GCM encrypted)
CREATE TABLE IF NOT EXISTS wallets (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name                  TEXT NOT NULL,
  address               TEXT NOT NULL,
  private_key_encrypted TEXT,   -- AES-256-GCM ciphertext (empty for adapter wallets)
  iv                    TEXT,   -- base64 IV for AES
  auth_tag              TEXT,   -- base64 auth tag for GCM
  type                  TEXT NOT NULL DEFAULT 'dev',  -- 'dev' | 'volume'
  balance               NUMERIC DEFAULT 0,
  connected             BOOLEAN DEFAULT FALSE,
  adapter_name          TEXT,   -- 'Phantom' | 'Solflare'
  created_at            TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_wallets_user ON wallets(user_id);

-- Pump CA pool
CREATE TABLE IF NOT EXISTS pump_ca_pool (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  address     TEXT NOT NULL,
  private_key TEXT NOT NULL,
  used        BOOLEAN DEFAULT FALSE,
  used_at     TIMESTAMPTZ,
  added_by    UUID REFERENCES users(id),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Portfolio tokens
CREATE TABLE IF NOT EXISTS portfolio_tokens (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ca            TEXT NOT NULL,
  name          TEXT,
  symbol        TEXT,
  image         TEXT,
  launch_price  NUMERIC DEFAULT 0,
  current_price NUMERIC DEFAULT 0,
  bought        NUMERIC DEFAULT 0,
  sold          NUMERIC DEFAULT 0,
  profit        NUMERIC DEFAULT 0,
  launched_at   TIMESTAMPTZ DEFAULT NOW(),
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- Trade history
CREATE TABLE IF NOT EXISTS trades (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ca             TEXT NOT NULL,
  token_symbol   TEXT,
  token_name     TEXT,
  token_image    TEXT,
  action         TEXT NOT NULL,  -- 'buy' | 'sell'
  amount_sol     NUMERIC DEFAULT 0,
  price_usd      NUMERIC DEFAULT 0,
  signature      TEXT,
  wallet_name    TEXT,
  wallet_address TEXT,
  timestamp      TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_trades_user ON trades(user_id);
CREATE INDEX IF NOT EXISTS idx_trades_ca   ON trades(ca);

-- Seed admin user (run manually after setup)
-- INSERT INTO users (email, is_admin) VALUES ('prod.by.shinsei@gmail.com', TRUE);

-- Row Level Security (optional, enable for extra safety)
-- ALTER TABLE wallets ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY wallets_own ON wallets USING (user_id = auth.uid());
