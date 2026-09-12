import type { FormDefinition } from "@webform/form-schema";
import { resolveFormTheme } from "@webform/form-schema";
import { useEffect, useState } from "react";
import { useParams, useSearchParams } from "react-router-dom";
import { api } from "../api/client";
import { FormRenderer, ThemedSuccess } from "../components/FormRenderer";
import { pageSurfaceStyle } from "../lib/formThemes";

export function PublicFormPage() {
  const { slug = "" } = useParams();
  const [searchParams] = useSearchParams();
  const embed = searchParams.get("embed") === "true";

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
      <div className={embed ? "px-3 py-6 text-center" : "mx-auto flex min-h-screen max-w-xl items-center justify-center px-4"}>
        <p className="text-sm text-ink-muted">Loading form…</p>
      </div>
    );
  }

  if (error || !definition) {
    return (
      <div className={embed ? "px-3 py-6" : "mx-auto flex min-h-screen max-w-xl items-center justify-center px-4"}>
        <div className="rounded-xl border border-line bg-surface p-6 text-center">
          <h1 className="font-display text-2xl font-semibold">Form unavailable</h1>
          <p className="mt-2 text-sm text-ink-muted">{error ?? "This form is not published."}</p>
        </div>
      </div>
    );
  }

  const theme = resolveFormTheme(definition.theme);

  if (success) {
    return (
      <div className={embed ? "" : "min-h-screen"} style={pageSurfaceStyle(theme)}>
        <ThemedSuccess theme={theme} message={success} compact={embed} />
      </div>
    );
  }

  return (
    <div className={embed ? "" : "min-h-screen"} style={pageSurfaceStyle(theme)}>
      {!embed ? (
        <div className="mx-auto flex max-w-xl items-baseline justify-between px-4 pt-6 text-xs" style={{ color: theme.colors.muted }}>
          <span>Webform</span>
          {revision != null ? <span>Revision {revision}</span> : null}
        </div>
      ) : null}
      <FormRenderer
        definition={definition}
        framed
        compactFrame={embed}
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
  );
}
