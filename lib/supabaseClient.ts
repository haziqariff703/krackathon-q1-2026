import { createClient } from "@supabase/supabase-js";

// Centralized client to avoid scattered setup and keep auth consistent.
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Supabase environment variables are missing. Check .env.local.",
  );
}

export const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
