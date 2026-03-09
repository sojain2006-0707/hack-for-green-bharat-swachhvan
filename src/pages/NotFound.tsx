import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import PhoneShell from "@/components/layout/PhoneShell";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <PhoneShell>
      <div className="flex flex-1 items-center justify-center animate-page-enter">
        <div className="text-center px-6">
          <h1 className="text-6xl font-bold text-foreground">404</h1>
          <p className="mt-3 text-lg text-muted-foreground">Page not found</p>
          <p className="mt-1 text-sm text-muted-foreground">The page you're looking for doesn't exist.</p>
          <Link
            to="/"
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background transition hover:opacity-90"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </PhoneShell>
  );
};

export default NotFound;
