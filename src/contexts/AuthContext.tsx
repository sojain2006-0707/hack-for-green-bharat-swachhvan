import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import * as auth from "@/lib/authService";

const DEMO_AUTH_ENABLED =
  String(import.meta.env.VITE_DEMO_AUTH ?? "").toLowerCase() === "true";
const DEMO_EMAIL = String(import.meta.env.VITE_DEMO_EMAIL ?? "demo@local.test");
const DEMO_PASSWORD = String(import.meta.env.VITE_DEMO_PASSWORD ?? "demo1234");
const DEMO_STORAGE_KEY = "demoAuth.email";
const DEMO_PROFILE_KEY = "demoProfile";
const DEMO_OTP_EMAIL_KEY = "demoOtp.email";
const DEMO_OTP_CODE_KEY = "demoOtp.code";
const DEMO_OTP_CODE_FALLBACK = "123456";

function readDemoProfile(): { full_name?: string; phone?: string } {
  try {
    const raw = localStorage.getItem(DEMO_PROFILE_KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw) as { full_name?: string; phone?: string };
    return {
      full_name: typeof parsed.full_name === "string" ? parsed.full_name : undefined,
      phone: typeof parsed.phone === "string" ? parsed.phone : undefined,
    };
  } catch {
    return {};
  }
}

function writeDemoProfile(next: { full_name?: string; phone?: string }) {
  try {
    localStorage.setItem(DEMO_PROFILE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

function createDemoSession(email: string): Session {
  const demoProfile = readDemoProfile();
  const user =
    {
      id: "demo-user",
      email,
      user_metadata: demoProfile,
    } as unknown as User;
  return { user } as unknown as Session;
}

type AuthContextValue = {
  loading: boolean;
  session: Session | null;
  user: User | null;

  signUp: (email: string, password: string) => Promise<void>;
  signIn: (email: string, password: string) => Promise<void>;
  magicLink: (email: string, redirectTo: string) => Promise<void>;
  requestEmailOtp: (email: string) => Promise<void>;
  verifyEmailOtp: (email: string, token: string) => Promise<void>;
  resetPasswordEmail: (email: string, redirectTo: string) => Promise<void>;
  updatePassword: (newPassword: string) => Promise<void>;
  updateProfile: (data: { fullName?: string; phone?: string }) => Promise<void>;
  updateEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    let mounted = true;

    if (!isSupabaseConfigured) {
      if (DEMO_AUTH_ENABLED) {
        const storedEmail = localStorage.getItem(DEMO_STORAGE_KEY);
        if (storedEmail) {
          setSession(createDemoSession(storedEmail));
        } else {
          setSession(null);
        }
      } else {
        setSession(null);
      }
      setLoading(false);
      return () => {
        mounted = false;
      };
    }

    (async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!mounted) return;
      if (error) {
        // Still allow app to render; user can retry login.
        setSession(null);
        setLoading(false);
        return;
      }
      setSession(data.session ?? null);
      setLoading(false);
    })();

    const { data: sub } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      loading,
      session,
      user: session?.user ?? null,

      signUp: async (email, password) => {
        if (!isSupabaseConfigured) {
          if (!DEMO_AUTH_ENABLED) {
            throw new Error("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.");
          }
          const normalizedEmail = email.trim();
          if (normalizedEmail.toLowerCase() !== DEMO_EMAIL.toLowerCase() || password !== DEMO_PASSWORD) {
            throw new Error(`Invalid demo credentials. Use ${DEMO_EMAIL} / ${DEMO_PASSWORD}.`);
          }
          localStorage.setItem(DEMO_STORAGE_KEY, normalizedEmail);
          setSession(createDemoSession(normalizedEmail));
          setLoading(false);
          return;
        }
        await auth.signUpWithEmailPassword(email, password);
      },
      signIn: async (email, password) => {
        if (!isSupabaseConfigured) {
          if (!DEMO_AUTH_ENABLED) {
            throw new Error("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.");
          }
          const normalizedEmail = email.trim();
          if (normalizedEmail.toLowerCase() !== DEMO_EMAIL.toLowerCase() || password !== DEMO_PASSWORD) {
            throw new Error(`Invalid demo credentials. Use ${DEMO_EMAIL} / ${DEMO_PASSWORD}.`);
          }
          localStorage.setItem(DEMO_STORAGE_KEY, normalizedEmail);
          setSession(createDemoSession(normalizedEmail));
          setLoading(false);
          return;
        }

        // Supabase IS configured — try real sign in first
        try {
          await auth.signInWithEmailPassword(email, password);
        } catch (realErr) {
          // If demo mode is on, try demo credentials as fallback
          if (!DEMO_AUTH_ENABLED) throw realErr;
          const normalizedEmail = email.trim();
          if (normalizedEmail.toLowerCase() !== DEMO_EMAIL.toLowerCase() || password !== DEMO_PASSWORD) {
            throw realErr; // Not demo credentials either, surface original error
          }
          localStorage.setItem(DEMO_STORAGE_KEY, normalizedEmail);
          setSession(createDemoSession(normalizedEmail));
          setLoading(false);
        }
      },
      magicLink: async (email, redirectTo) => {
        if (!isSupabaseConfigured) {
          throw new Error(
            DEMO_AUTH_ENABLED
              ? "Magic link is not available in demo mode."
              : "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.",
          );
        }
        await auth.signInWithMagicLink(email, redirectTo);
      },

      requestEmailOtp: async (email) => {
        const normalizedEmail = email.trim();
        if (!normalizedEmail) throw new Error("Email is required.");

        // Always store demo OTP when demo auth is enabled (works as fallback)
        if (DEMO_AUTH_ENABLED) {
          try {
            localStorage.setItem(DEMO_OTP_EMAIL_KEY, normalizedEmail);
            localStorage.setItem(DEMO_OTP_CODE_KEY, DEMO_OTP_CODE_FALLBACK);
          } catch {
            // ignore
          }
        }

        if (!isSupabaseConfigured) {
          if (!DEMO_AUTH_ENABLED) {
            throw new Error("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.");
          }
          // Demo-only mode: OTP stored above, no real email sent
          return;
        }

        // Try real Supabase OTP (sends email). If it fails and demo is on, we still have the demo code.
        try {
          await auth.requestEmailOtp(normalizedEmail);
        } catch (err) {
          if (!DEMO_AUTH_ENABLED) throw err;
          // Swallow error in demo mode — user can use demo code 123456
          console.warn("[Auth] Supabase OTP failed, demo OTP available:", err);
        }
      },

      verifyEmailOtp: async (email, token) => {
        const normalizedEmail = email.trim();
        const normalizedToken = token.trim();
        if (!normalizedEmail) throw new Error("Email is required.");
        if (!normalizedToken) throw new Error("OTP is required.");

        // When Supabase IS configured, try real verification first
        if (isSupabaseConfigured) {
          try {
            await auth.verifyEmailOtp(normalizedEmail, normalizedToken);
            return; // Real OTP worked
          } catch (realErr) {
            // If demo mode is on, fall through to demo OTP check
            if (!DEMO_AUTH_ENABLED) throw realErr;
            console.warn("[Auth] Real OTP failed, trying demo code:", realErr);
          }
        }

        // Demo OTP verification (also used as fallback when real OTP fails)
        if (!DEMO_AUTH_ENABLED) {
          throw new Error("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.");
        }
        let expectedEmail: string | null = null;
        let expectedCode: string | null = null;
        try {
          expectedEmail = localStorage.getItem(DEMO_OTP_EMAIL_KEY);
          expectedCode = localStorage.getItem(DEMO_OTP_CODE_KEY);
        } catch {
            // ignore
          }
          if (!expectedEmail || expectedEmail.toLowerCase() !== normalizedEmail.toLowerCase()) {
            throw new Error("Please request a new OTP.");
          }
          if (!expectedCode || normalizedToken !== expectedCode) {
            throw new Error(`Invalid OTP. Use ${DEMO_OTP_CODE_FALLBACK} in demo mode.`);
          }
          try {
            localStorage.setItem(DEMO_STORAGE_KEY, normalizedEmail);
            localStorage.removeItem(DEMO_OTP_EMAIL_KEY);
            localStorage.removeItem(DEMO_OTP_CODE_KEY);
          } catch {
            // ignore
          }
          setSession(createDemoSession(normalizedEmail));
          setLoading(false);
          return;
      },
      resetPasswordEmail: async (email, redirectTo) => {
        if (!isSupabaseConfigured) {
          throw new Error(
            DEMO_AUTH_ENABLED
              ? "Password reset is not available in demo mode."
              : "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.",
          );
        }
        await auth.sendPasswordReset(email, redirectTo);
      },
      updatePassword: async (newPassword) => {
        if (!isSupabaseConfigured) {
          throw new Error(
            DEMO_AUTH_ENABLED
              ? "Password update is not available in demo mode."
              : "Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.",
          );
        }
        await auth.updatePassword(newPassword);
      },

      updateProfile: async ({ fullName, phone }) => {
        const nextFullName = typeof fullName === "string" ? fullName.trim() : "";
        const nextPhone = typeof phone === "string" ? phone.trim() : "";

        if (!isSupabaseConfigured) {
          if (!DEMO_AUTH_ENABLED) {
            throw new Error("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.");
          }

          const currentEmail = session?.user?.email ?? localStorage.getItem(DEMO_STORAGE_KEY) ?? DEMO_EMAIL;
          writeDemoProfile({
            full_name: nextFullName || undefined,
            phone: nextPhone || undefined,
          });
          setSession(createDemoSession(currentEmail));
          setLoading(false);
          return;
        }

        await auth.updateUserProfile({
          full_name: nextFullName || undefined,
          phone: nextPhone || undefined,
        });

        const { data } = await supabase.auth.getSession();
        setSession(data.session ?? null);
        setLoading(false);
      },

      updateEmail: async (email) => {
        const normalizedEmail = email.trim();
        if (!normalizedEmail) throw new Error("Email is required.");

        if (!isSupabaseConfigured) {
          if (!DEMO_AUTH_ENABLED) {
            throw new Error("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.");
          }
          localStorage.setItem(DEMO_STORAGE_KEY, normalizedEmail);
          setSession(createDemoSession(normalizedEmail));
          setLoading(false);
          return;
        }

        await auth.updateUserEmail(normalizedEmail);
        const { data } = await supabase.auth.getSession();
        setSession(data.session ?? null);
        setLoading(false);
      },

      signOut: async () => {
        // Always clear demo state when signing out
        if (DEMO_AUTH_ENABLED) {
          try {
            localStorage.removeItem(DEMO_STORAGE_KEY);
            localStorage.removeItem(DEMO_PROFILE_KEY);
            localStorage.removeItem(DEMO_OTP_EMAIL_KEY);
            localStorage.removeItem(DEMO_OTP_CODE_KEY);
          } catch {
            // ignore
          }
        }

        if (!isSupabaseConfigured) {
          if (DEMO_AUTH_ENABLED) {
            setSession(null);
            setLoading(false);
            return;
          }
          throw new Error("Supabase is not configured. Set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env.");
        }

        // If user was a demo user, just clear session
        if (session?.user?.id === "demo-user") {
          setSession(null);
          setLoading(false);
          return;
        }

        await auth.signOut();
      },
    }),
    [loading, session],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
