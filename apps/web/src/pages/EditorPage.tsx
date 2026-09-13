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
import { EditorCopilot } from "../components/EditorCopilot";
import { SuccessToast } from "../components/SuccessToast";
import { useEditorStore } from "../store/editorStore";

type PreviewMode = "desktop" | "tablet" | "mobile";

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
  const [previewMode, setPreviewMode] = useState<PreviewMode>("desktop");
  const [editingTitle, setEditingTitle] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);

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
            theme: resolveFormTheme(data.draftDefinition.theme),
          },
        });
        setLastSavedAt(new Date());
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
      setLastSavedAt(new Date());
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
      <div className="flex min-h-[calc(100vh-57px)] items-center justify-center bg-[#F4F6F9]">
        <p className="text-sm text-[#64748B]">Loading editor…</p>
      </div>
    );
  }
  if (!form || !definition) {
    return (
      <div className="flex min-h-[calc(100vh-57px)] items-center justify-center bg-[#F4F6F9]">
        <p className="text-sm text-[#DC2626]">{error ?? "Form not found"}</p>
      </div>
    );
  }

  const isPublished = form.status === "published" && Boolean(form.publishedVersion);
  const theme = resolveFormTheme(definition.theme);
  const btnGhost =
    "inline-flex items-center gap-2 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-medium text-[#0F172A] hover:bg-[#F8FAFC] disabled:opacity-60";
  const btnSoft =
    "inline-flex items-center gap-2 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] px-3.5 py-2 text-sm font-medium text-[#2563EB] hover:bg-[#DBEAFE] disabled:opacity-60";
  const btnPrimary =
    "inline-flex items-center gap-2 rounded-lg bg-[#2563EB] px-3.5 py-2 text-sm font-medium text-white shadow-sm hover:bg-[#1D4ED8] disabled:opacity-60";
  const settingInput =
    "mt-1.5 w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15";

  const previewMax =
    previewMode === "mobile" ? "max-w-[390px]" : previewMode === "tablet" ? "max-w-[720px]" : "max-w-3xl";

  const savedLabel = (() => {
    if (saving) return "Saving…";
    if (dirty) return "Unsaved changes";
    if (message) return message;
    if (!lastSavedAt) return "All changes saved";
    const mins = Math.max(0, Math.round((Date.now() - lastSavedAt.getTime()) / 60000));
    if (mins <= 0) return "All changes saved · just now";
    if (mins === 1) return "All changes saved · Last saved 1 minute ago";
    return `All changes saved · Last saved ${mins} minutes ago`;
  })();

  return (
    <div className="flex min-h-[calc(100vh-57px)] flex-col bg-[#F4F6F9]">
      <SuccessToast
        open={showPublishToast}
        title="Published successfully"
        message="Opening share & embed page…"
      />

      <header className="border-b border-[#E5E7EB] bg-white">
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-5">
          <div className="min-w-0 flex-1">
            <nav className="mb-1 flex items-center gap-1.5 text-sm text-[#64748B]" aria-label="Breadcrumb">
              <Link to="/app" className="no-underline hover:text-[#0F172A]">
                My Forms
              </Link>
              <span className="text-[#CBD5E1]">›</span>
              <span className="truncate text-[#0F172A]">{title || form.title}</span>
            </nav>

            <div className="flex flex-wrap items-center gap-2.5">
              {editingTitle ? (
                <input
                  autoFocus
                  className="w-full max-w-md rounded-xl border border-[#BFDBFE] px-3 py-1.5 text-[1.65rem] font-semibold text-[#0F172A] outline-none focus:ring-2 focus:ring-[#2563EB]/20"
                  value={title}
                  onChange={(e) => setMeta({ title: e.target.value })}
                  onBlur={() => setEditingTitle(false)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") setEditingTitle(false);
                  }}
                />
              ) : (
                <>
                  <h1 className="truncate text-[1.65rem] font-semibold tracking-tight text-[#0F172A]">
                    {title || "Untitled form"}
                  </h1>
                  <button
                    type="button"
                    className="rounded-lg p-1.5 text-[#94A3B8] hover:bg-[#EFF6FF] hover:text-[#2563EB]"
                    aria-label="Edit title"
                    onClick={() => setEditingTitle(true)}
                  >
                    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                      <path
                        d="M12.5 4.5 15.5 7.5 8 15H5v-3L12.5 4.5Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinejoin="round"
                      />
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
                {form.publishedVersion ? ` - r${form.publishedVersion.revision}` : ""}
              </span>

              <span className="inline-flex items-center gap-1.5 text-xs text-[#64748B]">
                <span
                  className={`h-1.5 w-1.5 rounded-full ${dirty ? "bg-amber-500" : "bg-emerald-500"}`}
                />
                {dirty ? "Unsaved changes" : saving ? "Saving…" : "All changes saved"}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="mr-1 hidden items-center gap-0.5 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC] p-0.5 sm:flex">
              {(
                [
                  ["desktop", "Desktop"],
                  ["tablet", "Tablet"],
                  ["mobile", "Mobile"],
                ] as const
              ).map(([mode, label]) => (
                <button
                  key={mode}
                  type="button"
                  title={label}
                  aria-label={label}
                  className={`rounded-md p-1.5 ${
                    previewMode === mode
                      ? "bg-white text-[#2563EB] shadow-sm"
                      : "text-[#94A3B8] hover:text-[#0F172A]"
                  }`}
                  onClick={() => setPreviewMode(mode)}
                >
                  {mode === "desktop" ? (
                    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                      <rect x="2.5" y="4" width="15" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M7 16h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  ) : mode === "tablet" ? (
                    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                      <rect x="5" y="2.5" width="10" height="15" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                      <circle cx="10" cy="14.5" r="0.8" fill="currentColor" />
                    </svg>
                  ) : (
                    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                      <rect x="6.5" y="2.5" width="7" height="15" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
                      <path d="M9 14.5h2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                    </svg>
                  )}
                </button>
              ))}
            </div>

            <Link to={`/forms/${id}/preview`} className={`${btnGhost} no-underline`}>
              <EyeIcon />
              Preview
            </Link>
            <button
              type="button"
              className={btnGhost}
              onClick={() => {
                if (isPublished) navigate(`/forms/${id}/published`);
                else setMessage("Publish the form first to get share and embed links.");
              }}
            >
              <ShareIcon />
              Share
            </button>
            <Link to={`/forms/${id}/submissions`} className={`${btnGhost} no-underline`}>
              <InboxIcon />
              Inbox
            </Link>
            <button
              type="button"
              onClick={() => void saveDraft()}
              disabled={saving || publishing}
              className={btnSoft}
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              type="button"
              className="rounded-lg border border-[#E5E7EB] p-2 text-[#64748B] hover:bg-[#F8FAFC]"
              aria-label="More actions"
              title="More"
            >
              <svg viewBox="0 0 20 20" className="h-4 w-4" fill="currentColor" aria-hidden="true">
                <circle cx="10" cy="4" r="1.4" />
                <circle cx="10" cy="10" r="1.4" />
                <circle cx="10" cy="16" r="1.4" />
              </svg>
            </button>
          </div>
        </div>

        <div className="grid gap-3 border-t border-[#E5E7EB] bg-white px-4 py-4 sm:grid-cols-2 sm:px-5 lg:grid-cols-4">
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
          <p className="border-t border-red-100 bg-red-50 px-4 py-2 text-sm text-[#DC2626] sm:px-5">
            {error}
          </p>
        ) : null}
      </header>

      <div className="grid min-h-0 flex-1 gap-3 p-3 lg:grid-cols-[280px_300px_minmax(0,1fr)] lg:items-stretch sm:p-4">
        <section className="min-h-[28rem] overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
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
              onBack={() => selectField(null)}
            />
          ) : (
            <FieldSettingsEmpty />
          )}
        </section>

        <section className="relative flex min-h-[28rem] flex-col overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
          <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-3">
            <h2 className="text-sm font-semibold text-[#0F172A]">Live preview</h2>
            <div className="flex items-center gap-1 rounded-xl bg-[#F1F5F9] p-1">
              <button
                type="button"
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  previewMode === "desktop" ? "bg-white text-[#2563EB] shadow-sm" : "text-[#64748B]"
                }`}
                onClick={() => setPreviewMode("desktop")}
              >
                Desktop
              </button>
              <button
                type="button"
                className={`rounded-lg px-3 py-1.5 text-xs font-medium ${
                  previewMode === "mobile" ? "bg-white text-[#2563EB] shadow-sm" : "text-[#64748B]"
                }`}
                onClick={() => setPreviewMode("mobile")}
              >
                Mobile
              </button>
              <button
                type="button"
                className="inline-flex items-center gap-1 rounded-lg px-3 py-1.5 text-xs font-medium text-[#64748B] hover:text-[#0F172A]"
                onClick={() => setShowTheme(true)}
                title="Open form designer"
              >
                <ThemeBrushIcon />
                Theme
              </button>
            </div>
          </div>

          <div
            className="flex-1 overflow-auto bg-[#E8EEF5] bg-cover bg-left p-4 sm:p-6"
            style={{
              backgroundImage:
                "linear-gradient(105deg, rgba(232,238,245,0.88) 0%, rgba(232,238,245,0.72) 40%, rgba(232,238,245,0.82) 100%), url(https://images.unsplash.com/photo-1466781783364-36c955e42a7f?auto=format&fit=crop&w=1600&q=80)",
            }}
          >
            <div className={`mx-auto overflow-hidden rounded-2xl shadow-lg shadow-slate-900/10 ${previewMax}`}>
              <FormRenderer
                key={
                  definition.fields.map((f) => f.id).join(",") +
                  String(definition.theme?.presetId ?? "") +
                  String(definition.theme?.inputStyle ?? "") +
                  String(definition.theme?.cardStyle ?? "") +
                  String(definition.theme?.pageBackgroundImage ?? "") +
                  String(definition.theme?.formLayout ?? "") +
                  String(definition.theme?.buttonWidth ?? "") +
                  String(definition.theme?.buttonSize ?? "")
                }
                definition={{
                  ...definition,
                  theme,
                }}
                framed
                compactFrame
                previewSubmit
                selectedFieldId={selectedField?.id ?? null}
                onSelectField={selectField}
              />
            </div>
          </div>
        </section>
      </div>

      <footer className="sticky bottom-0 z-20 border-t border-[#E5E7EB] bg-white px-4 py-3 sm:px-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link
            to="/app"
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-medium text-[#0F172A] no-underline hover:bg-[#F8FAFC]"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
              <path d="M12 5 7 10l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
            Back to forms
          </Link>

          <div className="flex items-center gap-2 text-sm text-[#64748B]">
            <span
              className={`h-2 w-2 rounded-full ${dirty ? "bg-amber-500" : "bg-emerald-500"}`}
            />
            <span>{savedLabel}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link to={`/forms/${id}/preview`} className={`${btnGhost} no-underline`}>
              <EyeIcon />
              Preview
            </Link>
            <button
              type="button"
              onClick={() => void saveDraft()}
              disabled={saving || publishing}
              className={btnGhost}
            >
              <SaveIcon />
              Save
            </button>
            <div className="relative">
              <button
                type="button"
                onClick={() => void publish()}
                disabled={saving || publishing}
                className={btnPrimary}
                title="Publish and get the public link"
              >
                {publishing ? "Publishing…" : "Publish"}
                <svg viewBox="0 0 20 20" className="h-4 w-4 opacity-80" fill="none" aria-hidden="true">
                  <path d="m6 8 4 4 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </footer>

      {/* Blue theme symbol — top-right; Ask Copilot stays bottom-right */}
      <button
        type="button"
        onClick={() => setShowTheme(true)}
        className="fixed top-20 right-5 z-30 flex h-12 w-12 items-center justify-center rounded-full bg-[#2563EB] text-white shadow-lg shadow-blue-500/30 hover:bg-[#1D4ED8] lg:right-8"
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

      <EditorCopilot
        formId={id}
        definition={definition}
        onApplyDefinition={(next) => {
          setDefinition({
            ...next,
            theme: resolveFormTheme(next.theme ?? definition.theme),
          });
          setMessage("Copilot updated the draft. Save when you’re ready.");
        }}
      />

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

function EyeIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M2.5 10S5.5 4.5 10 4.5 17.5 10 17.5 10 14.5 15.5 10 15.5 2.5 10 2.5 10Z"
        stroke="currentColor"
        strokeWidth="1.5"
      />
      <circle cx="10" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <circle cx="15" cy="5" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="5" cy="10" r="2" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="15" cy="15" r="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="m7 9 6-3M7 11l6 3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function InboxIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M3.5 10.5 5 4.5h10l1.5 6v4a1 1 0 0 1-1 1h-11a1 1 0 0 1-1-1v-4Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M3.5 10.5h3.2l1 2h4.6l1-2h3.2" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
      <path
        d="M4.5 4.5h9l2 2V15.5h-11V4.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path d="M7 4.5v4h6v-4M7 15.5v-4h6v4" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function ThemeBrushIcon() {
  return (
    <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <path
        d="M4 15c1.5-.8 3-3 3-5.5A4.5 4.5 0 1 1 11.5 14c-2.5 0-4.7 1.5-5.5 3"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
      <circle cx="12" cy="7.5" r="1" fill="currentColor" />
    </svg>
  );
}
