"""
SwachhVan – Pathway Real-Time Streaming Pipeline
=================================================

Ingests van telemetry in real-time using Pathway's streaming engine.
Automatically recomputes fleet statistics, detects critical alerts,
and indexes the FAQ knowledge base whenever new data arrives.

Key Pathway features used:
  ─ pw.io.jsonlines.read()     Streaming / static ingestion from JSONL
  ─ pw.Table.groupby().reduce()Real-time fleet aggregations
  ─ pw.Table.filter()          Alert detection (waste ≥ 80 %, water ≤ 20 %)
  ─ pw.Table.select()          Column projection & enrichment
  ─ pw.Table.concat()          Union of alert streams
  ─ @pw.udf                    Custom Python logic inside the dataflow
  ─ pw.apply()                 Inline transforms on columns
  ─ pw.io.jsonlines.write()    Streaming output (auto-updated)
  ─ pw.run()                   Launches the Pathway streaming engine

Hackathon rule satisfied:
  "If your system does not update automatically when new data arrives,
   it is not a Pathway project."
  → This pipeline watches data/van_stream/ for new JSONL files.
    Every time van_simulator.py writes a new batch, Pathway
    recomputes stats, alerts, and outputs – fully automatic.

Usage:
  pip install pathway python-dotenv
  python pathway_pipeline.py
"""

import json
import os
from pathlib import Path

try:
    from dotenv import load_dotenv

    load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")
except ImportError:
    pass

import pathway as pw

# ── Directories ────────────────────────────────────────
STREAM_DIR = Path(__file__).parent / "data" / "van_stream"
FAQ_DIR = Path(__file__).parent / "data" / "faq"
OUTPUT_DIR = Path(__file__).parent / "data" / "output"


# ── Schema Definitions ─────────────────────────────────


class TelemetrySchema(pw.Schema):
    """Schema for van GPS + sensor telemetry records."""

    van_code: str
    timestamp: str
    latitude: float
    longitude: float
    heading: float
    speed_kmh: float
    waste_level: int
    water_level: int
    occupancy_status: str


class FAQSchema(pw.Schema):
    """Schema for FAQ knowledge-base entries."""

    question: str
    answer: str
    category: str
    keywords: str  # comma-separated keyword list


# ── Pathway UDFs (User-Defined Functions) ──────────────


@pw.udf
def classify_zone(lat: float, lng: float) -> str:
    """Map a GPS coordinate to a Delhi NCR zone name."""
    if lat > 28.65:
        return "North Delhi"
    if lat < 28.58:
        return "South Delhi"
    if lng > 77.25:
        return "East Delhi"
    if lng < 77.18:
        return "West Delhi"
    return "Central Delhi"


@pw.udf
def build_alert_message(van_code: str, waste: int, water: int) -> str:
    """Produce a human-readable alert string for a single telemetry row."""
    parts: list[str] = []
    if waste >= 80:
        parts.append(f"CRITICAL – {van_code} waste tank at {waste}%, needs immediate disposal")
    if water <= 20:
        parts.append(f"WARNING – {van_code} water level at {water}%, refill needed")
    return " | ".join(parts) if parts else ""


@pw.udf
def alert_severity(waste: int, water: int) -> str:
    """Return the highest severity among active alert conditions."""
    if waste >= 80:
        return "critical"
    if water <= 20:
        return "warning"
    return "ok"


# ── Pipeline Construction ──────────────────────────────


def build_pipeline():
    """Wire up the full Pathway dataflow graph."""

    # ── 1. STREAM TELEMETRY ────────────────────────────
    # Pathway watches this directory; any new JSONL file triggers recomputation.
    telemetry = pw.io.jsonlines.read(
        str(STREAM_DIR),
        schema=TelemetrySchema,
        mode="streaming",
    )
    print(f"[Pipeline] Telemetry ingestion  ← {STREAM_DIR}")

    # ── 2. ENRICH TELEMETRY ────────────────────────────
    # Add zone classification and alert message per row using UDFs.
    enriched = telemetry.select(
        van_code=telemetry.van_code,
        timestamp=telemetry.timestamp,
        latitude=telemetry.latitude,
        longitude=telemetry.longitude,
        heading=telemetry.heading,
        speed_kmh=telemetry.speed_kmh,
        waste_level=telemetry.waste_level,
        water_level=telemetry.water_level,
        occupancy_status=telemetry.occupancy_status,
        zone=classify_zone(telemetry.latitude, telemetry.longitude),
        alert_msg=build_alert_message(
            telemetry.van_code,
            telemetry.waste_level,
            telemetry.water_level,
        ),
        severity=alert_severity(telemetry.waste_level, telemetry.water_level),
    )
    print("[Pipeline] Enrichment (zone + alerts) configured")

    # ── 3. FLEET STATISTICS ────────────────────────────
    # Real-time per-van aggregation – auto-updates as new rows arrive.
    fleet_stats = telemetry.groupby(telemetry.van_code).reduce(
        van_code=telemetry.van_code,
        avg_waste=pw.reducers.avg(telemetry.waste_level),
        avg_water=pw.reducers.avg(telemetry.water_level),
        max_waste=pw.reducers.max(telemetry.waste_level),
        min_water=pw.reducers.min(telemetry.water_level),
        latest_speed=pw.reducers.max(telemetry.speed_kmh),
        record_count=pw.reducers.count(),
        latest_timestamp=pw.reducers.max(telemetry.timestamp),
    )
    print("[Pipeline] Fleet stats (groupby → reduce) configured")

    # ── 4. ALERT DETECTION ─────────────────────────────
    # Two parallel filters merged via concat – only rows with alerts.
    waste_alerts = telemetry.filter(telemetry.waste_level >= 80).select(
        van_code=telemetry.van_code,
        timestamp=telemetry.timestamp,
        latitude=telemetry.latitude,
        longitude=telemetry.longitude,
        waste_level=telemetry.waste_level,
        water_level=telemetry.water_level,
        alert_type=pw.apply(lambda _: "waste_full", telemetry.van_code),
        severity=pw.apply(lambda _: "critical", telemetry.van_code),
        message=pw.apply(
            lambda vc, wl: f"Van {vc} waste tank at {wl}%. Needs immediate disposal.",
            telemetry.van_code,
            telemetry.waste_level,
        ),
    )

    water_alerts = telemetry.filter(telemetry.water_level <= 20).select(
        van_code=telemetry.van_code,
        timestamp=telemetry.timestamp,
        latitude=telemetry.latitude,
        longitude=telemetry.longitude,
        waste_level=telemetry.waste_level,
        water_level=telemetry.water_level,
        alert_type=pw.apply(lambda _: "water_low", telemetry.van_code),
        severity=pw.apply(lambda _: "warning", telemetry.van_code),
        message=pw.apply(
            lambda vc, wl: f"Van {vc} water level at {wl}%. Refill needed.",
            telemetry.van_code,
            telemetry.water_level,
        ),
    )

    all_alerts = waste_alerts.concat(water_alerts)
    print("[Pipeline] Alert detection (filter + concat) configured")

    # ── 5. FAQ KNOWLEDGE BASE ──────────────────────────
    # Also streamed through Pathway – if new FAQ entries are added,
    # the index auto-updates (satisfies the hackathon rule).
    faq_index = pw.io.jsonlines.read(
        str(FAQ_DIR),
        schema=FAQSchema,
        mode="streaming",
    )
    print(f"[Pipeline] FAQ knowledge base   ← {FAQ_DIR}")

    # ── 6. WRITE OUTPUTS ───────────────────────────────
    # Pathway automatically overwrites these when upstream data changes.
    pw.io.jsonlines.write(enriched, str(OUTPUT_DIR / "enriched_telemetry.jsonl"))
    pw.io.jsonlines.write(fleet_stats, str(OUTPUT_DIR / "fleet_stats.jsonl"))
    pw.io.jsonlines.write(all_alerts, str(OUTPUT_DIR / "alerts.jsonl"))
    pw.io.jsonlines.write(faq_index, str(OUTPUT_DIR / "faq_index.jsonl"))
    print(f"[Pipeline] Outputs              → {OUTPUT_DIR}")


# ── Seed FAQ Data ──────────────────────────────────────


def seed_faq_file():
    """Create the FAQ JSONL file if it doesn't exist yet."""
    faq_path = FAQ_DIR / "knowledge_base.jsonl"
    if faq_path.exists():
        return

    faqs = [
        {"question": "How clean are the toilets?", "answer": "Every SwachhVan washroom is sanitized after each use using eco-friendly disinfectants. Users rate cleanliness after each visit, and our average rating is 4.5/5 stars. Vans with ratings below 3.5 are pulled for deep cleaning.", "category": "hygiene", "keywords": "clean,toilet,hygiene,sanitize,wash,dirty,cleanliness,germs,bacteria,disinfect"},
        {"question": "What hygiene standards do you follow?", "answer": "We follow five key hygiene standards: 1) Cleaned after every use, 2) Eco-friendly disinfectants, 3) Separate waste & water tanks sealed to prevent contamination, 4) Real-time cleanliness ratings by users, 5) Trained sanitation staff following strict SOPs.", "category": "hygiene", "keywords": "hygiene,standard,protocol,sop,cleaning,disinfect,sanitize,trained,staff,operator"},
        {"question": "What services are available?", "answer": "SwachhVan offers three services: 1) Washroom (₹10) – Clean western-style toilet, 2) Fresh-up (₹20) – Extra cleaning support with tissues and sanitizer, 3) Sanitary Pads (from ₹20) – Discreet purchase via in-van vending machine.", "category": "services", "keywords": "service,washroom,fresh,pads,sanitary,price,cost,available,offer,provide"},
        {"question": "What are the prices?", "answer": "Washroom use costs ₹10, Fresh-up service costs ₹20 (includes tissues + sanitizer + quick clean), Sanitary Pads start from ₹20. No hidden charges – the price shown is exactly what you pay.", "category": "services", "keywords": "price,cost,charge,fee,amount,rupee,10,20,how much,expensive,cheap,affordable"},
        {"question": "How do I book a van?", "answer": "1) Open the app and share your location, 2) Pick a service – Washroom, Fresh-up, or Pads, 3) Choose payment – Cash or Online UPI/card, 4) Confirm – nearest van heads to you in ~5-15 minutes.", "category": "booking", "keywords": "book,booking,order,request,how,use,app,reserve,schedule,find"},
        {"question": "How long does a van take to arrive?", "answer": "Average ETA is 5-15 minutes depending on your location and van availability. The app shows real-time ETA based on GPS tracking and traffic conditions.", "category": "booking", "keywords": "eta,arrive,time,long,wait,minutes,booking,fast,how long,reach,come"},
        {"question": "How do I pay?", "answer": "We accept Cash on Delivery (pay on arrival) and Online Payment via UPI or card. No hidden charges.", "category": "payment", "keywords": "pay,payment,money,cost,upi,card,cash,cod,price,how pay,mode"},
        {"question": "Is it safe for women?", "answer": "Our vans feature privacy-first interiors with secure locks, well-lit spaces, sound insulation, and a dedicated Period Emergency booking mode for urgent menstrual hygiene needs.", "category": "safety", "keywords": "women,safe,safety,privacy,period,emergency,female,lady,girl,secure,lock"},
        {"question": "How does SwachhVan help the environment?", "answer": "Waste-to-energy conversion (biogas), organic fertilizer production, reduced open defecation, lower methane emissions, and water-efficient washroom systems saving ~3 litres per visit.", "category": "sustainability", "keywords": "environment,green,eco,sustainable,energy,circular,carbon,planet,nature,climate"},
        {"question": "How does waste management work?", "answer": "Waste is collected in sealed tanks, transported to authorized treatment facilities. Organic waste is converted into biogas and fertilizer. IoT sensors monitor waste levels in real-time.", "category": "sustainability", "keywords": "waste,management,disposal,biogas,fertilizer,environment,pollution,recycle,treatment"},
        {"question": "What technology does SwachhVan use?", "answer": "React + TypeScript frontend with Vite, Supabase for real-time database and auth, Pathway for streaming data pipeline powering live van tracking & RAG chatbot, Leaflet maps, and IoT sensors.", "category": "technology", "keywords": "technology,tech,stack,pathway,supabase,react,ai,iot,software,app"},
        {"question": "How are van locations tracked?", "answer": "GPS trackers stream location data every 5 seconds into our Pathway real-time pipeline, which updates the live map, calculates ETAs, and triggers proximity-based booking matches.", "category": "technology", "keywords": "track,gps,location,map,real-time,pathway,live,position,satellite,navigate"},
        {"question": "What is the Pathway pipeline?", "answer": "Pathway is our real-time streaming engine. It ingests van telemetry every 5 seconds, computes fleet-wide statistics, detects critical alerts (waste ≥ 80%, water ≤ 20%), powers the live dashboard, and enables this RAG chatbot.", "category": "technology", "keywords": "pathway,pipeline,streaming,real-time,engine,data,telemetry,process"},
        {"question": "What happens when waste tank is full?", "answer": "IoT sensors monitor waste levels. At 80% capacity, Pathway triggers a critical alert and the van is directed to the nearest disposal center. Dashboard shows color-coded levels: green (<50%), amber (50-80%), red (≥80%).", "category": "operations", "keywords": "waste,full,tank,sensor,alert,disposal,capacity,80,level,overflow"},
        {"question": "Can I rate my experience?", "answer": "Rate hygiene 1-5 stars, select feedback tags like 'Clean & hygienic' or 'Quick arrival', and leave a note. Ratings influence van maintenance and operator performance.", "category": "feedback", "keywords": "rate,rating,feedback,review,stars,experience,quality,improve,complaint"},
        {"question": "What is SwachhVan?", "answer": "SwachhVan is a mobile-first platform deploying GPS-tracked washroom vans across cities. Four pillars: Mobility, Hygiene, Sustainability, and Inclusivity.", "category": "about", "keywords": "what,swachhvan,about,who,company,mission,vision,purpose,mobile washroom"},
        {"question": "How does SwachhVan work?", "answer": "1) Find nearby vans on the live map, 2) Pick a service – Washroom (₹10), Fresh-up (₹20), or Pads (₹20), 3) Book & pay, 4) Van arrives in ~5-15 min with strict hygiene protocols.", "category": "about", "keywords": "how,work,process,step,flow,use,explain,overview"},
        {"question": "What is the Refer & Earn program?", "answer": "Share your referral code. When friends sign up and complete their first booking, both earn reward credits for discounts on future services.", "category": "referral", "keywords": "refer,referral,earn,invite,friend,share,code,reward,credit,discount,bonus"},
        {"question": "How do I contact support?", "answer": "In-app Chat (recommended), Phone helpline 9 AM – 9 PM, or Email support@swachhvan.in.", "category": "support", "keywords": "contact,support,help,helpline,phone,call,email,reach,customer service,assistance"},
        {"question": "Hello", "answer": "Hello! Welcome to SwachhVan AI Assistant. I can help with booking, pricing, hygiene, safety, sustainability, and more. Just ask!", "category": "general", "keywords": "hello,hi,hey,hii,hola,namaste,greet,morning,evening,afternoon"},
        {"question": "Who built this app?", "answer": "SwachhVan was built for the Hack For Green Bharat hackathon. Tech stack: React, TypeScript, Vite, Supabase, Pathway real-time streaming, and Leaflet maps.", "category": "about", "keywords": "built,build,made,developer,team,hackathon,pathway,creator"},
    ]

    FAQ_DIR.mkdir(parents=True, exist_ok=True)
    with open(faq_path, "w", encoding="utf-8") as f:
        for entry in faqs:
            f.write(json.dumps(entry, ensure_ascii=False) + "\n")
    print(f"[Seed] Wrote {len(faqs)} FAQ entries → {faq_path}")


# ── Entry Point ────────────────────────────────────────


def main():
    print("=" * 60)
    print("  SwachhVan – Pathway Real-Time Streaming Pipeline")
    print("=" * 60)

    # Ensure directories exist
    STREAM_DIR.mkdir(parents=True, exist_ok=True)
    FAQ_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

    # Seed FAQ data if missing
    seed_faq_file()

    # Build the Pathway dataflow graph
    build_pipeline()

    print()
    print("[Engine] Starting Pathway streaming engine …")
    print("[Engine] Pipeline will auto-update when new JSONL data arrives.")
    print("[Engine] Press Ctrl+C to stop.")
    print()

    # Launch the Pathway engine – blocks until interrupted
    pw.run(monitoring_level=pw.MonitoringLevel.NONE)


if __name__ == "__main__":
    main()
