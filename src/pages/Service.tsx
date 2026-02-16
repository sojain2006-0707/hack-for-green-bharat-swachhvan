import PhoneShell from "@/components/layout/PhoneShell";
import AppMenu from "@/components/menu/AppMenu";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { BadgeCheck, Droplets, MapPin, ShieldCheck } from "lucide-react";
import { useMemo } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

export default function Service() {
  const { type } = useParams();
  const navigate = useNavigate();

  const content = useMemo(() => {
    if (type === "pads") {
      return {
        title: "Sanitary Pads",
        subtitle: "Available inside the van vending unit",
        price: 20,
        bullets: [
          "Discreet & hygienic purchase",
          "Tissues and disposal bags",
          "Nearest van ETA shown on map",
        ],
        icon: Droplets,
      };
    }
    if (type === "fresh") {
      return {
        title: "Fresh-up",
        subtitle: "Quick clean + comfort kit",
        price: 20,
        bullets: [
          "Extra cleaning support",
          "Tissues + sanitiser",
          "Private and safe",
        ],
        icon: ShieldCheck,
      };
    }
    return {
      title: "Using Washroom",
      subtitle: "A clean, accessible washroom near you",
      price: 10,
      bullets: [
        "Western toilet setup",
        "Hygiene check before each user",
        "Fast arrival based on your location",
      ],
      icon: BadgeCheck,
    };
  }, [type]);

  const Icon = content.icon;

  return (
    <PhoneShell>
      <main className="flex flex-1 flex-col p-4">
        <header className="flex items-center justify-between pt-2">
          <AppMenu />
          <Button asChild variant="ghost" size="pill" className="h-10">
            <Link to="/home">Back</Link>
          </Button>
        </header>

        <section className="mt-4 space-y-3">
          <Card className="rounded-[26px] border bg-card p-5 shadow-soft">
            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-brand/10">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <h1 className="text-2xl">{content.title}</h1>
                <p className="mt-1 text-sm text-muted-foreground">{content.subtitle}</p>
              </div>
              <div className="ml-auto rounded-full bg-foreground px-3 py-1 text-xs font-semibold text-background">
                ₹{content.price}
              </div>
            </div>

            <ul className="mt-4 space-y-2 text-sm">
              {content.bullets.map((b) => (
                <li key={b} className="flex items-start gap-2">
                  <span className="mt-1 h-1.5 w-1.5 rounded-full bg-brand" />
                  <span className="text-muted-foreground">{b}</span>
                </li>
              ))}
            </ul>
          </Card>

          <Card className="rounded-[26px] border bg-background p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-secondary">
                <MapPin className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">Nearest van</p>
                <p className="text-xs text-muted-foreground">ETA 6–15 min (mock)</p>
              </div>
            </div>
          </Card>
        </section>

        <div className="mt-auto pb-4 pt-6">
          <Button
            variant="brand"
            size="pill"
            className="w-full"
            onClick={() => navigate(`/payment?service=${type ?? "washroom"}&amount=${content.price}`)}
          >
            Continue to payment
          </Button>
        </div>
      </main>
    </PhoneShell>
  );
}
