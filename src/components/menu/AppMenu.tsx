import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import type { ComponentType } from "react";
import {
  Clock,
  Gift,
  HelpCircle,
  Info,
  MapPin,
  Menu,
  Settings,
  Star,
  User,
  X,
  LogOut,
  Sparkles,
  ShieldCheck,
  Users,
  Leaf,
  BarChart3,
} from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";

type MenuItem = {
  key: string;
  label: string;
  subtitle?: string;
  icon: ComponentType<{ className?: string }>;
  to?: string;
  onClick?: () => void;
  tone?: "default" | "danger";
};

function getInitial(email?: string | null) {
  const v = (email ?? "").trim();
  if (!v) return "G";
  return v[0]?.toUpperCase() ?? "G";
}

export default function AppMenu() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { toast } = useToast();

  const fullName = typeof (user as any)?.user_metadata?.full_name === "string" ? (user as any).user_metadata.full_name : "";
  const displayName = user?.email ? (fullName.trim() ? fullName.trim() : "User") : "Guest User";

  const comingSoon = (label: string) =>
    toast({
      title: "Coming soon",
      description: `${label} will be available in a future update.`,
    });

  const primaryItems: MenuItem[] = [
    {
      key: "dashboard",
      label: "Fleet Dashboard",
      subtitle: "Real-time analytics & alerts",
      icon: BarChart3,
      to: "/dashboard",
    },
    {
      key: "history",
      label: "Booking History",
      subtitle: "Your recent bookings",
      icon: Clock,
      onClick: () => comingSoon("Booking History"),
    },
    {
      key: "locations",
      label: "Saved Locations",
      subtitle: "Quickly reuse addresses",
      icon: MapPin,
      onClick: () => comingSoon("Saved Locations"),
    },
    {
      key: "refer",
      label: "Refer & Earn",
      subtitle: "Invite friends, earn rewards",
      icon: Gift,
      to: "/refer",
    },
    {
      key: "rate",
      label: "Rate Us",
      subtitle: "Share your feedback",
      icon: Star,
      to: "/rating",
    },
    {
      key: "support",
      label: "Help & Support",
      subtitle: "FAQs and contact",
      icon: HelpCircle,
      to: "/support",
    },
    {
      key: "settings",
      label: "Settings",
      subtitle: "Notifications and privacy",
      icon: Settings,
      to: "/settings",
    },
    {
      key: "about",
      label: "About SwachhVan",
      subtitle: "Learn more about us",
      icon: Info,
      to: "/about",
    },
  ];

  const infoItems: MenuItem[] = [
    {
      key: "how",
      label: "How It Works",
      icon: Sparkles,
      to: "/how-it-works",
    },
    {
      key: "hygiene",
      label: "Hygiene & Safety",
      icon: ShieldCheck,
      to: "/hygiene-safety",
    },
    {
      key: "women",
      label: "Women Facilities",
      icon: Users,
      to: "/women-facilities",
    },
    {
      key: "sustain",
      label: "Sustainability",
      icon: Leaf,
      to: "/sustainability",
    },
  ];

  const onSignOut = async () => {
    try {
      await signOut();
      navigate("/");
    } catch (e) {
      const message = e instanceof Error ? e.message : "Sign out failed.";
      toast({ title: "Sign out failed", description: message });
    }
  };

  const renderRow = (item: MenuItem) => {
    const Icon = item.icon;
    const active = item.to ? location.pathname === item.to : false;

    const rowClass = cn(
      "flex w-full items-center gap-4 rounded-3xl bg-white/80 px-3 py-3 text-left transition ring-1 ring-black/5 backdrop-blur",
      active ? "ring-black/10" : "hover:ring-black/10",
      item.tone === "danger" && "text-red-600",
    );

    const iconClass = cn(
      "grid h-11 w-11 place-items-center rounded-2xl ring-1",
      item.tone === "danger"
        ? "bg-red-50 text-red-600 ring-red-100"
        : "bg-emerald-50 text-emerald-700 ring-emerald-100",
    );

    const content = (
      <>
        <span className={iconClass}>
          <Icon className="h-5 w-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold tracking-tight text-foreground">{item.label}</span>
          {item.subtitle ? (
            <span className="mt-0.5 block truncate text-xs text-muted-foreground">{item.subtitle}</span>
          ) : null}
        </span>
      </>
    );

    if (item.to) {
      return (
        <SheetClose asChild key={item.key}>
          <Link to={item.to} className={rowClass} aria-current={active ? "page" : undefined}>
            {content}
          </Link>
        </SheetClose>
      );
    }

    return (
      <SheetClose asChild key={item.key}>
        <button type="button" className={rowClass} onClick={item.onClick}>
          {content}
        </button>
      </SheetClose>
    );
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full"
          aria-label="Open menu"
        >
          <Menu />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="flex h-dvh min-h-0 flex-col gap-0 overflow-hidden bg-[#F7F2DE] p-0 [&>button]:hidden"
      >
        {/* Header */}
        <div className="relative px-5 pb-4 pt-6">
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-emerald-200/55 via-emerald-100/10 to-transparent" />
          <div className="relative z-10 flex items-center justify-between">
            <div className="text-base font-semibold tracking-tight text-foreground">SwachhVan</div>
            <SheetClose asChild>
              <button
                type="button"
                aria-label="Close menu"
                className="grid h-10 w-10 place-items-center rounded-full bg-white/70 ring-1 ring-black/5 transition hover:bg-white"
              >
                <X className="h-5 w-5" />
              </button>
            </SheetClose>
          </div>

          {/* Profile card */}
          <div className="relative z-10 mt-4 rounded-3xl bg-white/80 p-4 ring-1 ring-black/5 backdrop-blur">
            <div className="flex items-center gap-3">
              <Avatar className="h-11 w-11 ring-1 ring-black/5">
                <AvatarFallback className="bg-emerald-50 text-emerald-700">
                  {getInitial(user?.email)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold tracking-tight text-foreground">
                  {displayName}
                </div>
                <div className="truncate text-xs text-muted-foreground">
                  {user?.email ? user.email : "Verify your email to continue"}
                </div>
              </div>
              <SheetClose asChild>
                <Button asChild variant="secondary" size="sm" className="rounded-full">
                  <Link to="/profile">Edit</Link>
                </Button>
              </SheetClose>
            </div>
          </div>
        </div>

        {/* Primary rows */}
        <nav className="min-h-0 flex-1 space-y-2 overflow-y-auto px-5 pb-5 pr-4 overscroll-contain">
          {primaryItems.map(renderRow)}

          <div className="pt-2">
            <div className="mb-2 text-xs font-semibold tracking-tight text-muted-foreground">More</div>
            <div className="space-y-2">
              {infoItems.map((it) => {
                const Icon = it.icon;
                const active = it.to ? location.pathname === it.to : false;
                return (
                  <SheetClose asChild key={it.key}>
                    <Link
                      to={it.to ?? "/"}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl bg-white/55 px-3 py-2 text-sm ring-1 ring-black/5 transition hover:bg-white/75",
                        active && "bg-white/80",
                      )}
                      aria-current={active ? "page" : undefined}
                    >
                      <span className="grid h-9 w-9 place-items-center rounded-2xl bg-white ring-1 ring-black/5">
                        <Icon className="h-4 w-4" />
                      </span>
                      <span className="font-medium tracking-tight text-foreground">{it.label}</span>
                    </Link>
                  </SheetClose>
                );
              })}
            </div>
          </div>
        </nav>

        {/* Footer actions */}
        <div className="space-y-2 px-5 pb-5">
          {user?.email ? (
            <SheetClose asChild>
              <button
                type="button"
                className="flex w-full items-center justify-center gap-2 rounded-2xl bg-red-50 px-4 py-3 text-sm font-semibold text-red-700 ring-1 ring-red-100 transition hover:bg-red-100"
                onClick={onSignOut}
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </SheetClose>
          ) : null}

          <div className="text-center text-[11px] text-muted-foreground">v0.1 • UI prototype</div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
