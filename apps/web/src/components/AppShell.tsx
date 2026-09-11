import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

export function AppShell() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

  function signOut() {
    clearSession();
    navigate("/signin", { replace: true });
  }

  return (
    <div className="min-h-screen">
      <header className="border-b border-line/80 bg-surface/80 backdrop-blur-sm">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link to="/app" className="group flex items-baseline gap-2 no-underline">
            <span className="font-display text-xl font-semibold tracking-tight text-ink">
              Webform
            </span>
            <span className="text-sm text-ink-muted group-hover:text-accent">Builder</span>
          </Link>
          <nav className="flex items-center gap-3 text-sm">
            <Link
              to="/"
              className="rounded-md px-2 py-1 text-ink-muted no-underline hover:bg-paper-2 hover:text-ink"
            >
              Home
            </Link>
            <Link
              to="/app"
              className="rounded-md px-2 py-1 text-ink-muted no-underline hover:bg-paper-2 hover:text-ink"
            >
              Forms
            </Link>
            {user ? (
              <span className="hidden text-ink-muted sm:inline" title={user.email}>
                {user.name || user.email}
              </span>
            ) : null}
            <button
              type="button"
              onClick={signOut}
              className="rounded-md border border-line px-2.5 py-1 text-ink-muted hover:bg-paper-2 hover:text-ink"
            >
              Sign out
            </button>
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Outlet />
      </main>
    </div>
  );
}
