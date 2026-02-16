/**
 * Van Service - Real-time van data operations via Supabase
 * Handles fetching, subscribing, and managing van fleet data
 */

import { supabase, isSupabaseConfigured } from "./supabaseClient";

// ── Types ──────────────────────────────────────────────

export interface Van {
  id: string;
  van_code: string;
  latitude: number;
  longitude: number;
  heading: number;
  speed_kmh: number;
  waste_level: number;
  water_level: number;
  occupancy_status: "available" | "busy" | "maintenance" | "en_route" | "waste_full";
  operator_name: string | null;
  last_cleaned_at: string;
  last_heartbeat: string;
  // Convenience aliases / extras
  /** Alias for occupancy_status */
  status: "available" | "busy" | "maintenance" | "en_route" | "waste_full";
  /** Display name (= van_code) */
  name: string;
  /** Operating zone label */
  zone: string;
  /** Whether the van carries feminine hygiene products */
  has_feminine_hygiene: boolean;
}

export interface VanAlert {
  id: string;
  van_id: string;
  alert_type: "waste_full" | "water_low" | "no_van_nearby" | "maintenance_needed" | "booking_unmatched";
  severity: "info" | "warning" | "critical";
  message: string;
  resolved: boolean;
  created_at: string;
}

export interface Booking {
  id: string;
  user_id: string;
  van_id: string | null;
  service_type: "washroom" | "fresh" | "pads";
  amount: number;
  payment_mode: "cod" | "online";
  status: "pending" | "confirmed" | "en_route" | "in_progress" | "completed" | "cancelled";
  user_lat: number | null;
  user_lng: number | null;
  eta_minutes: number | null;
  created_at: string;
}

export interface Rating {
  id: string;
  user_id: string;
  van_id: string | null;
  booking_id: string | null;
  stars: number;
  tags: string[];
  note: string | null;
  created_at: string;
}

// ── Mock Data (fallback when Supabase not configured) ──

const DELHI_CENTER = { lat: 28.6139, lng: 77.2090 };

const DELHI_ZONES = ["Connaught Place", "Chandni Chowk", "Karol Bagh", "Saket", "Lajpat Nagar", "Dwarka", "Rohini", "Nehru Place"];

function mkVan(
  id: string, code: string, lat: number, lng: number, heading: number, speed: number,
  waste: number, water: number, status: Van["occupancy_status"], operator: string,
  zoneIdx: number, feminine: boolean
): Van {
  const now = new Date().toISOString();
  return {
    id, van_code: code, latitude: lat, longitude: lng, heading, speed_kmh: speed,
    waste_level: waste, water_level: water, occupancy_status: status,
    operator_name: operator, last_cleaned_at: now, last_heartbeat: now,
    status, name: code, zone: DELHI_ZONES[zoneIdx] ?? "Delhi NCR", has_feminine_hygiene: feminine,
  };
}

const MOCK_VANS: Van[] = [
  mkVan("mock-1", "SV-01", 28.6139, 77.2090, 45, 15, 15, 92, "available", "Ramesh K.", 0, true),
  mkVan("mock-2", "SV-02", 28.6280, 77.2190, 120, 12, 42, 78, "available", "Suresh P.", 1, false),
  mkVan("mock-3", "SV-03", 28.5935, 77.2167, 200, 0, 68, 55, "busy", "Amit S.", 2, true),
  mkVan("mock-4", "SV-04", 28.6350, 77.2250, 0, 0, 82, 30, "waste_full", "Priya M.", 3, true),
  mkVan("mock-5", "SV-05", 28.6100, 77.2300, 90, 20, 25, 88, "available", "Deepak R.", 4, false),
  mkVan("mock-6", "SV-06", 28.6450, 77.2100, 300, 18, 10, 95, "available", "Kavita N.", 5, true),
  mkVan("mock-7", "SV-07", 28.5800, 77.2350, 150, 10, 55, 65, "en_route", "Vikram T.", 6, false),
  mkVan("mock-8", "SV-08", 28.6200, 77.1950, 270, 14, 35, 80, "available", "Anita D.", 7, true),
];

// Simulate van movement for mock mode
let mockVansState = MOCK_VANS.map((v) => ({ ...v }));

function simulateMockMovement(): Van[] {
  mockVansState = mockVansState.map((van) => {
    if (van.occupancy_status === "waste_full") return van;

    const isMoving = van.occupancy_status === "available" || van.occupancy_status === "en_route";
    if (!isMoving) return van;

    // Random movement
    const headingChange = (Math.random() - 0.5) * 40;
    const newHeading = (van.heading + headingChange + 360) % 360;
    const distanceDeg = (van.speed_kmh * 5) / 3600 / 111;

    let newLat = van.latitude + distanceDeg * Math.cos((newHeading * Math.PI) / 180);
    let newLng = van.longitude + distanceDeg * Math.sin((newHeading * Math.PI) / 180);

    // Boundary check
    newLat = Math.max(28.50, Math.min(28.70, newLat));
    newLng = Math.max(77.10, Math.min(77.35, newLng));

    return {
      ...van,
      latitude: newLat,
      longitude: newLng,
      heading: newHeading,
      waste_level: Math.min(100, van.waste_level + (Math.random() < 0.1 ? 1 : 0)),
      water_level: Math.max(0, van.water_level - (Math.random() < 0.1 ? 1 : 0)),
      last_heartbeat: new Date().toISOString(),
    };
  });

  return mockVansState;
}

// ── Van Operations ─────────────────────────────────────

/** Normalize a Supabase row into our full Van type (add convenience fields + defaults) */
function normalizeVan(row: Record<string, unknown>): Van {
  const v = row as unknown as Partial<Van>;
  return {
    id: v.id ?? "",
    van_code: v.van_code ?? "VAN",
    latitude: v.latitude ?? DELHI_CENTER.lat,
    longitude: v.longitude ?? DELHI_CENTER.lng,
    heading: v.heading ?? 0,
    speed_kmh: v.speed_kmh ?? 0,
    waste_level: v.waste_level ?? 0,
    water_level: v.water_level ?? 100,
    occupancy_status: v.occupancy_status ?? "available",
    operator_name: v.operator_name ?? null,
    last_cleaned_at: v.last_cleaned_at ?? new Date().toISOString(),
    last_heartbeat: v.last_heartbeat ?? new Date().toISOString(),
    status: v.occupancy_status ?? v.status ?? "available",
    name: v.name ?? v.van_code ?? "Van",
    zone: v.zone ?? "Delhi NCR",
    has_feminine_hygiene: v.has_feminine_hygiene ?? (["SV-01", "SV-03", "SV-04", "SV-06", "SV-08"].includes(v.van_code ?? "")),
  };
}

export async function fetchVans(): Promise<Van[]> {
  if (!isSupabaseConfigured) {
    return simulateMockMovement();
  }

  const { data, error } = await supabase
    .from("vans")
    .select("*")
    .order("van_code");

  if (error) {
    console.error("[vanService] Error fetching vans:", error);
    return MOCK_VANS;
  }

  return (data ?? []).map(normalizeVan);
}

export function subscribeToVans(callback: (vans: Van[]) => void): () => void {
  if (!isSupabaseConfigured) {
    // Mock: poll every 5 seconds
    const interval = setInterval(() => {
      callback(simulateMockMovement());
    }, 5000);
    return () => clearInterval(interval);
  }

  // Supabase Realtime subscription
  const channel = supabase
    .channel("vans-realtime")
    .on(
      "postgres_changes",
      { event: "*", schema: "public", table: "vans" },
      async () => {
        const vans = await fetchVans();
        callback(vans);
      }
    )
    .subscribe();

  // Also poll every 5s as backup
  const interval = setInterval(async () => {
    const vans = await fetchVans();
    callback(vans);
  }, 5000);

  return () => {
    clearInterval(interval);
    supabase.removeChannel(channel);
  };
}

// ── Alert Operations ───────────────────────────────────

export async function fetchAlerts(): Promise<VanAlert[]> {
  if (!isSupabaseConfigured) {
    return [
      {
        id: "mock-alert-1",
        van_id: "mock-4",
        alert_type: "waste_full",
        severity: "critical",
        message: "Van SV-04 waste tank at 82%. Needs immediate disposal.",
        resolved: false,
        created_at: new Date().toISOString(),
      },
    ];
  }

  const { data, error } = await supabase
    .from("alerts")
    .select("*")
    .eq("resolved", false)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("[vanService] Error fetching alerts:", error);
    return [];
  }

  return (data as VanAlert[]) ?? [];
}

export function subscribeToAlerts(callback: (alerts: VanAlert[]) => void): () => void {
  if (!isSupabaseConfigured) {
    const interval = setInterval(async () => {
      callback(await fetchAlerts());
    }, 10000);
    return () => clearInterval(interval);
  }

  const channel = supabase
    .channel("alerts-realtime")
    .on(
      "postgres_changes",
      { event: "INSERT", schema: "public", table: "alerts" },
      async () => {
        const alerts = await fetchAlerts();
        callback(alerts);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

// ── Booking Operations ─────────────────────────────────

export async function createBooking(booking: {
  userId: string;
  serviceType: "washroom" | "fresh" | "pads";
  amount: number;
  paymentMode: "cod" | "online";
  userLat?: number;
  userLng?: number;
}): Promise<Booking | null> {
  if (!isSupabaseConfigured) {
    // Mock booking
    const mockBooking: Booking = {
      id: `mock-booking-${Date.now()}`,
      user_id: booking.userId,
      van_id: MOCK_VANS[0].id,
      service_type: booking.serviceType,
      amount: booking.amount,
      payment_mode: booking.paymentMode,
      status: "confirmed",
      user_lat: booking.userLat ?? DELHI_CENTER.lat,
      user_lng: booking.userLng ?? DELHI_CENTER.lng,
      eta_minutes: Math.floor(Math.random() * 10) + 5,
      created_at: new Date().toISOString(),
    };
    return mockBooking;
  }

  // Find nearest available van
  const nearestVan = await findNearestVan(
    booking.userLat ?? DELHI_CENTER.lat,
    booking.userLng ?? DELHI_CENTER.lng
  );

  const { data, error } = await supabase
    .from("bookings")
    .insert({
      user_id: booking.userId,
      van_id: nearestVan?.id ?? null,
      service_type: booking.serviceType,
      amount: booking.amount,
      payment_mode: booking.paymentMode,
      status: nearestVan ? "confirmed" : "pending",
      user_lat: booking.userLat ?? null,
      user_lng: booking.userLng ?? null,
      eta_minutes: nearestVan
        ? calculateETA(
            booking.userLat ?? DELHI_CENTER.lat,
            booking.userLng ?? DELHI_CENTER.lng,
            nearestVan.latitude,
            nearestVan.longitude
          )
        : null,
    })
    .select()
    .single();

  if (error) {
    console.error("[vanService] Error creating booking:", error);
    return null;
  }

  // Update van status to en_route
  if (nearestVan) {
    await supabase
      .from("vans")
      .update({ occupancy_status: "en_route" })
      .eq("id", nearestVan.id);
  }

  return data as Booking;
}

export async function fetchUserBookings(userId: string): Promise<Booking[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from("bookings")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(20);

  if (error) {
    console.error("[vanService] Error fetching bookings:", error);
    return [];
  }

  return (data as Booking[]) ?? [];
}

// ── Rating Operations ──────────────────────────────────

export async function submitRating(rating: {
  userId: string;
  vanId?: string;
  bookingId?: string;
  stars: number;
  tags: string[];
  note?: string;
}): Promise<boolean> {
  if (!isSupabaseConfigured) {
    console.log("[vanService] Mock rating submitted:", rating);
    return true;
  }

  const { error } = await supabase.from("ratings").insert({
    user_id: rating.userId,
    van_id: rating.vanId ?? null,
    booking_id: rating.bookingId ?? null,
    stars: rating.stars,
    tags: rating.tags,
    note: rating.note ?? null,
  });

  if (error) {
    console.error("[vanService] Error submitting rating:", error);
    return false;
  }

  return true;
}

export async function fetchVanRatings(vanId: string): Promise<Rating[]> {
  if (!isSupabaseConfigured) return [];

  const { data, error } = await supabase
    .from("ratings")
    .select("*")
    .eq("van_id", vanId)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) return [];
  return (data as Rating[]) ?? [];
}

// ── Utility Functions ──────────────────────────────────

export async function findNearestVan(lat: number, lng: number): Promise<Van | null> {
  const vans = await fetchVans();
  const available = vans.filter((v) => v.occupancy_status === "available");

  if (available.length === 0) return null;

  let nearest: Van | null = null;
  let minDist = Infinity;

  for (const van of available) {
    const dist = haversineDistance(lat, lng, van.latitude, van.longitude);
    if (dist < minDist) {
      minDist = dist;
      nearest = van;
    }
  }

  return nearest;
}

export function calculateETA(
  userLat: number,
  userLng: number,
  vanLat: number,
  vanLng: number
): number {
  const distKm = haversineDistance(userLat, userLng, vanLat, vanLng);
  // Assume average speed of 15 km/h in city traffic
  const etaMinutes = Math.ceil((distKm / 15) * 60);
  return Math.max(3, Math.min(30, etaMinutes)); // Clamp between 3-30 minutes
}

function haversineDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// ── Fleet Statistics ───────────────────────────────────

export interface FleetStats {
  total: number;
  available: number;
  busy: number;
  en_route: number;
  waste_full: number;
  maintenance: number;
  avgWasteLevel: number;
  avgWaterLevel: number;
  activeAlerts: number;
}

export async function getFleetStats(): Promise<FleetStats> {
  const vans = await fetchVans();
  const alerts = await fetchAlerts();

  const stats: FleetStats = {
    total: vans.length,
    available: vans.filter((v) => v.occupancy_status === "available").length,
    busy: vans.filter((v) => v.occupancy_status === "busy").length,
    en_route: vans.filter((v) => v.occupancy_status === "en_route").length,
    waste_full: vans.filter((v) => v.occupancy_status === "waste_full").length,
    maintenance: vans.filter((v) => v.occupancy_status === "maintenance").length,
    avgWasteLevel: Math.round(vans.reduce((s, v) => s + v.waste_level, 0) / vans.length),
    avgWaterLevel: Math.round(vans.reduce((s, v) => s + v.water_level, 0) / vans.length),
    activeAlerts: alerts.length,
  };

  return stats;
}

// ── RAG Chatbot ────────────────────────────────────────

const RAG_BASE_URL = import.meta.env.VITE_RAG_URL ?? "http://localhost:8091";

export async function askRAG(query: string): Promise<{
  answer: string;
  sources: { question: string; category: string }[];
  confidence: string;
}> {
  try {
    const response = await fetch(`${RAG_BASE_URL}/v1/ask`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`RAG server error: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.warn("[vanService] RAG server not available, using fallback");
    return fallbackRAG(query);
  }
}

function fallbackRAG(query: string): {
  answer: string;
  sources: { question: string; category: string }[];
  confidence: string;
} {
  const q = query.toLowerCase();

  const faqs = [
    { keywords: ["clean", "hygiene", "toilet", "wash", "dirty", "sanitize"], question: "How clean are the toilets?", answer: "Every SwachhVan washroom is sanitized after each use using eco-friendly disinfectants. Our average cleanliness rating is 4.5/5 stars. Vans below 3.5 stars are pulled for deep cleaning.", category: "hygiene" },
    { keywords: ["waste", "disposal", "environment", "biogas", "recycle"], question: "How does waste management work?", answer: "Waste is collected in sealed tanks, transported to treatment facilities, and converted into biogas and organic fertilizer — supporting a circular economy.", category: "sustainability" },
    { keywords: ["service", "price", "cost", "available", "offer", "how much", "charge"], question: "What services & prices are available?", answer: "Washroom (₹10) — clean western toilet, Fresh-up (₹20) — tissues + sanitizer + quick clean, Sanitary Pads (from ₹20) — via in-van vending. No hidden charges.", category: "services" },
    { keywords: ["eta", "time", "arrive", "long", "wait", "reach", "come"], question: "How long does a van take?", answer: "Average ETA is 5-15 minutes based on GPS tracking and traffic. You can track the van live on the map.", category: "booking" },
    { keywords: ["women", "safe", "safety", "privacy", "period", "female", "lady", "girl"], question: "Is it safe for women?", answer: "Yes — privacy-first interiors, secure locks, well-lit spaces, dedicated Period Emergency mode, sanitary pad vending, sealed disposal, and in-app safety features.", category: "safety" },
    { keywords: ["pay", "payment", "upi", "cash", "cod", "card", "money", "online"], question: "How do I pay?", answer: "Cash on Delivery (pay when van arrives) or Online (UPI/card). No hidden charges — the price shown is what you pay.", category: "payment" },
    { keywords: ["book", "booking", "order", "reserve", "how", "use"], question: "How do I book a van?", answer: "Open the app → share location → pick a service → choose payment → confirm! Nearest van heads to you in ~5-15 min.", category: "booking" },
    { keywords: ["where", "area", "city", "delhi", "location", "zone", "near", "nearby"], question: "Where are vans available?", answer: "Currently across Delhi NCR — Connaught Place, Chandni Chowk, Karol Bagh, Saket, Lajpat Nagar, Dwarka, Rohini, Nehru Place. 8 vans in our fleet.", category: "booking" },
    { keywords: ["refer", "referral", "earn", "invite", "friend", "code", "reward", "credit"], question: "How does Refer & Earn work?", answer: "Share your unique SV code → friend signs up & books → both get reward credits for discounts!", category: "referral" },
    { keywords: ["rate", "rating", "feedback", "review", "stars", "complaint"], question: "Can I rate my experience?", answer: "Yes! Rate 1-5 stars, select feedback tags, and leave a note. Ratings influence maintenance and operator performance.", category: "feedback" },
    { keywords: ["account", "login", "signup", "sign", "register", "otp", "email"], question: "How do I sign up / log in?", answer: "Enter your email → receive a 6-digit OTP → verify and you're in! No password needed.", category: "account" },
    { keywords: ["what", "swachhvan", "about", "who", "mission"], question: "What is SwachhVan?", answer: "A mobile-first platform deploying GPS-tracked washroom vans across cities — clean, dignified hygiene on demand.", category: "about" },
    { keywords: ["hello", "hi", "hey", "hii", "namaste", "greet"], question: "Hello", answer: "Hello! 👋 I can help with booking, pricing, hygiene, payments, women's facilities, sustainability, and more. Just ask!", category: "general" },
    { keywords: ["thank", "thanks", "bye", "goodbye"], question: "Thanks", answer: "You're welcome! 😊 Stay clean, stay confident! 🌿", category: "general" },
    { keywords: ["contact", "support", "help", "phone", "call", "email"], question: "How do I contact support?", answer: "In-app chat (recommended), phone helpline (9 AM – 9 PM), or email support@swachhvan.in.", category: "support" },
    { keywords: ["pad", "sanitary", "menstrual", "napkin", "vending", "feminine"], question: "Are sanitary pads available?", answer: "Yes! Select vans have pad vending (from ₹20) with disposal bags. Use 'Women Hygiene' filter on the map.", category: "services" },
    { keywords: ["dashboard", "fleet", "admin", "monitor"], question: "What is the Fleet Dashboard?", answer: "Real-time fleet monitoring — total vans, availability, waste/water levels, alerts, bookings. Refreshes every 5 seconds.", category: "operations" },
    { keywords: ["track", "gps", "location", "map", "real-time", "live"], question: "How are vans tracked?", answer: "GPS trackers stream data every 5 seconds into our Pathway pipeline, updating the live map and ETAs.", category: "technology" },
    { keywords: ["pathway", "pipeline", "streaming", "engine"], question: "What is Pathway?", answer: "Pathway is our real-time streaming data engine — it ingests van telemetry, detects alerts, powers the dashboard and this AI chatbot.", category: "technology" },
  ];

  const match = faqs.find((f) => f.keywords.some((kw) => q.includes(kw)));

  if (match) {
    return {
      answer: match.answer,
      sources: [{ question: match.question, category: match.category }],
      confidence: "medium",
    };
  }

  return {
    answer: "I don't have specific information about that yet. Please check the Help & Support section or contact us at support@swachhvan.in.",
    sources: [],
    confidence: "low",
  };
}

// ── Location Search (SerpAPI Geocoding) ────────────────

const GEOCODE_BASE_URL = import.meta.env.VITE_GEOCODE_URL ?? "http://localhost:8091";

export interface GeocodedPlace {
  name: string;
  address: string;
  lat: number;
  lng: number;
  rating?: number;
  type?: string;
}

export interface GeocodeResult {
  lat: number;
  lng: number;
  address: string;
  name: string;
  results: GeocodedPlace[];
  error?: string;
}

/**
 * Geocode a place name → coordinates using the backend SerpAPI endpoint.
 * Works for any location worldwide (cities, landmarks, addresses).
 */
export async function geocodePlace(query: string): Promise<GeocodeResult> {
  try {
    const res = await fetch(`${GEOCODE_BASE_URL}/v1/geocode`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    if (!res.ok) throw new Error(`Geocode error: ${res.status}`);
    return await res.json();
  } catch (err) {
    console.warn("[vanService] Geocode failed, using fallback lookup:", err);
    return fallbackGeocode(query);
  }
}

/**
 * Search for places near a specific coordinate via SerpAPI.
 */
export async function searchNearby(
  lat: number,
  lng: number,
  query = "washroom"
): Promise<{ results: GeocodedPlace[]; total: number }> {
  try {
    const res = await fetch(`${GEOCODE_BASE_URL}/v1/nearby`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ lat, lng, query }),
    });
    if (!res.ok) throw new Error(`Nearby error: ${res.status}`);
    return await res.json();
  } catch {
    return { results: [], total: 0 };
  }
}

/** Fallback geocode for common Indian cities when backend is unreachable */
function fallbackGeocode(query: string): GeocodeResult {
  const q = query.toLowerCase().trim();
  const cities: Record<string, { lat: number; lng: number; name: string }> = {
    delhi: { lat: 28.6139, lng: 77.2090, name: "Delhi NCR" },
    "new delhi": { lat: 28.6139, lng: 77.2090, name: "New Delhi" },
    mumbai: { lat: 19.0760, lng: 72.8777, name: "Mumbai" },
    bangalore: { lat: 12.9716, lng: 77.5946, name: "Bangalore" },
    bengaluru: { lat: 12.9716, lng: 77.5946, name: "Bengaluru" },
    chennai: { lat: 13.0827, lng: 80.2707, name: "Chennai" },
    kolkata: { lat: 22.5726, lng: 88.3639, name: "Kolkata" },
    hyderabad: { lat: 17.3850, lng: 78.4867, name: "Hyderabad" },
    pune: { lat: 18.5204, lng: 73.8567, name: "Pune" },
    ahmedabad: { lat: 23.0225, lng: 72.5714, name: "Ahmedabad" },
    jaipur: { lat: 26.9124, lng: 75.7873, name: "Jaipur" },
    lucknow: { lat: 26.8467, lng: 80.9462, name: "Lucknow" },
    chandigarh: { lat: 30.7333, lng: 76.7794, name: "Chandigarh" },
    bhopal: { lat: 23.2599, lng: 77.4126, name: "Bhopal" },
    noida: { lat: 28.5355, lng: 77.3910, name: "Noida" },
    gurgaon: { lat: 28.4595, lng: 77.0266, name: "Gurgaon" },
    gurugram: { lat: 28.4595, lng: 77.0266, name: "Gurugram" },
  };

  const match = Object.entries(cities).find(([key]) => q.includes(key));
  if (match) {
    const [, city] = match;
    return { lat: city.lat, lng: city.lng, address: city.name, name: city.name, results: [] };
  }

  // Default to Delhi
  return { lat: 28.6139, lng: 77.2090, address: "Delhi NCR", name: "Delhi NCR", results: [], error: "Location not found" };
}

// ── Weather Service ────────────────────────────────────

export interface WeatherData {
  condition: string;
  temp_c: number;
  humidity: number;
  rain_mm: number;
  wind_kmh: number;
}

export async function fetchWeather(): Promise<WeatherData> {
  const apiKey = import.meta.env.VITE_OPENWEATHER_API_KEY;

  if (!apiKey) {
    return { condition: "Clear", temp_c: 28, humidity: 55, rain_mm: 0, wind_kmh: 10 };
  }

  try {
    const res = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${DELHI_CENTER.lat}&lon=${DELHI_CENTER.lng}&appid=${apiKey}&units=metric`
    );
    const data = await res.json();

    return {
      condition: data.weather?.[0]?.main ?? "Clear",
      temp_c: Math.round(data.main?.temp ?? 28),
      humidity: data.main?.humidity ?? 55,
      rain_mm: data.rain?.["1h"] ?? 0,
      wind_kmh: Math.round((data.wind?.speed ?? 3) * 3.6),
    };
  } catch {
    return { condition: "Clear", temp_c: 28, humidity: 55, rain_mm: 0, wind_kmh: 10 };
  }
}
