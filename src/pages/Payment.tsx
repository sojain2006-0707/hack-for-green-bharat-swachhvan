import PhoneShell from "@/components/layout/PhoneShell";
import AppMenu from "@/components/menu/AppMenu";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  CheckCircle2,
  CreditCard,
  HandCoins,
  Lock,
  Receipt,
  ShieldCheck,
  Sparkles,
  Loader2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { createBooking } from "@/lib/vanService";
import { useAuth } from "@/contexts/AuthContext";

type Mode = "cod" | "online";

export default function Payment() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  const service = params.get("service") ?? "washroom";
  const amount = Number(params.get("amount") ?? 10);
  const vanId = params.get("van") ?? "";
  const [mode, setMode] = useState<Mode>("cod");
  const [booking, setBooking] = useState(false);

  const title = useMemo(() => {
    if (service === "pads") return "Sanitary Pads";
    if (service === "fresh") return "Fresh-up";
    return "Using Washroom";
  }, [service]);

  const badge = useMemo(() => {
    if (service === "pads") return "Discreet purchase";
    if (service === "fresh") return "Comfort kit";
    return "Private washroom";
  }, [service]);

  const heroSrc = useMemo(() => {
    if (service === "pads") return "/payment-hero-pads.svg";
    if (service === "fresh") return "/payment-hero-fresh.svg";
    return "/payment-hero-washroom.svg";
  }, [service]);

  const trustSignals = useMemo(() => {
    if (service === "pads") {
      return [
        { icon: Sparkles, text: "Designed for comfort, dignity, and safety" },
        { icon: ShieldCheck, text: "Hygiene-checked sanitary essentials" },
        { icon: Lock, text: "Privacy-first design and discreet purchase" },
      ] as const;
    }

    return [
      { icon: CheckCircle2, text: "Cleanliness rating after each visit" },
      { icon: CheckCircle2, text: "Operator checklist + replenishment tracking" },
      { icon: CheckCircle2, text: "Privacy-first, no-judgment experience" },
    ] as const;
  }, [service]);

  return (
    <PhoneShell>
      <main className="relative flex flex-1 flex-col overflow-hidden bg-white p-4">
        <style>
          {`@keyframes payFloat{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(0,-8px,0)}}
            @keyframes payDrift{0%,100%{transform:translate3d(0,0,0) scale(1)}50%{transform:translate3d(10px,-12px,0) scale(1.02)}}
            @keyframes paySheen{0%{transform:translateX(-35%)}100%{transform:translateX(135%)}}`}
        </style>

        {/* Full-page soft theme background (matches HygieneSafety aesthetic) */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-50 via-white/60 to-sky-50" />
          <div className="absolute -left-24 top-12 h-80 w-80 rounded-full bg-emerald-300/18 blur-3xl" />
          <div className="absolute -right-32 -top-24 h-96 w-96 rounded-full bg-sky-300/22 blur-3xl" />
          <div className="absolute -bottom-36 left-1/3 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-emerald-400/12 blur-3xl" />

          <img
            src="/payment-bg.svg"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover opacity-90 motion-safe:animate-[payDrift_18s_ease-in-out_infinite]"
          />

          <div className="absolute inset-0 bg-white/15" />
        </div>

        <header className="relative flex items-center justify-between pt-2">
          <AppMenu />
          <Button asChild variant="editorial" size="pill" className="h-10">
            <Link to="/home">Back</Link>
          </Button>
        </header>

        <section className="relative mt-4 space-y-3">
          <Card className="overflow-hidden rounded-[28px] border-0 bg-white/60 p-0 shadow-soft ring-1 ring-black/5 backdrop-blur">
            {/* HERO (matches Image 2 style) */}
            <div className="relative">
              <div className="relative h-[240px] w-full overflow-hidden">
                <img
                  src={heroSrc}
                  alt=""
                  aria-hidden="true"
                  className="absolute inset-0 h-full w-full object-cover"
                  loading="eager"
                />
                <div className="absolute inset-0 bg-gradient-to-b from-white/0 via-white/0 to-white/65" />

                <div className="absolute left-4 top-4">
                  <div className="inline-flex items-center gap-2 rounded-full bg-white/75 px-3 py-2 text-xs font-semibold text-foreground shadow-soft ring-1 ring-black/10 backdrop-blur">
                    <Lock className="h-4 w-4" />
                    {badge}
                  </div>
                </div>

                <div className="absolute right-4 top-4">
                  <div className="relative overflow-hidden rounded-2xl bg-white/70 p-[1px] shadow-soft ring-1 ring-black/10 backdrop-blur">
                    <div className="relative overflow-hidden rounded-2xl bg-white/80">
                      <div className="pointer-events-none absolute -inset-y-8 left-0 w-1/2 bg-gradient-to-r from-transparent via-white/55 to-transparent opacity-35 motion-safe:animate-[paySheen_4.2s_ease-in-out_infinite]" />
                      <img
                        src="/swachhvan-van.png"
                        alt=""
                        aria-hidden="true"
                        className="h-[76px] w-[120px] object-contain p-2 opacity-95 motion-safe:animate-[payFloat_5.4s_ease-in-out_infinite]"
                        loading="lazy"
                      />
                    </div>
                  </div>
                </div>

                <div className="absolute bottom-4 left-4 right-4">
                  <p className="text-sm text-muted-foreground">Selected</p>
                  <h1 className="mt-1 text-4xl font-semibold leading-[1.02] tracking-tight text-foreground">
                    {title}
                  </h1>
                </div>
              </div>
            </div>

            {/* CONTENT */}
            <div className="space-y-3 p-4">
              <div className="rounded-[22px] bg-white/80 p-5 shadow-soft ring-1 ring-black/10 backdrop-blur">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-2xl font-semibold tracking-tight text-foreground">Total</p>
                    <p className="mt-1 text-sm text-muted-foreground">Includes service charge</p>
                  </div>
                  <p className="text-5xl font-semibold tracking-tight text-foreground">₹{amount}</p>
                </div>
              </div>

              <div className="rounded-[22px] bg-white/80 p-5 shadow-soft ring-1 ring-black/10 backdrop-blur">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5" />
                  <p className="text-xl font-semibold tracking-tight text-foreground">Innovation: trust signals</p>
                </div>
                <div className="mt-3 grid gap-2">
                  {trustSignals.map((item) => {
                    const Icon = item.icon;
                    const isPads = service === "pads";
                    return (
                      <div
                        key={item.text}
                        className="flex items-start gap-3 rounded-2xl bg-white/70 p-4 ring-1 ring-black/5"
                      >
                        <div
                          className={cn(
                            "grid h-9 w-9 shrink-0 place-items-center rounded-2xl ring-1 ring-black/5",
                            isPads ? "bg-emerald-500/10" : "bg-black/5",
                          )}
                        >
                          <Icon className={cn("h-4 w-4", isPads ? "text-emerald-700" : "text-emerald-600")} />
                        </div>
                        <p className="text-sm font-medium leading-relaxed text-foreground/85">{item.text}</p>
                      </div>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[22px] bg-white/80 p-5 shadow-soft ring-1 ring-black/10 backdrop-blur">
                <p className="text-xl font-semibold tracking-tight text-foreground">Choose payment mode</p>
                <div className="mt-3 grid gap-2">
                  <button
                    type="button"
                    onClick={() => setMode("cod")}
                    className={cn(
                      "relative flex items-center gap-3 overflow-hidden rounded-2xl p-4 text-left ring-1 transition",
                      mode === "cod"
                        ? "bg-white/85 ring-black/15 shadow-sm"
                        : "bg-white/65 ring-black/10 hover:bg-white/80",
                    )}
                  >
                    <img
                      src="/payment-cod.svg"
                      alt=""
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-10 -top-10 h-[120px] w-[210px] rotate-[4deg] opacity-50"
                      loading="lazy"
                    />
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-black/5">
                      <HandCoins className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">Cash on delivery</p>
                      <p className="text-xs text-muted-foreground">Pay when the van arrives</p>
                    </div>
                    {mode === "cod" && <CheckCircle2 className="h-5 w-5" />}
                  </button>

                  <button
                    type="button"
                    onClick={() => setMode("online")}
                    className={cn(
                      "relative flex items-center gap-3 overflow-hidden rounded-2xl p-4 text-left ring-1 transition",
                      mode === "online"
                        ? "bg-white/85 ring-black/15 shadow-sm"
                        : "bg-white/65 ring-black/10 hover:bg-white/80",
                    )}
                  >
                    <img
                      src="/payment-online.svg"
                      alt=""
                      aria-hidden="true"
                      className="pointer-events-none absolute -right-10 -top-10 h-[120px] w-[210px] -rotate-[4deg] opacity-50"
                      loading="lazy"
                    />
                    <div className="grid h-11 w-11 place-items-center rounded-2xl bg-black/5">
                      <CreditCard className="h-4 w-4" />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-foreground">Online payment</p>
                      <p className="text-xs text-muted-foreground">UPI / card (mock)</p>
                    </div>
                    {mode === "online" && <CheckCircle2 className="h-5 w-5" />}
                  </button>
                </div>
              </div>
            </div>
          </Card>
        </section>

        <div className="relative mt-auto pb-4 pt-6">
          {mode === "online" ? (
            <Button
              variant="brand"
              size="pill"
              className="w-full"
              disabled={booking}
              onClick={async () => {
                setBooking(true);
                try {
                  await createBooking({
                    userId: user?.id ?? "demo-user",
                    serviceType: service as "washroom" | "fresh" | "pads",
                    amount,
                    paymentMode: "online",
                  });
                } catch {
                  // fallback - continue to pay page anyway
                }
                navigate(`/pay?amount=${amount}&van=${vanId}&service=${service}`);
              }}
            >
              {booking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Proceed to pay
            </Button>
          ) : (
            <Button
              variant="brand"
              size="pill"
              className="w-full"
              disabled={booking}
              onClick={async () => {
                setBooking(true);
                try {
                  await createBooking({
                    userId: user?.id ?? "demo-user",
                    serviceType: service as "washroom" | "fresh" | "pads",
                    amount,
                    paymentMode: "cod",
                  });
                } catch {
                  // fallback
                }
                navigate("/rating");
              }}
            >
              {booking ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Confirm booking (COD)
            </Button>
          )}
        </div>
      </main>
    </PhoneShell>
  );
}
