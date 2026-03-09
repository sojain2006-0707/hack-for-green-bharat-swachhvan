import PhoneShell from "@/components/layout/PhoneShell";
import AppMenu from "@/components/menu/AppMenu";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Bell, ChevronRight, MapPin, ShieldCheck, User, LogOut } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

type ToggleKey = "notifications" | "locationHints";

const STORAGE_KEY = "swachhvan:settings";

function readSettings(): Record<ToggleKey, boolean> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return { notifications: true, locationHints: true };
    }
    const parsed = JSON.parse(raw) as Partial<Record<ToggleKey, boolean>>;
    return {
      notifications: Boolean(parsed.notifications ?? true),
      locationHints: Boolean(parsed.locationHints ?? true),
    };
  } catch {
    return { notifications: true, locationHints: true };
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
    <div className="flex items-center gap-3 rounded-2xl bg-white/70 px-3 py-3 ring-1 ring-black/5">
      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-black/5">{icon}</div>
      <div className="min-w-0 flex-1">
        <div className="truncate text-sm font-semibold tracking-tight text-foreground">{title}</div>
        {subtitle ? <div className="mt-0.5 truncate text-xs text-muted-foreground">{subtitle}</div> : null}
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
      <main className="relative flex flex-1 flex-col overflow-y-auto bg-white">
        {/* Background */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-sky-100 via-white/70 to-emerald-100" />
          <div className="absolute -left-28 top-8 h-96 w-96 rounded-full bg-emerald-300/18 blur-3xl" />
          <div className="absolute -right-32 -top-28 h-[520px] w-[520px] rounded-full bg-sky-300/22 blur-3xl" />
          <div className="absolute bottom-0 left-1/3 h-[400px] w-[400px] -translate-x-1/2 rounded-full bg-emerald-400/12 blur-3xl" />
          <div className="absolute inset-0 bg-white/25" />
        </div>

        <div className="relative flex flex-1 flex-col p-4">
        <header className="flex items-center justify-between pt-2">
          <AppMenu />
          <Button asChild variant="editorial" size="pill" className="h-10">
            <Link to="/home">Back</Link>
          </Button>
        </header>

        <section className="relative mt-3 space-y-3 pb-2">
          <Card className="rounded-[24px] border-0 bg-white/60 shadow-soft ring-1 ring-black/5 backdrop-blur">
            <CardContent className="p-4">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-black/5">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-2xl font-semibold tracking-tight text-foreground">Settings</h1>
                  <p className="mt-1 text-xs text-muted-foreground">Control preferences, privacy, and account actions.</p>
                </div>
              </div>

              <div className="mt-4 grid gap-2.5">
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

                <div className="mt-1 rounded-2xl bg-white/70 px-3 py-3 ring-1 ring-black/5">
                  <div className="text-xs font-semibold text-muted-foreground">Account</div>
                  <div className="mt-2 grid gap-2">
                    <Button asChild variant="secondary" size="pill" className="w-full justify-between rounded-xl">
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
                        className="w-full justify-center rounded-xl"
                        onClick={onSignOut}
                      >
                        <LogOut className="h-4 w-4" />
                        Sign out
                      </Button>
                    ) : null}

                    <div className="pt-0.5 text-[11px] text-muted-foreground">
                      Signed in as: <span className="font-medium text-foreground">{user?.email ?? "Guest"}</span>
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl bg-black/[0.03] px-3 py-3 ring-1 ring-black/5">
                  <p className="text-xs font-semibold">Note</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    These settings are stored on this device. They can be synced to your account.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
        </div>
      </main>
    </PhoneShell>
  );
}
