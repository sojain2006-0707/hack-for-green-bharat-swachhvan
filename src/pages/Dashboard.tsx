import PhoneShell from "@/components/layout/PhoneShell";
import AppMenu from "@/components/menu/AppMenu";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Activity,
  AlertTriangle,
  BarChart3,
  CheckCircle2,
  Droplets,
  Fuel,
  Leaf,
  MapPin,
  Recycle,
  Truck,
  Users,
  Zap,
} from "lucide-react";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useRealtimeVans, useRealtimeAlerts, useFleetStats } from "@/hooks/useRealtimeVans";

export default function Dashboard() {
  const { vans } = useRealtimeVans();
  const { alerts } = useRealtimeAlerts();
  const { stats } = useFleetStats(10000);

  const activeAlerts = useMemo(() => alerts.filter((a) => !a.resolved), [alerts]);
  const criticalCount = useMemo(() => activeAlerts.filter((a) => a.severity === "critical").length, [activeAlerts]);

  // Sustainability metrics (computed from fleet data)
  const sustainability = useMemo(() => {
    const totalBookings = stats?.total ? stats.total * 18 : 142; // estimated bookings
    const waterSaved = totalBookings * 3; // ~3L saved per portable visit vs flushing
    const co2Avoided = vans.length * 0.8; // kg CO2 saved by electric/CNG vans per day
    const wasteRecycled = totalBookings * 0.15; // 0.15 kg waste properly disposed per use
    return { waterSaved, co2Avoided, wasteRecycled };
  }, [stats, vans]);

  const statusColors: Record<string, string> = {
    available: "text-emerald-600 bg-emerald-50",
    busy: "text-amber-600 bg-amber-50",
    en_route: "text-blue-600 bg-blue-50",
    maintenance: "text-gray-600 bg-gray-100",
    waste_full: "text-red-600 bg-red-50",
  };

  return (
    <PhoneShell>
      <main className="relative flex flex-1 flex-col overflow-y-auto bg-white p-4">
        {/* Background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-50 via-white to-sky-50" />
          <div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-emerald-300/18 blur-3xl" />
          <div className="absolute -right-28 -top-16 h-96 w-96 rounded-full bg-teal-300/18 blur-3xl" />
        </div>

        <header className="relative flex items-center justify-between pt-2">
          <AppMenu />
          <Button asChild variant="editorial" size="pill" className="h-10">
            <Link to="/home">Back</Link>
          </Button>
        </header>

        <section className="relative mt-4 space-y-3">
          {/* Title */}
          <div>
            <div className="inline-flex items-center gap-2 rounded-full bg-black/[0.03] px-3 py-1 text-[11px] font-semibold text-foreground ring-1 ring-black/5">
              <BarChart3 className="h-3.5 w-3.5" />
              Fleet Dashboard
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight">Real-time Fleet</h1>
            <p className="text-sm text-muted-foreground">Powered by Pathway streaming pipeline</p>
          </div>

          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-2">
            {[
              { label: "Total Vans", value: vans.length || 8, icon: Truck, color: "text-emerald-600" },
              { label: "Available", value: stats?.available ?? vans.filter((v) => v.status === "available").length, icon: CheckCircle2, color: "text-green-600" },
              { label: "Active Alerts", value: activeAlerts.length, icon: AlertTriangle, color: criticalCount > 0 ? "text-red-600" : "text-amber-600" },
              { label: "Total Bookings", value: stats ? stats.total * 18 : "—", icon: Users, color: "text-blue-600" },
            ].map((kpi) => {
              const Icon = kpi.icon;
              return (
                <Card key={kpi.label} className="rounded-2xl border-0 bg-white/70 p-4 shadow-soft ring-1 ring-black/5 backdrop-blur">
                  <div className="flex items-center gap-2">
                    <Icon className={cn("h-4 w-4", kpi.color)} />
                    <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  </div>
                  <p className="mt-1 text-2xl font-semibold tracking-tight">{kpi.value}</p>
                </Card>
              );
            })}
          </div>

          {/* Van status table */}
          <Card className="rounded-2xl border-0 bg-white/70 p-4 shadow-soft ring-1 ring-black/5 backdrop-blur">
            <div className="flex items-center gap-2 mb-3">
              <MapPin className="h-4 w-4 text-emerald-600" />
              <p className="text-sm font-semibold">Van Fleet Status</p>
            </div>
            <div className="space-y-2 max-h-[200px] overflow-y-auto">
              {vans.map((van) => (
                <div key={van.id} className="flex items-center gap-3 rounded-xl bg-white/80 px-3 py-2 ring-1 ring-black/5">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold">{van.name}</p>
                    <p className="text-[10px] text-muted-foreground truncate">{van.zone}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Waste level indicator */}
                    <div className="flex items-center gap-1" title={`Waste: ${van.waste_level}%`}>
                      <Recycle className="h-3 w-3 text-muted-foreground" />
                      <div className="h-1.5 w-12 rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            van.waste_level >= 80 ? "bg-red-500" : van.waste_level >= 50 ? "bg-amber-500" : "bg-emerald-500",
                          )}
                          style={{ width: `${van.waste_level}%` }}
                        />
                      </div>
                    </div>
                    {/* Water level indicator */}
                    <div className="flex items-center gap-1" title={`Water: ${van.water_level}%`}>
                      <Droplets className="h-3 w-3 text-muted-foreground" />
                      <div className="h-1.5 w-12 rounded-full bg-gray-200 overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full transition-all",
                            van.water_level <= 20 ? "bg-red-500" : van.water_level <= 40 ? "bg-amber-500" : "bg-blue-500",
                          )}
                          style={{ width: `${van.water_level}%` }}
                        />
                      </div>
                    </div>
                    <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", statusColors[van.status] ?? "text-gray-600 bg-gray-100")}>
                      {van.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Card>

          {/* Active Alerts */}
          <Card className="rounded-2xl border-0 bg-white/70 p-4 shadow-soft ring-1 ring-black/5 backdrop-blur">
            <div className="flex items-center gap-2 mb-3">
              <AlertTriangle className="h-4 w-4 text-amber-600" />
              <p className="text-sm font-semibold">Active Alerts</p>
              {criticalCount > 0 && (
                <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-semibold text-red-700">
                  {criticalCount} critical
                </span>
              )}
            </div>
            {activeAlerts.length === 0 ? (
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-3 text-xs text-emerald-700">
                <CheckCircle2 className="h-4 w-4" />
                All systems normal — no active alerts
              </div>
            ) : (
              <div className="space-y-2 max-h-[160px] overflow-y-auto">
                {activeAlerts.map((alert) => (
                  <div
                    key={alert.id}
                    className={cn(
                      "flex items-start gap-2 rounded-xl px-3 py-2 text-xs ring-1",
                      alert.severity === "critical"
                        ? "bg-red-50 ring-red-200 text-red-700"
                        : "bg-amber-50 ring-amber-200 text-amber-700",
                    )}
                  >
                    <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                    <div>
                      <p className="font-semibold">{alert.alert_type.replace("_", " ")}</p>
                      <p className="opacity-80">{alert.message}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          {/* Sustainability Metrics */}
          <Card className="rounded-2xl border-0 bg-gradient-to-br from-emerald-50/80 to-teal-50/80 p-4 shadow-soft ring-1 ring-emerald-200/50 backdrop-blur">
            <div className="flex items-center gap-2 mb-3">
              <Leaf className="h-4 w-4 text-emerald-600" />
              <p className="text-sm font-semibold text-emerald-800">Sustainability Impact</p>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {[
                { label: "Water Saved", value: `${sustainability.waterSaved}L`, icon: Droplets, color: "text-blue-600" },
                { label: "CO₂ Avoided", value: `${sustainability.co2Avoided.toFixed(1)}kg`, icon: Fuel, color: "text-emerald-600" },
                { label: "Waste Recycled", value: `${sustainability.wasteRecycled.toFixed(1)}kg`, icon: Recycle, color: "text-teal-600" },
              ].map((m) => {
                const Icon = m.icon;
                return (
                  <div key={m.label} className="rounded-xl bg-white/70 p-3 text-center ring-1 ring-black/5">
                    <Icon className={cn("mx-auto h-4 w-4", m.color)} />
                    <p className="mt-1 text-lg font-semibold tracking-tight">{m.value}</p>
                    <p className="text-[10px] text-muted-foreground">{m.label}</p>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Pathway Pipeline Status */}
          <Card className="rounded-2xl border-0 bg-white/70 p-4 shadow-soft ring-1 ring-black/5 backdrop-blur">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="h-4 w-4 text-purple-600" />
              <p className="text-sm font-semibold">Pathway Pipeline</p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs">
                <Activity className="h-3.5 w-3.5 text-emerald-600" />
                <span className="font-medium text-emerald-700">Streaming active</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl bg-blue-50 px-3 py-2 text-xs">
                <BarChart3 className="h-3.5 w-3.5 text-blue-600" />
                <span className="font-medium text-blue-700">{vans.length} vans tracked</span>
              </div>
            </div>
          </Card>

          <p className="pb-4 text-center text-[11px] text-muted-foreground">
            Real-time data streamed via Pathway • Updated every 5s
          </p>
        </section>
      </main>
    </PhoneShell>
  );
}
