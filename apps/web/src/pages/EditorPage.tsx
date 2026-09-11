import { formDefinitionSchema } from "@webform/form-schema";
import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, type FormDetail } from "../api/client";
import { FieldInspector, FieldListPanel } from "../components/FieldEditor";
import { FormRenderer } from "../components/FormRenderer";
import { useEditorStore } from "../store/editorStore";

export function EditorPage() {
  const { id = "" } = useParams();
  const [form, setForm] = useState<FormDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPreview, setShowPreview] = useState(true);

  const title = useEditorStore((s) => s.title);
  const slug = useEditorStore((s) => s.slug);
  const definition = useEditorStore((s) => s.definition);
  const selectedFieldId = useEditorStore((s) => s.selectedFieldId);
  const dirty = useEditorStore((s) => s.dirty);
  const load = useEditorStore((s) => s.load);
  const setMeta = useEditorStore((s) => s.setMeta);
  const setDefinition = useEditorStore((s) => s.setDefinition);
  const selectField = useEditorStore((s) => s.selectField);
  const markClean = useEditorStore((s) => s.markClean);
  const reset = useEditorStore((s) => s.reset);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await api.getForm(id);
        if (cancelled) return;
        setForm(data);
        load({
          formId: data.id,
          title: data.title,
          slug: data.slug,
          definition: data.draftDefinition,
        });
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load form");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
      reset();
    };
  }, [id, load, reset]);

  const selectedField =
    definition?.fields.find((f) => f.id === selectedFieldId) ?? definition?.fields[0] ?? null;

  async function saveDraft() {
    if (!definition) return false;
    setError(null);
    setMessage(null);
    const nextDefinition = {
      ...definition,
      meta: { ...definition.meta, title: title.trim() || definition.meta.title },
    };
    const parsed = formDefinitionSchema.safeParse(nextDefinition);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Invalid form definition");
      return false;
    }

    try {
      setSaving(true);
      const updated = await api.updateForm(id, {
        title: title.trim(),
        slug: slug.trim(),
        draftDefinition: parsed.data,
      });
      setForm(updated);
      load({
        formId: updated.id,
        title: updated.title,
        slug: updated.slug,
        definition: updated.draftDefinition,
      });
      markClean();
      setMessage("Draft saved.");
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      return false;
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    setError(null);
    setMessage(null);
    const saved = await saveDraft();
    if (!saved) return;
    try {
      setPublishing(true);
      const result = await api.publishForm(id);
      setMessage(`Published revision ${result.revision}. Public URL: /f/${result.slug}`);
      const refreshed = await api.getForm(id);
      setForm(refreshed);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
    } finally {
      setPublishing(false);
    }
  }

  if (loading) return <p className="text-sm text-ink-muted">Loading editor…</p>;
  if (!form || !definition) {
    return <p className="text-sm text-danger">{error ?? "Form not found"}</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-ink-muted">
            <Link to="/" className="text-ink-muted no-underline hover:text-accent">
              Forms
            </Link>{" "}
            / editor
          </p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">{form.title}</h1>
          <p className="mt-1 text-sm text-ink-muted">
            Status: {form.status}
            {form.publishedVersion ? ` · published r${form.publishedVersion.revision}` : ""}
            {dirty ? " · unsaved changes" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setShowPreview((v) => !v)}
            className="rounded-md border border-line bg-surface px-3 py-2 text-sm hover:bg-paper-2"
          >
            {showPreview ? "Hide preview" : "Show preview"}
          </button>
          <Link
            to={`/forms/${id}/preview`}
            className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink no-underline hover:bg-paper-2"
          >
            Preview page
          </Link>
          <Link
            to={`/forms/${id}/submissions`}
            className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink no-underline hover:bg-paper-2"
          >
            Submissions
          </Link>
          {form.status === "published" ? (
            <Link
              to={`/f/${form.slug}`}
              className="rounded-md border border-line bg-surface px-3 py-2 text-sm text-ink no-underline hover:bg-paper-2"
              target="_blank"
              rel="noreferrer"
            >
              Public form
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => void saveDraft()}
            disabled={saving || publishing}
            className="rounded-md border border-line bg-surface px-3 py-2 text-sm font-medium hover:bg-paper-2 disabled:opacity-60"
          >
            {saving ? "Saving…" : "Save draft"}
          </button>
          <button
            type="button"
            onClick={() => void publish()}
            disabled={saving || publishing}
            className="rounded-md bg-accent px-3 py-2 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
          >
            {publishing ? "Publishing…" : "Publish"}
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-ink-muted">Title</span>
          <input
            className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
            value={title}
            onChange={(e) => setMeta({ title: e.target.value })}
          />
        </label>
        <label className="block text-sm">
          <span className="text-ink-muted">Slug</span>
          <input
            className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 font-mono text-sm"
            value={slug}
            onChange={(e) => setMeta({ slug: e.target.value })}
          />
        </label>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm">
          <span className="text-ink-muted">Description</span>
          <input
            className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
            value={definition.meta.description}
            onChange={(e) =>
              setDefinition({
                ...definition,
                meta: { ...definition.meta, description: e.target.value },
              })
            }
          />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="text-ink-muted">Submit label</span>
            <input
              className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
              value={definition.settings.submitLabel}
              onChange={(e) =>
                setDefinition({
                  ...definition,
                  settings: { ...definition.settings, submitLabel: e.target.value },
                })
              }
            />
          </label>
          <label className="block text-sm">
            <span className="text-ink-muted">Success message</span>
            <input
              className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
              value={definition.settings.successMessage}
              onChange={(e) =>
                setDefinition({
                  ...definition,
                  settings: { ...definition.settings, successMessage: e.target.value },
                })
              }
            />
          </label>
        </div>
      </div>

      {error ? <p className="text-sm text-danger">{error}</p> : null}
      {message ? <p className="text-sm text-accent">{message}</p> : null}

      <div
        className={`grid gap-4 ${showPreview ? "lg:grid-cols-[240px_280px_1fr]" : "lg:grid-cols-[1fr_1fr]"}`}
      >
        <section className="rounded-xl border border-line bg-surface p-4">
          <FieldListPanel
            definition={definition}
            selectedFieldId={selectedField?.id ?? null}
            onSelectField={selectField}
            onChange={setDefinition}
          />
        </section>

        <section className="rounded-xl border border-line bg-surface p-4">
          {selectedField ? (
            <FieldInspector
              definition={definition}
              field={selectedField}
              onChange={setDefinition}
            />
          ) : (
            <p className="text-sm text-ink-muted">Select a field to configure it.</p>
          )}
        </section>

        {showPreview ? (
          <section className="rounded-xl border border-line bg-surface p-5">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">
                Live preview
              </h2>
              <span className="text-xs text-ink-muted">Draft (not published)</span>
            </div>
            <FormRenderer key={definition.fields.map((f) => f.id).join(",")} definition={definition} />
          </section>
        ) : null}
      </div>
    </div>
  );
}
