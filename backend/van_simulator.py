"""
SwachhVan - Van Data Simulator
Simulates 8 vans moving around Delhi NCR with GPS + sensor data.
Writes telemetry to a JSON-Lines file (for Pathway) AND updates Supabase directly.

Usage:
  pip install supabase python-dotenv requests
  python van_simulator.py

Environment variables (in .env):
  SUPABASE_URL=https://your-project.supabase.co
  SUPABASE_SERVICE_KEY=your-service-role-key
  OPENWEATHER_API_KEY=your-openweather-key (optional)
"""

import json
import math
import os
import random
import time
from datetime import datetime, timezone
from pathlib import Path

try:
    from dotenv import load_dotenv
    load_dotenv(dotenv_path=Path(__file__).parent.parent / ".env")
except ImportError:
    pass

try:
    from supabase import create_client, Client
    SUPABASE_URL = os.getenv("SUPABASE_URL") or os.getenv("VITE_SUPABASE_URL", "")
    SUPABASE_KEY = os.getenv("SUPABASE_SERVICE_KEY") or os.getenv("VITE_SUPABASE_ANON_KEY", "")
    if SUPABASE_URL and SUPABASE_KEY:
        supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)
        HAS_SUPABASE = True
    else:
        HAS_SUPABASE = False
        supabase = None
except ImportError:
    HAS_SUPABASE = False
    supabase = None

try:
    import requests
    OPENWEATHER_KEY = os.getenv("OPENWEATHER_API_KEY") or os.getenv("VITE_OPENWEATHER_API_KEY", "")
    HAS_WEATHER = bool(OPENWEATHER_KEY)
except ImportError:
    HAS_WEATHER = False
    OPENWEATHER_KEY = ""

# ── Configuration ──────────────────────────────────────
TELEMETRY_FILE = Path(__file__).parent / "data" / "van_telemetry.jsonl"
WEATHER_FILE = Path(__file__).parent / "data" / "weather.json"
UPDATE_INTERVAL = 5  # seconds between updates
WEATHER_INTERVAL = 300  # fetch weather every 5 minutes

# Delhi NCR center and boundaries
DELHI_CENTER = (28.6139, 77.2090)
DELHI_BOUNDS = {
    "lat_min": 28.50, "lat_max": 28.70,
    "lng_min": 77.10, "lng_max": 77.35,
}

# Van configurations
VANS = [
    {"van_code": "SV-01", "lat": 28.6139, "lng": 77.2090, "waste": 15, "water": 92, "status": "available"},
    {"van_code": "SV-02", "lat": 28.6280, "lng": 77.2190, "waste": 42, "water": 78, "status": "available"},
    {"van_code": "SV-03", "lat": 28.5935, "lng": 77.2167, "waste": 68, "water": 55, "status": "busy"},
    {"van_code": "SV-04", "lat": 28.6350, "lng": 77.2250, "waste": 82, "water": 30, "status": "waste_full"},
    {"van_code": "SV-05", "lat": 28.6100, "lng": 77.2300, "waste": 25, "water": 88, "status": "available"},
    {"van_code": "SV-06", "lat": 28.6450, "lng": 77.2100, "waste": 10, "water": 95, "status": "available"},
    {"van_code": "SV-07", "lat": 28.5800, "lng": 77.2350, "waste": 55, "water": 65, "status": "en_route"},
    {"van_code": "SV-08", "lat": 28.6200, "lng": 77.1950, "waste": 35, "water": 80, "status": "available"},
]


class VanSimulator:
    """Simulates a single van's movement and sensor data."""

    def __init__(self, config: dict):
        self.van_code = config["van_code"]
        self.lat = config["lat"]
        self.lng = config["lng"]
        self.waste_level = config["waste"]
        self.water_level = config["water"]
        self.status = config["status"]
        self.heading = random.uniform(0, 360)
        self.speed_kmh = random.uniform(5, 25) if self.status != "waste_full" else 0
        self.usage_count = 0

    def update(self, weather_factor: float = 1.0):
        """Advance simulation by one tick."""
        # Movement (convert speed to lat/lng delta)
        if self.status in ("available", "en_route"):
            # Random direction changes
            self.heading += random.uniform(-30, 30)
            self.heading %= 360

            # Speed variation based on weather
            base_speed = random.uniform(8, 30) * weather_factor
            self.speed_kmh = max(2, base_speed)

            # Convert km/h to degrees (rough: 1 degree ≈ 111 km)
            distance_km = (self.speed_kmh * UPDATE_INTERVAL) / 3600
            distance_deg = distance_km / 111.0

            delta_lat = distance_deg * math.cos(math.radians(self.heading))
            delta_lng = distance_deg * math.sin(math.radians(self.heading))

            self.lat += delta_lat
            self.lng += delta_lng

            # Bounce off boundaries
            if self.lat < DELHI_BOUNDS["lat_min"] or self.lat > DELHI_BOUNDS["lat_max"]:
                self.heading = 360 - self.heading
                self.lat = max(DELHI_BOUNDS["lat_min"], min(DELHI_BOUNDS["lat_max"], self.lat))
            if self.lng < DELHI_BOUNDS["lng_min"] or self.lng > DELHI_BOUNDS["lng_max"]:
                self.heading = 180 - self.heading
                self.lng = max(DELHI_BOUNDS["lng_min"], min(DELHI_BOUNDS["lng_max"], self.lng))

        elif self.status == "busy":
            self.speed_kmh = 0
            # Simulate usage: waste increases, water decreases
            self.waste_level = min(100, self.waste_level + random.randint(1, 3))
            self.water_level = max(0, self.water_level - random.randint(1, 2))
            self.usage_count += 1

            # After some time, become available again
            if self.usage_count > random.randint(3, 8):
                self.status = "available"
                self.usage_count = 0

        elif self.status == "waste_full":
            self.speed_kmh = 0
            # Simulate going to disposal center and coming back
            if random.random() < 0.05:  # 5% chance per tick to get emptied
                self.waste_level = 5
                self.water_level = 95
                self.status = "available"

        # Gradual waste accumulation for all moving vans
        if self.status == "available":
            self.waste_level = min(100, self.waste_level + random.choice([0, 0, 0, 1]))
            self.water_level = max(0, self.water_level - random.choice([0, 0, 0, 1]))

            # Random booking simulation
            if random.random() < 0.02:  # 2% chance per tick
                self.status = "busy"
                self.usage_count = 0

        # Check for waste_full threshold
        if self.waste_level >= 80 and self.status != "waste_full":
            self.status = "waste_full"

    def to_telemetry(self) -> dict:
        """Generate telemetry record."""
        return {
            "van_code": self.van_code,
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "latitude": round(self.lat, 6),
            "longitude": round(self.lng, 6),
            "heading": round(self.heading, 1),
            "speed_kmh": round(self.speed_kmh, 1),
            "waste_level": self.waste_level,
            "water_level": self.water_level,
            "occupancy_status": self.status,
        }


def fetch_weather() -> dict:
    """Fetch current weather for Delhi from OpenWeatherMap."""
    if not HAS_WEATHER:
        return {"condition": "clear", "temp_c": 28, "humidity": 55, "rain_mm": 0, "wind_kmh": 10}

    try:
        url = f"https://api.openweathermap.org/data/2.5/weather?lat={DELHI_CENTER[0]}&lon={DELHI_CENTER[1]}&appid={OPENWEATHER_KEY}&units=metric"
        resp = requests.get(url, timeout=10)
        data = resp.json()

        condition = data.get("weather", [{}])[0].get("main", "Clear").lower()
        temp = data.get("main", {}).get("temp", 28)
        humidity = data.get("main", {}).get("humidity", 55)
        rain = data.get("rain", {}).get("1h", 0)
        wind = data.get("wind", {}).get("speed", 3) * 3.6  # m/s to km/h

        weather = {
            "condition": condition,
            "temp_c": round(temp, 1),
            "humidity": humidity,
            "rain_mm": round(rain, 1),
            "wind_kmh": round(wind, 1),
            "fetched_at": datetime.now(timezone.utc).isoformat(),
        }

        # Save weather data
        WEATHER_FILE.parent.mkdir(parents=True, exist_ok=True)
        with open(WEATHER_FILE, "w") as f:
            json.dump(weather, f, indent=2)

        return weather
    except Exception as e:
        print(f"[Weather] Error fetching: {e}")
        return {"condition": "clear", "temp_c": 28, "humidity": 55, "rain_mm": 0, "wind_kmh": 10}


def get_weather_factor(weather: dict) -> float:
    """Calculate speed reduction factor based on weather."""
    factor = 1.0
    if weather.get("rain_mm", 0) > 5:
        factor *= 0.6  # Heavy rain: 40% slower
    elif weather.get("rain_mm", 0) > 1:
        factor *= 0.8  # Light rain: 20% slower
    if weather.get("wind_kmh", 0) > 40:
        factor *= 0.85
    return factor


def update_supabase(van: VanSimulator, telemetry: dict):
    """Update van position in Supabase and log telemetry."""
    if not HAS_SUPABASE or not supabase:
        return

    try:
        # Update van current position
        supabase.table("vans").update({
            "latitude": telemetry["latitude"],
            "longitude": telemetry["longitude"],
            "heading": telemetry["heading"],
            "speed_kmh": telemetry["speed_kmh"],
            "waste_level": telemetry["waste_level"],
            "water_level": telemetry["water_level"],
            "occupancy_status": telemetry["occupancy_status"],
            "last_heartbeat": telemetry["timestamp"],
        }).eq("van_code", van.van_code).execute()

        # Insert telemetry log
        supabase.table("van_telemetry").insert({
            "van_id": get_van_id(van.van_code),
            "latitude": telemetry["latitude"],
            "longitude": telemetry["longitude"],
            "waste_level": telemetry["waste_level"],
            "water_level": telemetry["water_level"],
            "speed_kmh": telemetry["speed_kmh"],
            "occupancy_status": telemetry["occupancy_status"],
        }).execute()

    except Exception as e:
        print(f"[Supabase] Error: {e}")


def check_alerts(van: VanSimulator):
    """Generate alerts based on van status."""
    if not HAS_SUPABASE or not supabase:
        return

    try:
        van_id = get_van_id(van.van_code)
        if not van_id:
            return

        # Waste full alert
        if van.waste_level >= 80:
            # Check if unresolved alert already exists
            existing = supabase.table("alerts").select("id").eq("van_id", van_id).eq("alert_type", "waste_full").eq("resolved", False).execute()
            if not existing.data:
                supabase.table("alerts").insert({
                    "van_id": van_id,
                    "alert_type": "waste_full",
                    "severity": "critical",
                    "message": f"Van {van.van_code} waste tank at {van.waste_level}%. Needs immediate disposal.",
                }).execute()
                print(f"[ALERT] {van.van_code} waste at {van.waste_level}% - CRITICAL")

        # Water low alert
        if van.water_level <= 20:
            existing = supabase.table("alerts").select("id").eq("van_id", van_id).eq("alert_type", "water_low").eq("resolved", False).execute()
            if not existing.data:
                supabase.table("alerts").insert({
                    "van_id": van_id,
                    "alert_type": "water_low",
                    "severity": "warning",
                    "message": f"Van {van.van_code} water level at {van.water_level}%. Refill needed.",
                }).execute()
                print(f"[ALERT] {van.van_code} water at {van.water_level}% - WARNING")

        # Resolve alerts when levels return to normal
        if van.waste_level < 50:
            supabase.table("alerts").update({
                "resolved": True,
                "resolved_at": datetime.now(timezone.utc).isoformat(),
            }).eq("van_id", van_id).eq("alert_type", "waste_full").eq("resolved", False).execute()

        if van.water_level > 50:
            supabase.table("alerts").update({
                "resolved": True,
                "resolved_at": datetime.now(timezone.utc).isoformat(),
            }).eq("van_id", van_id).eq("alert_type", "water_low").eq("resolved", False).execute()

    except Exception as e:
        print(f"[Alerts] Error: {e}")


# Cache van UUID lookups
_van_id_cache: dict[str, str] = {}

def get_van_id(van_code: str) -> str | None:
    """Get van UUID from van_code."""
    if van_code in _van_id_cache:
        return _van_id_cache[van_code]

    if not HAS_SUPABASE or not supabase:
        return None

    try:
        result = supabase.table("vans").select("id").eq("van_code", van_code).single().execute()
        if result.data:
            _van_id_cache[van_code] = result.data["id"]
            return result.data["id"]
    except Exception:
        pass
    return None


def main():
    """Main simulation loop."""
    print("=" * 60)
    print("SwachhVan - Van Data Simulator")
    print(f"City: Delhi NCR ({DELHI_CENTER[0]}, {DELHI_CENTER[1]})")
    print(f"Vans: {len(VANS)}")
    print(f"Supabase: {'Connected' if HAS_SUPABASE else 'Not configured'}")
    print(f"Weather API: {'Connected' if HAS_WEATHER else 'Using mock data'}")
    print(f"Update interval: {UPDATE_INTERVAL}s")
    print(f"Telemetry file: {TELEMETRY_FILE}")
    print("=" * 60)

    # Ensure data directory exists
    TELEMETRY_FILE.parent.mkdir(parents=True, exist_ok=True)

    # Initialize simulators
    simulators = [VanSimulator(v) for v in VANS]

    # Fetch initial weather
    weather = fetch_weather()
    weather_factor = get_weather_factor(weather)
    last_weather_fetch = time.time()
    print(f"[Weather] {weather['condition']}, {weather['temp_c']}°C, rain: {weather['rain_mm']}mm")

    tick = 0
    try:
        while True:
            tick += 1
            now = datetime.now(timezone.utc).strftime("%H:%M:%S")

            # Refresh weather periodically
            if time.time() - last_weather_fetch > WEATHER_INTERVAL:
                weather = fetch_weather()
                weather_factor = get_weather_factor(weather)
                last_weather_fetch = time.time()
                print(f"\n[Weather Update] {weather['condition']}, {weather['temp_c']}°C, rain: {weather['rain_mm']}mm")

            # Update each van
            with open(TELEMETRY_FILE, "a") as f:
                for sim in simulators:
                    sim.update(weather_factor)
                    telemetry = sim.to_telemetry()

                    # Write to JSONL file (for Pathway to read)
                    f.write(json.dumps(telemetry) + "\n")

                    # Update Supabase
                    update_supabase(sim, telemetry)

                    # Check alerts
                    if tick % 6 == 0:  # Check alerts every 30s
                        check_alerts(sim)

            # Print summary
            statuses = {}
            for s in simulators:
                statuses[s.status] = statuses.get(s.status, 0) + 1

            status_str = " | ".join(f"{k}: {v}" for k, v in sorted(statuses.items()))
            print(f"[{now}] Tick {tick:>4} | {status_str} | Weather: {weather_factor:.1f}x", end="\r")

            time.sleep(UPDATE_INTERVAL)

    except KeyboardInterrupt:
        print("\n\n[Simulator] Stopped by user.")


if __name__ == "__main__":
    main()
