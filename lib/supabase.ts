import { createClient } from '@supabase/supabase-js';

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// Client-side client (anon key)
export const supabase = createClient(URL, KEY);

// Server-side client (service role key — never expose to client)
export function supabaseAdmin() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY not set');
  return createClient(URL, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
