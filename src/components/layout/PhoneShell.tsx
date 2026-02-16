import { cn } from "@/lib/utils";
import * as React from "react";

type PhoneShellProps = {
  children: React.ReactNode;
  className?: string;
};

/**
 * A simple “phone frame” so the web preview feels like a mobile app.
 */
export default function PhoneShell({ children, className }: PhoneShellProps) {
  return (
    <div className="min-h-screen bg-white">
      <div className="mx-auto flex min-h-screen max-w-[420px] flex-col px-4 py-6">
        <div
          className={cn(
            "relative flex flex-1 flex-col overflow-hidden rounded-[28px] border bg-background shadow-elevated",
            className,
          )}
        >
          {/* status bar hint */}
          <div className="pointer-events-none absolute left-0 right-0 top-0 z-20 h-6 bg-background/80 backdrop-blur-sm" />
          {children}
        </div>
      </div>
    </div>
  );
}
