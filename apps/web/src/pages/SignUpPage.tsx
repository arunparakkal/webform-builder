import { useState, type FormEvent } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { api } from "../api/client";
import { PasswordField } from "../components/PasswordField";
import { signupFormSchema, zodFieldErrors, type FieldErrors } from "../lib/authValidation";
import { useAuthStore } from "../store/authStore";

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
      setSession(result.token, result.user);
      navigate("/app", { replace: true });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create account");
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
        <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight">Create account</h1>
        <p className="mt-2 text-sm text-ink-muted">Sign up to build and publish forms.</p>
      </div>

      <form onSubmit={onSubmit} className="space-y-4 rounded-xl border border-line bg-surface p-6 shadow-sm" noValidate>
        <label className="block text-sm">
          <span className="text-ink-muted">Name</span>
          <input
            type="text"
            autoComplete="name"
            className="mt-1 w-full rounded-md border border-line px-3 py-2"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          {fieldErrors.name ? <p className="mt-1 text-xs text-red-600">{fieldErrors.name}</p> : null}
        </label>
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
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={fieldErrors.password}
          hint="At least 8 characters, with a letter and a number."
        />
        <PasswordField
          label="Confirm password"
          name="confirmPassword"
          autoComplete="new-password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          error={fieldErrors.confirmPassword}
        />

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {submitting ? "Creating account…" : "Sign up"}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-ink-muted">
        Already have an account?{" "}
        <Link to="/signin" className="font-medium text-accent no-underline hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
}
