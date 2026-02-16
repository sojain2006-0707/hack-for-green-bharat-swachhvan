import PhoneShell from "@/components/layout/PhoneShell";
import AppMenu from "@/components/menu/AppMenu";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Flame, Leaf, Recycle, Sprout, Wind } from "lucide-react";
import { Link } from "react-router-dom";

type Feature = {
  title: string;
  description: string;
  icon: React.ReactNode;
};

const WASTE_CONVERTED_INTO: Feature[] = [
  {
    title: "Bio-gas energy",
    description:
      "Organic waste can be transformed into bio-gas, which may be used as a renewable energy source for electricity or heating.",
    icon: <Flame className="h-4 w-4" />,
  },
  {
    title: "Organic fertilizer",
    description:
      "Treated waste supports the production of eco-friendly fertilizers that can enrich soil and promote sustainable agriculture.",
    icon: <Sprout className="h-4 w-4" />,
  },
  {
    title: "Reduced open defecation",
    description:
      "Accessible mobile washrooms help reduce unsafe sanitation practices, improving public health and environmental hygiene.",
    icon: <Recycle className="h-4 w-4" />,
  },
  {
    title: "Lower pollution & methane emissions",
    description:
      "Controlled waste treatment prevents harmful gases and contaminants from entering the environment.",
    icon: <Wind className="h-4 w-4" />,
  },
  {
    title: "Supports circular economy",
    description:
      "Waste is reused as a resource instead of being discarded, contributing to long-term sustainability.",
    icon: <Leaf className="h-4 w-4" />,
  },
];

export default function Sustainability() {
  return (
    <PhoneShell>
      <main className="relative flex flex-1 flex-col overflow-hidden bg-white p-4">
        {/* Full-page soft theme background (reference: HygieneSafety) */}
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
                <Leaf className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-3xl font-semibold tracking-tight text-foreground">Environmental Impact</h1>
                <p className="mt-2 text-base leading-relaxed text-muted-foreground">
                  Turning waste into value for a cleaner tomorrow.
                </p>
              </div>
            </div>

            <div className="mt-6 rounded-2xl bg-white/70 p-4 ring-1 ring-black/5">
              <p className="text-sm leading-relaxed text-muted-foreground">
                SwachhVan goes beyond providing clean washroom access — it focuses on responsible waste management and sustainable environmental practices. Human waste collected from vans is safely processed and converted into useful resources, helping reduce pollution and promote a circular economy.
              </p>
            </div>

            <div className="mt-6">
              <div className="flex items-center gap-2">
                <Recycle className="h-4 w-4" />
                <p className="text-sm font-semibold text-foreground">Waste Converted Into</p>
              </div>

              <div className="mt-3 grid gap-3">
                {WASTE_CONVERTED_INTO.map((item) => (
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
          </Card>
        </section>
      </main>
    </PhoneShell>
  );
}
