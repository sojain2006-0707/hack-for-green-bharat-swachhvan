import PhoneShell from "@/components/layout/PhoneShell";
import QuoteStrip from "@/components/ui/QuoteStrip";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { isSupabaseConfigured } from "@/lib/supabaseClient";
import { KeyRound, Link as LinkIcon, Mail, ShieldCheck } from "lucide-react";
import * as React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

export default function LoginPage() {
	const { signIn, magicLink } = useAuth();
	const nav = useNavigate();
	const loc = useLocation() as any;

	const demoAuthEnabled = import.meta.env.VITE_DEMO_AUTH === "true";
	const demoEmail = "demo@swachhvan.app";
	const demoPassword = "demo123";

	const [email, setEmail] = React.useState("");
	const [password, setPassword] = React.useState("");
	const [busy, setBusy] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);
	const [info, setInfo] = React.useState<string | null>(null);

	const authDisabled = !isSupabaseConfigured && !demoAuthEnabled;

	const redirectAfterLogin = loc.state?.from ?? "/home";
	const magicRedirectTo = `${window.location.origin}/auth/callback`;

	async function onPasswordLogin(e: React.FormEvent) {
		e.preventDefault();
		setBusy(true);
		setError(null);
		setInfo(null);
		try {
			await signIn(email.trim(), password);
			nav(redirectAfterLogin, { replace: true });
		} catch (err: any) {
			setError(err?.message ?? "Login failed");
		} finally {
			setBusy(false);
		}
	}

	async function onMagicLink() {
		setBusy(true);
		setError(null);
		setInfo(null);
		try {
			await magicLink(email.trim(), magicRedirectTo);
			setInfo("Magic link sent. Check your email.");
		} catch (err: any) {
			setError(err?.message ?? "Failed to send magic link");
		} finally {
			setBusy(false);
		}
	}

	return (
		<PhoneShell>
			<main className="flex flex-1 flex-col p-6">
				<header className="pt-4">
					<div className="inline-flex items-center gap-2 rounded-full border bg-background px-3 py-1 text-xs text-muted-foreground shadow-soft">
						<ShieldCheck className="h-3.5 w-3.5" />
						Cleanliness-first • Privacy-first
					</div>
					<h1 className="mt-5 text-3xl leading-tight">Sign in</h1>
					<p className="mt-2 max-w-[40ch] text-sm text-muted-foreground">
						Login to book the nearest van and access your bookings.
					</p>
				</header>

				<section className="mt-6 animate-slide-up space-y-3">
					<Card className="rounded-2xl border bg-background p-4 shadow-soft">
						{!isSupabaseConfigured && (
							<div className="mb-4 rounded-xl border border-amber-500/30 bg-amber-500/5 px-3 py-2 text-xs text-foreground">
								{demoAuthEnabled ? (
									<div className="space-y-2">
										<p className="font-semibold">Demo login enabled (local dev)</p>
										<p className="text-muted-foreground">
											Use <span className="font-mono">{demoEmail}</span> / <span className="font-mono">{demoPassword}</span>.
										</p>
										<Button
											type="button"
											variant="outline"
											size="sm"
											onClick={() => {
												setEmail(demoEmail);
												setPassword(demoPassword);
												setInfo(null);
												setError(null);
											}}
										>
											Fill demo credentials
										</Button>
									</div>
								) : (
									<div className="space-y-1">
										<p className="font-semibold">Supabase is not configured</p>
										<p className="text-muted-foreground">
											Set <span className="font-mono">VITE_SUPABASE_URL</span> and{" "}
											<span className="font-mono">VITE_SUPABASE_ANON_KEY</span> in{" "}
											<span className="font-mono">.env</span>, or enable demo auth with{" "}
											<span className="font-mono">VITE_DEMO_AUTH=true</span>.
										</p>
									</div>
								)}
							</div>
						)}

						<form onSubmit={onPasswordLogin} className="space-y-3">
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
										placeholder="••••••••"
										required
									/>
								</div>
							</div>

							<Button disabled={busy || authDisabled} type="submit" variant="brand" size="pill" className="w-full">
								{busy ? "Please wait…" : "Login"}
							</Button>
						</form>

						<div className="my-4 flex items-center gap-3">
							<div className="h-px flex-1 bg-border" />
							<span className="text-xs text-muted-foreground">or</span>
							<div className="h-px flex-1 bg-border" />
						</div>

						<Button
							disabled={busy || !email.trim() || authDisabled}
							onClick={onMagicLink}
							variant="outline"
							size="pill"
							className="w-full"
						>
							<LinkIcon />
							Send Magic Link
						</Button>

						{(error || info) && (
							<div
								role={error ? "alert" : "status"}
								aria-live={error ? "assertive" : "polite"}
								className={cn(
									"mt-3 rounded-xl border px-3 py-2 text-xs text-foreground",
									error ? "border-destructive bg-destructive/10" : "border-zone-green bg-zone-green/10",
								)}
							>
								<span className="font-semibold">{error ? "Error: " : "Success: "}</span>
								{error ?? info}
							</div>
						)}

						<div className="mt-4 flex items-center justify-between text-xs text-muted-foreground">
							<Link to="/signup" className="underline underline-offset-4">
								Create account
							</Link>
							<Link to="/forgot-password" className="underline underline-offset-4">
								Forgot password?
							</Link>
						</div>
					</Card>
				</section>

				<section className="mt-auto pb-2">
					<QuoteStrip />
				</section>
			</main>
		</PhoneShell>
	);
}

