import { Link, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuthStore } from "../store/authStore";

const dashboardNav = [
  { label: "My Forms", to: "/app", icon: "forms" as const },
  { label: "Templates", to: "/app/templates", icon: "templates" as const },
  { label: "AI Builder", to: "/app/ai", icon: "ai" as const },
  { label: "Submissions", to: "/app/submissions", icon: "inbox" as const },
  { label: "Settings", to: null, icon: "settings" as const },
];

const editorNav = [
  { label: "My Forms", to: "/app", icon: "forms" as const },
  { label: "Templates", to: "/app/templates", icon: "templates" as const },
  { label: "AI Builder", to: "/app/ai", icon: "ai" as const },
  { label: "Submissions", to: "/app/submissions", icon: "inbox" as const },
];

function NavIcon({
  name,
}: {
  name: "forms" | "templates" | "inbox" | "settings" | "ai";
}) {
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
    case "ai":
      return (
        <svg viewBox="0 0 20 20" className={common} fill="none" aria-hidden="true">
          <path
            d="M10 3.5 11.2 7.5 15.5 8.5 11.2 9.5 10 13.5 8.8 9.5 4.5 8.5 8.8 7.5 10 3.5Z"
            stroke="currentColor"
            strokeWidth="1.4"
            strokeLinejoin="round"
          />
          <path
            d="M15 12.5 15.6 14.2 17.5 14.8 15.6 15.4 15 17.2 14.4 15.4 12.5 14.8 14.4 14.2 15 12.5Z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
        </svg>
      );
    case "inbox":
      return (
        <svg viewBox="0 0 20 20" className={common} fill="none" aria-hidden="true">
          <path
            d="M3.5 10.5 5 4.5h10l1.5 6v4a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-4Z"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
          <path
            d="M3.5 10.5h3.2l1 2h4.6l1-2h3.2"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinejoin="round"
          />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 20 20" className={common} fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.5" />
          <path
            d="M10 3.5v2M10 14.5v2M3.5 10h2M14.5 10h2M5.4 5.4l1.4 1.4M13.2 13.2l1.4 1.4M14.6 5.4l-1.4 1.4M6.8 13.2l-1.4 1.4"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
          />
        </svg>
      );
  }
}

function BrandMark() {
  return (
    <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563EB] text-sm font-bold text-white">
      F
    </span>
  );
}

export function AppShell() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);
  const isEditor = location.pathname.startsWith("/forms/");

  const displayName = user?.name || user?.email || "User";
  const initials = displayName.split(/\s+|@/)[0]?.slice(0, 1).toUpperCase() ?? "U";

  function signOut() {
    clearSession();
    navigate("/signin", { replace: true });
  }

  if (isEditor) {
    return (
      <div className="min-h-screen bg-[#F4F6F9] text-[#0F172A]">
        <header className="sticky top-0 z-30 border-b border-[#E5E7EB] bg-white">
          <div className="flex items-center gap-4 px-4 py-2.5 sm:px-5">
            <Link to="/app" className="flex shrink-0 items-center gap-2.5 no-underline">
              <BrandMark />
              <span className="text-[15px] font-semibold tracking-tight text-[#0F172A]">
                FormBuilder
              </span>
            </Link>

            <nav className="ml-2 hidden items-center gap-1 lg:flex" aria-label="Product">
              {editorNav.map((item) => {
                const active =
                  item.to === "/app"
                    ? location.pathname === "/app"
                    : item.to
                      ? location.pathname.startsWith(item.to)
                      : false;
                const className = `inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm no-underline ${
                  active
                    ? "bg-[#EFF6FF] font-medium text-[#2563EB]"
                    : item.to
                      ? "text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0F172A]"
                      : "cursor-default text-[#94A3B8]"
                }`;
                if (!item.to) {
                  return (
                    <span key={item.label} className={className} title="Coming soon">
                      <NavIcon name={item.icon} />
                      {item.label}
                    </span>
                  );
                }
                return (
                  <Link key={item.label} to={item.to} className={className}>
                    <NavIcon name={item.icon} />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            <div className="ml-auto flex items-center gap-2.5">
              <label className="relative hidden md:block">
                <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#94A3B8]">
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                    <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5" />
                    <path d="m13.5 13.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                </span>
                <input
                  className="w-56 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] py-2 pr-3 pl-9 text-sm outline-none placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:bg-white focus:ring-2 focus:ring-[#2563EB]/15"
                  placeholder="Search forms..."
                  aria-label="Search forms"
                />
              </label>
              <button
                type="button"
                className="relative rounded-lg border border-[#E5E7EB] p-2 text-[#64748B] hover:bg-[#F8FAFC]"
                aria-label="Notifications"
                title="Notifications"
              >
                <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                  <path
                    d="M10 17a1.5 1.5 0 0 0 1.5-1.5h-3A1.5 1.5 0 0 0 10 17Zm5-4.5V9a5 5 0 1 0-10 0v3.5L3.5 14v1h13v-1L15 12.5Z"
                    stroke="currentColor"
                    strokeWidth="1.4"
                    strokeLinejoin="round"
                  />
                </svg>
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[#EF4444] ring-2 ring-white" />
              </button>
              <div className="flex items-center gap-2 rounded-lg py-1 pr-1 pl-1">
                <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#2563EB] text-xs font-semibold text-white">
                  {initials}
                </span>
                <span className="hidden max-w-[8rem] truncate text-sm font-medium text-[#0F172A] sm:inline">
                  {displayName.split(/\s+|@/)[0]}
                </span>
                <button
                  type="button"
                  onClick={signOut}
                  className="rounded-md p-1 text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#0F172A]"
                  aria-label="Account menu / sign out"
                  title="Sign out"
                >
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                    <path d="m6 8 4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </header>
        <main>
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
            <BrandMark />
            <span className="text-base font-semibold tracking-tight">FormBuilder</span>
          </Link>

          <nav className="flex flex-1 flex-col gap-1" aria-label="Dashboard">
            {dashboardNav.map((item) => {
              const onTemplates = location.pathname.startsWith("/app/templates");
              const onAi = location.pathname.startsWith("/app/ai");
              const onSubmissions = location.pathname.startsWith("/app/submissions");
              const onMyForms = location.pathname === "/app";
              let active = false;
              if (item.label === "Templates") active = onTemplates;
              else if (item.label === "AI Builder") active = onAi;
              else if (item.label === "Submissions") active = onSubmissions;
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
                <div className="flex items-center gap-2.5 rounded-full border border-[#E5E7EB] py-1 pr-3 pl-1">
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
