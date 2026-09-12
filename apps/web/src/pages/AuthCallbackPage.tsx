import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { completeOAuthCallback, takeAuthRedirect } from "../lib/supabase";
import { useAuthStore } from "../store/authStore";

/**
 * OAuth return URL for Supabase Auth.
 * Exchanges the Supabase session for this app's JWT, then enters /app.
 */
export function AuthCallbackPage() {
  const navigate = useNavigate();
  const setSession = useAuthStore((s) => s.setSession);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const supabaseSession = await completeOAuthCallback();
        const result = await api.supabaseAuth(supabaseSession.access_token);
        if (cancelled) return;
        setSession(result.token, result.user);
        navigate(takeAuthRedirect("/app"), { replace: true });
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Could not complete Google sign-in");
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [navigate, setSession]);

  if (error) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-[#F5F7FA] px-4 text-center">
        <p className="max-w-md text-sm text-[#DC2626]">{error}</p>
        <p className="max-w-md text-xs text-[#64748B]">
          Start again from Sign in (don&apos;t refresh this callback URL).
        </p>
        <Link to="/signin" className="text-sm font-medium text-[#2563EB] no-underline hover:underline">
          Back to sign in
        </Link>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#F5F7FA] px-4">
      <p className="text-sm text-[#64748B]">Finishing Google sign-in…</p>
    </div>
  );
}
