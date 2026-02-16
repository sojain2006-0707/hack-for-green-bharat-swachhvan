import PhoneShell from "@/components/layout/PhoneShell";
import AppMenu from "@/components/menu/AppMenu";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, ShieldCheck, Loader2 } from "lucide-react";
import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { createBooking } from "@/lib/vanService";
import { useAuth } from "@/contexts/AuthContext";

export default function OnlinePay() {
  const [params] = useSearchParams();
  const amount = Number(params.get("amount") ?? 10);
  const vanId = params.get("van") ?? "";
  const service = params.get("service") ?? "washroom";
  const { user } = useAuth();
  const [paid, setPaid] = useState(false);
  const [paying, setPaying] = useState(false);

  const upiId = useMemo(() => "swachhvan@upi (mock)", []);

  return (
    <PhoneShell>
      <main className="flex flex-1 flex-col p-4">
        <header className="flex items-center justify-between pt-2">
          <AppMenu />
          <Button asChild variant="editorial" size="pill" className="h-10">
            <Link to="/payment">Back</Link>
          </Button>
          <div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-2 text-xs text-muted-foreground shadow-soft">
            <ShieldCheck className="h-3.5 w-3.5" />
            Secure payment
          </div>
        </header>

        <section className="mt-4 space-y-3">
          <Card className="rounded-[26px] border bg-card p-5 shadow-soft">
            <h1 className="text-2xl">Pay online</h1>
            <p className="mt-1 text-sm text-muted-foreground">Prototype screen (no real payment here)</p>
            <div className="mt-4 rounded-2xl border bg-background p-4">
              <p className="text-xs text-muted-foreground">Amount</p>
              <p className="mt-1 text-3xl font-semibold">₹{amount}</p>
              <p className="mt-3 text-xs text-muted-foreground">UPI</p>
              <p className="text-sm font-semibold">{upiId}</p>
            </div>
          </Card>

          <Card className="rounded-[26px] border bg-background p-5 shadow-soft">
            <p className="text-sm font-semibold">Status</p>
            <div className="mt-3 flex items-center gap-3 rounded-2xl border bg-card p-4">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-secondary">
                <CheckCircle2 className="h-4 w-4" />
              </div>
              <div>
                <p className="text-sm font-semibold">{paid ? "Payment successful" : "Waiting for payment"}</p>
                <p className="text-xs text-muted-foreground">
                  {paid ? "Booking confirmed." : "Tap the button below to simulate payment."}
                </p>
              </div>
            </div>
          </Card>
        </section>

        <div className="mt-auto pb-4 pt-6">
          {paid ? (
            <Button asChild variant="brand" size="pill" className="w-full">
              <Link to="/rating">Rate your experience</Link>
            </Button>
          ) : (
            <Button
              variant="brand"
              size="pill"
              className="w-full"
              disabled={paying}
              onClick={async () => {
                setPaying(true);
                try {
                  await createBooking({
                    userId: user?.id ?? "demo-user",
                    serviceType: service as "washroom" | "fresh" | "pads",
                    amount,
                    paymentMode: "online",
                  });
                } catch {
                  // fallback
                }
                setPaid(true);
                setPaying(false);
              }}
            >
              {paying ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              Simulate payment
            </Button>
          )}
        </div>
      </main>
    </PhoneShell>
  );
}
