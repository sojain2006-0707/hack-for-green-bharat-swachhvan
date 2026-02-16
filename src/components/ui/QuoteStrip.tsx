import { cn } from "@/lib/utils";

const QUOTES = [
  "Clean today. Greener tomorrow.",
  "Respect the space you use.",
  "Small habits. Big hygiene.",
  "Swachh Bharat starts with us.",
];

export default function QuoteStrip({ className }: { className?: string }) {
  return (
    <div className={cn("overflow-hidden rounded-2xl border bg-card shadow-soft", className)}>
      <div className="flex gap-6 whitespace-nowrap px-4 py-3 text-sm">
        <div className="flex gap-6 animate-[shine_2.4s_ease-in-out_infinite] [background:linear-gradient(90deg,transparent,transparent,transparent)]">
          {Array.from({ length: 2 }).map((_, loopIdx) => (
            <div key={loopIdx} className="flex gap-6">
              {QUOTES.map((q) => (
                <span key={`${loopIdx}-${q}`} className="text-muted-foreground">
                  <span className="text-foreground/90">“</span>
                  {q}
                  <span className="text-foreground/90">”</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
