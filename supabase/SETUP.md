# Supabase setup (SwachhVan)

## What you must have
- **Project URL** (looks like `https://<project-ref>.supabase.co`)
- **Anon public key** (NOT service role)

Put these in `.env` (project root):
- `VITE_SUPABASE_URL=...`
- `VITE_SUPABASE_ANON_KEY=...`
- `VITE_DEMO_AUTH=false`

Restart dev server after editing env.

## Step-by-step
1) Supabase Dashboard → **Project Settings → API**
   - Copy **Project URL**
   - Copy **anon public** key

2) Create the database tables + RLS
   - Supabase Dashboard → **SQL Editor**
   - Paste and run: `supabase/schema.sql`

3) Enable Email OTP auth
   - Authentication → Providers → **Email** enabled

4) Configure redirect URLs
   - Authentication → URL Configuration
   - Site URL: `http://localhost:<port>`
   - Redirect URLs: `http://localhost:<port>/*`

## Notes
- You do **not** create a separate "login database".
  Supabase Auth already stores users in `auth.users`.
- Your app-level "user database" is `public.user_profiles`.
- OTP logs table `public.otp_login_logs` is designed to be written by a server/Edge Function (safer).
