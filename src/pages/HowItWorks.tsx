import PhoneShell from "@/components/layout/PhoneShell";
import AppMenu from "@/components/menu/AppMenu";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";

export default function HowItWorks() {
  return (
    <PhoneShell>
      <main className="relative flex flex-1 flex-col overflow-hidden bg-white p-4">
        {/* Full-page scenic theme background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-sky-100 via-white/70 to-emerald-100" />
          <div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-emerald-300/20 blur-3xl" />
          <div className="absolute -right-28 -top-20 h-96 w-96 rounded-full bg-sky-300/25 blur-3xl" />
          <div className="absolute -bottom-40 left-1/4 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-emerald-400/15 blur-3xl" />

          <img
            src="/swachhvan-van.png"
            alt=""
            className="absolute -right-24 bottom-6 w-[520px] max-w-none opacity-55"
            style={{
              maskImage: "linear-gradient(to left, rgba(0,0,0,1) 65%, rgba(0,0,0,0) 100%)",
              WebkitMaskImage: "linear-gradient(to left, rgba(0,0,0,1) 65%, rgba(0,0,0,0) 100%)",
            }}
            aria-hidden="true"
          />

          <div className="absolute inset-0 bg-white/35" />
        </div>

        <header className="relative flex items-center justify-between pt-2">
          <AppMenu />
          <Button asChild variant="editorial" size="pill" className="h-10">
            <Link to="/home">Back</Link>
          </Button>
        </header>

        <section className="relative mt-4">
          <Card className="rounded-[28px] border-0 bg-white/55 p-6 shadow-soft ring-1 ring-black/5 backdrop-blur">
            <div>
              <div className="flex items-start gap-4">
                <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-black/5">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-4xl font-semibold tracking-tight text-foreground">How It Works</h1>
                  <p className="mt-2 text-xl leading-snug text-muted-foreground">
                    A simple flow that respects time
                    <br />
                    and dignity.
                  </p>
                </div>
              </div>

              <ol className="mt-8 space-y-8">
                <li>
                  <p className="text-2xl font-semibold tracking-tight text-foreground">1) Find nearby vans</p>
                  <p className="mt-2 text-lg leading-relaxed text-muted-foreground">
                    User opens the app and shares location. Nearby washroom vans are shown on the map with live availability
                    and ETA.
                  </p>
                </li>

                <li>
                  <p className="text-2xl font-semibold tracking-tight text-foreground">2) Pick a service</p>
                  <p className="mt-2 text-lg leading-relaxed text-muted-foreground">
                    Choose what you need — washroom use, freshen‑up, or hygiene essentials. Transparent prices like ₹10 / ₹20.
                  </p>
                </li>

                <li>
                  <p className="text-2xl font-semibold tracking-tight text-foreground">3) Book & pay</p>
                  <p className="mt-2 text-lg leading-relaxed text-muted-foreground">
                    Confirm the booking in seconds. Payment supports cash or digital mode (demo flow).
                  </p>
                </li>

                <li>
                  <p className="text-2xl font-semibold tracking-tight text-foreground">4) Arrive clean, leave safe</p>
                  <p className="mt-2 text-lg leading-relaxed text-muted-foreground">
                    The van reaches you in about 5–15 minutes. Operators follow hygiene & safety protocols and waste is
                    safely collected and reused.
                  </p>
                </li>
              </ol>
            </div>
          </Card>
        </section>
      </main>
    </PhoneShell>
  );
}
