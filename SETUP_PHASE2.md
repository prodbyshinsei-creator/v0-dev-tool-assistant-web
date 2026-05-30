# Phase 2 Setup Guide

## 1. Create Supabase Project

1. Go to https://supabase.com and create a free account
2. Create new project (choose region closest to users)
3. Wait for project to initialize (~2 min)

## 2. Run Database Schema

1. Go to **SQL Editor** in Supabase dashboard
2. Paste contents of `migrations/001_schema.sql`
3. Click **Run**
4. Then run: `INSERT INTO users (email, is_admin) VALUES ('prod.by.shinsei@gmail.com', TRUE);`

## 3. Get API Keys

In Supabase dashboard → **Project Settings** → **API**:
- `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
- `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `service_role` key → `SUPABASE_SERVICE_ROLE_KEY` (never expose to client!)

## 4. Set Environment Variables in Vercel

Go to https://vercel.com → your project → **Settings** → **Environment Variables**

Add these:
```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...
ENCRYPTION_SECRET=your-random-32+-char-secret-string-here
```

For `ENCRYPTION_SECRET` — generate a random string:
```bash
openssl rand -base64 32
```

## 5. Install Dependencies

These are already in package.json after this commit:
- `@supabase/supabase-js` — Supabase client
- `bcryptjs` — password hashing
- `@types/bcryptjs` — types

## 6. Redeploy

Vercel will auto-redeploy when env vars are set. Or trigger manually.

## 7. Migrate Existing Users

Existing localStorage users won't be in the DB. They'll need to re-register once.
Their wallets will need to be re-imported (private keys are in their browser localStorage).

## Security Notes

- Private keys are encrypted with **AES-256-GCM** before storing in DB
- Encryption key = `ENCRYPTION_SECRET + userId` (per-user derivation)
- Passwords hashed with **bcrypt** cost factor 12
- Sessions stored in DB with 30-day TTL, httpOnly cookies
- Service role key never leaves the server
