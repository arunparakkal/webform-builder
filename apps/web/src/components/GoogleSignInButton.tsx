import { useState } from "react";
import { startGoogleOAuth } from "../lib/supabase";

type Props = {
  disabled?: boolean;
  label?: string;
  /** Where to send the user after OAuth completes (default /app). */
  redirectTo?: string;
};

export function GoogleSignInButton({
  disabled = false,
  label = "Continue with Google",
  redirectTo = "/app",
}: Props) {
  const [busy, setBusy] = useState(false);
  const [localError, setLocalError] = useState<string | null>(null);

  async function handleClick() {
    setLocalError(null);
    try {
      setBusy(true);
      await startGoogleOAuth(redirectTo);
      // Browser navigates away to Google / Supabase.
    } catch (err) {
      setBusy(false);
      setLocalError(err instanceof Error ? err.message : "Google sign-in failed");
    }
  }

  return (
    <div className="w-full">
      <button
        type="button"
        disabled={disabled || busy}
        onClick={() => void handleClick()}
        className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm font-medium text-[#0B1F44] hover:bg-[#F8FAFC] disabled:opacity-60"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
          <path
            fill="#EA4335"
            d="M12 10.2v3.9h5.5c-.2 1.3-1.6 3.9-5.5 3.9-3.3 0-6-2.7-6-6s2.7-6 6-6c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.3 14.5 2.3 12 2.3 6.9 2.3 2.8 6.4 2.8 11.5S6.9 20.7 12 20.7c5.2 0 8.6-3.6 8.6-8.8 0-.6-.1-1-.1-1.5H12z"
          />
          <path
            fill="#34A853"
            d="M3.8 7.5 7 9.9C7.9 7.7 9.8 6.2 12 6.2c1.9 0 3.1.8 3.8 1.5l2.6-2.5C16.7 3.3 14.5 2.3 12 2.3 8.3 2.3 5.1 4.4 3.8 7.5z"
          />
          <path
            fill="#4A90E2"
            d="M12 20.7c2.4 0 4.5-.8 6-2.2l-2.9-2.2c-.8.6-1.9 1-3.1 1-2.4 0-4.4-1.6-5.1-3.8l-3.1 2.4c1.4 2.9 4.4 4.8 8.2 4.8z"
          />
          <path
            fill="#FBBC05"
            d="M6.9 14.5c-.2-.6-.3-1.2-.3-1.8s.1-1.2.3-1.8L3.8 8.5C3.3 9.4 3 10.4 3 11.5s.3 2.1.8 3z"
          />
        </svg>
        {busy ? "Redirecting…" : label}
      </button>
      {localError ? <p className="mt-2 text-xs text-[#DC2626]">{localError}</p> : null}
    </div>
  );
}

export function GitHubSignInButton({ disabled = false }: { disabled?: boolean }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={() => {
        window.alert(
          "GitHub via Supabase can be enabled the same way as Google in the Supabase dashboard. Use Google or email for now.",
        );
      }}
      className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm font-medium text-[#0B1F44] hover:bg-[#F8FAFC] disabled:opacity-60"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
        <path d="M12 2C6.5 2 2 6.6 2 12.2c0 4.5 2.9 8.3 6.9 9.6.5.1.7-.2.7-.5v-1.9c-2.8.6-3.4-1.4-3.4-1.4-.4-1.1-1.1-1.4-1.1-1.4-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.6 2.4 1.1 3 .9.1-.7.4-1.1.6-1.4-2.2-.3-4.6-1.2-4.6-5.1 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1 .8-.2 1.6-.3 2.4-.3s1.6.1 2.4.3c1.9-1.3 2.7-1 2.7-1 .5 1.4.2 2.4.1 2.7.7.7 1.1 1.6 1.1 2.7 0 4-2.3 4.8-4.6 5.1.4.3.7 1 .7 2v2.9c0 .3.2.6.7.5 4-1.3 6.9-5.1 6.9-9.6C22 6.6 17.5 2 12 2z" />
      </svg>
      Continue with GitHub
    </button>
  );
}
