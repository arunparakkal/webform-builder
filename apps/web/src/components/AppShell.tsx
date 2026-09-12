import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const navItems = [
  { label: "My Forms", to: "/app", icon: "forms" },
  { label: "Templates", to: "/app/templates", icon: "templates" },
  { label: "Submissions", to: null, icon: "inbox" },
  { label: "Analytics", to: null, icon: "chart" },
  { label: "Integrations", to: null, icon: "plug" },
  { label: "Settings", to: null, icon: "settings" },
] as const;

function NavIcon({ name }: { name: (typeof navItems)[number]["icon"] }) {
  const common = "h-4 w-4";
  switch (name) {
    case "forms":
      return (
        <svg viewBox="0 0 20 20" className={common} fill="none" aria-hidden="true">
          <rect x="4" y="3.5" width="12" height="13" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M7 8h6M7 11h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "templates":
      return (
        <svg viewBox="0 0 20 20" className={common} fill="none" aria-hidden="true">
          <rect x="3.5" y="3.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="11" y="3.5" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="3.5" y="11" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
          <rect x="11" y="11" width="5.5" height="5.5" rx="1" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      );
    case "inbox":
      return (
        <svg viewBox="0 0 20 20" className={common} fill="none" aria-hidden="true">
          <path d="M3.5 10.5 5 4.5h10l1.5 6v4a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-4Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
          <path d="M3.5 10.5h3.2l1 2h4.6l1-2h3.2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        </svg>
      );
    case "chart":
      return (
        <svg viewBox="0 0 20 20" className={common} fill="none" aria-hidden="true">
          <path d="M4 15V9M10 15V5M16 15v-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
        </svg>
      );
    case "plug":
      return (
        <svg viewBox="0 0 20 20" className={common} fill="none" aria-hidden="true">
          <path d="M7 3.5v3M13 3.5v3M5.5 6.5h9v2.2A4.5 4.5 0 0 1 10 13.2v3.3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 20 20" className={common} fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.5" />
          <path d="M10 3.5v2M10 14.5v2M3.5 10h2M14.5 10h2M5.4 5.4l1.4 1.4M13.2 13.2l1.4 1.4M14.6 5.4l-1.4 1.4M6.8 13.2l-1.4 1.4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
  }
}

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const isEditor = location.pathname.startsWith("/forms/");

  const initials = (user?.name || user?.email || "U")
    .split(/\s+|@/)[0]
    ?.slice(0, 1)
    .toUpperCase();

  function signOut() {
    clearSession();
    navigate("/signin", { replace: true });
  }

  if (isEditor) {
    return (
      <div className="min-h-screen bg-[#F5F7FA] text-[#0B1F44]">
        <header className="sticky top-0 z-30 border-b border-[#E5E7EB] bg-white">
          <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-8">
              <Link to="/app" className="flex items-center gap-2.5 no-underline">
                <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#2563EB] text-white">
                  <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                    <path
                      d="M7 12c2.5-4 7.5-4 10 0-2.5 4-7.5 4-10 0Z"
                      stroke="currentColor"
                      strokeWidth="1.8"
                    />
                    <path d="M12 10.5v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                  </svg>
                </span>
                <span className="text-[15px] font-semibold tracking-tight text-[#0B1F44]">
                  FormBuilder
                </span>
              </Link>
              <nav className="hidden items-center gap-6 text-sm md:flex" aria-label="Product">
                <Link to="/app" className="text-[#64748B] no-underline hover:text-[#0B1F44]">
                  Dashboard
                </Link>
                <span className="border-b-2 border-[#2563EB] pb-0.5 font-medium text-[#2563EB]">
                  Editor
                </span>
              </nav>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2563EB] text-xs font-semibold text-white">
                    {initials}
                  </span>
                  <span className="hidden max-w-[10rem] truncate text-sm font-medium text-[#0B1F44] sm:inline">
                    {user.name || user.email}
                  </span>
                </div>
              ) : null}
              <button
                type="button"
                onClick={signOut}
                className="rounded-lg border border-[#E5E7EB] px-2.5 py-1.5 text-xs font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0B1F44]"
              >
                Sign out
              </button>
            </div>
          </div>
        </header>
        <main className="px-0 py-0">
          <Outlet />
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5F7FA] text-[#0B1F44]">
      <div className="flex min-h-screen">
        <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-[#E5E7EB] bg-white px-4 py-5 md:flex">
          <Link to="/app" className="mb-8 flex items-center gap-2.5 px-2 no-underline">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2563EB] text-white">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" aria-hidden="true">
                <path
                  d="M7 12c2.5-4 7.5-4 10 0-2.5 4-7.5 4-10 0Z"
                  stroke="currentColor"
                  strokeWidth="1.8"
                />
                <path d="M12 10.5v5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </span>
            <span className="text-base font-semibold tracking-tight">FormBuilder</span>
          </Link>

          <nav className="flex flex-1 flex-col gap-1" aria-label="Dashboard">
            {navItems.map((item) => {
              const onTemplates = location.pathname.startsWith("/app/templates");
              const onMyForms = location.pathname === "/app";
              let active = false;
              if (item.label === "Templates") active = onTemplates;
              else if (item.label === "My Forms") active = onMyForms;

              if (!item.to) {
                return (
                  <span
                    key={item.label}
                    className="flex cursor-default items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-[#94A3B8]"
                    title="Coming soon"
                  >
                    <NavIcon name={item.icon} />
                    {item.label}
                  </span>
                );
              }
              return (
                <Link
                  key={item.label}
                  to={item.to}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm no-underline ${
                    active
                      ? "bg-[#EFF6FF] font-medium text-[#2563EB]"
                      : "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0B1F44]"
                  }`}
                >
                  <NavIcon name={item.icon} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="mt-4 rounded-2xl bg-gradient-to-br from-[#2563EB] to-[#1D4ED8] p-4 text-white">
            <p className="text-sm font-semibold">Upgrade to Pro</p>
            <p className="mt-1 text-xs text-white/80">More forms, embeds, and analytics later.</p>
            <button
              type="button"
              className="mt-3 w-full rounded-lg bg-white/15 px-3 py-2 text-xs font-medium hover:bg-white/25"
            >
              Coming soon
            </button>
          </div>
        </aside>

        <div className="min-w-0 flex-1">
          <header className="sticky top-0 z-20 flex items-center justify-between gap-4 border-b border-[#E5E7EB] bg-white/90 px-4 py-3 backdrop-blur sm:px-6">
            <div className="md:hidden">
              <Link to="/app" className="text-sm font-semibold text-[#0B1F44] no-underline">
                FormBuilder
              </Link>
            </div>
            <div className="ml-auto flex items-center gap-3">
              <button
                type="button"
                className="relative rounded-full border border-[#E5E7EB] p-2 text-[#64748B] hover:bg-[#F8FAFC]"
                aria-label="Notifications"
                title="No new notifications"
              >
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                  <path
                    d="M10 17a1.5 1.5 0 0 0 1.5-1.5h-3A1.5 1.5 0 0 0 10 17Zm5-4.5V9a5 5 0 1 0-10 0v3.5L3.5 14v1h13v-1L15 12.5Z"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
              {user ? (
                <div className="flex items-center gap-2.5 rounded-full border border-[#E5E7EB] py-1 pl-1 pr-3">
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2563EB] text-xs font-semibold text-white">
                    {initials}
                  </span>
                  <span className="hidden sm:block">
                    <span className="block text-sm font-medium leading-tight text-[#0B1F44]">
                      {user.name || user.email}
                    </span>
                    <span className="block text-[11px] leading-tight text-[#94A3B8]">Free Plan</span>
                  </span>
                </div>
              ) : null}
              <button
                type="button"
                onClick={signOut}
                className="rounded-lg border border-[#E5E7EB] px-2.5 py-1.5 text-xs font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0B1F44]"
              >
                Sign out
              </button>
            </div>
          </header>

          <main className="px-4 py-6 sm:px-6 lg:px-8">
            <Outlet />
          </main>
        </div>
      </div>
    </div>
  );
}
