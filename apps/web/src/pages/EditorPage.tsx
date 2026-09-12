import { formDefinitionSchema, resolveFormTheme } from "@webform/form-schema";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api, type FormDetail } from "../api/client";
import {
  FieldInspector,
  FieldListPanel,
  FieldSettingsEmpty,
} from "../components/FieldEditor";
import { FormRenderer } from "../components/FormRenderer";
import { FormThemePanel } from "../components/FormThemePanel";
import { SuccessToast } from "../components/SuccessToast";
import { useEditorStore } from "../store/editorStore";

export function EditorPage() {
  const { id = "" } = useParams();
  const navigate = useNavigate();
  const [form, setForm] = useState<FormDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showPublishToast, setShowPublishToast] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [previewMode, setPreviewMode] = useState<"desktop" | "mobile">("desktop");
  const [editingTitle, setEditingTitle] = useState(false);

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
          definition: {
            ...data.draftDefinition,
            theme: {
              ...resolveFormTheme(data.draftDefinition.theme),
              buttonWidth: "auto",
            },
          },
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
    definition?.fields.find((f) => f.id === selectedFieldId) ?? null;

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
      setMessage(`Published revision ${result.revision}.`);
      setShowPublishToast(true);
      window.setTimeout(() => {
        navigate(`/forms/${id}/published`);
      }, 900);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Publish failed");
      setPublishing(false);
    }
  }

  function removeSelectedField() {
    if (!definition || !selectedField) return;
    setDefinition({
      ...definition,
      fields: definition.fields.filter((f) => f.id !== selectedField.id),
    });
    selectField(null);
  }

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-57px)] items-center justify-center bg-[#F5F7FA]">
        <p className="text-sm text-[#64748B]">Loading editor…</p>
      </div>
    );
  }
  if (!form || !definition) {
    return (
      <div className="flex min-h-[calc(100vh-57px)] items-center justify-center bg-[#F5F7FA]">
        <p className="text-sm text-[#DC2626]">{error ?? "Form not found"}</p>
      </div>
    );
  }

  const isPublished = form.status === "published" && Boolean(form.publishedVersion);
  const btnGhost =
    "inline-flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-2 text-sm font-medium text-[#0B1F44] hover:bg-[#F8FAFC] disabled:opacity-60";
  const btnPrimary =
    "inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#1D4ED8] disabled:opacity-60";
  const settingInput =
    "mt-1.5 w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15";

  return (
    <div className="flex min-h-[calc(100vh-57px)] flex-col bg-[#F5F7FA]">
      <SuccessToast
        open={showPublishToast}
        title="Published successfully"
        message="Opening share & embed page…"
      />
      <header className="border-b border-[#E5E7EB] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div className="min-w-0 flex-1">
            <nav className="mb-1.5 flex items-center gap-2 text-sm text-[#64748B]" aria-label="Breadcrumb">
              <Link to="/app" className="no-underline hover:text-[#0B1F44]">
                My Forms
              </Link>
              <span>/</span>
              <span className="truncate text-[#0B1F44]">{title || form.title}</span>
            </nav>

            <div className="flex flex-wrap items-center gap-2">
              {editingTitle ? (
                <input
                  autoFocus
                  className="w-full max-w-md rounded-xl border border-[#BFDBFE] px-3 py-1.5 text-2xl font-semibold text-[#0B1F44] outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                  value={title}
                  onChange={(e) => setMeta({ title: e.target.value })}
                  onBlur={() => setEditingTitle(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setEditingTitle(false);
                  }}
                />
              ) : (
                <>
                  <h1 className="truncate text-2xl font-semibold tracking-tight text-[#0B1F44]">
                    {title || "Untitled form"}
                  </h1>
                  <button
                    type="button"
                    className="rounded-lg p-1.5 text-[#94A3B8] hover:bg-[#EFF6FF] hover:text-[#2563EB]"
                    aria-label="Edit title"
                    onClick={() => setEditingTitle(true)}
                  >
                    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                      <path d="M12.5 4.5 15.5 7.5 8 15H5v-3L12.5 4.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                    </svg>
                  </button>
                </>
              )}
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${
                  form.status === "published"
                    ? "bg-[#ECFDF5] text-[#047857]"
                    : "bg-[#F1F5F9] text-[#64748B]"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    form.status === "published" ? "bg-emerald-500" : "bg-[#94A3B8]"
                  }`}
                />
                {form.status === "published" ? "Published" : "Draft"}
                {form.publishedVersion ? ` · r${form.publishedVersion.revision}` : ""}
              </span>
              <span className="inline-flex items-center gap-1.5 text-xs text-[#64748B]">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${dirty ? "bg-amber-500" : "bg-emerald-500"}`}
                />
                {saving ? "Saving…" : dirty ? "Unsaved changes" : message || "All changes saved"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/forms/${id}/preview`} className={`${btnGhost} no-underline`}>
              Preview
            </Link>
            <button
              type="button"
              className={btnGhost}
              onClick={() => {
                if (isPublished) {
                  navigate(`/forms/${id}/published`);
                } else {
                  setMessage("Publish the form first to get share and embed links.");
                }
              }}
            >
              Share
            </button>
            <Link to={`/forms/${id}/submissions`} className={`${btnGhost} no-underline`}>
              Inbox
            </Link>
            <button
              type="button"
              onClick={() => void saveDraft()}
              disabled={saving || publishing}
              className={btnGhost}
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              onClick={() => void publish()}
              disabled={saving || publishing}
              className={btnPrimary}
            >
              {publishing ? "Publishing…" : "Publish"}
            </button>
          </div>
        </div>

        <div className="grid gap-3 border-t border-[#E5E7EB] bg-[#F8FAFC] px-4 py-4 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
          <label className="block text-sm">
            <span className="font-medium text-[#64748B]">Short description</span>
            <input
              className={settingInput}
              value={definition.meta.description}
              onChange={(e) =>
                setDefinition({
                  ...definition,
                  meta: { ...definition.meta, description: e.target.value },
                })
              }
              placeholder="What is this form for?"
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-[#64748B]">Form slug</span>
            <input
              className={`${settingInput} font-mono`}
              value={slug}
              onChange={(e) => setMeta({ slug: e.target.value })}
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-[#64748B]">Success message</span>
            <input
              className={settingInput}
              value={definition.settings.successMessage}
              onChange={(e) =>
                setDefinition({
                  ...definition,
                  settings: { ...definition.settings, successMessage: e.target.value },
                })
              }
            />
          </label>
          <label className="block text-sm">
            <span className="font-medium text-[#64748B]">Submit button label</span>
            <input
              className={settingInput}
              value={definition.settings.submitLabel}
              onChange={(e) =>
                setDefinition({
                  ...definition,
                  settings: { ...definition.settings, submitLabel: e.target.value },
                })
              }
            />
          </label>
        </div>

        {error ? (
          <p className="border-t border-red-100 bg-red-50 px-4 py-2 text-sm text-[#DC2626] sm:px-6">
            {error}
          </p>
        ) : null}
      </header>

      <div className="grid flex-1 gap-4 p-4 lg:grid-cols-[280px_320px_minmax(0,1fr)] lg:items-start sm:p-6">
        <section className="min-h-[28rem] overflow-hidden rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] shadow-sm">
          <FieldListPanel
            definition={definition}
            selectedFieldId={selectedField?.id ?? null}
            onSelectField={selectField}
            onChange={setDefinition}
          />
        </section>

        <section className="min-h-[28rem] overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
          {selectedField ? (
            <FieldInspector
              definition={definition}
              field={selectedField}
              onChange={setDefinition}
              onRemove={removeSelectedField}
            />
          ) : (
            <FieldSettingsEmpty />
          )}
        </section>

        <section className="relative min-h-[28rem] overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-3">
            <h2 className="text-sm font-semibold text-[#0B1F44]">Live preview</h2>
            <div className="flex items-center gap-1 rounded-xl bg-[#F1F5F9] p-1">
              <button
                type="button"
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  previewMode === "desktop"
                    ? "bg-white text-[#2563EB] shadow-sm"
                    : "text-[#64748B]"
                }`}
                onClick={() => setPreviewMode("desktop")}
              >
                Desktop
              </button>
              <button
                type="button"
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  previewMode === "mobile"
                    ? "bg-white text-[#2563EB] shadow-sm"
                    : "text-[#64748B]"
                }`}
                onClick={() => setPreviewMode("mobile")}
              >
                Mobile
              </button>
              <button
                type="button"
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-[#64748B] hover:text-[#0B1F44]"
                onClick={() => setShowTheme(true)}
              >
                Theme
              </button>
            </div>
          </div>

          <div
            className="bg-[radial-gradient(#CBD5E1_1px,transparent_1px)] bg-[length:16px_16px] p-4 sm:p-6"
            style={{ backgroundColor: "#F3F4F6" }}
          >
            <div
              className={`mx-auto overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-md ${
                previewMode === "mobile" ? "max-w-[390px]" : "max-w-none"
              }`}
            >
              <FormRenderer
                key={
                  definition.fields.map((f) => f.id).join(",") +
                  String(definition.theme?.buttonWidth ?? "") +
                  String(definition.theme?.buttonSize ?? "")
                }
                definition={{
                  ...definition,
                  theme: {
                    ...resolveFormTheme(definition.theme),
                    buttonWidth: "auto",
                  },
                }}
                framed
                compactFrame
                previewSubmit
                selectedFieldId={selectedField?.id ?? null}
                onSelectField={selectField}
              />
            </div>
            <p className="mt-4 text-center text-xs text-[#94A3B8]">
              {definition.settings.successMessage}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowTheme(true)}
            className="absolute right-4 bottom-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#2563EB] text-white shadow-lg shadow-blue-500/30 hover:bg-[#1D4ED8]"
            aria-label="Open form designer"
            title="Colors and themes"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
              <path
                d="M5 19c2-1 4-4 4-7a6 6 0 1 1 6 6c-3 0-6 2-7 4"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
              <circle cx="15" cy="9" r="1.2" fill="currentColor" />
            </svg>
          </button>
        </section>
      </div>

      {showTheme ? (
        <div className="fixed inset-0 z-40 flex justify-end bg-[#0B1F44]/20 backdrop-blur-[1px]">
          <button
            type="button"
            className="flex-1 cursor-default"
            aria-label="Close theme panel"
            onClick={() => setShowTheme(false)}
          />
          <div className="h-full w-full max-w-sm shadow-2xl">
            <FormThemePanel
              definition={definition}
              onChange={setDefinition}
              onClose={() => setShowTheme(false)}
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
