import PhoneShell from "@/components/layout/PhoneShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Mail, Send } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function ForgotPassword() {
  const { resetPasswordEmail } = useAuth();

  const [email, setEmail] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setErr(null);
    setMsg(null);
    try {
      await resetPasswordEmail(email.trim(), `${window.location.origin}/reset-password`);
      setMsg("Reset link sent. Check your email.");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to send reset link");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PhoneShell>
      <main className="flex flex-1 flex-col p-6">
        <header className="pt-4">
          <h1 className="mt-5 text-3xl leading-tight">Reset password</h1>
          <p className="mt-2 max-w-[40ch] text-sm text-muted-foreground">
            We’ll email you a secure link to set a new password.
          </p>
        </header>

        <section className="mt-6 animate-slide-up space-y-3">
          <Card className="rounded-2xl border bg-background p-4 shadow-soft">
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Email</label>
                <div className="relative">
                  <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    type="email"
                    placeholder="email@domain.com"
                    required
                  />
                </div>
              </div>

              <Button disabled={busy} type="submit" variant="brand" size="pill" className="w-full">
                <Send />
                {busy ? "Sending…" : "Send reset link"}
              </Button>

              {(err || msg) && (
                <div
                  className={cn(
                    "rounded-xl border px-3 py-2 text-xs",
                    err ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-zone-green/30 bg-zone-green/5 text-zone-green",
                  )}
                >
                  {err ?? msg}
                </div>
              )}

              <p className="text-center text-xs text-muted-foreground">
                <Link to="/login" className="underline underline-offset-4">
                  Back to login
                </Link>
              </p>
            </form>
          </Card>
        </section>
      </main>
    </PhoneShell>
  );
}
