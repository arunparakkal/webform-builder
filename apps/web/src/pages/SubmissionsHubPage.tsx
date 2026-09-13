import { resolveFormTheme, type FormDefinition } from "@webform/form-schema";
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api, type FormSummary } from "../api/client";
import { FormRenderer } from "../components/FormRenderer";
import { pageSurfaceStyle } from "../lib/formThemes";

function previewDefinition(form: FormSummary): FormDefinition | null {
  const draft = form.draftDefinition;
  if (!draft?.fields?.length) return null;
  return {
    ...draft,
    theme: resolveFormTheme(draft.theme),
    // Keep cards readable — show first few fields only.
    fields: draft.fields.slice(0, 4),
  };
}

export function SubmissionsHubPage() {
  const [forms, setForms] = useState<FormSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");

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

  return (
    <div className="-mx-4 -my-6 min-h-[calc(100vh-57px)] bg-[#2F3440] px-4 py-8 text-white sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-white">Submissions</h1>
            <p className="mt-1 text-sm text-white/65">
              Choose a form to open its inbox. Columns match that form’s fields.
            </p>
          </div>
          <label className="relative block w-full max-w-sm">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-white/40">
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.6" />
                <path d="M13.5 13.5L17 17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              </svg>
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search forms…"
              className="w-full rounded-xl border border-white/15 bg-white/10 py-2.5 pl-10 pr-3 text-sm text-white outline-none placeholder:text-white/40 focus:border-[#60A5FA] focus:ring-2 focus:ring-[#60A5FA]/25"
            />
          </label>
        </div>

        {error ? (
          <p className="rounded-xl border border-red-400/30 bg-red-500/10 px-4 py-3 text-sm text-red-200">
            {error}
          </p>
        ) : null}

        {loading ? (
          <p className="text-sm text-white/60">Loading your forms…</p>
        ) : filtered.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-white/20 bg-white/5 px-6 py-16 text-center">
            <p className="text-white/70">No forms yet.</p>
            <Link
              to="/app"
              className="mt-3 inline-block text-sm font-medium text-[#93C5FD] no-underline hover:underline"
            >
              Create a form on My Forms →
            </Link>
          </div>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filtered.map((form) => {
              const definition = previewDefinition(form);
              const theme = definition ? resolveFormTheme(definition.theme) : null;
              const titleColor = theme?.colors.button ?? "#6366F1";
              const isPublished = form.status === "published";

              return (
                <Link
                  key={form.id}
                  to={`/forms/${form.id}/submissions`}
                  className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-lg shadow-black/25 no-underline transition hover:-translate-y-0.5 hover:shadow-xl"
                >
                  <div
                    className="relative h-56 overflow-hidden sm:h-64"
                    style={theme ? pageSurfaceStyle(theme) : { background: "#E2E8F0" }}
                  >
                    <div className="pointer-events-none absolute inset-0 scale-[0.72] origin-top px-3 pt-3 opacity-95">
                      {definition ? (
                        <FormRenderer
                          definition={definition}
                          readOnly
                          previewSubmit
                          compactFrame
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center rounded-xl bg-white/80 text-sm text-[#64748B]">
                          Empty form
                        </div>
                      )}
                    </div>
                    <span
                      className={`absolute top-3 right-3 rounded-full px-2.5 py-0.5 text-[11px] font-medium ${
                        isPublished
                          ? "bg-[#ECFDF5] text-[#047857]"
                          : "bg-white/90 text-[#64748B]"
                      }`}
                    >
                      {isPublished ? "Published" : "Draft"}
                    </span>
                  </div>
                  <div className="border-t border-[#E5E7EB] bg-white px-4 py-3">
                    <p
                      className="truncate text-base font-medium tracking-tight"
                      style={{ color: titleColor }}
                    >
                      {form.title}
                    </p>
                    <p className="mt-0.5 truncate text-xs text-[#94A3B8]">/{form.slug}</p>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
