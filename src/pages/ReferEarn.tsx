import PhoneShell from "@/components/layout/PhoneShell";
import AppMenu from "@/components/menu/AppMenu";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { Copy, Gift, Share2, Sparkles, Star } from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const STORAGE_KEY = "swachhvan:referral:code";

function makeCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // avoid confusing chars
  let out = "SV";
  for (let i = 0; i < 8; i += 1) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

function getReferralCode(): string {
  try {
    const existing = localStorage.getItem(STORAGE_KEY);
    if (existing && existing.length >= 6) return existing;
    const next = makeCode();
    localStorage.setItem(STORAGE_KEY, next);
    return next;
  } catch {
    return makeCode();
  }
}

export default function ReferEarn() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [copyBusy, setCopyBusy] = useState(false);

  const code = useMemo(() => getReferralCode(), []);
  const shareText = useMemo(() => {
    const who = user?.email ? `from ${user.email}` : "";
    return `Join SwachhVan ${who} — use my referral code ${code} and get rewards!`;
  }, [code, user?.email]);

  async function copyCode() {
    setCopyBusy(true);
    try {
      await navigator.clipboard.writeText(code);
      toast({ title: "Copied", description: "Referral code copied to clipboard." });
    } catch {
      toast({ title: "Copy failed", description: "Clipboard permission blocked. You can manually copy the code." });
    } finally {
      setCopyBusy(false);
    }
  }

  async function share() {
    try {
      if (navigator.share) {
        await navigator.share({ title: "SwachhVan", text: shareText });
        return;
      }
    } catch {
      // user cancelled share
      return;
    }

    // Fallback: copy the whole message
    try {
      await navigator.clipboard.writeText(shareText);
      toast({ title: "Copied", description: "Share message copied to clipboard." });
    } catch {
      toast({ title: "Share", description: shareText });
    }
  }

  return (
    <PhoneShell>
      <main className="relative flex flex-1 flex-col overflow-hidden bg-white p-4">
        {/* Background */}
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
                  <Gift className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-3xl font-semibold tracking-tight text-foreground">Refer & Earn</h1>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Invite friends to SwachhVan. When they join, both of you get rewards.
                  </p>
                </div>
              </div>

              <div className="mt-6 rounded-3xl bg-gradient-to-br from-emerald-600 to-sky-600 p-[1px] shadow-soft">
                <div className="rounded-3xl bg-white/90 p-5 ring-1 ring-black/5 backdrop-blur">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-xs font-semibold text-muted-foreground">Your referral code</div>
                      <div className="mt-1 text-2xl font-semibold tracking-[0.22em] text-foreground">{code}</div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="secondary" size="icon" className="rounded-2xl" onClick={copyCode} disabled={copyBusy}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button variant="brand" size="icon" className="rounded-2xl" onClick={share}>
                        <Share2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <div className="rounded-2xl bg-black/[0.03] p-3 ring-1 ring-black/5">
                      <div className="text-xs text-muted-foreground">Invites</div>
                      <div className="mt-1 text-lg font-semibold">0</div>
                    </div>
                    <div className="rounded-2xl bg-black/[0.03] p-3 ring-1 ring-black/5">
                      <div className="text-xs text-muted-foreground">Joined</div>
                      <div className="mt-1 text-lg font-semibold">0</div>
                    </div>
                    <div className="rounded-2xl bg-black/[0.03] p-3 ring-1 ring-black/5">
                      <div className="text-xs text-muted-foreground">Rewards</div>
                      <div className="mt-1 text-lg font-semibold">₹0</div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5 grid gap-3">
                <div className="rounded-3xl bg-white/70 p-4 ring-1 ring-black/5">
                  <div className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4" />
                    <div className="text-sm font-semibold">How it works</div>
                  </div>
                  <ol className="mt-2 space-y-2 text-sm text-muted-foreground">
                    <li>1. Share your code with friends.</li>
                    <li>2. They sign up and book their first service.</li>
                    <li>3. You both receive reward credits.</li>
                  </ol>
                </div>

                <div className="rounded-3xl bg-white/70 p-4 ring-1 ring-black/5">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4" />
                    <div className="text-sm font-semibold">Rewards</div>
                  </div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    Rewards are shown as credits and can be applied during checkout.
                  </p>
                </div>

                <div className="rounded-3xl bg-white/70 p-4 ring-1 ring-black/5">
                  <div className="text-sm font-semibold">Terms</div>
                  <p className="mt-2 text-sm text-muted-foreground">
                    One reward per new user. Fraud and self-referrals may be blocked. Rewards availability may vary by city.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </main>
    </PhoneShell>
  );
}
