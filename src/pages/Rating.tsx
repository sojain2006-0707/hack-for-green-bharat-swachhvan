import PhoneShell from "@/components/layout/PhoneShell";
import AppMenu from "@/components/menu/AppMenu";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import {
  BadgeCheck,
  Frown,
  Sparkles,
  Star,
  ThumbsDown,
  ThumbsUp,
  Loader2,
  CheckCircle2,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { submitRating } from "@/lib/vanService";
import { useAuth } from "@/contexts/AuthContext";

export default function Rating() {
  const [value, setValue] = useState(4);
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { user } = useAuth();

  const title = useMemo(() => {
    if (value >= 5) return "Awesome!";
    if (value === 4) return "Great";
    if (value === 3) return "Okay";
    return "We can do better";
  }, [value]);

  const subtitle = useMemo(() => {
    if (value >= 4) return "What did you like?";
    if (value === 3) return "What should we improve?";
    return "Tell us what went wrong";
  }, [value]);

  const tagOptions = useMemo(() => {
    if (value >= 4) {
      return [
        "Clean & hygienic",
        "Quick arrival",
        "Privacy-first",
        "Well maintained",
        "Friendly operator",
        "Easy booking",
      ];
    }
    return [
      "Long wait time",
      "Cleanliness issue",
      "Location mismatch",
      "Payment issue",
      "Consumables missing",
      "Other",
    ];
  }, [value]);

  const tone = useMemo(() => {
    if (value >= 4) return "positive" as const;
    if (value === 3) return "neutral" as const;
    return "negative" as const;
  }, [value]);

  const toggleTag = (tag: string) => {
    setSelectedTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));
  };

  return (
    <PhoneShell>
      <main className="relative flex flex-1 flex-col overflow-hidden bg-white p-4">
        <style>
          {`@keyframes rateFadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
            @keyframes rateSheen{0%{transform:translateX(-35%)}100%{transform:translateX(135%)}}
            @keyframes rateFloat{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(0,-8px,0)}}`}
        </style>

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

        <header className="relative flex items-center justify-between pt-2 motion-safe:animate-[rateFadeUp_420ms_ease-out]">
          <AppMenu />
          <Button asChild variant="ghost" size="pill" className="h-10">
            <Link to="/home">Back</Link>
          </Button>
        </header>

        <section className="relative mt-4 space-y-3 motion-safe:animate-[rateFadeUp_520ms_ease-out]">
          <Card className="relative overflow-hidden rounded-[28px] border-0 bg-white/60 p-6 shadow-soft ring-1 ring-black/5 backdrop-blur">
            <div className="pointer-events-none absolute -inset-y-10 -left-10 w-1/2 bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-40 motion-safe:animate-[rateSheen_4.6s_ease-in-out_infinite]" />
            <div className="pointer-events-none absolute -right-16 -top-16 h-44 w-44 rounded-full bg-emerald-300/14 blur-2xl" />
            <div className="pointer-events-none absolute -left-16 -bottom-16 h-44 w-44 rounded-full bg-sky-300/14 blur-2xl" />

            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full bg-black/[0.03] px-3 py-1 text-[11px] font-semibold text-foreground ring-1 ring-black/5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Help us improve
                </div>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">Rate SwachhVan</h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  How was the hygiene and overall service?
                </p>
              </div>

              <div
                className={cn(
                  "grid h-12 w-12 shrink-0 place-items-center rounded-2xl ring-1 ring-black/5",
                  tone === "positive"
                    ? "bg-emerald-500/10"
                    : tone === "neutral"
                      ? "bg-sky-500/10"
                      : "bg-rose-500/10",
                )}
              >
                {tone === "positive" ? (
                  <ThumbsUp className="h-5 w-5" />
                ) : tone === "neutral" ? (
                  <BadgeCheck className="h-5 w-5" />
                ) : (
                  <ThumbsDown className="h-5 w-5" />
                )}
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-foreground">{title}</p>
                <p className="text-xs font-semibold text-muted-foreground">Selected: {value} / 5</p>
              </div>

              <div className="mt-3 flex items-center justify-center gap-2">
                {Array.from({ length: 5 }).map((_, i) => {
                  const star = i + 1;
                  const active = star <= value;
                  return (
                    <button
                      key={star}
                      type="button"
                      onClick={() => {
                        setValue(star);
                        setSelectedTags([]);
                      }}
                      className={cn(
                        "grid h-12 w-12 place-items-center rounded-2xl ring-1 ring-black/10 transition",
                        active
                          ? "bg-white/85 shadow-soft"
                          : "bg-white/60 hover:bg-white/80",
                      )}
                      aria-label={`Rate ${star} stars`}
                    >
                      <Star
                        className={cn(
                          "h-5 w-5 transition",
                          active ? "fill-amber-400 text-amber-500" : "text-foreground/70",
                        )}
                      />
                    </button>
                  );
                })}
              </div>

              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
                {tone === "negative" ? <Frown className="h-4 w-4" /> : <BadgeCheck className="h-4 w-4" />}
                <span>{subtitle}</span>
              </div>
            </div>
          </Card>

          <Card className="rounded-[28px] border-0 bg-white/60 p-6 shadow-soft ring-1 ring-black/5 backdrop-blur">
            <p className="text-sm font-semibold text-foreground">Quick feedback</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {tagOptions.map((tag) => {
                const active = selectedTags.includes(tag);
                return (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={cn(
                      "rounded-full px-4 py-2 text-xs font-medium ring-1 transition",
                      active
                        ? "bg-emerald-600/12 text-foreground ring-black/10"
                        : "bg-white/70 text-muted-foreground ring-black/5 hover:bg-white/85 hover:text-foreground",
                    )}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>

            <div className="mt-5">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Add a short note (optional)…"
                className="min-h-[120px] bg-white/70"
                disabled={submitted}
              />
              {submitted && (
                <div className="mt-2 flex items-center justify-center gap-2 text-xs text-emerald-700">
                  <CheckCircle2 className="h-4 w-4" />
                  Rating submitted — thank you!
                </div>
              )}
            </div>
          </Card>

          <div className="pb-4">
            {submitted ? (
              <Button asChild variant="brand" size="pill" className="w-full">
                <Link to="/home">Back to map</Link>
              </Button>
            ) : (
              <Button
                variant="brand"
                size="pill"
                className="w-full"
                disabled={submitting}
                onClick={async () => {
                  setSubmitting(true);
                  try {
                    await submitRating({
                      userId: user?.id ?? "demo-user",
                      stars: value,
                      tags: selectedTags,
                      note: note || undefined,
                    });
                    setSubmitted(true);
                  } catch {
                    setSubmitted(true); // show success in demo mode anyway
                  }
                  setSubmitting(false);
                }}
              >
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Submit rating
              </Button>
            )}
          </div>
        </section>
      </main>
    </PhoneShell>
  );
}
