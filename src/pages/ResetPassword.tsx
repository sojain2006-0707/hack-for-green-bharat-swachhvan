import PhoneShell from "@/components/layout/PhoneShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { KeyRound, Save } from "lucide-react";
import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function ResetPassword() {
  const { updatePassword } = useAuth();

  const [p1, setP1] = React.useState("");
  const [p2, setP2] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [msg, setMsg] = React.useState<string | null>(null);
  const [err, setErr] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);

    if (p1.length < 6) return setErr("Password must be at least 6 characters");
    if (p1 !== p2) return setErr("Passwords do not match");

    setBusy(true);
    try {
      await updatePassword(p1);
      setMsg("Password updated. You can close this page.");
    } catch (e: any) {
      setErr(e?.message ?? "Failed to update password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PhoneShell>
      <main className="flex flex-1 flex-col p-6">
        <header className="pt-4">
          <h1 className="mt-5 text-3xl leading-tight">Set new password</h1>
          <p className="mt-2 max-w-[44ch] text-sm text-muted-foreground">
            Choose a strong password to protect your account.
          </p>
        </header>

        <section className="mt-6 animate-slide-up space-y-3">
          <Card className="rounded-2xl border bg-background p-4 shadow-soft">
            <form onSubmit={onSubmit} className="space-y-3">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">New password</label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    type="password"
                    placeholder="New password"
                    value={p1}
                    onChange={(e) => setP1(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Confirm password</label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    type="password"
                    placeholder="Confirm password"
                    value={p2}
                    onChange={(e) => setP2(e.target.value)}
                  />
                </div>
              </div>

              <Button disabled={busy} type="submit" variant="brand" size="pill" className="w-full">
                <Save />
                {busy ? "Saving…" : "Update password"}
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
