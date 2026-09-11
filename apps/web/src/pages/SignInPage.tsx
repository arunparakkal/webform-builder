import { useMemo, useState, type FormEvent } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { PasswordField } from "../components/PasswordField";
import { signinFormSchema, zodFieldErrors, type FieldErrors } from "../lib/authValidation";
import { useAuthStore } from "../store/authStore";

export function SignInPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const token = useAuthStore((s) => s.token);
  const setSession = useAuthStore((s) => s.setSession);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const redirectTo = useMemo(() => {
    const from = (location.state as { from?: string } | null)?.from;
    return from && from.startsWith("/") ? from : "/app";
  }, [location.state]);

  if (token) return <Navigate to={redirectTo} replace />;

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
      setSession(result.token, result.user);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not sign in");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-12">
      <div className="mb-8 text-center">
        <Link to="/" className="font-display text-2xl font-semibold text-ink no-underline">
          Webform Builder
        </Link>
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">Sign in</h1>
        <p className="mt-2 text-sm text-ink-muted">Access your forms dashboard.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-line bg-surface p-6 shadow-sm" noValidate>
        <label className="block text-sm">
          <span className="text-ink-muted">Email</span>
          <input
            type="email"
            autoComplete="email"
            className="mt-1 w-full rounded-md border border-line px-3 py-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          {fieldErrors.email ? <p className="mt-1 text-xs text-red-600">{fieldErrors.email}</p> : null}
        </label>
        <PasswordField
          label="Password"
          name="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {submitting ? "Signing in…" : "Sign in"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        No account?{" "}
        <Link to="/signup" className="font-medium text-accent no-underline hover:underline">
          Create one
        </Link>
      </p>
    </div>
  );
}
