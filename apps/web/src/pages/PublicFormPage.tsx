import type { FormDefinition } from "@webform/form-schema";
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api/client";
import { FormRenderer } from "../components/FormRenderer";

export function PublicFormPage() {
  const { slug = "" } = useParams();
  const [definition, setDefinition] = useState<FormDefinition | null>(null);
  const [revision, setRevision] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const published = await api.getPublishedForm(slug);
        if (cancelled) return;
        setDefinition(published.definition);
        setRevision(published.revision);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Form not found");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-4">
        <p className="text-sm text-ink-muted">Loading form…</p>
      </div>
    );
  }

  if (error || !definition) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-4">
        <div className="rounded-xl border border-line bg-surface p-6 text-center">
          <h1 className="font-display text-2xl font-semibold">Form unavailable</h1>
          <p className="mt-2 text-sm text-ink-muted">{error ?? "This form is not published."}</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="mx-auto flex min-h-screen max-w-xl items-center justify-center px-4">
        <div className="w-full rounded-xl border border-line bg-surface p-8 text-center shadow-sm">
          <p className="text-xs uppercase tracking-wide text-ink-muted">Webform</p>
          <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Submitted</h1>
          <p className="mt-3 text-ink-muted">{success}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto min-h-screen max-w-xl px-4 py-12">
      <div className="mb-4 flex items-baseline justify-between text-xs text-ink-muted">
        <span className="font-display text-sm font-medium text-ink">Webform</span>
        {revision != null ? <span>Revision {revision}</span> : null}
      </div>
      <div className="rounded-xl border border-line bg-surface p-6 shadow-sm sm:p-8">
        <FormRenderer
          definition={definition}
          showHoneypot
          onSubmit={async (payload, website) => {
            await api.submitPublicForm(slug, {
              payload,
              website,
              idempotencyKey: crypto.randomUUID(),
            });
            setSuccess(definition.settings.successMessage);
          }}
        />
      </div>
    </div>
  );
}
