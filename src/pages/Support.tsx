import PhoneShell from "@/components/layout/PhoneShell";
import AppMenu from "@/components/menu/AppMenu";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  BadgeCheck,
  CreditCard,
  FileText,
  LifeBuoy,
  Mail,
  MapPin,
  MessageCircle,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  User,
} from "lucide-react";
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

type Topic = {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
};

const TOPICS: Topic[] = [
  {
    id: "booking",
    title: "Booking & ETA",
    description: "Van not arrived, location, delays",
    icon: MapPin,
  },
  {
    id: "payments",
    title: "Payments",
    description: "COD, online payment options",
    icon: CreditCard,
  },
  {
    id: "hygiene",
    title: "Hygiene & Safety",
    description: "Report cleanliness or safety issue",
    icon: ShieldCheck,
  },
  {
    id: "account",
    title: "Account",
    description: "Login, password, profile",
    icon: User,
  },
  {
    id: "feedback",
    title: "Feedback",
    description: "Share rating and suggestions",
    icon: BadgeCheck,
  },
  {
    id: "policy",
    title: "Policies",
    description: "Privacy, usage, refunds",
    icon: FileText,
  },
];

export default function Support() {
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [query, setQuery] = useState("");
  const [activeTopic, setActiveTopic] = useState<string>(TOPICS[0].id);

  const filteredTopics = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TOPICS;
    return TOPICS.filter((t) =>
      `${t.title} ${t.description}`.toLowerCase().includes(q),
    );
  }, [query]);

  const topicHint = useMemo(() => {
    const active = TOPICS.find((t) => t.id === activeTopic);
    return active?.title ?? "Support";
  }, [activeTopic]);

  return (
    <PhoneShell>
      <main className="relative flex flex-1 flex-col overflow-hidden bg-white p-4">
        <style>
          {`@keyframes supportFadeUp{from{opacity:0;transform:translateY(8px)}to{opacity:1;transform:translateY(0)}}
            @keyframes supportSheen{0%{transform:translateX(-30%)}100%{transform:translateX(130%)}}`}
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

        <header className="relative flex items-center justify-between pt-2 motion-safe:animate-[supportFadeUp_420ms_ease-out]">
          <AppMenu />
          <Button asChild variant="ghost" size="pill" className="h-10">
            <Link to="/home">Back</Link>
          </Button>
        </header>

        <section className="relative mt-4 space-y-3 motion-safe:animate-[supportFadeUp_520ms_ease-out]">
          {/* Header card */}
          <Card className="relative overflow-hidden rounded-[28px] border-0 bg-white/60 p-6 shadow-soft ring-1 ring-black/5 backdrop-blur">
            <div className="pointer-events-none absolute -inset-y-10 -left-10 w-1/2 bg-gradient-to-r from-transparent via-white/35 to-transparent opacity-40 motion-safe:animate-[supportSheen_4.2s_ease-in-out_infinite]" />

            <div className="flex items-start gap-4">
              <div className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-black/5">
                <LifeBuoy className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <div className="inline-flex items-center gap-2 rounded-full bg-black/[0.03] px-3 py-1 text-[11px] font-semibold text-foreground ring-1 ring-black/5">
                  <Sparkles className="h-3.5 w-3.5" />
                  Fast help, privacy-first
                </div>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground">Support</h1>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  Search topics, browse quick help, or send us a message.
                </p>
              </div>
            </div>

            {/* Search */}
            <div className="mt-5 rounded-[999px] bg-gradient-to-r from-emerald-500/25 via-teal-500/20 to-cyan-500/25 p-[1px] shadow-soft">
              <div className="flex items-center gap-2 rounded-[999px] bg-white/75 px-4 py-3 ring-1 ring-black/5 backdrop-blur">
                <Search className="h-4 w-4 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search help (booking, payment, hygiene…)"
                  className="h-auto border-0 bg-transparent p-0 shadow-none ring-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                />
              </div>
            </div>
          </Card>

          {/* Topics grid */}
          <Card className="rounded-[28px] border-0 bg-white/60 p-6 shadow-soft ring-1 ring-black/5 backdrop-blur">
            <p className="text-sm font-semibold text-foreground">Popular help topics</p>
            <p className="mt-1 text-xs text-muted-foreground">Tap a topic to prefill your message</p>

            <div className="mt-4 grid grid-cols-2 gap-3">
              {filteredTopics.map((t) => {
                const Icon = t.icon;
                const active = t.id === activeTopic;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => {
                      setActiveTopic(t.id);
                      setSubject(t.title);
                      if (!message) {
                        setMessage(`Hi Support, I need help with: ${t.title}.\n\nDetails:`);
                      }
                    }}
                    className={
                      active
                        ? "rounded-2xl bg-white/80 p-4 text-left shadow-soft ring-1 ring-black/15"
                        : "rounded-2xl bg-white/65 p-4 text-left ring-1 ring-black/5 transition hover:bg-white/75 hover:ring-black/10"
                    }
                  >
                    <div className="flex items-start gap-3">
                      <div className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-black/5">
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground">{t.title}</p>
                        <p className="mt-0.5 line-clamp-2 text-xs text-muted-foreground">{t.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </Card>

          {/* FAQs */}
          <Card className="rounded-[28px] border-0 bg-white/60 p-6 shadow-soft ring-1 ring-black/5 backdrop-blur">
            <p className="text-sm font-semibold text-foreground">FAQs</p>
            <Accordion type="single" collapsible className="mt-2">
              <AccordionItem value="eta">
                <AccordionTrigger className="text-sm">Why is the ETA changing?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  ETA updates are based on real-time van availability and traffic conditions. Times may vary depending on demand and route changes.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="cod">
                <AccordionTrigger className="text-sm">How does Cash on Delivery work?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Choose COD at checkout and pay the operator directly when the van arrives. You'll receive a booking confirmation with details.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="privacy">
                <AccordionTrigger className="text-sm">Is this privacy-first?</AccordionTrigger>
                <AccordionContent className="text-muted-foreground">
                  Yes—our experience is designed to be discreet and respectful. You can report issues anonymously in the message.
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </Card>

          {/* Contact actions */}
          <Card className="rounded-[28px] border-0 bg-white/60 p-6 shadow-soft ring-1 ring-black/5 backdrop-blur">
            <p className="text-sm font-semibold text-foreground">Contact</p>
            <div className="mt-3 grid gap-2">
              <button
                type="button"
                className="flex items-center gap-3 rounded-2xl bg-white/70 p-4 text-left ring-1 ring-black/5 transition hover:bg-white/80"
              >
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-black/5">
                  <MessageCircle className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Chat with us</p>
                  <p className="text-xs text-muted-foreground">Fastest way to get help</p>
                </div>
                <span className="rounded-full bg-emerald-600/10 px-3 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-black/5">
                  Recommended
                </span>
              </button>

              <button
                type="button"
                className="flex items-center gap-3 rounded-2xl bg-white/70 p-4 text-left ring-1 ring-black/5 transition hover:bg-white/80"
              >
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-black/5">
                  <Phone className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Call us</p>
                  <p className="text-xs text-muted-foreground">9 AM – 9 PM, all days</p>
                </div>
              </button>

              <button
                type="button"
                className="flex items-center gap-3 rounded-2xl bg-white/70 p-4 text-left ring-1 ring-black/5 transition hover:bg-white/80"
              >
                <div className="grid h-10 w-10 place-items-center rounded-2xl bg-black/5">
                  <Mail className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Email</p>
                  <p className="text-xs text-muted-foreground">support@swachhvan.app</p>
                </div>
              </button>
            </div>
          </Card>

          {/* Message form */}
          <Card className="rounded-[28px] border-0 bg-white/60 p-6 shadow-soft ring-1 ring-black/5 backdrop-blur">
            <p className="text-sm font-semibold text-foreground">Send a message</p>
            <p className="mt-1 text-xs text-muted-foreground">Topic: {topicHint}</p>

            <div className="mt-4 space-y-3">
              <Input
                placeholder="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
              <Textarea
                placeholder="Describe what happened…"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="min-h-[140px]"
              />
            </div>

            <div className="mt-4">
              <Button variant="brand" size="pill" className="w-full">
                Send message
              </Button>
              <p className="mt-3 text-center text-xs text-muted-foreground">We'll respond within 24 hours</p>
            </div>
          </Card>
        </section>
      </main>
    </PhoneShell>
  );
}
