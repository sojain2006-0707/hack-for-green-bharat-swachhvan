import PhoneShell from "@/components/layout/PhoneShell";
import AppMenu from "@/components/menu/AppMenu";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, ChevronRight, Lock, MapPin, Moon, ShieldCheck, User, LogOut } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

type ToggleKey = "notifications" | "locationHints" | "lowData" | "darkMode";

const STORAGE_KEY = "swachhvan:settings";

function readSettings(): Record<ToggleKey, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { notifications: true, locationHints: true, lowData: false, darkMode: false };
    }
    const parsed = JSON.parse(raw) as Partial<Record<ToggleKey, boolean>>;
    return {
      notifications: Boolean(parsed.notifications ?? true),
      locationHints: Boolean(parsed.locationHints ?? true),
      lowData: Boolean(parsed.lowData ?? false),
      darkMode: Boolean(parsed.darkMode ?? false),
    };
  } catch {
    return { notifications: true, locationHints: true, lowData: false, darkMode: false };
  }
}

function writeSettings(next: Record<ToggleKey, boolean>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // ignore
  }
}

function SettingsRow({
  title,
  subtitle,
  icon,
  right,
}: {
  title: string;
  subtitle?: string;
  icon: React.ReactNode;
  right?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-4 rounded-3xl bg-white/70 p-4 ring-1 ring-black/5">
      <div className="grid h-11 w-11 place-items-center rounded-2xl bg-black/5">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold tracking-tight text-foreground">{title}</div>
        {subtitle ? <div className="mt-1 truncate text-xs text-muted-foreground">{subtitle}</div> : null}
      </div>
      {right}
    </div>
  );
}

export default function Settings() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const initial = useMemo(() => readSettings(), []);
  const [toggles, setToggles] = useState<Record<ToggleKey, boolean>>(initial);

  useEffect(() => {
    writeSettings(toggles);
  }, [toggles]);

  const onToggle = (key: ToggleKey) => setToggles((s) => ({ ...s, [key]: !s[key] }));

  async function onSignOut() {
    try {
      await signOut();
      navigate("/");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Sign out failed.";
      toast({ title: "Sign out failed", description: message });
    }
  }

  return (
    <PhoneShell>
      <main className="relative flex flex-1 flex-col overflow-hidden bg-white p-4">
        {/* Background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-sky-100 via-white/70 to-emerald-100" />
          <div className="absolute -left-28 top-8 h-96 w-96 rounded-full bg-emerald-300/18 blur-3xl" />
          <div className="absolute -right-32 -top-28 h-[520px] w-[520px] rounded-full bg-sky-300/22 blur-3xl" />
          <div className="absolute -bottom-44 left-1/3 h-[560px] w-[560px] -translate-x-1/2 rounded-full bg-emerald-400/12 blur-3xl" />
          <img
            src="/swachhvan-van.png"
            alt=""
            className="absolute -right-28 bottom-10 w-[520px] max-w-none opacity-45"
            style={{
              maskImage: "linear-gradient(to left, rgba(0,0,0,1) 65%, rgba(0,0,0,0) 100%)",
              WebkitMaskImage: "linear-gradient(to left, rgba(0,0,0,1) 65%, rgba(0,0,0,0) 100%)",
            }}
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-white/25" />
        </div>

        <header className="relative flex items-center justify-between pt-2">
          <AppMenu />
          <Button asChild variant="editorial" size="pill" className="h-10">
            <Link to="/home">Back</Link>
          </Button>
        </header>

        <section className="relative mt-4 space-y-3">
          <Card className="rounded-[28px] border-0 bg-white/60 shadow-soft ring-1 ring-black/5 backdrop-blur">
            <CardContent className="p-6">
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-black/5">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-3xl font-semibold tracking-tight text-foreground">Settings</h1>
                  <p className="mt-2 text-sm text-muted-foreground">Control preferences, privacy, and account actions.</p>
                </div>
              </div>

              <div className="mt-6 grid gap-3">
                <SettingsRow
                  title="Notifications"
                  subtitle="Booking updates and offers"
                  icon={<Bell className="h-5 w-5" />}
                  right={<Switch checked={toggles.notifications} onCheckedChange={() => onToggle("notifications")} />}
                />

                <SettingsRow
                  title="Location hints"
                  subtitle="Show prompts to share your area"
                  icon={<MapPin className="h-5 w-5" />}
                  right={<Switch checked={toggles.locationHints} onCheckedChange={() => onToggle("locationHints")} />}
                />

                <SettingsRow
                  title="Low data mode"
                  subtitle="Reduce heavy visuals where possible"
                  icon={<Lock className="h-5 w-5" />}
                  right={<Switch checked={toggles.lowData} onCheckedChange={() => onToggle("lowData")} />}
                />

                <SettingsRow
                  title="Dark mode (prototype)"
                  subtitle="UI toggle placeholder"
                  icon={<Moon className="h-5 w-5" />}
                  right={<Switch checked={toggles.darkMode} onCheckedChange={() => onToggle("darkMode")} />}
                />

                <div className="mt-2 rounded-3xl bg-white/70 p-4 ring-1 ring-black/5">
                  <div className="text-xs font-semibold text-muted-foreground">Account</div>
                  <div className="mt-3 grid gap-2">
                    <Button asChild variant="secondary" size="pill" className="w-full justify-between rounded-2xl">
                      <Link to="/profile">
                        <span className="inline-flex items-center gap-2">
                          <User className="h-4 w-4" />
                          Edit profile
                        </span>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>

                    {user?.email ? (
                      <Button
                        type="button"
                        variant="destructive"
                        size="pill"
                        className="w-full justify-center rounded-2xl"
                        onClick={onSignOut}
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </Button>
                    ) : null}

                    <div className="pt-1 text-[11px] text-muted-foreground">
                      Signed in as: <span className="font-medium text-foreground">{user?.email ?? "Guest"}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-3xl bg-black/[0.03] p-4 ring-1 ring-black/5">
                  <p className="text-sm font-semibold">Note</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    These settings are stored on this device (prototype). In production, they can be synced to your account.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </PhoneShell>
  );
}
