import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api, type FormSummary } from "../api/client";
import { formatDate, slugify } from "../lib/fields";

export function FormsListPage() {
  const navigate = useNavigate();
  const [forms, setForms] = useState<FormSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [creating, setCreating] = useState(false);

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

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      setCreating(true);
      const form = await api.createForm(title.trim(), slug.trim());
      navigate(`/forms/${form.id}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create form");
    } finally {
      setCreating(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">Your forms</h1>
        <p className="mt-1 text-ink-muted">Create drafts, publish versions, and review submissions.</p>
      </div>

      <form
        onSubmit={handleCreate}
        className="grid gap-3 rounded-xl border border-line bg-surface p-4 shadow-sm sm:grid-cols-[1fr_1fr_auto] sm:items-end"
      >
        <label className="block text-sm">
          <span className="text-ink-muted">Title</span>
          <input
            required
            className="mt-1 w-full rounded-md border border-line px-3 py-2"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              if (!slugTouched) setSlug(slugify(e.target.value));
            }}
            placeholder="Contact us"
          />
        </label>
        <label className="block text-sm">
          <span className="text-ink-muted">Slug</span>
          <input
            required
            pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
            className="mt-1 w-full rounded-md border border-line px-3 py-2 font-mono text-sm"
            value={slug}
            onChange={(e) => {
              setSlugTouched(true);
              setSlug(e.target.value);
            }}
            placeholder="contact-us"
          />
        </label>
        <button
          type="submit"
          disabled={creating || !title.trim() || !slug.trim()}
          className="rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {creating ? "Creating…" : "Create form"}
        </button>
      </form>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-ink-muted">Loading forms…</p>
      ) : forms.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-paper-2/50 px-4 py-10 text-center text-ink-muted">
          No forms yet. Create your first draft above.
        </p>
      ) : (
        <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line bg-surface">
          {forms.map((form) => (
            <li key={form.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3">
              <div>
                <Link to={`/forms/${form.id}`} className="font-medium text-ink no-underline hover:text-accent">
                  {form.title}
                </Link>
                <div className="mt-0.5 text-xs text-ink-muted">
                  /f/{form.slug} · {form.status} · updated {formatDate(form.updatedAt)}
                </div>
              </div>
              <div className="flex gap-2 text-sm">
                <Link
                  to={`/forms/${form.id}`}
                  className="rounded-md border border-line px-3 py-1.5 text-ink no-underline hover:bg-paper-2"
                >
                  Edit
                </Link>
                <Link
                  to={`/forms/${form.id}/submissions`}
                  className="rounded-md border border-line px-3 py-1.5 text-ink no-underline hover:bg-paper-2"
                >
                  Submissions
                </Link>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
