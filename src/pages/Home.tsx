import PhoneShell from "@/components/layout/PhoneShell";
import AppMenu from "@/components/menu/AppMenu";
import LiveMap from "@/components/map/LiveMap";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { Droplet, MapPin, Package, Pencil, Toilet, AlertTriangle, Search, X, Loader2 } from "lucide-react";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useRealtimeVans, useUserLocation, useNearestVan, useRealtimeAlerts } from "@/hooks/useRealtimeVans";
import type { Van } from "@/lib/vanService";
import { geocodePlace } from "@/lib/vanService";

type ServiceOption = {
  id: "washroom" | "fresh" | "pads";
  title: string;
  subtitle: string;
  price: number;
  pricePrefix?: "From";
  icon: React.ReactNode;
};

const OPTIONS: ServiceOption[] = [
  {
    id: "washroom",
    title: "Book Washroom",
    subtitle: "Clean western seat + privacy",
    price: 10,
    icon: <Toilet className="h-4 w-4" />,
  },
  {
    id: "fresh",
    title: "Freshen Up",
    subtitle: "Tissue + sanitizer + quick clean",
    price: 20,
    icon: <Droplet className="h-4 w-4" />,
  },
  {
    id: "pads",
    title: "Sanitary Pads",
    subtitle: "Vending available in van",
    price: 20,
    pricePrefix: "From",
    icon: <Package className="h-4 w-4" />,
  },
];

export default function Home() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<ServiceOption>(OPTIONS[0]);
  const [selectedVan, setSelectedVan] = useState<Van | null>(null);

  // Location search state
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [customLocation, setCustomLocation] = useState<{ lat: number; lng: number; name: string } | null>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Real-time data hooks
  const { vans, loading: vansLoading } = useRealtimeVans();
  const { location: userLocation } = useUserLocation();
  const lat = customLocation?.lat ?? userLocation?.lat ?? 28.6139;
  const lng = customLocation?.lng ?? userLocation?.lng ?? 77.2090;
  const { nearestVan, eta: nearestEta } = useNearestVan(lat, lng);
  const { alerts } = useRealtimeAlerts();

  // Handle location search
  const handleLocationSearch = useCallback(async () => {
    const q = searchQuery.trim();
    if (!q) return;
    setSearching(true);
    try {
      const result = await geocodePlace(q);
      if (result.lat && result.lng) {
        setCustomLocation({ lat: result.lat, lng: result.lng, name: result.name || result.address || q });
        setSearchOpen(false);
        setSearchQuery("");
      }
    } catch (err) {
      console.error("Location search failed:", err);
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  // Focus search input when opened
  useEffect(() => {
    if (searchOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [searchOpen]);

  // Derived fleet stats
  const availableCount = useMemo(() => vans.filter((v) => v.status === "available").length, [vans]);
  const busyCount = useMemo(() => vans.filter((v) => v.status === "busy").length, [vans]);
  const etaLabel = useMemo(() => {
    if (nearestEta != null) return `ETA ~${nearestEta} min`;
    return "Locating…";
  }, [nearestEta]);

  // Critical alerts count
  const criticalAlerts = useMemo(() => alerts.filter((a) => a.severity === "critical" && !a.resolved).length, [alerts]);

  const storageKey = "cleanvan:home:vans-near-you:enabled";
  const [vansNearYouEnabled, setVansNearYouEnabled] = useState<boolean>(() => {
    try {
      const raw = window.localStorage.getItem(storageKey);
      if (raw === null) return true;
      return raw === "1";
    } catch {
      return true;
    }
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(storageKey, vansNearYouEnabled ? "1" : "0");
    } catch {
      // ignore
    }
  }, [vansNearYouEnabled]);

  const [activeChip, setActiveChip] = useState<string>("nearby");

  // Filter vans based on active chip
  const filteredVans = useMemo(() => {
    switch (activeChip) {
      case "women":
        return vans.filter((v) => v.has_feminine_hygiene);
      case "fast":
        return [...vans].sort((a, b) => {
          const distA = Math.abs(a.latitude - lat) + Math.abs(a.longitude - lng);
          const distB = Math.abs(b.latitude - lat) + Math.abs(b.longitude - lng);
          return distA - distB;
        });
      default:
        return vans;
    }
  }, [vans, activeChip, lat, lng]);

  const locationLabel = useMemo(() => {
    if (customLocation) return customLocation.name;
    if (lat === 28.6139 && lng === 77.209) return "Delhi NCR";
    return "Your area";
  }, [lat, lng, customLocation]);

  return (
    <PhoneShell className="bg-white">
      <div className="relative flex min-h-full flex-1 flex-col overflow-hidden">
        <style>
          {`@keyframes homeFadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
            @keyframes homeSheen{0%{transform:translateX(-30%)}100%{transform:translateX(130%)}}`}
        </style>

        {/* full-page soft theme background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-50 via-white to-teal-50" />
          <div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-emerald-300/18 blur-3xl" />
          <div className="absolute -right-28 -top-16 h-96 w-96 rounded-full bg-teal-300/18 blur-3xl" />
          <div className="absolute -bottom-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-lime-300/10 blur-3xl" />
          <div className="absolute inset-0 bg-white/35" />
        </div>

        <header className="relative px-4 pt-6 motion-safe:animate-[homeFadeUp_420ms_ease-out]">
          <div className="flex items-center justify-between">
            <AppMenu />
            <div className="inline-flex items-center gap-2 text-xs font-semibold text-muted-foreground">
              <span className="relative inline-flex h-2.5 w-2.5">
                <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500/30 motion-safe:animate-ping" />
                <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-600" />
              </span>
              Live availability
            </div>
          </div>

          {/* Search / action bar */}
          <div className="mt-4">
            <div className="rounded-[999px] bg-gradient-to-r from-emerald-500/25 via-teal-500/20 to-cyan-500/25 p-[1px] shadow-soft">
              <div className="relative flex items-center gap-3 overflow-hidden rounded-[999px] bg-white/75 px-4 py-3 ring-1 ring-black/5 backdrop-blur">
                <div className="pointer-events-none absolute -inset-y-8 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/40 to-transparent opacity-50 motion-safe:animate-[homeSheen_3.6s_ease-in-out_infinite]" />

                <div className="grid h-10 w-10 place-items-center rounded-full bg-gradient-to-br from-emerald-600/10 via-teal-600/10 to-cyan-600/10 ring-1 ring-black/5">
                  <MapPin className="h-4 w-4 text-foreground/80" />
                </div>

                {searchOpen ? (
                  <form
                    className="flex min-w-0 flex-1 items-center gap-2"
                    onSubmit={(e) => { e.preventDefault(); handleLocationSearch(); }}
                  >
                    <input
                      ref={searchInputRef}
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      placeholder="Search any city or place…"
                      className="min-w-0 flex-1 bg-transparent text-[13px] font-medium tracking-tight text-foreground outline-none placeholder:text-muted-foreground/60"
                    />
                    {searching ? (
                      <Loader2 className="h-4 w-4 animate-spin text-emerald-600" />
                    ) : (
                      <button
                        type="submit"
                        disabled={!searchQuery.trim()}
                        className="grid h-8 w-8 place-items-center rounded-full bg-emerald-600/10 text-emerald-700 transition hover:bg-emerald-600/20 disabled:opacity-40"
                        aria-label="Search"
                      >
                        <Search className="h-3.5 w-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => { setSearchOpen(false); setSearchQuery(""); }}
                      className="grid h-8 w-8 place-items-center rounded-full bg-black/5 transition hover:bg-black/10"
                      aria-label="Close search"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </form>
                ) : (
                  <>
                    <div className="min-w-0">
                      <p className="truncate text-[13px] font-semibold tracking-tight text-foreground">{locationLabel}</p>
                      <p className="truncate text-xs text-muted-foreground">
                        {customLocation ? "Tap ✏️ to change location" : "Share location for nearest van"}
                      </p>
                    </div>

                    <button
                      className="ml-auto grid h-10 w-10 place-items-center rounded-full bg-black/5 transition-transform duration-200 hover:scale-[1.04] hover:bg-black/10 active:scale-[0.98]"
                      aria-label="Edit location"
                      type="button"
                      onClick={() => setSearchOpen(true)}
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                  </>
                )}
              </div>
            </div>

            {/* Reset to current location */}
            {customLocation && !searchOpen && (
              <div className="mt-2 flex justify-center">
                <button
                  type="button"
                  className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-medium text-emerald-700 ring-1 ring-emerald-200 transition hover:bg-emerald-100"
                  onClick={() => setCustomLocation(null)}
                >
                  <MapPin className="h-3 w-3" />
                  Use my current location
                </button>
              </div>
            )}
          </div>

          {/* Quick filter chips */}
          <div className="no-scrollbar mt-4 flex gap-2 overflow-x-auto pb-1">
            {[
              { id: "nearby", label: "Nearby" },
              { id: "women", label: "Women Hygiene" },
              { id: "low", label: "Low Demand Area" },
              { id: "fast", label: "Fast Arrival" },
              { id: "certified", label: "Clean Certified" },
            ].map((chip) => {
              const active = chip.id === activeChip;
              return (
                <button
                  key={chip.id}
                  type="button"
                  onClick={() => setActiveChip(chip.id)}
                  className={cn(
                    "whitespace-nowrap rounded-full px-4 py-2 text-xs font-medium shadow-soft ring-1 ring-black/5 transition-all duration-200",
                    active
                      ? "bg-gradient-to-r from-emerald-600/14 via-teal-600/12 to-cyan-600/12 text-foreground ring-black/10 motion-safe:animate-[homeFadeUp_260ms_ease-out]"
                      : "bg-white/75 text-muted-foreground hover:-translate-y-[1px] hover:bg-white hover:text-foreground",
                  )}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </header>

        <main className="relative flex min-h-0 flex-1 flex-col px-4 pb-6 pt-6">
          <div className="mt-4 flex min-h-0 flex-1 flex-col motion-safe:animate-[homeFadeUp_520ms_ease-out]">
            {vansNearYouEnabled ? (
              <>
                <LiveMap
                  vans={filteredVans}
                  userLocation={{ lat, lng }}
                  selectedVanId={selectedVan?.id}
                  onSelectVan={(van) => setSelectedVan(van)}
                  className="flex-1 min-h-[260px]"
                />

                {/* Critical alert banner */}
                {criticalAlerts > 0 && (
                  <div className="mt-2 flex items-center gap-2 rounded-xl bg-red-50 px-3 py-2 ring-1 ring-red-200">
                    <AlertTriangle className="h-4 w-4 text-red-600" />
                    <p className="text-xs font-medium text-red-700">
                      {criticalAlerts} critical alert{criticalAlerts > 1 ? "s" : ""} — maintenance dispatched
                    </p>
                  </div>
                )}

                <Card className="relative flex-1 min-h-[260px] overflow-hidden rounded-[22px] border-0 bg-white/70 p-2 shadow-soft ring-1 ring-black/5 backdrop-blur">
                  <div className="flex h-full flex-col">
                    <div className="px-2 pb-2 pt-1">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <h1 className="truncate text-base font-semibold tracking-tight">Vans near you</h1>
                          <p className="mt-1 truncate text-xs text-muted-foreground">
                            {vansLoading ? "Loading…" : `${availableCount} available • ${busyCount} busy • ${etaLabel}`}
                          </p>
                        </div>

                        <div className="flex items-center gap-3">
                          <Button
                            variant="editorial"
                            size="sm"
                            className="h-9 rounded-full px-4"
                            onClick={() => {
                              const vanId = selectedVan?.id || nearestVan?.id || "";
                              navigate(`/payment?service=${selected.id}&amount=${selected.price}&van=${vanId}`);
                            }}
                          >
                            Book
                          </Button>
                          <Switch
                            checked={vansNearYouEnabled}
                            onCheckedChange={setVansNearYouEnabled}
                            aria-label="Toggle vans near you"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex-1 space-y-2 overflow-auto">
                      {OPTIONS.map((opt) => (
                        <div
                          key={opt.id}
                          className={cn(
                            "flex items-center gap-3 rounded-2xl bg-white/80 px-3 py-3 ring-1 ring-black/5 transition-all",
                            selected.id === opt.id
                              ? "ring-black/15 shadow-sm"
                              : "hover:bg-white hover:ring-black/10",
                          )}
                        >
                          <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-black/5 text-foreground">
                            {opt.icon}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold">{opt.title}</p>
                            <p className="mt-0.5 truncate text-xs text-muted-foreground">{opt.subtitle}</p>
                          </div>
                          <div className="flex shrink-0 items-center gap-2">
                            <p className="text-xs text-muted-foreground">
                              {opt.pricePrefix ? `${opt.pricePrefix} ` : ""}
                              <span className="font-semibold text-foreground">₹{opt.price}</span>
                            </p>
                            <Button
                              variant="brand"
                              size="sm"
                              className="h-9 rounded-full px-4"
                              onClick={() => {
                                setSelected(opt);
                                navigate(`/payment?service=${opt.id}&amount=${opt.price}`);
                              }}
                            >
                              Book
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>

                    <p className="px-2 pt-3 text-[11px] leading-relaxed text-muted-foreground font-bold text-center">
                      Stay Clean. Stay Confident. 🌿
                    </p>
                  </div>
                </Card>
              </>
            ) : (
              <div className="relative flex min-h-0 flex-1">
                <LiveMap
                  vans={filteredVans}
                  userLocation={{ lat, lng }}
                  selectedVanId={selectedVan?.id}
                  onSelectVan={(van) => setSelectedVan(van)}
                  className="h-full w-full flex-1 min-h-[520px]"
                />

                <div className="pointer-events-none absolute bottom-3 left-3 right-3">
                  <div className="pointer-events-auto rounded-[18px] bg-white/90 p-3 shadow-soft ring-1 ring-black/5 backdrop-blur motion-safe:animate-[homeFadeUp_380ms_ease-out]">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold">Vans near you</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {vansLoading ? "Loading…" : `${availableCount} available • ${busyCount} busy • ${etaLabel}`}
                        </p>
                      </div>
                      <Switch
                        checked={vansNearYouEnabled}
                        onCheckedChange={setVansNearYouEnabled}
                        aria-label="Toggle vans near you"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </PhoneShell>
  );
}
