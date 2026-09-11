import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, type FormDetail, type SubmissionItem } from "../api/client";
import { formatDate } from "../lib/fields";

export function SubmissionsPage() {
  const { id = "" } = useParams();
  const [form, setForm] = useState<FormDetail | null>(null);
  const [items, setItems] = useState<SubmissionItem[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [revisionFilter, setRevisionFilter] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load(opts?: { cursor?: string; append?: boolean; revision?: number }) {
    const response = await api.listSubmissions(id, {
      cursor: opts?.cursor,
      limit: 20,
      revision: opts?.revision,
    });
    setItems((prev) => (opts?.append ? [...prev, ...response.items] : response.items));
    setNextCursor(response.nextCursor);
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const detail = await api.getForm(id);
        if (cancelled) return;
        setForm(detail);
        await load({
          revision: revisionFilter ? Number(revisionFilter) : undefined,
        });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load submissions");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id, revisionFilter]);

  async function handleLoadMore() {
    if (!nextCursor) return;
    try {
      setLoadingMore(true);
      await load({
        cursor: nextCursor,
        append: true,
        revision: revisionFilter ? Number(revisionFilter) : undefined,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load more");
    } finally {
      setLoadingMore(false);
    }
  }

  const revisions = form?.versions ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-ink-muted">
            <Link to={`/forms/${id}`} className="no-underline hover:text-accent">
              ← Editor
            </Link>
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
            Submissions{form ? ` · ${form.title}` : ""}
          </h1>
        </div>
        <a
          href={api.exportSubmissionsUrl(id)}
          className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white no-underline hover:bg-accent-hover"
        >
          Export CSV
        </a>
      </div>

      <div className="flex flex-wrap items-end gap-3">
        <label className="block text-sm">
          <span className="text-ink-muted">Filter by revision</span>
          <select
            className="mt-1 block rounded-md border border-line bg-surface px-3 py-2"
            value={revisionFilter}
            onChange={(e) => setRevisionFilter(e.target.value)}
          >
            <option value="">All revisions</option>
            {revisions.map((v) => (
              <option key={v.id} value={String(v.revision)}>
                Revision {v.revision}
              </option>
            ))}
          </select>
        </label>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}

      {loading ? (
        <p className="text-sm text-ink-muted">Loading submissions…</p>
      ) : items.length === 0 ? (
        <p className="rounded-xl border border-dashed border-line bg-paper-2/50 px-4 py-10 text-center text-ink-muted">
          No submissions yet.
        </p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-line bg-surface">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-line bg-paper-2/60 text-xs uppercase tracking-wide text-ink-muted">
              <tr>
                <th className="px-3 py-2 font-medium">When</th>
                <th className="px-3 py-2 font-medium">Revision</th>
                <th className="px-3 py-2 font-medium">Payload</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={item.id} className="border-b border-line/70 align-top last:border-0">
                  <td className="whitespace-nowrap px-3 py-3 text-ink-muted">
                    {formatDate(item.createdAt)}
                  </td>
                  <td className="px-3 py-3">r{item.revision}</td>
                  <td className="px-3 py-3">
                    <dl className="grid gap-1 sm:grid-cols-[120px_1fr]">
                      {Object.entries(item.payload).map(([key, value]) => (
                        <div key={key} className="contents">
                          <dt className="font-mono text-xs text-ink-muted">{key}</dt>
                          <dd className="text-ink">
                            {Array.isArray(value) ? value.join(", ") : String(value)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {nextCursor ? (
        <button
          type="button"
          onClick={handleLoadMore}
          disabled={loadingMore}
          className="rounded-md border border-line bg-surface px-4 py-2 text-sm hover:bg-paper-2 disabled:opacity-60"
        >
          {loadingMore ? "Loading…" : "Load more"}
        </button>
      ) : null}
    </div>
  );
}
