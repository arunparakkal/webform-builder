import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../api/client";
import { CopyButton } from "../components/CopyButton";
import {
  buildIframeEmbedCode,
  buildJavaScriptEmbedCode,
  getPublicWebOrigin,
  publicFormUrl,
} from "../lib/embedCode";
import {
  getFormTemplates,
  shuffleTemplates,
  uniqueTemplateSlug,
  type FormTemplate,
} from "../lib/formTemplates";

type CreatedResult = {
  template: FormTemplate;
  formId: string;
  title: string;
  slug: string;
  revision: number;
};

export function TemplatesPage() {
  const templates = useMemo(() => shuffleTemplates(getFormTemplates()), []);
  const [selected, setSelected] = useState<FormTemplate | null>(null);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<CreatedResult | null>(null);
  const [embedTab, setEmbedTab] = useState<"iframe" | "js">("iframe");

  const origin = useMemo(
    () =>
      getPublicWebOrigin(
        import.meta.env.VITE_PUBLIC_WEB_URL as string | undefined,
        typeof window !== "undefined" ? window.location.origin : undefined,
      ),
    [],
  );

  async function useTemplate(template: FormTemplate) {
    setError(null);
    setCreating(true);
    setSelected(template);
    try {
      // Fresh definition IDs for this create
      const fresh = getFormTemplates().find((t) => t.id === template.id) ?? template;
      const slug = uniqueTemplateSlug(fresh.slugBase);
      const created = await api.createForm(fresh.title, slug);
      await api.updateForm(created.id, {
        title: fresh.title,
        draftDefinition: fresh.definition,
      });
      const published = await api.publishForm(created.id);
      setResult({
        template: fresh,
        formId: created.id,
        title: fresh.title,
        slug: published.slug,
        revision: published.revision,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not create form from template");
      setResult(null);
    } finally {
      setCreating(false);
    }
  }

  function backToList() {
    setResult(null);
    setSelected(null);
    setError(null);
  }

  if (result) {
    const url = origin ? publicFormUrl(origin, result.slug, false) : "";
    const iframeCode = origin
      ? buildIframeEmbedCode({
          origin,
          slug: result.slug,
          title: result.title,
          iframeHeight: 650,
        })
      : "";
    const jsCode = origin
      ? buildJavaScriptEmbedCode({ origin, slug: result.slug, title: result.title })
      : "";
    const activeCode = embedTab === "iframe" ? iframeCode : jsCode;

    return (
      <div className="mx-auto max-w-4xl space-y-6">
        <button
          type="button"
          onClick={backToList}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[#64748B] hover:text-[#0B1F44]"
        >
          <span aria-hidden="true">←</span> All templates
        </button>

        <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-[#ECFDF5] via-[#F0FDFA] to-[#EFF6FF] p-5 shadow-sm sm:p-7">
          <div className="flex items-start gap-4">
            <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#10B981] text-white shadow-lg shadow-emerald-500/25">
              <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" aria-hidden="true">
                <path d="M6 12.5 10 16.5 18 8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Template published</p>
              <h1 className="mt-1 font-display text-2xl font-semibold tracking-tight text-[#0B1F44]">
                {result.title}
              </h1>
              <p className="mt-1 text-sm text-[#64748B]">
                Created from <span className="font-medium text-[#0B1F44]">{result.template.title}</span>
                {" · "}revision {result.revision}. Copy the public URL or embed snippets below.
              </p>
            </div>
          </div>
        </section>

        <section className="space-y-4 rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
          <div>
            <h2 className="text-sm font-semibold text-[#0B1F44]">Public form URL</h2>
            <div className="mt-2 flex flex-col gap-2 sm:flex-row sm:items-center">
              <code className="block flex-1 overflow-x-auto rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-2.5 font-mono text-xs text-[#0B1F44]">
                {url || "Open this app in a browser to generate a URL."}
              </code>
              <div className="flex shrink-0 gap-2">
                {url ? (
                  <CopyButton
                    text={url}
                    label="Copy URL"
                    className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-medium text-[#0B1F44] hover:bg-[#F8FAFC]"
                  />
                ) : null}
                {url ? (
                  <a
                    href={url}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl bg-[#2563EB] px-3 py-2 text-sm font-medium text-white no-underline hover:bg-[#1D4ED8]"
                  >
                    Open form
                  </a>
                ) : null}
              </div>
            </div>
          </div>

          <div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-sm font-semibold text-[#0B1F44]">Embed on your site</h2>
              <div className="flex rounded-lg border border-[#E5E7EB] p-0.5">
                <button
                  type="button"
                  onClick={() => setEmbedTab("iframe")}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                    embedTab === "iframe" ? "bg-[#EFF6FF] text-[#2563EB]" : "text-[#64748B]"
                  }`}
                >
                  iframe
                </button>
                <button
                  type="button"
                  onClick={() => setEmbedTab("js")}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium ${
                    embedTab === "js" ? "bg-[#EFF6FF] text-[#2563EB]" : "text-[#64748B]"
                  }`}
                >
                  Script
                </button>
              </div>
            </div>
            <p className="mt-1 text-sm text-[#64748B]">
              Paste into any website. Submissions use the same public API and inbox.
            </p>
            <pre className="mt-3 overflow-x-auto rounded-xl border border-[#E5E7EB] bg-[#0B1F44] p-4 text-xs leading-relaxed text-[#E2E8F0]">
              {activeCode || "Embed code unavailable."}
            </pre>
            {activeCode ? (
              <div className="mt-3">
                <CopyButton
                  text={activeCode}
                  label={embedTab === "iframe" ? "Copy iframe" : "Copy script"}
                  className="rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-sm font-medium text-[#0B1F44] hover:bg-[#F8FAFC]"
                />
              </div>
            ) : null}
          </div>

          <div className="flex flex-wrap gap-2 border-t border-[#E5E7EB] pt-4">
            <Link
              to={`/forms/${result.formId}`}
              className="rounded-xl bg-[#2563EB] px-3.5 py-2.5 text-sm font-medium text-white no-underline hover:bg-[#1D4ED8]"
            >
              Open in editor
            </Link>
            <Link
              to={`/forms/${result.formId}/submissions`}
              className="rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-sm font-medium text-[#0B1F44] no-underline hover:bg-[#F8FAFC]"
            >
              View submissions
            </Link>
            <button
              type="button"
              onClick={backToList}
              className="rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC] hover:text-[#0B1F44]"
            >
              Use another template
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight text-[#0B1F44]">Templates</h1>
        <p className="mt-1 max-w-2xl text-sm text-[#64748B]">
          Pick a ready-made form. We create and publish it for you, then give you the public URL,
          iframe, and script embed — same flow as a form you built yourself.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700" role="alert">
          {error}
        </div>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {templates.map((template) => {
          const busy = creating && selected?.id === template.id;
          return (
            <article
              key={template.id}
              className="flex flex-col rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm transition hover:border-[#BFDBFE] hover:shadow-md"
            >
              <div className="flex items-start justify-between gap-3">
                <span
                  className="flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white"
                  style={{ backgroundColor: template.accent }}
                  aria-hidden="true"
                >
                  {template.title.slice(0, 1)}
                </span>
                <span className="rounded-full bg-[#F1F5F9] px-2.5 py-0.5 text-[11px] font-medium text-[#64748B]">
                  {template.category}
                </span>
              </div>
              <h2 className="mt-4 text-base font-semibold text-[#0B1F44]">{template.title}</h2>
              <p className="mt-1 flex-1 text-sm leading-relaxed text-[#64748B]">{template.description}</p>
              <p className="mt-3 text-xs text-[#94A3B8]">{template.fieldCount} fields · ready to publish</p>
              <button
                type="button"
                disabled={creating}
                onClick={() => void useTemplate(template)}
                className="mt-4 w-full rounded-xl bg-[#2563EB] px-3 py-2.5 text-sm font-medium text-white hover:bg-[#1D4ED8] disabled:cursor-wait disabled:opacity-70"
              >
                {busy ? "Creating & publishing…" : "Use template"}
              </button>
            </article>
          );
        })}
      </div>
    </div>
  );
}
