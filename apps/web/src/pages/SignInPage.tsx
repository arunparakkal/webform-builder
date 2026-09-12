import { useMemo, useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { AuthLayout } from "../components/AuthLayout";
import { GitHubSignInButton, GoogleSignInButton } from "../components/GoogleSignInButton";
import { PasswordField } from "../components/PasswordField";
import { signinFormSchema, zodFieldErrors, type FieldErrors } from "../lib/authValidation";
import { useAuthStore } from "../store/authStore";

const inputClass =
  "w-full rounded-xl border border-[#E5E7EB] bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15";

export function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = useAuthStore((s) => s.token);
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = useMemo(() => {
    const from = (location.state as { from?: string } | null)?.from;
    return from && from.startsWith("/") ? from : "/app";
  }, [location.state]);

  if (token) return <Navigate to={redirectTo} replace />;

  async function finishAuth(result: { token: string; user: { id: string; email: string; name: string | null } }) {
    setSession(result.token, result.user);
    navigate(redirectTo, { replace: true });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const parsed = signinFormSchema.safeParse({ email, password });
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});
    try {
      setSubmitting(true);
      const result = await api.signin(parsed.data);
      await finishAuth(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout mode="signin">
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-[#0B1F44]">Welcome back</h1>
        <p className="mt-1 text-sm text-[#64748B]">Sign in to your FormBuilder account.</p>

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <GoogleSignInButton disabled={submitting} redirectTo={redirectTo} />
          <GitHubSignInButton disabled={submitting} />
        </div>

        <div className="my-5 flex items-center gap-3 text-xs font-medium tracking-wide text-[#94A3B8]">
          <span className="h-px flex-1 bg-[#E5E7EB]" />
          OR
          <span className="h-px flex-1 bg-[#E5E7EB]" />
        </div>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <label className="block text-sm">
            <span className="font-medium text-[#0B1F44]">Email address</span>
            <span className="relative mt-1.5 block">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#94A3B8]">
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                  <rect x="3" y="5" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                  <path d="m4 7 6 4 6-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </span>
              <input
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                className={inputClass}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </span>
            {fieldErrors.email ? <p className="mt-1 text-xs text-[#DC2626]">{fieldErrors.email}</p> : null}
          </label>

          <PasswordField
            label="Password"
            name="password"
            autoComplete="current-password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
          />

          <div className="flex items-center justify-between gap-3 text-sm">
            <label className="inline-flex items-center gap-2 text-[#64748B]">
              <input
                type="checkbox"
                className="h-4 w-4 rounded border-[#CBD5E1] text-[#2563EB] focus:ring-[#2563EB]"
                checked={remember}
                onChange={(e) => setRemember(e.target.checked)}
              />
              Remember me
            </label>
            <span className="cursor-default text-[#2563EB]" title="Coming soon">
              Forgot password?
            </span>
          </div>

          {error ? <p className="text-sm text-[#DC2626]">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#4F46E5] px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-500/25 hover:from-[#1D4ED8] hover:to-[#4338CA] disabled:opacity-60"
          >
            {submitting ? "Signing in…" : "Sign in"}
            <span aria-hidden="true">→</span>
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-[#64748B]">
          Don&apos;t have an account?{" "}
          <Link to="/signup" className="font-semibold text-[#2563EB] no-underline hover:underline">
            Sign up
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
