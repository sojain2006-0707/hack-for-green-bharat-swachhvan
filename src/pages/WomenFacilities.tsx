import PhoneShell from "@/components/layout/PhoneShell";
import AppMenu from "@/components/menu/AppMenu";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  AlertTriangle,
  HeartHandshake,
  Lock,
  ShieldCheck,
  Trash2,
  Sparkles,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function WomenFacilities() {
  const facilities = [
    {
      title: "Sanitary pads on demand",
      description:
        "Clean, high-quality sanitary pads are available inside select vans through hygienic dispensing systems, accessible whenever needed.",
      icon: <Sparkles className="h-4 w-4" />,
    },
    {
      title: "Safe & hygienic disposal system",
      description:
        "Dedicated, sealed disposal units ensure sanitary waste is handled discreetly, safely, and responsibly without odor or exposure.",
      icon: <Trash2 className="h-4 w-4" />,
    },
    {
      title: "Enhanced privacy inside vans",
      description:
        "Washroom vans are designed to provide maximum privacy with secure locks, sound insulation, and well-lit interiors.",
      icon: <Lock className="h-4 w-4" />,
    },
    {
      title: "Period emergency booking option",
      description:
        "A dedicated “Period Emergency” booking mode helps women quickly locate the nearest available van during urgent situations.",
      icon: <AlertTriangle className="h-4 w-4" />,
    },
    {
      title: "Women safety assistance",
      description:
        "In-app safety features and quick support options are available to ensure peace of mind during service usage.",
      icon: <ShieldCheck className="h-4 w-4" />,
    },
  ] as const;

  return (
    <PhoneShell>
      <main className="relative flex flex-1 flex-col overflow-hidden bg-white p-4">
        {/* Full-page soft theme background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-pink-50 via-white/60 to-rose-50" />
          <div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-pink-300/18 blur-3xl" />
          <div className="absolute -right-32 -top-24 h-96 w-96 rounded-full bg-fuchsia-300/22 blur-3xl" />
          <div className="absolute -bottom-36 left-1/3 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-rose-400/12 blur-3xl" />
          <div className="absolute bottom-24 -left-20 h-64 w-64 rounded-full bg-violet-300/12 blur-3xl" />
          <img
            src="/women-facilities-bg.svg"
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-100"
            aria-hidden="true"
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
          <Card className="rounded-[28px] border-0 bg-white/60 p-6 shadow-soft ring-1 ring-black/5 backdrop-blur">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-black/5">
                <HeartHandshake className="h-5 w-5 text-pink-700" />
              </div>
              <div className="min-w-0">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">Women Facilities</h1>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                  Designed with care, dignity, and safety at the core.
                </p>
              </div>
            </div>

            <div className="mt-6 space-y-3 text-sm leading-relaxed text-muted-foreground">
              <p>
                SwachhVan is thoughtfully built to support women’s hygiene needs, comfort, and safety — especially in
                situations where access to clean facilities is limited or urgent.
              </p>
              <p>
                We understand that hygiene is deeply personal, and our services aim to remove hesitation, stress, and
                discomfort, particularly during travel or menstrual emergencies.
              </p>
            </div>

            <div className="mt-6">
              <p className="text-sm font-semibold text-foreground">Facilities Provided</p>
              <div className="mt-3 grid gap-3">
                {facilities.map((item) => (
                  <div key={item.title} className="flex items-start gap-3 rounded-2xl bg-white/70 p-4 ring-1 ring-black/5">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-black/5 text-foreground">
                      {item.icon}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-foreground">{item.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{item.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-black/[0.03] p-4 ring-1 ring-black/5">
              <p className="text-sm font-semibold text-foreground">Innovation: comfort + safety signals</p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>Privacy-first interiors with better lighting and lock assurance</li>
                <li>Fast “Period Emergency” mode to reduce time-to-support</li>
                <li>Refill prompts for pads & sealed disposal units</li>
                <li>Quick support entry points for safety assistance</li>
              </ul>
            </div>

            <div className="mt-6 flex flex-wrap gap-2">
              <Button asChild variant="editorial" size="pill" className="h-10">
                <Link to="/home">Book a Van</Link>
              </Button>
              <Button asChild variant="outline" size="pill" className="h-10 bg-white/70">
                <Link to="/hygiene-safety">Hygiene & Safety</Link>
              </Button>
            </div>
          </Card>
        </section>
      </main>
    </PhoneShell>
  );
}
