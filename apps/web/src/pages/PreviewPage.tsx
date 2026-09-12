import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import type { FormDefinition } from "@webform/form-schema";
import { api } from "../api/client";
import { FormRenderer } from "../components/FormRenderer";

export function PreviewPage() {
  const { id = "" } = useParams();
  const [definition, setDefinition] = useState<FormDefinition | null>(null);
  const [title, setTitle] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const form = await api.getForm(id);
        if (cancelled) return;
        setTitle(form.title);
        setDefinition(form.draftDefinition);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load preview");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (loading) return <p className="text-sm text-ink-muted">Loading preview…</p>;
  if (error || !definition) {
    return <p className="text-sm text-danger">{error ?? "Preview unavailable"}</p>;
  }

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm text-ink-muted">
            <Link to={`/forms/${id}`} className="no-underline hover:text-accent">
              ← Back to editor
            </Link>
          </p>
          <h1 className="font-display text-2xl font-semibold">Preview · {title}</h1>
          <p className="text-sm text-ink-muted">Draft definition (not the published version)</p>
        </div>
      </div>
      <div className="overflow-hidden rounded-xl border border-line">
        <FormRenderer definition={definition} framed compactFrame />
      </div>
    </div>
  );
}
