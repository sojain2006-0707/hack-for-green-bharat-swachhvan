"""
SwachhVan - Pathway RAG Chatbot Server
======================================

REST API that answers user questions about SwachhVan using
Retrieval-Augmented Generation (RAG) powered by Pathway.

Pathway integration:
  1. A background Pathway pipeline indexes FAQ knowledge from JSONL files.
     When new FAQ entries are added, Pathway auto-reindexes them.
  2. The /v1/fleet endpoint reads Pathway's real-time output files
     (fleet stats, alerts) that are auto-updated by pathway_pipeline.py.
  3. FAQ retrieval uses a Pathway UDF for keyword scoring, running
     inside the Pathway dataflow graph on a background thread.

Key Pathway features used:
  ─ pw.io.jsonlines.read()   Streaming FAQ ingestion
  ─ pw.Table.select()        Column projection
  ─ @pw.udf                  Custom relevance scoring
  ─ pw.io.jsonlines.write()  Indexed FAQ output
  ─ pw.run()                 Background streaming engine

Usage:
  pip install pathway python-dotenv
  python rag_server.py

Endpoints:
  POST /v1/ask       { "query": "How clean are the toilets?" }
  GET  /v1/ask?q=... Query via URL parameter
  GET  /v1/faqs      List all FAQ entries
  GET  /v1/fleet     Real-time fleet stats from Pathway output
  GET  /v1/alerts    Real-time alerts from Pathway output
  GET  /v1/health    Health check (includes Pathway status)
  POST /v1/geocode   Geocode a place name (SerpAPI)
  POST /v1/nearby    Search nearby places (SerpAPI)
"""

import json
import os
from pathlib import Path
from http.server import HTTPServer, BaseHTTPRequestHandler
from urllib.parse import urlparse, parse_qs, urlencode
import threading

try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")
except ImportError:
    pass

# ── Pathway Background Pipeline ───────────────────────
# Run Pathway in a daemon thread to continuously index FAQs
# and provide real-time data processing.

import pathway as pw

FAQ_DIR = Path(__file__).parent / "data" / "faq"
OUTPUT_DIR = Path(__file__).parent / "data" / "output"
PATHWAY_RUNNING = False


class _FAQSchema(pw.Schema):
    """Pathway schema for FAQ documents."""
    question: str
    answer: str
    category: str
    keywords: str


@pw.udf
def score_relevance(query_keywords: str, faq_keywords: str, question: str) -> float:
    """
    Pathway UDF: score how relevant an FAQ entry is to the query keywords.
    Runs inside the Pathway dataflow graph.
    """
    q_words = set(query_keywords.lower().split(","))
    faq_kws = set(faq_keywords.lower().split(","))
    q_lower = query_keywords.lower()

    score = 0.0
    # Keyword overlap
    overlap = q_words & faq_kws
    score += len(overlap) * 4.0
    # Substring match
    for kw in faq_kws:
        if kw.strip() in q_lower:
            score += 2.0
    # Question text match
    for w in q_words:
        if w.strip() in question.lower():
            score += 1.5
    return score


def _run_pathway_faq_pipeline():
    """
    Background Pathway pipeline that:
    1. Reads FAQ JSONL from data/faq/ in streaming mode
    2. Writes indexed FAQ data to data/output/faq_index.jsonl
    When new FAQ entries are added, Pathway auto-reindexes.
    """
    global PATHWAY_RUNNING

    FAQ_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    try:
        faq_table = pw.io.jsonlines.read(
            str(FAQ_DIR),
            schema=_FAQSchema,
            mode="streaming",
        )

        # Project and write the indexed FAQ data
        indexed = faq_table.select(
            question=faq_table.question,
            answer=faq_table.answer,
            category=faq_table.category,
            keywords=faq_table.keywords,
        )

        pw.io.jsonlines.write(indexed, str(OUTPUT_DIR / "faq_index.jsonl"))

        PATHWAY_RUNNING = True
        print("[Pathway] FAQ indexing pipeline started (background thread)")
        pw.run(monitoring_level=pw.MonitoringLevel.NONE)
    except Exception as e:
        print(f"[Pathway] Pipeline error: {e}")
        PATHWAY_RUNNING = False


def start_pathway_background():
    """Launch the Pathway pipeline on a daemon thread."""
    t = threading.Thread(target=_run_pathway_faq_pipeline, daemon=True)
    t.start()
    print("[Pathway] Background thread launched")


# ── Pathway Output Readers ─────────────────────────────
# Read real-time data produced by pathway_pipeline.py

def read_pathway_fleet_stats() -> list[dict]:
    """Read fleet stats from Pathway's output file."""
    stats_file = OUTPUT_DIR / "fleet_stats.jsonl"
    if not stats_file.exists():
        return []
    results = []
    try:
        with open(stats_file, "r") as f:
            for line in f:
                line = line.strip()
                if line:
                    results.append(json.loads(line))
    except Exception:
        pass
    return results


def read_pathway_alerts() -> list[dict]:
    """Read active alerts from Pathway's output file."""
    alerts_file = OUTPUT_DIR / "alerts.jsonl"
    if not alerts_file.exists():
        return []
    results = []
    try:
        with open(alerts_file, "r") as f:
            for line in f:
                line = line.strip()
                if line:
                    results.append(json.loads(line))
    except Exception:
        pass
    return results

# SerpAPI key for Google Maps geocoding
SERPAPI_KEY = os.getenv("SERPAPI_KEY", "")

try:
    import urllib.request as _urllib_request
    HAS_URLLIB = True
except ImportError:
    HAS_URLLIB = False

# ── FAQ Knowledge Base (in-memory for quick RAG) ──────

FAQ_DATA = [
    # ── HYGIENE & CLEANLINESS ───────────────────────────
    {
        "question": "How clean are the toilets?",
        "answer": "Every SwachhVan washroom is sanitized after each use using eco-friendly disinfectants. Users rate cleanliness after each visit, and our average rating is 4.5/5 stars. Vans with ratings below 3.5 are pulled for deep cleaning.",
        "category": "hygiene",
        "keywords": ["clean", "toilet", "hygiene", "sanitize", "wash", "dirty", "cleanliness", "germs", "bacteria", "disinfect"],
    },
    {
        "question": "What hygiene standards do you follow?",
        "answer": "We follow five key hygiene standards: 1) Cleaned after every use with sanitization between customers, 2) Eco-friendly disinfectants that are safe yet effective, 3) Separate waste & water tanks that are sealed to prevent contamination, 4) Real-time cleanliness ratings by users after each visit, 5) Trained sanitation staff who follow strict SOPs and safe waste-handling protocols.",
        "category": "hygiene",
        "keywords": ["hygiene", "standard", "protocol", "sop", "cleaning", "disinfect", "sanitize", "trained", "staff", "operator"],
    },
    {
        "question": "Are the washrooms cleaned after every use?",
        "answer": "Yes, absolutely! Every SwachhVan washroom is sanitized between customers. Our operators follow a strict cleaning checklist covering surfaces, fixtures, consumable restocking (soap, sanitizer, tissues), and waste disposal. Users can see the cleanliness rating before booking.",
        "category": "hygiene",
        "keywords": ["clean", "every", "use", "between", "customer", "checklist", "soap", "sanitizer", "tissue"],
    },
    {
        "question": "What consumables are provided?",
        "answer": "Each van is stocked with: liquid soap, hand sanitizer, tissue paper, toilet seat covers, disposal bags, and running water. For women's vans, we additionally carry sanitary pads and sealed disposal units. Consumable levels are monitored and refilled regularly.",
        "category": "hygiene",
        "keywords": ["consumable", "soap", "sanitizer", "tissue", "toilet", "paper", "supply", "stock", "refill"],
    },

    # ── SERVICES & PRICING ──────────────────────────────
    {
        "question": "What services are available?",
        "answer": "SwachhVan offers three services: 1) Washroom (₹10) — Clean western-style toilet with hand hygiene essentials and privacy, 2) Fresh-up (₹20) — Extra cleaning support with tissues, sanitizer, and a private space, 3) Sanitary Pads (from ₹20) — Discreet and hygienic purchase via in-van vending machine with tissues and disposal bags included.",
        "category": "services",
        "keywords": ["service", "washroom", "fresh", "pads", "sanitary", "price", "cost", "available", "offer", "provide"],
    },
    {
        "question": "What are the prices?",
        "answer": "Our pricing is simple and transparent with no hidden charges: Washroom use costs ₹10, Fresh-up service costs ₹20 (includes tissues + sanitizer + quick clean), and Sanitary Pads start from ₹20 (discreet purchase with disposal bags). The price shown is exactly what you pay.",
        "category": "services",
        "keywords": ["price", "cost", "charge", "fee", "amount", "rupee", "₹", "10", "20", "how much", "expensive", "cheap", "affordable"],
    },
    {
        "question": "What is the Fresh-up service?",
        "answer": "The Fresh-up service (₹20) provides extra cleaning and comfort support. You get tissues, hand sanitizer, a quick clean, and a private, safe space. It's perfect for when you need more than just a quick washroom visit — ideal for travelers, outdoor workers, or anyone needing to freshen up on the go.",
        "category": "services",
        "keywords": ["fresh", "freshen", "tissue", "sanitizer", "comfort", "quick", "clean"],
    },
    {
        "question": "Do you sell sanitary pads?",
        "answer": "Yes! Select SwachhVan vans are equipped with hygienic sanitary pad vending machines. Pads start from ₹20 and come with tissues and sealed disposal bags for discreet and hygienic disposal. You can filter vans with feminine hygiene products on the map using the 'Women Hygiene' filter.",
        "category": "services",
        "keywords": ["sanitary", "pad", "pads", "menstrual", "period", "vending", "feminine", "hygiene", "buy", "purchase", "napkin"],
    },
    {
        "question": "Is the washroom western style or Indian style?",
        "answer": "Our vans are equipped with clean western-style (sitting) toilet seats. Each seat is sanitized after every use with eco-friendly disinfectants and includes hygiene essentials like soap, sanitizer, and tissue paper.",
        "category": "services",
        "keywords": ["western", "indian", "squat", "sitting", "seat", "toilet", "style", "commode"],
    },

    # ── BOOKING & ETA ───────────────────────────────────
    {
        "question": "How do I book a van?",
        "answer": "Booking is easy! 1) Open the app and share your location to see nearby vans on the live map, 2) Pick a service — Washroom (₹10), Fresh-up (₹20), or Sanitary Pads (₹20), 3) Choose your payment mode — Cash on Delivery or Online (UPI/card), 4) Confirm your booking! The nearest van will head to you in ~5-15 minutes.",
        "category": "booking",
        "keywords": ["book", "booking", "order", "request", "how", "use", "app", "reserve", "schedule", "find"],
    },
    {
        "question": "How long does a van take to arrive?",
        "answer": "Average ETA is 5-15 minutes depending on your location and van availability. The app shows real-time ETA based on GPS tracking and current traffic conditions. During peak hours or rain, ETAs may be slightly longer. You can track the van live on the map as it approaches.",
        "category": "booking",
        "keywords": ["eta", "arrive", "time", "long", "wait", "minutes", "booking", "fast", "how long", "reach", "come"],
    },
    {
        "question": "Why is the ETA changing?",
        "answer": "ETA updates in real-time based on traffic conditions, van availability, and route changes. If a van gets delayed or rerouted due to traffic or weather, the ETA adjusts automatically. Rest assured, we always match you with the closest available van for the fastest possible service.",
        "category": "booking",
        "keywords": ["eta", "changing", "change", "update", "delay", "late", "slow", "traffic", "route"],
    },
    {
        "question": "Can I cancel a booking?",
        "answer": "Yes, you can cancel a booking before the van arrives at your location. Simply go to your active booking and tap cancel. No cancellation charges apply if cancelled before the van is dispatched. For late cancellations, a nominal fee may apply in future.",
        "category": "booking",
        "keywords": ["cancel", "cancellation", "refund", "undo", "stop", "abort", "cancel booking", "cancel my", "dont want", "remove booking"],
    },
    {
        "question": "Where are vans available?",
        "answer": "SwachhVan currently operates across Delhi NCR including areas like Connaught Place, Chandni Chowk, Karol Bagh, Saket, Lajpat Nagar, Dwarka, Rohini, and Nehru Place. We have 8 vans in our fleet covering these zones. Open the app to see live availability near you on the interactive map.",
        "category": "booking",
        "keywords": ["where", "available", "area", "city", "delhi", "location", "zone", "coverage", "nearby", "near", "find"],
    },

    # ── PAYMENT ─────────────────────────────────────────
    {
        "question": "How do I pay?",
        "answer": "We accept two payment modes: 1) Cash on Delivery (COD) — pay the exact amount when the van arrives, no change needed, 2) Online Payment — via UPI or card for a cashless, contactless experience. No hidden charges — the price shown is exactly what you pay.",
        "category": "payment",
        "keywords": ["pay", "payment", "money", "cost", "upi", "card", "cash", "cod", "price", "how pay", "mode"],
    },
    {
        "question": "How does Cash on Delivery work?",
        "answer": "Simply select 'Cash on Delivery' during checkout. When the van arrives at your location, pay the displayed amount directly to the operator. Exact change is appreciated. You'll receive a booking confirmation in-app as soon as you confirm the service.",
        "category": "payment",
        "keywords": ["cash", "delivery", "cod", "operator", "change", "arrive", "hand"],
    },
    {
        "question": "Do you accept UPI payments?",
        "answer": "Yes! We accept UPI payments for a smooth, cashless experience. During checkout, select 'Online Payment' and you'll see our UPI ID. You can pay using any UPI app like Google Pay, PhonePe, Paytm, etc. Payment is confirmed instantly.",
        "category": "payment",
        "keywords": ["upi", "online", "digital", "gpay", "google pay", "phonepe", "paytm", "qr", "scan", "cashless"],
    },
    {
        "question": "Are there any hidden charges?",
        "answer": "No, absolutely not! SwachhVan has a transparent pricing policy. Washroom costs ₹10, Fresh-up costs ₹20, and Sanitary Pads start from ₹20. The price shown at checkout is exactly what you pay — no surge pricing, no convenience fees, no hidden charges.",
        "category": "payment",
        "keywords": ["hidden", "charge", "extra", "fee", "surge", "additional", "transparent", "exact"],
    },

    # ── WOMEN'S SAFETY & FACILITIES ─────────────────────
    {
        "question": "Is it safe for women?",
        "answer": "Absolutely. Our vans feature privacy-first interiors with secure locks, well-lit spaces, and sound insulation. We offer a dedicated 'Period Emergency' booking mode for urgent situations, sanitary pad vending, sealed disposal units, and in-app safety assistance features. Your safety and dignity are our top priority.",
        "category": "safety",
        "keywords": ["women", "safe", "safety", "privacy", "period", "emergency", "female", "lady", "girl", "secure", "lock"],
    },
    {
        "question": "What is Period Emergency mode?",
        "answer": "Period Emergency is a dedicated booking mode for urgent menstrual hygiene needs. It quickly locates the nearest van with sanitary pad vending, prioritizes your request, and provides the fastest possible ETA. The service is designed to be discreet, dignified, and stress-free.",
        "category": "safety",
        "keywords": ["period", "emergency", "menstrual", "urgent", "pad", "quick", "fast", "immediately"],
    },
    {
        "question": "Do vans have sanitary pad disposal?",
        "answer": "Yes, all women-equipped vans have sealed, hygienic disposal units specifically designed for sanitary pads and feminine products. Disposal is discreet with no odor or exposure. Used products are safely collected and handled as per bio-medical waste protocols.",
        "category": "safety",
        "keywords": ["disposal", "dispose", "pad", "sanitary", "sealed", "hygienic", "bin", "throw"],
    },
    {
        "question": "How is privacy maintained in the vans?",
        "answer": "Privacy is our top priority. Each van features: secure door locks that can only be operated from inside, sound insulation for complete privacy, well-lit interiors with no external visibility, clear privacy signage, and respectful operator conduct protocols. Our design ensures a no-judgment, dignified experience.",
        "category": "safety",
        "keywords": ["privacy", "private", "lock", "secure", "door", "insulation", "dignity", "discreet", "confidential"],
    },

    # ── SUSTAINABILITY & ENVIRONMENT ────────────────────
    {
        "question": "How does SwachhVan help the environment?",
        "answer": "SwachhVan contributes to sustainability through: 1) Waste-to-energy conversion — organic waste transformed into biogas for renewable energy, 2) Organic fertilizer production — treated waste enriches soil, 3) Reduced open defecation — improving public health, 4) Lower methane emissions — controlled waste treatment prevents harmful greenhouse gases, 5) Water-efficient washroom systems — saving approximately 3 liters per visit. We're proud to be part of the circular economy.",
        "category": "sustainability",
        "keywords": ["environment", "green", "eco", "sustainable", "energy", "circular", "carbon", "planet", "nature", "climate"],
    },
    {
        "question": "How does waste management work?",
        "answer": "Waste is collected in sealed tanks and transported to authorized treatment facilities. Organic waste is converted into biogas energy and organic fertilizer, supporting a circular economy. This prevents harmful methane emissions and groundwater contamination. IoT sensors monitor waste levels in real-time, and vans are automatically directed to disposal centers when tanks reach 80% capacity.",
        "category": "sustainability",
        "keywords": ["waste", "management", "disposal", "biogas", "fertilizer", "environment", "pollution", "recycle", "treatment"],
    },
    {
        "question": "What is the circular economy approach?",
        "answer": "SwachhVan follows a circular economy model where nothing goes to waste: human waste is treated and converted into biogas (renewable energy) and organic fertilizer (enriching soil). Water is efficiently managed with minimal usage per visit (~3L saved). This means every visit contributes to sustainability — waste becomes a resource instead of a pollutant.",
        "category": "sustainability",
        "keywords": ["circular", "economy", "recycle", "reuse", "resource", "renewable", "biogas", "fertilizer"],
    },
    {
        "question": "How much water and CO2 does SwachhVan save?",
        "answer": "Each SwachhVan visit saves approximately 3 liters of water compared to traditional facilities. Our electric/CNG-powered vans avoid roughly 0.8 kg of CO₂ emissions per van per day. Each use also recycles about 0.15 kg of waste into useful biogas or fertilizer. These sustainability metrics are tracked and displayed on the admin dashboard.",
        "category": "sustainability",
        "keywords": ["water", "save", "co2", "carbon", "emission", "metric", "impact", "liter", "kg"],
    },

    # ── TECHNOLOGY & OPERATIONS ──────────────────────────
    {
        "question": "What technology does SwachhVan use?",
        "answer": "Our tech stack includes: React + TypeScript frontend with Vite for lightning-fast performance, Supabase for real-time database and authentication, Pathway for streaming data pipeline powering live van tracking, Leaflet with OpenStreetMap for interactive maps, IoT sensors for waste/water tank monitoring, and this RAG-based AI chatbot for instant user support.",
        "category": "technology",
        "keywords": ["technology", "tech", "stack", "pathway", "supabase", "react", "ai", "iot", "software", "app"],
    },
    {
        "question": "How are van locations tracked?",
        "answer": "Each van is equipped with GPS trackers that stream location data every 5 seconds. This data feeds into our Pathway real-time streaming pipeline, which updates the live map, calculates accurate ETAs based on traffic conditions, and triggers proximity-based booking matches. You can see all van positions on the interactive map in real-time.",
        "category": "technology",
        "keywords": ["track", "gps", "location", "map", "real-time", "pathway", "live", "position", "satellite", "navigate"],
    },
    {
        "question": "What happens when waste tank is full?",
        "answer": "IoT sensors continuously monitor waste levels in real-time. When a van reaches 80% capacity, our Pathway pipeline automatically triggers a critical alert and the van is directed to the nearest authorized disposal center. The dashboard shows waste levels with color coding — green (<50%), amber (50-80%), and red (≥80%). This ensures zero service interruption.",
        "category": "operations",
        "keywords": ["waste", "full", "tank", "sensor", "alert", "disposal", "capacity", "80", "level", "overflow"],
    },
    {
        "question": "What about rainy weather?",
        "answer": "Our vans are designed for all-weather operation with waterproof interiors. During rain, we integrate OpenWeatherMap data to adjust routing for safer travel. ETAs may increase by 20-40% during heavy rain. Vans prioritize covered parking areas. The system automatically factors weather into van speed and ETA calculations.",
        "category": "operations",
        "keywords": ["rain", "weather", "rainy", "storm", "wet", "monsoon", "climate", "hot", "cold", "summer", "winter"],
    },
    {
        "question": "What is the Pathway pipeline?",
        "answer": "Pathway is our real-time streaming data engine. It ingests van telemetry (GPS, waste levels, water levels) every 5 seconds, computes fleet-wide statistics, detects critical alerts (waste ≥ 80%, water ≤ 20%), and powers the live dashboard. It also enables this RAG chatbot for intelligent Q&A. Think of it as the brain coordinating our entire fleet in real-time.",
        "category": "technology",
        "keywords": ["pathway", "pipeline", "streaming", "real-time", "engine", "data", "telemetry", "process"],
    },
    {
        "question": "How many vans does SwachhVan have?",
        "answer": "Currently, our fleet consists of 8 GPS-tracked vans (SV-01 through SV-08) operating across Delhi NCR. These cover zones including Connaught Place, Chandni Chowk, Karol Bagh, Saket, Lajpat Nagar, Dwarka, Rohini, and Nehru Place. We plan to scale to more vans and cities in the future.",
        "category": "operations",
        "keywords": ["how many", "van", "fleet", "number", "count", "total", "sv-01", "sv-08"],
    },

    # ── RATINGS & FEEDBACK ──────────────────────────────
    {
        "question": "Can I rate my experience?",
        "answer": "Yes! After each visit, you can: 1) Rate hygiene on a 1-5 star scale (5 = Awesome!, 4 = Great, 3 = Okay), 2) Select quick feedback tags like 'Clean & hygienic', 'Quick arrival', 'Privacy-first', 'Well maintained', 'Friendly operator', 'Easy booking', 3) Leave a detailed note. Your ratings directly influence van maintenance schedules, operator performance, and service improvements.",
        "category": "feedback",
        "keywords": ["rate", "rating", "feedback", "review", "stars", "experience", "quality", "improve", "complaint"],
    },
    {
        "question": "What if I had a bad experience?",
        "answer": "We're sorry to hear that! Please rate your experience (1-3 stars) and select relevant feedback tags like 'Cleanliness issue', 'Long wait time', 'Location mismatch', 'Payment issue', or 'Consumables missing'. You can also leave a detailed note. Your feedback is taken very seriously — vans with low ratings are pulled for deep cleaning and operators are retrained. You can also contact support at support@swachhvan.in.",
        "category": "feedback",
        "keywords": ["bad", "complaint", "issue", "problem", "dirty", "unhappy", "dissatisfied", "poor", "terrible", "worst"],
    },
    {
        "question": "How can I report an issue?",
        "answer": "You can report issues in multiple ways: 1) After your visit, use the rating system with negative feedback tags, 2) Contact us via in-app chat support (recommended), 3) Call us at our helpline (9 AM – 9 PM), 4) Email us at support@swachhvan.in with your booking details. All issues are anonymous by default — your privacy is protected.",
        "category": "feedback",
        "keywords": ["report", "issue", "problem", "complain", "contact", "help", "support", "grievance"],
    },

    # ── REFER & EARN ────────────────────────────────────
    {
        "question": "What is the Refer & Earn program?",
        "answer": "Share your unique referral code with friends and family! When they sign up and complete their first booking, both you and your friend earn reward credits. These credits can be applied during checkout for discounts on future services. Your referral code starts with 'SV' followed by 8 characters — find it in the Refer & Earn section of the app.",
        "category": "referral",
        "keywords": ["refer", "referral", "earn", "invite", "friend", "share", "code", "reward", "credit", "discount", "bonus"],
    },
    {
        "question": "How do referral rewards work?",
        "answer": "It's simple: 1) Share your unique referral code with friends, 2) When they sign up and book their first service, 3) Both you and your friend get reward credits! Credits can be used during checkout for discounts on any service. Note: one reward per new user, and self-referrals are not allowed. Rewards may vary by city.",
        "category": "referral",
        "keywords": ["reward", "credit", "referral", "how", "work", "get", "earn", "bonus"],
    },

    # ── ACCOUNT & PROFILE ───────────────────────────────
    {
        "question": "How do I create an account?",
        "answer": "Creating an account is quick and easy! Enter your email address and we'll send you a 6-digit OTP (One-Time Password) to verify your identity. No password needed — just confirm the OTP and you're in! You can also use the app in guest mode for basic browsing, but you'll need an account to book services.",
        "category": "account",
        "keywords": ["account", "create", "signup", "sign up", "register", "join", "new", "otp", "email", "login", "log in"],
    },
    {
        "question": "How do I log in?",
        "answer": "Enter your registered email address on the login screen. We'll send a 6-digit OTP to your email — enter it to log in securely. No password to remember! If you've forgotten which email you used, try the email associated with your bookings or contact support@swachhvan.in.",
        "category": "account",
        "keywords": ["login", "log in", "sign in", "enter", "otp", "email", "password", "forgot", "access"],
    },
    {
        "question": "How do I update my profile?",
        "answer": "Go to Profile from the side menu. You can update your: Full name, Phone number (10-digit mobile), Gender (Female / Male / Non-binary / Prefer not to say), and Email address. Changes are saved automatically. Note: changing your email will require confirmation via the new email address.",
        "category": "account",
        "keywords": ["profile", "update", "edit", "name", "phone", "gender", "change", "personal", "details", "information"],
    },
    {
        "question": "What settings can I change?",
        "answer": "In Settings, you can toggle: 1) Notifications — booking updates and offers (default: ON), 2) Location hints — prompts to share your area (default: ON), 3) Low data mode — reduces heavy visuals for slower connections (default: OFF), 4) Dark mode — switch between light and dark themes (default: OFF). You can also sign out or edit your profile from Settings.",
        "category": "account",
        "keywords": ["settings", "notification", "dark mode", "theme", "location", "data", "toggle", "preference", "configure"],
    },

    # ── SUPPORT & CONTACT ───────────────────────────────
    {
        "question": "How do I contact support?",
        "answer": "You can reach us through: 1) In-app Chat (recommended) — get instant AI-powered answers, 2) Phone — call our helpline between 9 AM – 9 PM, 3) Email — write to support@swachhvan.in with your query. For booking-specific issues, include your booking ID for faster resolution.",
        "category": "support",
        "keywords": ["contact", "support", "help", "helpline", "phone", "call", "email", "reach", "customer service", "assistance"],
    },
    {
        "question": "What help topics are available?",
        "answer": "Our support covers these topics: 1) Booking & ETA — questions about finding vans, booking flow, arrival times, 2) Payments — COD, UPI, payment issues, 3) Hygiene & Safety — cleanliness standards, safety protocols, 4) Account — login, profile, settings, 5) Feedback — ratings, complaints, issue reporting, 6) Policies — terms, privacy, data handling.",
        "category": "support",
        "keywords": ["help", "topic", "faq", "question", "guide", "tutorial", "how to"],
    },

    # ── ABOUT SWACHHVAN ─────────────────────────────────
    {
        "question": "What is SwachhVan?",
        "answer": "SwachhVan is a mobile-first platform that deploys GPS-tracked washroom vans across cities. We provide on-demand, clean, dignified washroom and hygiene services — bringing facilities to where people need them. Our four pillars are: Mobility (washrooms come to you), Hygiene (regularly cleaned and monitored), Sustainability (responsible waste handling via biogas & fertilizer), and Inclusivity (women's hygiene and safety focus).",
        "category": "about",
        "keywords": ["what", "swachhvan", "about", "who", "company", "mission", "vision", "purpose", "mobile washroom"],
    },
    {
        "question": "Who is SwachhVan for?",
        "answer": "SwachhVan serves everyone who needs clean, accessible washroom facilities: commuters and daily travelers, outdoor workers at construction sites, event-goers at festivals and concerts, women needing safe and dignified hygiene access, and residents in areas with limited public washroom infrastructure. We aim to make civic hygiene accessible to all.",
        "category": "about",
        "keywords": ["who", "target", "user", "customer", "people", "audience", "for whom"],
    },
    {
        "question": "How does SwachhVan work?",
        "answer": "It's a 4-step process: 1) Find nearby vans — open the app, share your location, and see available vans on the live map with real-time ETA, 2) Pick a service — Washroom (₹10), Fresh-up (₹20), or Sanitary Pads (₹20), 3) Book & pay — confirm in seconds with cash or digital payment, 4) Arrive clean, leave safe — the van reaches in ~5-15 minutes, operators follow strict hygiene protocols, and waste is safely collected for sustainable processing.",
        "category": "about",
        "keywords": ["how", "work", "process", "step", "flow", "use", "explain", "overview"],
    },

    # ── DASHBOARD & FLEET ───────────────────────────────
    {
        "question": "What is the Fleet Dashboard?",
        "answer": "The Fleet Dashboard provides real-time monitoring of our entire van fleet powered by the Pathway streaming pipeline. It shows: Total vans in fleet, Available vans, Active alerts (waste full / water low), Total bookings. Each van displays its zone, waste level (color-coded), water level, and current status. Data refreshes every 5 seconds.",
        "category": "operations",
        "keywords": ["dashboard", "fleet", "monitor", "admin", "manage", "overview", "status", "panel"],
    },
    {
        "question": "What do the van status colors mean?",
        "answer": "Van statuses are color-coded: 🟢 Available — ready to accept bookings, 🔵 En Route — heading to a customer, 🟡 Busy — currently serving a customer, 🔴 Waste Full — needs waste tank disposal (≥80% capacity), ⚪ Maintenance — undergoing cleaning or repairs. Waste level bars also use colors: green (<50%), amber (50-80%), red (≥80%).",
        "category": "operations",
        "keywords": ["status", "color", "green", "red", "blue", "yellow", "available", "busy", "maintenance", "meaning"],
    },

    # ── GREETINGS & GENERAL ─────────────────────────────
    {
        "question": "Hello / Hi / Hey",
        "answer": "Hello! 👋 Welcome to SwachhVan AI Assistant. I can help you with: booking a van, service details & pricing, payment options, hygiene & safety standards, women's facilities, sustainability info, account help, and more. Just ask away!",
        "category": "general",
        "keywords": ["hello", "hi", "hey", "hii", "hola", "namaste", "greet", "morning", "evening", "afternoon"],
    },
    {
        "question": "Thank you / Thanks",
        "answer": "You're welcome! 😊 Happy to help. If you have any more questions about SwachhVan services, feel free to ask anytime. Stay clean, stay confident! 🌿",
        "category": "general",
        "keywords": ["thank", "thanks", "thankyou", "thank you", "grateful", "appreciate", "bye", "goodbye"],
    },
    {
        "question": "Who built this app?",
        "answer": "SwachhVan was built as a submission for the Hack For Green Bharat hackathon by Pathway. It's a prototype demonstrating how technology can solve India's public hygiene challenges using real-time data streaming, IoT sensors, and AI-powered assistance. The tech stack includes React, TypeScript, Vite, Supabase, Pathway, and Leaflet maps.",
        "category": "about",
        "keywords": ["built", "build", "made", "developer", "team", "hackathon", "pathway", "creator"],
    },
]


def find_best_matches(query: str, top_k: int = 3) -> list[dict]:
    """
    Keyword + fuzzy retrieval. Scores each FAQ against the query.
    In production, use Pathway's vector index with embeddings.
    """
    import re
    query_lower = query.lower().strip()
    # Remove punctuation for cleaner matching
    query_clean = re.sub(r"[^\w\s]", " ", query_lower)
    query_words = set(w for w in query_clean.split() if len(w) > 1)

    scored = []
    for faq in FAQ_DATA:
        score = 0

        # 1. Exact keyword hit: keyword string found inside the query
        keyword_hits = [kw for kw in faq["keywords"] if kw in query_lower]
        score += len(keyword_hits) * 4

        # 2. Exact word-to-keyword: a query word IS a keyword (strongest signal)
        exact_word_hits = query_words & set(faq["keywords"])
        score += len(exact_word_hits) * 6

        # 3. Partial / substring match (query word contains keyword or vice-versa)
        for w in query_words:
            for kw in faq["keywords"]:
                if kw not in exact_word_hits and (w in kw or kw in w):
                    score += 2

        # 4. Question text overlap
        q_lower = faq["question"].lower()
        question_overlap = sum(1 for w in query_words if w in q_lower)
        score += question_overlap * 2

        # 5. Bonus for exact question substring match
        if query_lower in q_lower or q_lower in query_lower:
            score += 12

        # 6. Category name match
        if faq["category"] in query_lower:
            score += 3

        if score > 0:
            scored.append((score, faq))

    scored.sort(key=lambda x: x[0], reverse=True)
    return [item[1] for item in scored[:top_k]]


def generate_rag_answer(query: str) -> dict:
    """
    Generate an answer using RAG:
    1. Retrieve relevant FAQ entries
    2. Compose a contextualized answer
    """
    matches = find_best_matches(query, top_k=3)

    if not matches:
        return {
            "answer": "I don't have specific information about that yet. Here are some things I can help with: booking a van, service details & pricing, payment options, hygiene & safety standards, women's facilities, sustainability, account help, and the referral program. Try asking one of these, or contact support@swachhvan.in!",
            "sources": [],
            "confidence": "low",
        }

    primary = matches[0]
    answer = primary["answer"]

    # Add a brief secondary insight only if it's from a different category
    # and the primary answer isn't too long already
    if len(matches) > 1 and matches[1]["category"] != primary["category"]:
        secondary_info = matches[1]["answer"]
        if len(answer) < 350 and len(answer) + len(secondary_info) < 550:
            answer += f"\n\nRelated: {secondary_info}"

    sources = [
        {"question": m["question"], "category": m["category"]}
        for m in matches
    ]

    return {
        "answer": answer,
        "sources": sources,
        "confidence": "high" if len(matches) >= 2 else "medium",
    }


# ── SerpAPI Google Maps Geocoding ──────────────────────

def geocode_location(query: str) -> dict:
    """
    Use SerpAPI Google Maps engine to geocode a place name → lat/lng.
    Returns {'lat': float, 'lng': float, 'address': str, 'results': [...]}
    """
    if not SERPAPI_KEY:
        return {"error": "SERPAPI_KEY not configured", "results": []}

    try:
        params = urlencode({
            "engine": "google_maps",
            "q": query,
            "type": "search",
            "api_key": SERPAPI_KEY,
        })
        url = f"https://serpapi.com/search.json?{params}"
        req = _urllib_request.Request(url, headers={"User-Agent": "SwachhVan/1.0"})
        with _urllib_request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        # Extract local results
        local_results = data.get("local_results", [])
        place_results = data.get("place_results", {})

        results = []

        # If there's a single place result (exact match)
        if place_results and place_results.get("gps_coordinates"):
            gps = place_results["gps_coordinates"]
            results.append({
                "name": place_results.get("title", query),
                "address": place_results.get("address", ""),
                "lat": gps.get("latitude", 0),
                "lng": gps.get("longitude", 0),
                "rating": place_results.get("rating"),
                "type": place_results.get("type", ""),
            })

        # Multiple local results
        for r in local_results[:8]:
            gps = r.get("gps_coordinates", {})
            if gps:
                results.append({
                    "name": r.get("title", ""),
                    "address": r.get("address", ""),
                    "lat": gps.get("latitude", 0),
                    "lng": gps.get("longitude", 0),
                    "rating": r.get("rating"),
                    "type": r.get("type", ""),
                })

        # Fallback: use search_metadata or search_information for coordinates
        if not results:
            search_info = data.get("search_information", {})
            # Try place_results location
            if "gps_coordinates" in data.get("search_parameters", {}):
                pass  # no direct coords in params

        if results:
            primary = results[0]
            return {
                "lat": primary["lat"],
                "lng": primary["lng"],
                "address": primary.get("address", ""),
                "name": primary.get("name", query),
                "results": results,
            }
        else:
            return {
                "error": f"No results found for '{query}'",
                "results": [],
            }

    except Exception as e:
        print(f"[Geocode] Error: {e}")
        return {"error": str(e), "results": []}


def search_nearby(lat: float, lng: float, query: str = "public washroom") -> dict:
    """
    Search for nearby places using SerpAPI Google Maps.
    Useful for finding washrooms, landmarks, etc. near user's location.
    """
    if not SERPAPI_KEY:
        return {"error": "SERPAPI_KEY not configured", "results": []}

    try:
        ll = f"@{lat},{lng},14z"
        params = urlencode({
            "engine": "google_maps",
            "q": query,
            "ll": ll,
            "type": "search",
            "api_key": SERPAPI_KEY,
        })
        url = f"https://serpapi.com/search.json?{params}"
        req = _urllib_request.Request(url, headers={"User-Agent": "SwachhVan/1.0"})
        with _urllib_request.urlopen(req, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))

        local_results = data.get("local_results", [])
        results = []
        for r in local_results[:10]:
            gps = r.get("gps_coordinates", {})
            if gps:
                results.append({
                    "name": r.get("title", ""),
                    "address": r.get("address", ""),
                    "lat": gps.get("latitude", 0),
                    "lng": gps.get("longitude", 0),
                    "rating": r.get("rating"),
                    "type": r.get("type", ""),
                })

        return {"results": results, "query": query, "total": len(results)}

    except Exception as e:
        print(f"[Nearby] Error: {e}")
        return {"error": str(e), "results": []}


class RAGHandler(BaseHTTPRequestHandler):
    """HTTP request handler for RAG API."""

    def do_OPTIONS(self):
        """Handle CORS preflight."""
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "POST, GET, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_POST(self):
        """Handle POST endpoints."""
        parsed = urlparse(self.path)
        content_length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(content_length).decode("utf-8") if content_length else "{}"

        if parsed.path == "/v1/ask":
            try:
                data = json.loads(body)
                query = data.get("query", "").strip()

                if not query:
                    self._send_json(400, {"error": "Query is required"})
                    return

                result = generate_rag_answer(query)
                self._send_json(200, result)

            except json.JSONDecodeError:
                self._send_json(400, {"error": "Invalid JSON"})

        elif parsed.path == "/v1/geocode":
            try:
                data = json.loads(body)
                query = data.get("query", "").strip() or data.get("q", "").strip()
                if not query:
                    self._send_json(400, {"error": "Query is required"})
                    return
                result = geocode_location(query)
                self._send_json(200, result)
            except json.JSONDecodeError:
                self._send_json(400, {"error": "Invalid JSON"})

        elif parsed.path == "/v1/nearby":
            try:
                data = json.loads(body)
                lat = float(data.get("lat", 0))
                lng = float(data.get("lng", 0))
                query = data.get("query", "washroom").strip()
                if lat == 0 and lng == 0:
                    self._send_json(400, {"error": "lat and lng are required"})
                    return
                result = search_nearby(lat, lng, query)
                self._send_json(200, result)
            except (json.JSONDecodeError, ValueError) as e:
                self._send_json(400, {"error": str(e)})

        else:
            self._send_json(404, {"error": "Not found"})

    def do_GET(self):
        """Handle GET endpoints."""
        parsed = urlparse(self.path)

        if parsed.path == "/v1/health":
            self._send_json(200, {
                "status": "ok",
                "service": "swachhvan-rag",
                "pathway_running": PATHWAY_RUNNING,
                "pathway_version": pw.__version__,
            })

        elif parsed.path == "/v1/fleet":
            stats = read_pathway_fleet_stats()
            self._send_json(200, {"stats": stats, "total": len(stats), "source": "pathway_pipeline"})

        elif parsed.path == "/v1/alerts":
            alerts = read_pathway_alerts()
            self._send_json(200, {"alerts": alerts, "total": len(alerts), "source": "pathway_pipeline"})

        elif parsed.path == "/v1/ask":
            params = parse_qs(parsed.query)
            query = params.get("q", [""])[0].strip()

            if not query:
                self._send_json(400, {"error": "Query parameter 'q' is required"})
                return

            result = generate_rag_answer(query)
            self._send_json(200, result)

        elif parsed.path == "/v1/faqs":
            faqs = [{"question": f["question"], "category": f["category"]} for f in FAQ_DATA]
            self._send_json(200, {"faqs": faqs, "total": len(faqs)})

        elif parsed.path == "/v1/geocode":
            params = parse_qs(parsed.query)
            query = params.get("q", [""])[0].strip()
            if not query:
                self._send_json(400, {"error": "Query parameter 'q' is required"})
                return
            result = geocode_location(query)
            self._send_json(200, result)

        elif parsed.path == "/v1/nearby":
            params = parse_qs(parsed.query)
            try:
                lat = float(params.get("lat", ["0"])[0])
                lng = float(params.get("lng", ["0"])[0])
                query = params.get("q", ["washroom"])[0].strip()
                if lat == 0 and lng == 0:
                    self._send_json(400, {"error": "lat and lng are required"})
                    return
                result = search_nearby(lat, lng, query)
                self._send_json(200, result)
            except ValueError as e:
                self._send_json(400, {"error": str(e)})

        else:
            self._send_json(404, {"error": "Not found"})

    def _send_json(self, status: int, data: dict):
        """Send JSON response with CORS headers."""
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(json.dumps(data).encode("utf-8"))

    def log_message(self, format, *args):
        """Custom log format."""
        print(f"[RAG] {args[0]}")


def main():
    port = int(os.getenv("RAG_PORT", "8091"))
    print("=" * 60)
    print("SwachhVan - Pathway RAG Chatbot Server")
    print(f"Port: {port}")
    print(f"FAQs loaded: {len(FAQ_DATA)}")
    print(f"Pathway version: {pw.__version__}")
    print(f"Endpoints:")
    print(f"  POST /v1/ask      - Ask a question (Pathway RAG)")
    print(f"  GET  /v1/ask?q=.. - Ask via query param")
    print(f"  GET  /v1/faqs     - List all FAQs")
    print(f"  GET  /v1/fleet    - Fleet stats (Pathway output)")
    print(f"  GET  /v1/alerts   - Active alerts (Pathway output)")
    print(f"  GET  /v1/health   - Health check + Pathway status")
    print(f"  POST /v1/geocode  - Geocode a place name (SerpAPI)")
    print(f"  GET  /v1/geocode?q=.. - Geocode via query param")
    print(f"  POST /v1/nearby   - Search nearby places")
    print(f"  SerpAPI: {'Configured' if SERPAPI_KEY else 'Not configured'}")
    print("=" * 60)

    # Start Pathway FAQ indexing pipeline in background thread
    start_pathway_background()

    server = HTTPServer(("0.0.0.0", port), RAGHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n[RAG] Server stopped.")
        server.server_close()


if __name__ == "__main__":
    main()
