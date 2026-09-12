import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { AuthLayout } from "../components/AuthLayout";
import { GitHubSignInButton, GoogleSignInButton } from "../components/GoogleSignInButton";
import { PasswordField } from "../components/PasswordField";
import { signupFormSchema, zodFieldErrors, type FieldErrors } from "../lib/authValidation";
import { useAuthStore } from "../store/authStore";

const inputClass =
  "w-full rounded-xl border border-[#E5E7EB] bg-white py-2.5 pl-10 pr-3 text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15";

export function SignUpPage() {
  const navigate = useNavigate();
  const token = useAuthStore((s) => s.token);
  const setSession = useAuthStore((s) => s.setSession);

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (token) return <Navigate to="/app" replace />;

  async function finishAuth(result: { token: string; user: { id: string; email: string; name: string | null } }) {
    setSession(result.token, result.user);
    navigate("/app", { replace: true });
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    const parsed = signupFormSchema.safeParse({ name, email, password, confirmPassword });
    if (!parsed.success) {
      setFieldErrors(zodFieldErrors(parsed.error));
      return;
    }
    setFieldErrors({});
    try {
      setSubmitting(true);
      const result = await api.signup({
        name: parsed.data.name,
        email: parsed.data.email,
        password: parsed.data.password,
        confirmPassword: parsed.data.confirmPassword,
      });
      await finishAuth(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout mode="signup">
      <div className="rounded-2xl border border-[#E5E7EB] bg-white p-6 shadow-xl shadow-slate-200/60 sm:p-8">
        <h1 className="text-2xl font-semibold tracking-tight text-[#0B1F44]">Create your account</h1>
        <p className="mt-1 text-sm text-[#64748B]">Start building forms with FormBuilder free.</p>

        <div className="mt-6 grid gap-2 sm:grid-cols-2">
          <GoogleSignInButton disabled={submitting} label="Continue with Google" />
          <GitHubSignInButton disabled={submitting} />
        </div>

        <div className="my-5 flex items-center gap-3 text-xs font-medium tracking-wide text-[#94A3B8]">
          <span className="h-px flex-1 bg-[#E5E7EB]" />
          OR
          <span className="h-px flex-1 bg-[#E5E7EB]" />
        </div>

        <form onSubmit={onSubmit} className="space-y-4" noValidate>
          <label className="block text-sm">
            <span className="font-medium text-[#0B1F44]">Full name</span>
            <span className="relative mt-1.5 block">
              <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#94A3B8]">
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                  <circle cx="10" cy="7" r="3" stroke="currentColor" strokeWidth="1.5" />
                  <path d="M4.5 16c1.5-2.5 4-3.5 5.5-3.5S14 13.5 15.5 16" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </span>
              <input
                type="text"
                autoComplete="name"
                placeholder="Your name"
                className={inputClass}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </span>
            {fieldErrors.name ? <p className="mt-1 text-xs text-[#DC2626]">{fieldErrors.name}</p> : null}
          </label>

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
            autoComplete="new-password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            error={fieldErrors.password}
            hint="Use a letter and a number."
          />
          <PasswordField
            label="Confirm password"
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Repeat password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            error={fieldErrors.confirmPassword}
          />

          {error ? <p className="text-sm text-[#DC2626]">{error}</p> : null}

          <button
            type="submit"
            disabled={submitting}
            className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#2563EB] to-[#4F46E5] px-4 py-3 text-sm font-semibold text-white shadow-sm shadow-blue-500/25 hover:from-[#1D4ED8] hover:to-[#4338CA] disabled:opacity-60"
          >
            {submitting ? "Creating account…" : "Create account"}
            <span aria-hidden="true">→</span>
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-[#64748B]">
          Already have an account?{" "}
          <Link to="/signin" className="font-semibold text-[#2563EB] no-underline hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </AuthLayout>
  );
}
