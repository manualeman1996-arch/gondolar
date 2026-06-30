"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * Browser Supabase client (uses the public anon key).
 * Safe for both the anonymous shopper app and the authenticated admin app —
 * Row Level Security enforces what each role can read/write.
 */
export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  );
}
