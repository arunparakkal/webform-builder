import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, type FormSummary } from "../api/client";
import { CreateFormModal } from "../components/CreateFormModal";
import { formatDate } from "../lib/fields";
import { useAuthStore } from "../store/authStore";

function formAccent(index: number) {
  const tones = [
    { bg: "bg-[#EFF6FF]", icon: "text-[#2563EB]" },
    { bg: "bg-[#F5F3FF]", icon: "text-[#7C3AED]" },
    { bg: "bg-[#ECFDF5]", icon: "text-[#059669]" },
    { bg: "bg-[#FFF7ED]", icon: "text-[#EA580C]" },
  ];
  return tones[index % tones.length]!;
}

function weekBars(forms: FormSummary[]) {
  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const counts = Array.from({ length: 7 }, () => 0);
  const now = new Date();
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  start.setDate(start.getDate() - ((start.getDay() + 6) % 7));

  for (const form of forms) {
    const d = new Date(form.updatedAt);
    if (d < start) continue;
    const idx = (d.getDay() + 6) % 7;
    counts[idx]! += 1;
  }

  const max = Math.max(1, ...counts);
  return days.map((label, i) => ({
    label,
    value: counts[i]!,
    height: Math.max(12, Math.round((counts[i]! / max) * 88)),
  }));
}

export function FormsListPage() {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [forms, setForms] = useState<FormSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

  const firstName =
    user?.name?.split(/\s+/)[0] || user?.email?.split("@")[0] || "there";

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await api.listForms();
        if (!cancelled) setForms(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load forms");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return forms;
    return forms.filter(
      (f) => f.title.toLowerCase().includes(q) || f.slug.toLowerCase().includes(q),
    );
  }, [forms, query]);

  const publishedCount = forms.filter((f) => f.status === "published").length;
  const draftCount = forms.length - publishedCount;
  const weekActivity = useMemo(() => weekBars(forms), [forms]);
  const newThisWeek = useMemo(() => {
    const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    return forms.filter((f) => new Date(f.createdAt).getTime() >= weekAgo).length;
  }, [forms]);

  async function handleCreate(title: string, slug: string) {
    setCreateError(null);
    try {
      setCreating(true);
      const form = await api.createForm(title, slug);
      setModalOpen(false);
      navigate(`/forms/${form.id}`);
    } catch (err) {
      setCreateError(err instanceof Error ? err.message : "Could not create form");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <label className="relative block w-full max-w-xl">
          <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#94A3B8]">
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
              <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.6" />
              <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search forms…"
            className="w-full rounded-xl border border-[#E5E7EB] bg-white py-2.5 pl-10 pr-3 text-sm text-[#0B1F44] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
          />
        </label>
      </div>

      <section className="overflow-hidden rounded-2xl bg-gradient-to-br from-[#2563EB] via-[#3B82F6] to-[#60A5FA] px-6 py-7 text-white shadow-sm sm:px-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">
              Welcome back, {firstName}
            </h1>
            <p className="mt-2 text-sm text-white/85 sm:text-[15px]">
              Build, publish, and share forms from one place. Create a draft to open the editor.
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => {
                  setCreateError(null);
                  setModalOpen(true);
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-sm font-semibold text-[#2563EB] shadow-sm hover:bg-[#F8FAFC]"
              >
                <span aria-hidden="true">+</span> Create New Form
              </button>
              <Link
                to="/app"
                className="inline-flex items-center rounded-xl border border-white/40 bg-white/10 px-4 py-2.5 text-sm font-medium text-white no-underline backdrop-blur hover:bg-white/15"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("recent-forms")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                Browse forms
              </Link>
            </div>
          </div>
          <div className="hidden h-28 w-40 shrink-0 rounded-2xl border border-white/25 bg-white/10 p-3 backdrop-blur sm:block">
            <div className="flex h-full items-end gap-1.5">
              {[40, 65, 48, 80, 55, 70, 90].map((h, i) => (
                <span
                  key={i}
                  className="flex-1 rounded-md bg-white/80"
                  style={{ height: `${h}%` }}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          {
            label: "Total Forms",
            value: String(forms.length),
            hint: newThisWeek > 0 ? `↑ ${newThisWeek} new this week` : "No new forms this week",
            accent: "text-[#2563EB]",
            spark: "from-[#93C5FD] to-[#2563EB]",
          },
          {
            label: "Published",
            value: String(publishedCount),
            hint: publishedCount > 0 ? "Live and shareable" : "Publish from the editor",
            accent: "text-[#7C3AED]",
            spark: "from-[#C4B5FD] to-[#7C3AED]",
          },
          {
            label: "Drafts",
            value: String(draftCount),
            hint: draftCount > 0 ? "Ready to finish" : "All forms published",
            accent: "text-[#059669]",
            spark: "from-[#6EE7B7] to-[#059669]",
          },
          {
            label: "Updated",
            value: forms[0] ? formatDate(forms[0].updatedAt).split(",")[0]! : "—",
            hint: forms[0] ? "Most recent activity" : "Create your first form",
            accent: "text-[#EA580C]",
            spark: "from-[#FDBA74] to-[#EA580C]",
          },
        ].map((card) => (
          <div
            key={card.label}
            className="rounded-2xl border border-[#E5E7EB] bg-white p-4 shadow-sm"
          >
            <p className="text-sm text-[#64748B]">{card.label}</p>
            <div className="mt-2 flex items-end justify-between gap-3">
              <p className={`text-3xl font-semibold tracking-tight ${card.accent}`}>{card.value}</p>
              <span
                className={`h-10 w-16 rounded-lg bg-gradient-to-t ${card.spark} opacity-80`}
                aria-hidden="true"
              />
            </div>
            <p className="mt-2 text-xs text-[#64748B]">{card.hint}</p>
          </div>
        ))}
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section
          id="recent-forms"
          className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm"
        >
          <div className="flex items-center justify-between border-b border-[#E5E7EB] px-5 py-4">
            <div>
              <h2 className="text-base font-semibold text-[#0B1F44]">Recent Forms</h2>
              <p className="text-sm text-[#64748B]">Open a form to edit or view submissions</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setCreateError(null);
                setModalOpen(true);
              }}
              className="rounded-xl bg-[#2563EB] px-3.5 py-2 text-sm font-medium text-white hover:bg-[#1D4ED8]"
            >
              + Create
            </button>
          </div>

          {error ? <p className="px-5 py-4 text-sm text-[#DC2626]">{error}</p> : null}

          {loading ? (
            <p className="px-5 py-10 text-sm text-[#64748B]">Loading forms…</p>
          ) : filtered.length === 0 ? (
            <div className="px-5 py-12 text-center">
              <p className="text-sm font-medium text-[#0B1F44]">
                {query ? "No forms match your search" : "No forms yet"}
              </p>
              <p className="mt-1 text-sm text-[#64748B]">
                {query ? "Try a different title or slug." : "Create your first form to get started."}
              </p>
              {!query ? (
                <button
                  type="button"
                  onClick={() => setModalOpen(true)}
                  className="mt-4 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1D4ED8]"
                >
                  Create New Form
                </button>
              ) : null}
            </div>
          ) : (
            <ul className="divide-y divide-[#E5E7EB]">
              {filtered.map((form, index) => {
                const tone = formAccent(index);
                const active = form.status === "published";
                return (
                  <li
                    key={form.id}
                    className="flex flex-wrap items-center gap-4 px-5 py-4 hover:bg-[#F8FAFC]"
                  >
                    <div
                      className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${tone.bg} ${tone.icon}`}
                    >
                      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
                        <rect x="5" y="4" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.7" />
                        <path d="M8 9h8M8 13h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                      </svg>
                    </div>
                    <div className="min-w-0 flex-1">
                      <Link
                        to={`/forms/${form.id}`}
                        className="font-medium text-[#0B1F44] no-underline hover:text-[#2563EB]"
                      >
                        {form.title}
                      </Link>
                      <p className="truncate text-sm text-[#64748B]">
                        /f/…/{form.slug}
                      </p>
                    </div>
                    <div className="hidden text-sm text-[#64748B] sm:block">
                      {formatDate(form.createdAt).split(",")[0]}
                    </div>
                    <span
                      className={`rounded-full px-2.5 py-1 text-xs font-medium ${
                        active
                          ? "bg-[#ECFDF5] text-[#047857]"
                          : "bg-[#FFF7ED] text-[#C2410C]"
                      }`}
                    >
                      {active ? "Active" : "Draft"}
                    </span>
                    <div className="flex gap-2">
                      <Link
                        to={`/forms/${form.id}`}
                        className="rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-sm text-[#0B1F44] no-underline hover:bg-white"
                      >
                        Edit
                      </Link>
                      <Link
                        to={`/forms/${form.id}/submissions`}
                        className="rounded-lg border border-[#E5E7EB] px-3 py-1.5 text-sm text-[#0B1F44] no-underline hover:bg-white"
                      >
                        Inbox
                      </Link>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <aside className="space-y-4">
          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-[#0B1F44]">Quick Actions</h2>
            <div className="mt-4 space-y-3">
              <button
                type="button"
                onClick={() => {
                  setCreateError(null);
                  setModalOpen(true);
                }}
                className="flex w-full items-center gap-3 rounded-xl bg-[#EFF6FF] px-3.5 py-3 text-left hover:bg-[#DBEAFE]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#2563EB] text-white">
                  +
                </span>
                <span>
                  <span className="block text-sm font-semibold text-[#0B1F44]">Create Form</span>
                  <span className="block text-xs text-[#64748B]">Title, slug, then editor</span>
                </span>
              </button>
              <Link
                to="/app/ai"
                className="flex w-full items-center gap-3 rounded-xl bg-[#F8FAFC] px-3.5 py-3 text-left no-underline hover:bg-[#F1F5F9]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E2E8F0] text-[#0B1F44]">
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                    <path
                      d="M10 3.5 11.2 7.5 15.5 8.5 11.2 9.5 10 13.5 8.8 9.5 4.5 8.5 8.8 7.5 10 3.5Z"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <span>
                  <span className="block text-sm font-semibold text-[#0B1F44]">AI Builder</span>
                  <span className="block text-xs text-[#64748B]">Describe a form in chat</span>
                </span>
              </Link>
              <Link
                to="/app"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("recent-forms")?.scrollIntoView({ behavior: "smooth" });
                }}
                className="flex w-full items-center gap-3 rounded-xl bg-[#F8FAFC] px-3.5 py-3 text-left no-underline hover:bg-[#F1F5F9]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#E2E8F0] text-[#0B1F44]">
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                    <path d="M4 6h12M4 10h12M4 14h8" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
                  </svg>
                </span>
                <span>
                  <span className="block text-sm font-semibold text-[#0B1F44]">My Forms</span>
                  <span className="block text-xs text-[#64748B]">Jump to recent list</span>
                </span>
              </Link>
            </div>
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
            <h2 className="text-base font-semibold text-[#0B1F44]">This Week</h2>
            <p className="mt-1 text-sm text-[#64748B]">Form updates by day</p>
            <div className="mt-5 flex h-28 items-end justify-between gap-2">
              {weekActivity.map((day) => (
                <div key={day.label} className="flex flex-1 flex-col items-center gap-2">
                  <span
                    className="w-full rounded-md bg-[#2563EB]/85"
                    style={{ height: `${day.height}px` }}
                    title={`${day.value} update${day.value === 1 ? "" : "s"}`}
                  />
                  <span className="text-[10px] font-medium text-[#94A3B8]">{day.label}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-[#E5E7EB] bg-gradient-to-br from-[#0B1F44] to-[#1E3A5F] p-5 text-white shadow-sm">
            <h2 className="text-base font-semibold">Need Help?</h2>
            <p className="mt-2 text-sm text-white/75">
              Publish a form, then share the public link or embed code from the editor.
            </p>
            <Link
              to="/"
              className="mt-4 inline-flex rounded-xl bg-white px-3.5 py-2 text-sm font-medium text-[#0B1F44] no-underline hover:bg-[#F8FAFC]"
            >
              View product guide
            </Link>
          </div>
        </aside>
      </div>

      <CreateFormModal
        open={modalOpen}
        creating={creating}
        error={createError}
        onClose={() => {
          if (!creating) {
            setModalOpen(false);
            setCreateError(null);
          }
        }}
        onCreate={handleCreate}
      />
    </div>
  );
}
