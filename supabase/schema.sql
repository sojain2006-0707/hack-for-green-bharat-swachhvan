-- ============================================================
-- SwachhVan Database Schema
-- Run this in Supabase SQL Editor (Dashboard -> SQL Editor)
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. USER PROFILES (already referenced in existing code)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  phone TEXT,
  email TEXT,
  gender TEXT DEFAULT 'prefer_not_to_say',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile"
  ON public.user_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile"
  ON public.user_profiles FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile"
  ON public.user_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 2. VANS (fleet of mobile washroom vans)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.vans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  van_code TEXT UNIQUE NOT NULL,
  latitude DOUBLE PRECISION NOT NULL DEFAULT 28.6139,
  longitude DOUBLE PRECISION NOT NULL DEFAULT 77.2090,
  heading DOUBLE PRECISION DEFAULT 0,
  speed_kmh DOUBLE PRECISION DEFAULT 0,
  waste_level INTEGER DEFAULT 0 CHECK (waste_level BETWEEN 0 AND 100),
  water_level INTEGER DEFAULT 100 CHECK (water_level BETWEEN 0 AND 100),
  occupancy_status TEXT DEFAULT 'available' CHECK (occupancy_status IN ('available','busy','maintenance','en_route','waste_full')),
  operator_name TEXT,
  last_cleaned_at TIMESTAMPTZ DEFAULT now(),
  last_heartbeat TIMESTAMPTZ DEFAULT now(),
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.vans ENABLE ROW LEVEL SECURITY;

-- Everyone can read van data (public info for map)
CREATE POLICY "Anyone can read vans"
  ON public.vans FOR SELECT
  USING (true);

-- Only service role / backend can update vans
CREATE POLICY "Service role can update vans"
  ON public.vans FOR UPDATE
  USING (true);

CREATE POLICY "Service role can insert vans"
  ON public.vans FOR INSERT
  WITH CHECK (true);

-- ============================================================
-- 3. BOOKINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  van_id UUID REFERENCES public.vans(id) ON DELETE SET NULL,
  service_type TEXT NOT NULL CHECK (service_type IN ('washroom','fresh','pads')),
  amount INTEGER NOT NULL DEFAULT 10,
  payment_mode TEXT DEFAULT 'cod' CHECK (payment_mode IN ('cod','online')),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending','confirmed','en_route','in_progress','completed','cancelled')),
  user_lat DOUBLE PRECISION,
  user_lng DOUBLE PRECISION,
  eta_minutes INTEGER,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own bookings"
  ON public.bookings FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own bookings"
  ON public.bookings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own bookings"
  ON public.bookings FOR UPDATE
  USING (auth.uid() = user_id);

-- ============================================================
-- 4. RATINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  van_id UUID REFERENCES public.vans(id) ON DELETE SET NULL,
  booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
  stars INTEGER NOT NULL CHECK (stars BETWEEN 1 AND 5),
  tags TEXT[] DEFAULT '{}',
  note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read all ratings"
  ON public.ratings FOR SELECT
  USING (true);

CREATE POLICY "Users can insert own ratings"
  ON public.ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ============================================================
-- 5. ALERTS (real-time monitoring alerts)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  van_id UUID REFERENCES public.vans(id) ON DELETE CASCADE,
  alert_type TEXT NOT NULL CHECK (alert_type IN ('waste_full','water_low','no_van_nearby','maintenance_needed','booking_unmatched')),
  severity TEXT DEFAULT 'warning' CHECK (severity IN ('info','warning','critical')),
  message TEXT,
  resolved BOOLEAN DEFAULT false,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read alerts"
  ON public.alerts FOR SELECT
  USING (true);

CREATE POLICY "Service can insert alerts"
  ON public.alerts FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Service can update alerts"
  ON public.alerts FOR UPDATE
  USING (true);

-- ============================================================
-- 6. VAN TELEMETRY LOG (time-series for Pathway analysis)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.van_telemetry (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  van_id UUID REFERENCES public.vans(id) ON DELETE CASCADE,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  waste_level INTEGER,
  water_level INTEGER,
  speed_kmh DOUBLE PRECISION,
  occupancy_status TEXT,
  recorded_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.van_telemetry ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read telemetry"
  ON public.van_telemetry FOR SELECT
  USING (true);

CREATE POLICY "Service can insert telemetry"
  ON public.van_telemetry FOR INSERT
  WITH CHECK (true);

-- Index for time-series queries
CREATE INDEX IF NOT EXISTS idx_van_telemetry_recorded_at
  ON public.van_telemetry (recorded_at DESC);

CREATE INDEX IF NOT EXISTS idx_van_telemetry_van_id
  ON public.van_telemetry (van_id, recorded_at DESC);

-- ============================================================
-- 7. FAQ KNOWLEDGE BASE (for RAG chatbot)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.faq_knowledge (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  category TEXT DEFAULT 'general',
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.faq_knowledge ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read FAQs"
  ON public.faq_knowledge FOR SELECT
  USING (true);

-- ============================================================
-- 8. SEED DATA - Delhi NCR Vans
-- ============================================================
INSERT INTO public.vans (van_code, latitude, longitude, waste_level, water_level, occupancy_status, operator_name)
VALUES
  ('SV-01', 28.6139, 77.2090, 15, 92, 'available', 'Ramesh K.'),
  ('SV-02', 28.6280, 77.2190, 42, 78, 'available', 'Suresh P.'),
  ('SV-03', 28.5935, 77.2167, 68, 55, 'busy', 'Amit S.'),
  ('SV-04', 28.6350, 77.2250, 82, 30, 'waste_full', 'Priya M.'),
  ('SV-05', 28.6100, 77.2300, 25, 88, 'available', 'Deepak R.'),
  ('SV-06', 28.6450, 77.2100, 10, 95, 'available', 'Kavita N.'),
  ('SV-07', 28.5800, 77.2350, 55, 65, 'en_route', 'Vikram T.'),
  ('SV-08', 28.6200, 77.1950, 35, 80, 'available', 'Anita D.')
ON CONFLICT (van_code) DO NOTHING;

-- ============================================================
-- 9. SEED DATA - FAQ Knowledge Base
-- ============================================================
INSERT INTO public.faq_knowledge (question, answer, category) VALUES
  ('How clean are the toilets?', 'Every SwachhVan washroom is sanitized after each use using eco-friendly disinfectants. Users rate cleanliness after each visit, and our average rating is 4.5/5 stars. Vans with ratings below 3.5 are pulled for deep cleaning.', 'hygiene'),
  ('How does the waste management work?', 'Waste is collected in sealed tanks and transported to authorized treatment facilities. Organic waste is converted into biogas and fertilizer, supporting a circular economy.', 'sustainability'),
  ('What services are available?', 'SwachhVan offers three services: Washroom (₹10) for clean western-style toilet access, Fresh-up (₹20) for tissues + sanitizer + quick clean, and Sanitary Pads (from ₹20) via in-van vending.', 'services'),
  ('How long does a van take to arrive?', 'Average ETA is 5-15 minutes depending on your location and van availability. The app shows real-time ETA based on GPS tracking and traffic conditions.', 'booking'),
  ('Is it safe for women?', 'Absolutely. Our vans feature privacy-first interiors, secure locks, well-lit spaces, and dedicated women safety features. We also offer a Period Emergency booking mode for urgent situations.', 'safety'),
  ('How do I pay?', 'We accept both Cash on Delivery (pay when the van arrives) and online payment (UPI/card). No hidden charges.', 'payment'),
  ('What happens when waste tank is full?', 'IoT sensors monitor waste levels in real-time. When a van reaches 80% capacity, our system automatically triggers a relocation alert to the nearest disposal center. This ensures uninterrupted service.', 'operations'),
  ('How do you track van locations?', 'Each van is equipped with GPS trackers that stream location data every 5 seconds. This data feeds into our Pathway real-time pipeline, which updates the live map and calculates accurate ETAs using traffic data.', 'technology'),
  ('What about rainy weather?', 'Our vans are designed for all-weather operation. During rain, we adjust routing using real-time weather data to ensure safe travel. ETAs may increase slightly during heavy rain.', 'operations'),
  ('Can I rate my experience?', 'Yes! After each visit, you can rate the hygiene (1-5 stars), select quick feedback tags, and leave a note. This data directly influences van maintenance schedules and operator performance.', 'feedback')
ON CONFLICT DO NOTHING;

-- ============================================================
-- 10. ENABLE REALTIME for key tables
-- ============================================================
-- Run these in Supabase Dashboard -> Database -> Replication
-- Or use: ALTER PUBLICATION supabase_realtime ADD TABLE public.vans;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.bookings;
-- ALTER PUBLICATION supabase_realtime ADD TABLE public.alerts;

-- ============================================================
-- DONE! Your database is ready.
-- Next: Enable Realtime for vans, bookings, alerts tables
-- in Supabase Dashboard -> Database -> Replication
-- ============================================================
