import { createClient } from "@supabase/supabase-js";

function normalizeEnv(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

const supabaseUrl = normalizeEnv(import.meta.env.VITE_SUPABASE_URL);
const supabaseAnonKey = normalizeEnv(import.meta.env.VITE_SUPABASE_ANON_KEY);

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseAnonKey);

// Do not crash the whole UI if env vars are missing or blank.
// Instead, we keep a placeholder client and let the UI show a configuration message.
const safeUrl = supabaseUrl ?? "http://localhost";
const safeAnonKey = supabaseAnonKey ?? "missing-anon-key";

export const supabase = createClient(safeUrl, safeAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true, // needed for magic link + reset links
  },
});
