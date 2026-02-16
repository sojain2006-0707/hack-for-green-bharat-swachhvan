/**
 * LiveMap - Leaflet + OpenStreetMap component with real-time van tracking
 * 100% FREE — no API key required.
 * Shows live van positions, user location, and interactive van selection.
 */

import "leaflet/dist/leaflet.css";
import { cn } from "@/lib/utils";
import type { Van } from "@/lib/vanService";
import { calculateETA } from "@/lib/vanService";
import { useEffect, useMemo } from "react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";

// Fix Leaflet default marker icon issue with bundlers
// eslint-disable-next-line @typescript-eslint/no-explicit-any
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

// ── Types ──────────────────────────────────────────────

interface LiveMapProps {
  className?: string;
  vans: Van[];
  userLocation?: { lat: number; lng: number } | null;
  selectedVanId?: string | null;
  onSelectVan?: (van: Van) => void;
  showTraffic?: boolean;
  interactive?: boolean;
}

// ── Status Colors ──────────────────────────────────────

const STATUS_COLORS: Record<string, string> = {
  available: "#16a34a",   // green
  busy: "#f59e0b",        // amber
  en_route: "#3b82f6",    // blue
  waste_full: "#ef4444",  // red
  maintenance: "#6b7280", // gray
};

const STATUS_LABELS: Record<string, string> = {
  available: "Available",
  busy: "In Use",
  en_route: "En Route",
  waste_full: "Waste Full",
  maintenance: "Maintenance",
};

// ── Custom Van Icon ────────────────────────────────────

function createVanIcon(van: Van, isSelected: boolean, eta: number | null): L.DivIcon {
  const color = STATUS_COLORS[van.occupancy_status] ?? "#6b7280";
  return L.divIcon({
    className: "",
    iconSize: [80, 42],
    iconAnchor: [40, 42],
    popupAnchor: [0, -42],
    html: `
      <div style="
        display: flex;
        flex-direction: column;
        align-items: center;
        cursor: pointer;
        transform: scale(${isSelected ? 1.3 : 1});
        transition: transform 0.2s ease;
      ">
        <div style="
          background: ${color};
          color: white;
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 10px;
          font-weight: 700;
          white-space: nowrap;
          box-shadow: 0 2px 8px rgba(0,0,0,0.25);
          border: 2px solid ${isSelected ? "white" : "transparent"};
        ">
          ${van.van_code}${eta ? ` · ${eta}m` : ""}
        </div>
        <div style="
          width: 16px; height: 16px;
          background: ${color};
          border: 2.5px solid white;
          border-radius: 50%;
          margin-top: -3px;
          box-shadow: 0 1px 4px rgba(0,0,0,0.3);
        "></div>
        <div style="
          width: 2px; height: 6px;
          background: ${color};
          margin-top: -2px;
        "></div>
      </div>
    `,
  });
}

function createUserIcon(): L.DivIcon {
  return L.divIcon({
    className: "",
    iconSize: [20, 20],
    iconAnchor: [10, 10],
    html: `
      <div style="position: relative;">
        <div style="
          width: 16px; height: 16px;
          background: #1d4ed8;
          border: 3px solid white;
          border-radius: 50%;
          box-shadow: 0 0 0 2px rgba(29,78,216,0.3), 0 2px 6px rgba(0,0,0,0.3);
        "></div>
        <div style="
          position: absolute; top: -2px; left: -2px;
          width: 20px; height: 20px;
          border-radius: 50%;
          background: rgba(29,78,216,0.15);
          animation: pulse 2s infinite;
        "></div>
      </div>
    `,
  });
}

// ── Auto-Center Helper ─────────────────────────────────

function MapCenter({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], map.getZoom(), { animate: true });
  }, [map, lat, lng]);
  return null;
}

// ── Map Component ──────────────────────────────────────

export default function LiveMap({
  className,
  vans,
  userLocation,
  selectedVanId,
  onSelectVan,
  interactive = true,
}: LiveMapProps) {
  const center = userLocation ?? { lat: 28.6139, lng: 77.2090 };
  const userIcon = useMemo(() => createUserIcon(), []);

  return (
    <div className={cn("relative overflow-hidden rounded-2xl", className)} style={{ isolation: "isolate", zIndex: 0 }}>
      <MapContainer
        center={[center.lat, center.lng]}
        zoom={13}
        scrollWheelZoom={interactive}
        dragging={interactive}
        zoomControl={interactive}
        style={{ height: "100%", width: "100%", minHeight: 260 }}
        attributionControl={true}
      >
        {/* Free OpenStreetMap tiles — no API key */}
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <MapCenter lat={center.lat} lng={center.lng} />

        {/* User location marker */}
        {userLocation && (
          <Marker position={[userLocation.lat, userLocation.lng]} icon={userIcon}>
            <Popup>
              <strong>Your Location</strong>
            </Popup>
          </Marker>
        )}

        {/* Van markers */}
        {vans.map((van) => {
          const isSelected = van.id === selectedVanId;
          const eta = userLocation
            ? calculateETA(userLocation.lat, userLocation.lng, van.latitude, van.longitude)
            : null;
          const icon = createVanIcon(van, isSelected, eta);
          const statusLabel = STATUS_LABELS[van.occupancy_status] ?? van.occupancy_status;

          return (
            <Marker
              key={van.id}
              position={[van.latitude, van.longitude]}
              icon={icon}
              eventHandlers={{
                click: () => onSelectVan?.(van),
              }}
            >
              <Popup>
                <div style={{ minWidth: 140 }}>
                  <strong>{van.van_code}</strong> — {statusLabel}
                  <br />
                  <span style={{ fontSize: 11 }}>
                    Waste: {van.waste_level}% · Water: {van.water_level}%
                  </span>
                  {eta && (
                    <>
                      <br />
                      <span style={{ fontSize: 11, color: "#16a34a" }}>
                        ETA: ~{eta} min
                      </span>
                    </>
                  )}
                  {van.operator_name && (
                    <>
                      <br />
                      <span style={{ fontSize: 11, color: "#6b7280" }}>
                        Operator: {van.operator_name}
                      </span>
                    </>
                  )}
                </div>
              </Popup>
            </Marker>
          );
        })}
      </MapContainer>

      {/* Map legend */}
      <div className="absolute bottom-3 left-3 z-[1000] rounded-xl bg-white/90 px-3 py-2 shadow-soft ring-1 ring-black/10 backdrop-blur text-[10px]">
        <div className="flex items-center gap-3">
          {Object.entries(STATUS_COLORS).slice(0, 4).map(([status, color]) => (
            <div key={status} className="flex items-center gap-1">
              <div className="h-2 w-2 rounded-full" style={{ background: color }} />
              <span className="capitalize">{STATUS_LABELS[status] ?? status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}


