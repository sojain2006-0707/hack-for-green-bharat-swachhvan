import PhoneShell from "@/components/layout/PhoneShell";
import AppMenu from "@/components/menu/AppMenu";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { isSupabaseConfigured, supabase } from "@/lib/supabaseClient";
import { Mail, Phone, Save, User, Users } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";

function readString(value: unknown) {
  return typeof value === "string" ? value : "";
}

export default function Profile() {
  const { user, updateEmail, updateProfile } = useAuth();
  const { toast } = useToast();

  const initialFullName = useMemo(() => readString((user?.user_metadata as any)?.full_name), [user]);
  const initialPhone = useMemo(() => readString((user?.user_metadata as any)?.phone), [user]);
  const initialGender = useMemo(() => readString((user?.user_metadata as any)?.gender), [user]);
  const initialEmail = useMemo(() => readString(user?.email), [user]);

  const [fullName, setFullName] = useState(initialFullName);
  const [phone, setPhone] = useState(initialPhone);
  const [gender, setGender] = useState(initialGender || "prefer_not_to_say");
  const [email, setEmail] = useState(initialEmail);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName(initialFullName);
    setPhone(initialPhone);
    setGender(initialGender || "prefer_not_to_say");
    setEmail(initialEmail);
  }, [initialFullName, initialPhone, initialGender, initialEmail]);

  const emailChanged = email.trim() && email.trim().toLowerCase() !== initialEmail.trim().toLowerCase();
  const profileChanged =
    fullName.trim() !== initialFullName.trim() ||
    phone.trim() !== initialPhone.trim() ||
    (gender || "prefer_not_to_say") !== (initialGender || "prefer_not_to_say");

  async function onSave() {
    if (!user) return;
    if (!email.trim()) {
      toast({ title: "Email required", description: "Please enter a valid email address." });
      return;
    }

    if (!emailChanged && !profileChanged) {
      toast({ title: "No changes", description: "Nothing to update." });
      return;
    }

    setSaving(true);
    try {
      if (profileChanged) {
        await updateProfile({ fullName, phone, gender });
      }
      if (emailChanged) {
        await updateEmail(email);
      }

      // Store a real user profile row in Postgres (public.user_profiles).
      // Requires you to run supabase/schema.sql in your Supabase project.
      if (isSupabaseConfigured) {
        await supabase
          .from("user_profiles")
          .upsert(
            {
              user_id: user.id,
              full_name: fullName.trim() || null,
              phone: phone.trim() || null,
              email: email.trim() || null,
              gender: (gender || "prefer_not_to_say").trim(),
            },
            { onConflict: "user_id" },
          );
      }

      toast({
        title: "Saved",
        description: emailChanged
          ? "If you changed your email, please check your inbox to confirm it."
          : "Profile updated successfully.",
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Update failed.";
      toast({ title: "Update failed", description: message });
    } finally {
      setSaving(false);
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
                  <User className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-3xl font-semibold tracking-tight text-foreground">My Profile</h1>
                  <p className="mt-2 text-sm text-muted-foreground">Edit your name, phone number, gender and email.</p>
                </div>
              </div>

              <div className="mt-6 grid gap-4">
                <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-black/5">
                  <label className="text-xs font-semibold text-foreground">Full name</label>
                  <div className="mt-2">
                    <Input
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Your name"
                      autoComplete="name"
                    />
                  </div>
                </div>

                <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-black/5">
                  <label className="text-xs font-semibold text-foreground">Phone number</label>
                  <div className="mt-2 relative">
                    <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="10-digit mobile"
                      inputMode="tel"
                      autoComplete="tel"
                      className="pl-9"
                    />
                  </div>
                </div>

                <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-black/5">
                  <label className="text-xs font-semibold text-foreground">Gender</label>
                  <div className="mt-2 relative">
                    <Users className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger className="pl-9">
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="non_binary">Non-binary</SelectItem>
                        <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="rounded-2xl bg-white/70 p-4 ring-1 ring-black/5">
                  <label className="text-xs font-semibold text-foreground">Email address</label>
                  <div className="mt-2 relative">
                    <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="email@domain.com"
                      inputMode="email"
                      autoComplete="email"
                      className="pl-9"
                    />
                  </div>
                  <p className="mt-2 text-[11px] leading-snug text-muted-foreground">
                    If you update your email, you may need to confirm it via email.
                  </p>
                </div>

                <Button
                  variant="brand"
                  size="pill"
                  className="w-full"
                  onClick={onSave}
                  disabled={saving}
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </section>

        <div className="relative mt-auto pt-4" />
      </main>
    </PhoneShell>
  );
}
