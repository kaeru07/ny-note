"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

let supabaseClient: SupabaseClient | null = null;

export function hasSupabaseEnv() {
  return Boolean(supabaseUrl && supabaseAnonKey);
}

export function getSupabaseClient() {
  if (!hasSupabaseEnv()) {
    throw new Error("Supabase environment variables are missing.");
  }

  if (supabaseClient) {
    return supabaseClient;
  }

  supabaseClient = createClient(supabaseUrl!, supabaseAnonKey!);
  return supabaseClient;
}
