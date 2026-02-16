import PhoneShell from "@/components/layout/PhoneShell";
import { useAuth } from "@/contexts/AuthContext";
import React from "react";
import { useNavigate } from "react-router-dom";

export default function AuthCallback() {
  const { loading, user } = useAuth();
  const nav = useNavigate();

  React.useEffect(() => {
    if (!loading && user) nav("/home", { replace: true });
  }, [loading, user, nav]);

  return (
    <PhoneShell>
      <main className="flex flex-1 items-center justify-center p-6">
        <div className="text-center">
          <p className="text-sm font-semibold">Signing you in…</p>
          <p className="mt-1 text-xs text-muted-foreground">Please wait while we verify your session.</p>
        </div>
      </main>
    </PhoneShell>
  );
}
