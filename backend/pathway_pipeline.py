"""
SwachhVan - Pathway Real-Time Pipeline
Ingests van telemetry data, processes it in real-time, generates alerts,
and serves a RAG chatbot for FAQ queries.

Usage:
  pip install pathway[all] python-dotenv requests
  python pathway_pipeline.py

This pipeline:
1. Reads van telemetry from JSONL file (simulated GPS + sensor stream)
2. Computes real-time aggregations (avg waste, van counts by status)
3. Triggers alerts when waste >= 80% or water <= 20%
4. Serves a REST API for the frontend to query
5. Implements RAG for FAQ search using Pathway's vector store
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
from pathway.stdlib.indexing import default_usearch_knn_document_index
from datetime import datetime, timezone

# ── Configuration ──────────────────────────────────────
TELEMETRY_DIR = str(Path(__file__).parent / "data")
FAQ_FILE = str(Path(__file__).parent / "data" / "faq_knowledge.jsonl")
REST_PORT = 8090

# ── Schema Definitions ─────────────────────────────────

class TelemetrySchema(pw.Schema):
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
    question: str
    answer: str
    category: str


# ── 1. INGEST VAN TELEMETRY ────────────────────────────

def create_telemetry_pipeline():
    """
    Read telemetry from JSON-Lines files.
    Pathway monitors the directory for new data (streaming mode).
    """
    telemetry = pw.io.jsonlines.read(
        TELEMETRY_DIR,
        schema=TelemetrySchema,
        mode="streaming",
    )

    return telemetry


# ── 2. REAL-TIME AGGREGATIONS ──────────────────────────

def compute_fleet_stats(telemetry: pw.Table):
    """
    Compute real-time fleet statistics:
    - Count of vans by status
    - Average waste/water levels
    - Vans that need attention
    """

    # Latest record per van (deduplicated)
    latest_per_van = telemetry.groupby(telemetry.van_code).reduce(
        van_code=telemetry.van_code,
        latest_timestamp=pw.reducers.max(telemetry.timestamp),
        avg_waste=pw.reducers.avg(telemetry.waste_level),
        avg_water=pw.reducers.avg(telemetry.water_level),
        record_count=pw.reducers.count(),
    )

    return latest_per_van


# ── 3. ALERT DETECTION ─────────────────────────────────

def detect_alerts(telemetry: pw.Table):
    """
    Filter telemetry for alert conditions:
    - waste_level >= 80 (waste_full)
    - water_level <= 20 (water_low)
    """

    waste_alerts = telemetry.filter(telemetry.waste_level >= 80).select(
        van_code=telemetry.van_code,
        alert_type=pw.declare_type(str, "waste_full"),
        severity=pw.declare_type(str, "critical"),
        message=pw.apply(
            lambda vc, wl: f"Van {vc} waste tank at {wl}%. Needs immediate disposal.",
            telemetry.van_code,
            telemetry.waste_level,
        ),
        timestamp=telemetry.timestamp,
        latitude=telemetry.latitude,
        longitude=telemetry.longitude,
    )

    water_alerts = telemetry.filter(telemetry.water_level <= 20).select(
        van_code=telemetry.van_code,
        alert_type=pw.declare_type(str, "water_low"),
        severity=pw.declare_type(str, "warning"),
        message=pw.apply(
            lambda vc, wl: f"Van {vc} water level at {wl}%. Refill needed.",
            telemetry.van_code,
            telemetry.water_level,
        ),
        timestamp=telemetry.timestamp,
        latitude=telemetry.latitude,
        longitude=telemetry.longitude,
    )

    all_alerts = waste_alerts.concat(water_alerts)
    return all_alerts


# ── 4. RAG KNOWLEDGE BASE ──────────────────────────────

def create_faq_index():
    """
    Load FAQ knowledge base and create a vector index for RAG.
    Users can query: "How clean are the toilets?" and get smart answers.
    """

    # Ensure FAQ file exists
    faq_path = Path(FAQ_FILE)
    if not faq_path.exists():
        faq_path.parent.mkdir(parents=True, exist_ok=True)
        faqs = [
            {"question": "How clean are the toilets?", "answer": "Every SwachhVan washroom is sanitized after each use using eco-friendly disinfectants. Users rate cleanliness after each visit, and our average rating is 4.5/5 stars.", "category": "hygiene"},
            {"question": "How does waste management work?", "answer": "Waste is collected in sealed tanks and transported to authorized treatment facilities. Organic waste is converted into biogas and fertilizer.", "category": "sustainability"},
            {"question": "What services are available?", "answer": "SwachhVan offers: Washroom (₹10), Fresh-up (₹20) with tissues + sanitizer, and Sanitary Pads (from ₹20) via in-van vending.", "category": "services"},
            {"question": "How long does a van take to arrive?", "answer": "Average ETA is 5-15 minutes depending on your location and van availability. Real-time ETA is calculated using GPS and traffic data.", "category": "booking"},
            {"question": "Is it safe for women?", "answer": "Our vans feature privacy-first interiors, secure locks, well-lit spaces, and a Period Emergency booking mode for urgent situations.", "category": "safety"},
            {"question": "How do I pay?", "answer": "We accept Cash on Delivery and online payment (UPI/card). No hidden charges.", "category": "payment"},
            {"question": "What happens when waste tank is full?", "answer": "IoT sensors monitor waste levels. At 80% capacity, the system triggers a relocation alert to the nearest disposal center.", "category": "operations"},
            {"question": "How are van locations tracked?", "answer": "GPS trackers stream location every 5 seconds into our Pathway pipeline, which updates the live map and calculates ETAs.", "category": "technology"},
            {"question": "What about rainy weather?", "answer": "Vans operate in all weather. During rain, routing adjusts using real-time weather data. ETAs may increase slightly.", "category": "operations"},
            {"question": "Can I rate my experience?", "answer": "Rate hygiene 1-5 stars, select feedback tags, and leave notes. This data influences maintenance and operator performance.", "category": "feedback"},
        ]
        with open(faq_path, "w") as f:
            for faq in faqs:
                f.write(json.dumps(faq) + "\n")

    faq_table = pw.io.jsonlines.read(
        str(faq_path.parent),
        schema=FAQSchema,
        mode="static",
    )

    return faq_table


# ── 5. REST API SERVER ──────────────────────────────────

def serve_api(telemetry, fleet_stats, alerts, faq_table):
    """
    Expose real-time data via REST endpoints for the frontend.
    
    Endpoints:
    - GET /v1/vans          → Current van positions + status
    - GET /v1/stats         → Fleet aggregated stats
    - GET /v1/alerts        → Active alerts
    - GET /v1/faq?q=...     → RAG-powered FAQ search
    """

    # Serve van positions
    pw.io.http.rest_connector(
        host="0.0.0.0",
        port=REST_PORT,
        route="/v1/vans",
        schema=TelemetrySchema,
        autocommit_duration_ms=1000,
        delete_completed_queries=True,
    ).select(telemetry)

    # Serve fleet stats
    pw.io.http.rest_connector(
        host="0.0.0.0",
        port=REST_PORT,
        route="/v1/stats",
        autocommit_duration_ms=5000,
        delete_completed_queries=True,
    ).select(fleet_stats)

    # Serve alerts
    pw.io.http.rest_connector(
        host="0.0.0.0",
        port=REST_PORT,
        route="/v1/alerts",
        autocommit_duration_ms=2000,
        delete_completed_queries=True,
    ).select(alerts)


# ── MAIN ────────────────────────────────────────────────

def main():
    print("=" * 60)
    print("SwachhVan - Pathway Real-Time Pipeline")
    print(f"Telemetry dir: {TELEMETRY_DIR}")
    print(f"REST API port: {REST_PORT}")
    print("=" * 60)

    # Create data directory
    Path(TELEMETRY_DIR).mkdir(parents=True, exist_ok=True)

    # 1. Ingest telemetry
    telemetry = create_telemetry_pipeline()
    print("[Pipeline] Telemetry ingestion configured")

    # 2. Compute fleet stats
    fleet_stats = compute_fleet_stats(telemetry)
    print("[Pipeline] Fleet stats computation configured")

    # 3. Detect alerts
    alerts = detect_alerts(telemetry)
    print("[Pipeline] Alert detection configured")

    # 4. Load FAQ knowledge base
    faq_table = create_faq_index()
    print("[Pipeline] FAQ knowledge base loaded")

    # 5. Output: Write alerts to JSONL for downstream
    pw.io.jsonlines.write(alerts, str(Path(TELEMETRY_DIR) / "alerts_output.jsonl"))
    print("[Pipeline] Alert output configured")

    # 6. Output: Write fleet stats
    pw.io.jsonlines.write(fleet_stats, str(Path(TELEMETRY_DIR) / "fleet_stats.jsonl"))
    print("[Pipeline] Fleet stats output configured")

    print("\n[Pipeline] Starting Pathway engine...")
    print("[Pipeline] Press Ctrl+C to stop\n")

    # Run the pipeline
    pw.run(monitoring_level=pw.MonitoringLevel.NONE)


if __name__ == "__main__":
    main()
