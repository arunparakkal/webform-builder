import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { slugify } from "../lib/fields";

type CreateFormModalProps = {
  open: boolean;
  creating?: boolean;
  error?: string | null;
  onClose: () => void;
  onCreate: (title: string, slug: string) => void | Promise<void>;
};

export function CreateFormModal({
  open,
  creating = false,
  error = null,
  onClose,
  onCreate,
}: CreateFormModalProps) {
  const titleId = useId();
  const slugId = useId();
  const titleRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);

  useEffect(() => {
    if (!open) return;
    setTitle("");
    setSlug("");
    setSlugTouched(false);
    const t = window.setTimeout(() => titleRef.current?.focus(), 40);
    return () => window.clearTimeout(t);
  }, [open]);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape" && !creating) onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, creating, onClose]);

  if (!open) return null;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const nextTitle = title.trim();
    const nextSlug = slug.trim();
    if (!nextTitle || !nextSlug) return;
    await onCreate(nextTitle, nextSlug);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1F44]/40 p-4 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !creating) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${titleId}-heading`}
        className="w-full max-w-md rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-xl sm:p-6"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id={`${titleId}-heading`} className="text-lg font-semibold text-[#0B1F44]">
              Create new form
            </h2>
            <p className="mt-1 text-sm text-[#64748B]">
              Give it a title and URL slug (unique for your account), then open the editor.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={creating}
            className="rounded-lg p-1.5 text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#0B1F44] disabled:opacity-50"
            aria-label="Close"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block text-sm" htmlFor={titleId}>
            <span className="font-medium text-[#0B1F44]">Title</span>
            <input
              ref={titleRef}
              id={titleId}
              required
              className="mt-1.5 w-full rounded-xl border border-[#E5E7EB] px-3.5 py-2.5 text-[#0B1F44] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/20"
              value={title}
              onChange={(e) => {
                setTitle(e.target.value);
                if (!slugTouched) setSlug(slugify(e.target.value));
              }}
              placeholder="Customer Feedback"
              disabled={creating}
            />
          </label>

          <label className="block text-sm" htmlFor={slugId}>
            <span className="font-medium text-[#0B1F44]">Slug</span>
            <div className="mt-1.5 flex overflow-hidden rounded-xl border border-[#E5E7EB] focus-within:border-[#2563EB] focus-within:ring-2 focus-within:ring-[#2563EB]/20">
              <span className="flex items-center border-r border-[#E5E7EB] bg-[#F8FAFC] px-3 text-xs text-[#94A3B8]">
                /f/…/
              </span>
              <input
                id={slugId}
                required
                pattern="^[a-z0-9]+(?:-[a-z0-9]+)*$"
                title="Lowercase letters, numbers, and hyphens only"
                className="w-full px-3.5 py-2.5 font-mono text-sm text-[#0B1F44] outline-none"
                value={slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  setSlug(e.target.value);
                }}
                placeholder="customer-feedback"
                disabled={creating}
              />
            </div>
          </label>

          {error ? <p className="text-sm text-[#DC2626]">{error}</p> : null}

          <div className="flex justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={creating}
              className="rounded-xl border border-[#E5E7EB] px-4 py-2.5 text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creating || !title.trim() || !slug.trim()}
              className="rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#1D4ED8] disabled:opacity-60"
            >
              {creating ? "Creating…" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
