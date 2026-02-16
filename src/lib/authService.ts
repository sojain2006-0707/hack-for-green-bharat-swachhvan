import { isSupabaseConfigured, supabase } from "./supabaseClient";

function ensureSupabaseConfigured() {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.");
  }
}

export async function signUpWithEmailPassword(email: string, password: string) {
  ensureSupabaseConfigured();
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) throw error;
  return data;
}

export async function signInWithEmailPassword(email: string, password: string) {
  ensureSupabaseConfigured();
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
  return data;
}

export async function signInWithMagicLink(email: string, redirectTo: string) {
  ensureSupabaseConfigured();
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: redirectTo,
    },
  });
  if (error) throw error;
  return data;
}

export async function requestEmailOtp(email: string) {
  ensureSupabaseConfigured();
  const { data, error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      shouldCreateUser: true,
    },
  });
  if (error) throw error;
  return data;
}

export async function verifyEmailOtp(email: string, token: string) {
  ensureSupabaseConfigured();
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: "email",
  });
  if (error) throw error;
  return data;
}

export async function sendPasswordReset(email: string, redirectTo: string) {
  ensureSupabaseConfigured();
  const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  });
  if (error) throw error;
  return data;
}

export async function updatePassword(newPassword: string) {
  ensureSupabaseConfigured();
  const { data, error } = await supabase.auth.updateUser({ password: newPassword });
  if (error) throw error;
  return data;
}

export async function updateUserProfile(data: { full_name?: string; phone?: string }) {
  ensureSupabaseConfigured();
  const { data: res, error } = await supabase.auth.updateUser({
    data,
  });
  if (error) throw error;
  return res;
}

export async function updateUserEmail(email: string) {
  ensureSupabaseConfigured();
  const { data, error } = await supabase.auth.updateUser({ email });
  if (error) throw error;
  return data;
}

export async function signOut() {
  ensureSupabaseConfigured();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}
