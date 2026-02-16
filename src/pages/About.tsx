import PhoneShell from "@/components/layout/PhoneShell";
import AppMenu from "@/components/menu/AppMenu";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CardContent } from "@/components/ui/card";
import {
  Globe,
  Info,
  Leaf,
  MapPin,
  ShieldCheck,
  Sparkles,
  Toilet,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function About() {
  return (
    <PhoneShell>
      <main className="relative flex flex-1 flex-col overflow-hidden bg-white p-4">
        {/* Full-page theme background */}
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
                  <Info className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-3xl font-semibold tracking-tight text-foreground">About SwachhVan</h1>
                  <p className="mt-2 text-base leading-relaxed text-muted-foreground">Civic hygiene, made accessible.</p>
                </div>
              </div>

              <div className="mt-5 space-y-3 text-sm leading-relaxed text-foreground">
                <p>
                  SwachhVan is a mobile-first prototype for on-demand washroom and hygiene services. The goal is to make clean,
                  dignified facilities available where and when people need them.
                </p>
              </div>

              <div className="mt-5 overflow-hidden rounded-2xl ring-1 ring-black/5">
                <img
                  src="/swachhvan-van.png"
                  alt="SwachhVan mobile washroom van"
                  className="h-auto w-full object-cover"
                  loading="lazy"
                  referrerPolicy="no-referrer"
                />
              </div>

              <div className="mt-6 grid gap-3">
                <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-black/5">
                  <p className="text-sm font-semibold">Why it matters</p>
                  <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                    We’re building for a simple promise: clean, safe, dignified washrooms — for commuters, travelers, outdoor workers,
                    and areas with limited public infrastructure.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-black/5">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      <p className="text-sm font-semibold">Mobility</p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">Washrooms that come to you.</p>
                  </div>
                  <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-black/5">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4" />
                      <p className="text-sm font-semibold">Hygiene</p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">Regularly cleaned, monitored cycles.</p>
                  </div>
                  <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-black/5">
                    <div className="flex items-center gap-2">
                      <Leaf className="h-4 w-4" />
                      <p className="text-sm font-semibold">Sustainability</p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">Responsible waste handling.</p>
                  </div>
                  <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-black/5">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <p className="text-sm font-semibold">Inclusivity</p>
                    </div>
                    <p className="mt-1 text-sm text-muted-foreground">Women’s hygiene and safety focus.</p>
                  </div>
                </div>

                <div className="rounded-2xl bg-black/[0.03] p-4 ring-1 ring-black/5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    <p className="text-sm font-semibold">Innovation (prototype vision)</p>
                  </div>
                  <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                    <li>Live availability + ETA (demo UI)</li>
                    <li>Service selection with transparent pricing (₹10 / ₹20)</li>
                    <li>Cash or digital payment flow (mock)</li>
                    <li>Cleanliness ratings + operator checklist idea</li>
                  </ul>
                </div>

                <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-black/5">
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-black/5">
                      <Toilet className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold">What’s inside the van</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        Clean western toilets, hand hygiene essentials, and support for women’s hygiene — including sanitary pad vending.
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-2">
                <Button asChild variant="brand" size="pill" className="flex-1">
                  <Link to="/how-it-works">
                    <Globe className="h-4 w-4" />
                    How it works
                  </Link>
                </Button>
                <Button asChild variant="editorial" size="pill" className="flex-1">
                  <Link to="/hygiene-safety">Hygiene & safety</Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </PhoneShell>
  );
}
