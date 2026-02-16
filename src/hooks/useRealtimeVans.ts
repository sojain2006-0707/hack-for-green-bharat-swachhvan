/**
 * useRealtimeVans - React hook for real-time van tracking
 * Subscribes to van position updates via Supabase Realtime
 * Falls back to mock simulation when Supabase is not configured
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  type Van,
  type VanAlert,
  type FleetStats,
  type WeatherData,
  fetchVans,
  fetchAlerts,
  subscribeToVans,
  subscribeToAlerts,
  getFleetStats,
  fetchWeather,
  calculateETA,
  findNearestVan,
} from "@/lib/vanService";

// ── useRealtimeVans ────────────────────────────────────

export function useRealtimeVans() {
  const [vans, setVans] = useState<Van[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    async function init() {
      try {
        const initialVans = await fetchVans();
        setVans(initialVans);
        setLoading(false);

        unsubscribe = subscribeToVans((updatedVans) => {
          setVans(updatedVans);
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load vans");
        setLoading(false);
      }
    }

    init();

    return () => {
      unsubscribe?.();
    };
  }, []);

  const availableCount = vans.filter((v) => v.occupancy_status === "available").length;
  const busyCount = vans.filter((v) => v.occupancy_status === "busy").length;
  const nearestEta = useCallback(
    (userLat: number, userLng: number) => {
      const available = vans.filter((v) => v.occupancy_status === "available");
      if (available.length === 0) return null;

      let minEta = Infinity;
      for (const van of available) {
        const eta = calculateETA(userLat, userLng, van.latitude, van.longitude);
        if (eta < minEta) minEta = eta;
      }
      return minEta === Infinity ? null : minEta;
    },
    [vans]
  );

  return {
    vans,
    loading,
    error,
    availableCount,
    busyCount,
    totalCount: vans.length,
    nearestEta,
  };
}

// ── useRealtimeAlerts ──────────────────────────────────

export function useRealtimeAlerts() {
  const [alerts, setAlerts] = useState<VanAlert[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let unsubscribe: (() => void) | null = null;

    async function init() {
      const initialAlerts = await fetchAlerts();
      setAlerts(initialAlerts);
      setLoading(false);

      unsubscribe = subscribeToAlerts((updatedAlerts) => {
        setAlerts(updatedAlerts);
      });
    }

    init();

    return () => {
      unsubscribe?.();
    };
  }, []);

  const criticalCount = alerts.filter((a) => a.severity === "critical").length;
  const warningCount = alerts.filter((a) => a.severity === "warning").length;

  return {
    alerts,
    loading,
    criticalCount,
    warningCount,
    totalAlerts: alerts.length,
  };
}

// ── useFleetStats ──────────────────────────────────────

export function useFleetStats(refreshInterval = 10000) {
  const [stats, setStats] = useState<FleetStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await getFleetStats();
      setStats(data);
      setLoading(false);
    }

    load();
    const interval = setInterval(load, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  return { stats, loading };
}

// ── useWeather ─────────────────────────────────────────

export function useWeather(refreshInterval = 300000) {
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const data = await fetchWeather();
      setWeather(data);
      setLoading(false);
    }

    load();
    const interval = setInterval(load, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  return { weather, loading };
}

// ── useUserLocation ────────────────────────────────────

export function useUserLocation() {
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!navigator.geolocation) {
      setError("Geolocation is not supported");
      setLocation({ lat: 28.6139, lng: 77.2090 }); // Delhi fallback
      setLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
        setLoading(false);
      },
      (err) => {
        setError(err.message);
        setLocation({ lat: 28.6139, lng: 77.2090 }); // Delhi fallback
        setLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  }, []);

  return { location, error, loading };
}

// ── useNearestVan ──────────────────────────────────────

export function useNearestVan(userLat?: number, userLng?: number) {
  const [nearestVan, setNearestVan] = useState<Van | null>(null);
  const [eta, setEta] = useState<number | null>(null);

  const lat = userLat ?? 28.6139;
  const lng = userLng ?? 77.2090;

  useEffect(() => {
    async function find() {
      const van = await findNearestVan(lat, lng);
      setNearestVan(van);
      if (van) {
        setEta(calculateETA(lat, lng, van.latitude, van.longitude));
      }
    }

    find();
    const interval = setInterval(find, 10000);
    return () => clearInterval(interval);
  }, [lat, lng]);

  return { nearestVan, eta };
}
