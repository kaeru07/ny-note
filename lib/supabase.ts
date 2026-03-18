"use client";

import { createClient } from "@supabase/supabase-js";

export function hasSupabaseEnv() {
  const hasUrl = process.env.NEXT_PUBLIC_SUPABASE_URL !== undefined;
  const hasAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY !== undefined;

  console.log("[supabase] URL exists:", hasUrl);
  console.log("[supabase] ANON KEY exists:", hasAnonKey);

  return hasUrl && hasAnonKey;
}

export function getSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
