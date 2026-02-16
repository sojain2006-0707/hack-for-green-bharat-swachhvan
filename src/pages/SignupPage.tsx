import PhoneShell from "@/components/layout/PhoneShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { KeyRound, Mail, UserPlus } from "lucide-react";
import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export default function SignupPage() {
  const { signUp } = useAuth();
  const nav = useNavigate();

  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [info, setInfo] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setInfo(null);
    try {
      await signUp(email.trim(), password);
      setInfo("Account created. If email confirmation is ON, verify your email.");
      nav("/login", { replace: true });
    } catch (err: any) {
      setError(err?.message ?? "Signup failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <PhoneShell>
      <main className="flex flex-1 flex-col p-6">
        <header className="pt-4">
          <h1 className="mt-5 text-3xl leading-tight">Create account</h1>
          <p className="mt-2 max-w-[40ch] text-sm text-muted-foreground">
            Join SwachhVan for safer access and cleaner communities.
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

              <div className="space-y-1">
                <label className="text-xs font-semibold text-muted-foreground">Password</label>
                <div className="relative">
                  <KeyRound className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    className="pl-9"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    type="password"
                    placeholder="Minimum 6 characters"
                    required
                  />
                </div>
              </div>

              <Button disabled={busy} type="submit" variant="brand" size="pill" className="w-full">
                <UserPlus />
                {busy ? "Please wait…" : "Sign up"}
              </Button>

              {(error || info) && (
                <div
                  className={cn(
                    "rounded-xl border px-3 py-2 text-xs",
                    error ? "border-destructive/30 bg-destructive/5 text-destructive" : "border-zone-green/30 bg-zone-green/5 text-zone-green",
                  )}
                >
                  {error ?? info}
                </div>
              )}

              <p className="text-center text-xs text-muted-foreground">
                Already have an account?{" "}
                <Link to="/login" className="underline underline-offset-4">
                  Login
                </Link>
              </p>
            </form>
          </Card>
        </section>
      </main>
    </PhoneShell>
  );
}
