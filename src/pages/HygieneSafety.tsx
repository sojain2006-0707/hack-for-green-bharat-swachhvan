import PhoneShell from "@/components/layout/PhoneShell";
import AppMenu from "@/components/menu/AppMenu";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  ClipboardCheck,
  Droplets,
  Leaf,
  Lock,
  Phone,
  ShieldCheck,
  Star,
  Users,
} from "lucide-react";
import { Link } from "react-router-dom";

type Feature = {
  title: string;
  description: string;
  icon: React.ReactNode;
};

const HYGIENE_STANDARDS: Feature[] = [
  {
    title: "Cleaned after every use",
    description: "Each van is sanitized between customers to keep hygiene consistent all day.",
    icon: <ClipboardCheck className="h-4 w-4" />,
  },
  {
    title: "Eco‑friendly disinfectants",
    description: "Eco-safe, effective disinfectants to protect people and the environment.",
    icon: <Leaf className="h-4 w-4" />,
  },
  {
    title: "Separate waste & water tanks",
    description: "Fresh water and waste are stored in sealed, separate tanks to prevent contamination.",
    icon: <Droplets className="h-4 w-4" />,
  },
  {
    title: "Real‑time cleanliness ratings",
    description: "Rate hygiene after each visit to help us track quality and stay transparent.",
    icon: <Star className="h-4 w-4" />,
  },
  {
    title: "Trained sanitation staff",
    description: "Operators follow cleaning protocols and safe waste-handling practices.",
    icon: <Users className="h-4 w-4" />,
  },
];

const SAFETY_SUPPORT: Feature[] = [
  {
    title: "Privacy-first experience",
    description: "Clear signage, respectful conduct, and privacy-focused layout for dignity.",
    icon: <Lock className="h-4 w-4" />,
  },
  {
    title: "Cleaning checklist",
    description: "Standard operating procedures for every service cycle.",
    icon: <ClipboardCheck className="h-4 w-4" />,
  },
  {
    title: "Consumables & replenishment",
    description: "Soap, sanitizer, tissue, and disposal supplies are monitored and refilled.",
    icon: <Droplets className="h-4 w-4" />,
  },
  {
    title: "Emergency support",
    description: "Quick access to contact and reporting options when needed.",
    icon: <Phone className="h-4 w-4" />,
  },
];

export default function HygieneSafety() {
  return (
    <PhoneShell>
      <main className="relative flex flex-1 flex-col overflow-hidden bg-white p-4">
        {/* Full-page soft theme background */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-50 via-white/60 to-sky-50" />
          <div className="absolute -left-24 top-10 h-80 w-80 rounded-full bg-emerald-300/18 blur-3xl" />
          <div className="absolute -right-32 -top-24 h-96 w-96 rounded-full bg-sky-300/22 blur-3xl" />
          <div className="absolute -bottom-36 left-1/3 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-emerald-400/12 blur-3xl" />

          <img
            src="/hygiene-safety-bg.svg"
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
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">Hygiene & Safety</h1>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                  Your health, dignity, and safety come first — designed for a clean, secure, and respectful experience every time.
                </p>
              </div>
            </div>

            <div className="mt-6">
              <p className="text-sm font-semibold text-foreground">Hygiene standards</p>
              <div className="mt-3 grid gap-3">
                {HYGIENE_STANDARDS.map((item) => (
                  <div
                    key={item.title}
                    className="flex items-start gap-3 rounded-2xl bg-white/70 p-4 ring-1 ring-black/5"
                  >
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

            <div className="mt-6">
              <p className="text-sm font-semibold text-foreground">Safety & support</p>
              <div className="mt-3 grid gap-3">
                {SAFETY_SUPPORT.map((item) => (
                  <div
                    key={item.title}
                    className="flex items-start gap-3 rounded-2xl bg-white/70 p-4 ring-1 ring-black/5"
                  >
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
              <p className="text-sm font-semibold text-foreground">Innovation: trust signals</p>
              <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                <li>Cleanliness rating after each visit</li>
                <li>Operator checklist + replenishment tracking</li>
                <li>Clear reporting path for any issue</li>
              </ul>
            </div>
          </Card>
        </section>
      </main>
    </PhoneShell>
  );
}
