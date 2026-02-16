import PhoneShell from "@/components/layout/PhoneShell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Mail } from "lucide-react";
import * as React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const DEMO_AUTH_ENABLED =
  String(import.meta.env.VITE_DEMO_AUTH ?? "").toLowerCase() === "true";
const DEMO_OTP_CODE = "123456";

const PHOTOS = {
	hero:
		"https://images.unsplash.com/photo-1585421514738-01798e348b17?auto=format&fit=crop&w=1400&q=80",
	washroom:
		"https://images.unsplash.com/photo-1564540583246-934409427776?auto=format&fit=crop&w=900&q=80",
	fresh:
		"https://images.unsplash.com/photo-1583947215259-38e31be8751f?auto=format&fit=crop&w=900&q=80",
	pads: "/category-pads.svg",
	van:
		"https://images.unsplash.com/photo-1541976844346-f18aeac57b06?auto=format&fit=crop&w=900&q=80",
} as const;

type Category = {
	title: string;
	photo: string;
	to: string;
};

const CATEGORIES: Category[] = [
	{ title: "Washroom", photo: PHOTOS.washroom, to: "/service/washroom" },
	{ title: "Freshen Up", photo: PHOTOS.fresh, to: "/service/fresh" },
	{ title: "Sanitary Pads", photo: PHOTOS.pads, to: "/service/pads" },
	{ title: "Mobile Van", photo: PHOTOS.van, to: "/home" },
];

const Index = () => {
	const { loading, user, requestEmailOtp, verifyEmailOtp } = useAuth();
	const navigate = useNavigate();
	const location = useLocation() as any;

	const [email, setEmail] = React.useState("");
	const [otpOpen, setOtpOpen] = React.useState(false);
	const [otp, setOtp] = React.useState("");
	const [busy, setBusy] = React.useState(false);
	const [error, setError] = React.useState<string | null>(null);
	const emailInputRef = React.useRef<HTMLInputElement | null>(null);

	if (loading) {
		return (
			<PhoneShell>
				<main className="flex flex-1 items-center justify-center p-6">
					<p className="text-sm text-muted-foreground">Loading…</p>
				</main>
			</PhoneShell>
		);
	}

	const redirectAfterAuth = location.state?.from ?? "/home";
	const primaryCtaTo = user ? "/home" : "/";

	const normalizedEmail = email.trim();
	const emailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail);

	async function onContinue(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		if (user) {
			navigate(redirectAfterAuth, { replace: true });
			return;
		}
		if (!emailValid) {
			setError("Enter a valid email address.");
			return;
		}
		setBusy(true);
		try {
			await requestEmailOtp(normalizedEmail);
			setOtp("");
			setOtpOpen(true);
		} catch (err: any) {
			setError(err?.message ?? "Failed to send OTP");
		} finally {
			setBusy(false);
		}
	}

	async function onVerifyOtp() {
		setError(null);
		if (user) {
			setOtpOpen(false);
			navigate(redirectAfterAuth, { replace: true });
			return;
		}
		if (!emailValid) {
			setError("Enter a valid email address.");
			return;
		}
		if (otp.trim().length !== 6) {
			setError("Enter the 6-digit OTP.");
			return;
		}
		setBusy(true);
		try {
			await verifyEmailOtp(normalizedEmail, otp);
			setOtpOpen(false);
			navigate(redirectAfterAuth, { replace: true });
		} catch (err: any) {
			setError(err?.message ?? "Invalid OTP");
		} finally {
			setBusy(false);
		}
	}

	function requireEmailVerification() {
		setError("Verify your email to continue.");
		try {
			emailInputRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
		} catch {
			// ignore
		}
		emailInputRef.current?.focus();
	}

	return (
		<PhoneShell className="bg-white">
			<main className="flex flex-1 flex-col bg-white">
				<style>
					{`@keyframes vansSheen{0%{transform:translateX(-35%)}100%{transform:translateX(135%)}}
					@keyframes vansFloat{0%,100%{transform:translate3d(0,0,0)}50%{transform:translate3d(0,-10px,0)}}
					@keyframes vansPing{0%{transform:scale(1);opacity:.7}80%{transform:scale(2.3);opacity:0}100%{opacity:0}}`}
				</style>

				{/* HERO */}
				<section className="relative overflow-hidden">
					<div className="relative h-[360px] w-full">
						<img
							src={PHOTOS.hero}
							alt="Clean public hygiene service"
							className="absolute inset-0 h-full w-full object-cover"
							loading="eager"
							referrerPolicy="no-referrer"
						/>
						<div className="absolute inset-0 bg-black/35" />
						<div className="absolute inset-x-0 top-0 z-10 flex items-center justify-between px-5 pt-5">
							<div className="text-sm font-semibold tracking-tight text-white/95">SwachhVan</div>
							<Link
								to={user ? "/home" : "/login"}
								className="text-xs font-semibold text-white/90 underline underline-offset-4"
							>
								{user ? "Open" : "Sign in"}
							</Link>
						</div>

						<div className="relative z-10 flex h-full flex-col items-center justify-center px-6 text-center">
							<h1 className="text-4xl font-semibold leading-[1.05] tracking-tight text-white">
								Clean Washrooms. Anywhere.
							</h1>
							<p className="mt-3 max-w-[34ch] text-sm leading-relaxed text-white/85">
								On-demand mobile washroom & hygiene services for everyone.
							</p>
							<Button
								variant="editorial"
								size="pill"
								className="mt-6 h-11 w-full max-w-[240px] rounded-full border-white/70 bg-white/90 text-foreground hover:bg-white"
								onClick={() => navigate(user ? "/home" : "/", user ? undefined : { state: { from: "/home" } })}
							>
								{user ? "Open app" : "Continue"}
							</Button>
						</div>
					</div>
				</section>

				{/* EMAIL VERIFICATION */}
				<section className="-mt-10 px-5">
					<form onSubmit={onContinue} className="animate-slide-up">
						<Card className="rounded-3xl border-0 bg-white/95 p-4 shadow-soft ring-1 ring-black/5">
							<div className="space-y-3">
								<div className="space-y-1">
									<p className="text-xs font-semibold tracking-tight text-muted-foreground">Email verification</p>
									<div className="relative">
										<Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
										<Input
											ref={emailInputRef}
											value={email}
											onChange={(e) => setEmail(e.target.value)}
											type="email"
											placeholder="email@domain.com"
											className="h-12 rounded-full pl-10"
											required
										/>
									</div>
									<p className="text-[11px] leading-relaxed text-muted-foreground">
										We’ll send a 6-digit OTP to confirm your email.
									</p>
								</div>

								<Button
									type="submit"
									variant="brand"
									size="pill"
									className="h-12 w-full"
									disabled={busy || (!user && !emailValid)}
								>
									{busy ? "Please wait…" : user ? "Open" : "Continue →"}
								</Button>

								{error && (
									<div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs">
										<span className="font-semibold">Error: </span>
										{error}
									</div>
								)}
							</div>
						</Card>
					</form>
				</section>

				{/* CATEGORIES */}
				<section className="mt-6 px-5 pb-8">
					<div className="flex items-end justify-between">
						<div>
							<h2 className="text-xl font-semibold tracking-tight">Explore services</h2>
							<p className="mt-1 text-sm text-muted-foreground">Choose a category to book.</p>
						</div>
						{!user && (
							<button
								type="button"
								onClick={requireEmailVerification}
								className="text-xs font-semibold underline underline-offset-4 text-muted-foreground"
							>
								Verify to book
							</button>
						)}
					</div>

					<div className="mt-4 grid grid-cols-2 gap-3">
						{CATEGORIES.map((cat) => (
							<button
								key={cat.title}
								type="button"
								onClick={() => {
									if (!user) {
										requireEmailVerification();
										return;
									}
									navigate(cat.to);
								}}
								className={cn(
									"group relative aspect-square overflow-hidden rounded-2xl bg-white shadow-soft ring-1 ring-black/5",
									!user && "opacity-90",
								)}
							>
								<img
									src={cat.photo}
									alt={cat.title}
									className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
									loading="lazy"
									referrerPolicy="no-referrer"
									onError={(e) => {
										(e.currentTarget as HTMLImageElement).src = "/placeholder.svg";
									}}
								/>
								<div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/15 to-transparent" />
								{!user && (
									<div className="absolute left-3 top-3 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold text-muted-foreground ring-1 ring-black/5">
										Verify first
									</div>
								)}
								<div className="absolute inset-x-0 bottom-0 p-3">
									<p className="inline-flex rounded-full bg-black/35 px-3 py-1 text-sm font-semibold tracking-tight text-white drop-shadow-sm">
										{cat.title}
									</p>
								</div>
							</button>
						))}
					</div>
				</section>

				<Dialog
					open={otpOpen}
					onOpenChange={(open) => {
						setOtpOpen(open);
						if (!open) setOtp("");
					}}
				>
					<DialogContent className="max-w-[360px] rounded-3xl">
						<DialogHeader>
							<DialogTitle>Enter OTP</DialogTitle>
							<DialogDescription>
								We sent a 6-digit code to <span className="font-semibold text-foreground">{normalizedEmail}</span>.
							</DialogDescription>
						</DialogHeader>

						<div className="space-y-4">
							<div className="flex justify-center">
								<InputOTP
									maxLength={6}
									value={otp}
									onChange={(value) => setOtp(value)}
									autoFocus
								>
									<InputOTPGroup>
										<InputOTPSlot index={0} />
										<InputOTPSlot index={1} />
										<InputOTPSlot index={2} />
										<InputOTPSlot index={3} />
										<InputOTPSlot index={4} />
										<InputOTPSlot index={5} />
									</InputOTPGroup>
								</InputOTP>
							</div>

							<div className="flex items-center justify-between">
								<button
									type="button"
									disabled={busy}
									onClick={async () => {
										setError(null);
										setBusy(true);
										try {
											await requestEmailOtp(normalizedEmail);
											setOtp("");
										} catch (err: any) {
											setError(err?.message ?? "Failed to resend OTP");
										} finally {
											setBusy(false);
										}
									}}
									className={cn(
										"text-xs font-semibold underline underline-offset-4",
										busy && "pointer-events-none opacity-60",
									)}
								>
									Resend code
								</button>
								<p className="text-xs text-muted-foreground">Didn’t get it? Check spam.</p>
							</div>

							{error && (
								<div role="alert" className="rounded-2xl border border-destructive/30 bg-destructive/10 px-3 py-2 text-xs">
									<span className="font-semibold">Error: </span>
									{error}
								</div>
							)}
						</div>

						<DialogFooter>
							<Button
								type="button"
								variant="brand"
								size="pill"
								className="w-full"
								disabled={busy || otp.trim().length !== 6}
								onClick={onVerifyOtp}
							>
								{busy ? "Verifying…" : "Verify & Continue"}
							</Button>
						</DialogFooter>
					</DialogContent>
				</Dialog>

			</main>
		</PhoneShell>
	);
};

export default Index;
