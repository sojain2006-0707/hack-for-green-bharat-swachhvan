import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

export function RequireAuth({ children }: { children: React.ReactNode }) {
  const { loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  return <>{children}</>;
}
