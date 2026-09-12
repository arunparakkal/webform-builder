import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { api, type FormDetail } from "../api/client";
import { CopyButton } from "../components/CopyButton";
import {
  buildIframeEmbedCode,
  buildJavaScriptEmbedCode,
  getPublicWebOrigin,
  isSafeFormSlug,
  publicFormUrl,
} from "../lib/embedCode";

export function PublishSuccessPage() {
  const { id = "" } = useParams();
  const [form, setForm] = useState<FormDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [embedTab, setEmbedTab] = useState<"iframe" | "js">("iframe");
  const [iframeHeight] = useState(650);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const data = await api.getForm(id);
        if (cancelled) return;
        setForm(data);
      } catch (err) {
        if (!cancelled) setError(err instanceof Error ? err.message : "Failed to load form");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [id]);

  const origin = useMemo(
    () =>
      getPublicWebOrigin(
        import.meta.env.VITE_PUBLIC_WEB_URL as string | undefined,
        typeof window !== "undefined" ? window.location.origin : undefined,
      ),
    [],
  );

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-57px)] items-center justify-center bg-[#F5F7FA]">
        <p className="text-sm text-[#64748B]">Loading publish details…</p>
      </div>
    );
  }

  if (error || !form) {
    return (
      <div className="flex min-h-[calc(100vh-57px)] flex-col items-center justify-center gap-3 bg-[#F5F7FA] px-4">
        <p className="text-sm text-[#DC2626]">{error ?? "Form not found"}</p>
        <Link to="/app" className="text-sm font-medium text-[#2563EB] no-underline hover:underline">
          Back to dashboard
        </Link>
      </div>
    );
  }

  const revision = form.publishedVersion?.revision;
  const safe =
    isSafeFormSlug(form.slug) && Boolean(form.ownerId);
  const url = safe && origin ? publicFormUrl(origin, form.ownerId, form.slug, false) : "";
  const iframeCode =
    safe && origin
      ? buildIframeEmbedCode({
          origin,
          ownerId: form.ownerId,
          slug: form.slug,
          title: form.title,
          iframeHeight,
        })
      : "";
  const jsCode =
    safe && origin
      ? buildJavaScriptEmbedCode({
          origin,
          ownerId: form.ownerId,
          slug: form.slug,
          title: form.title,
        })
      : "";
  const activeCode = embedTab === "iframe" ? iframeCode : jsCode;

  const btnGhost =
    "inline-flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-3.5 py-2.5 text-sm font-medium text-[#0B1F44] hover:bg-[#F8FAFC]";
  const btnPrimary =
    "inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-3.5 py-2.5 text-sm font-medium text-white shadow-sm hover:bg-[#1D4ED8]";

  return (
    <div className="min-h-[calc(100vh-57px)] bg-[#F5F7FA]">
      <div className="border-b border-[#E5E7EB] bg-white px-4 py-3 sm:px-6">
        <nav className="flex items-center gap-2 text-sm text-[#64748B]" aria-label="Breadcrumb">
          <Link to="/app" className="inline-flex items-center gap-1.5 no-underline hover:text-[#0B1F44]">
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
              <path
                d="M3.5 9.5 10 4l6.5 5.5V16a1 1 0 0 1-1 1h-3.5v-4h-4v4H4.5a1 1 0 0 1-1-1V9.5Z"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeLinejoin="round"
              />
            </svg>
            My Forms
          </Link>
          <span>/</span>
          <span className="font-medium text-[#0B1F44]">{form.title}</span>
        </nav>
      </div>

      <div className="mx-auto max-w-6xl space-y-5 px-4 py-6 sm:px-6">
        <section className="overflow-hidden rounded-2xl border border-emerald-100 bg-gradient-to-br from-[#ECFDF5] via-[#F0FDFA] to-[#EFF6FF] p-5 shadow-sm sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-start gap-4">
              <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-[#10B981] text-white shadow-lg shadow-emerald-500/30">
                <svg viewBox="0 0 24 24" className="h-7 w-7" fill="none" aria-hidden="true">
                  <path
                    d="M6 12.5 10 16.5 18 8"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              <div>
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-[#047857] ring-1 ring-emerald-200">
                  ✔ Published
                </span>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[#0B1F44] sm:text-3xl">
                  Your form is published successfully!
                </h1>
                <p className="mt-1.5 text-sm text-[#64748B]">
                  Your form is now live and ready to collect responses.
                </p>
                <p className="mt-3 inline-flex items-center gap-1.5 text-xs text-[#64748B]">
                  <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                    <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
                    <path d="M10 6.5V10l2.5 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                  </svg>
                  Revision {revision ?? "—"} · Published just now
                </p>
              </div>
            </div>

            <div className="relative hidden h-28 w-44 shrink-0 sm:block" aria-hidden="true">
              <div className="absolute inset-y-2 left-0 w-28 rounded-xl border border-white/70 bg-white/90 p-2 shadow-md">
                <div className="mb-2 h-2 w-16 rounded bg-[#E2E8F0]" />
                <div className="mb-1.5 h-2 w-full rounded bg-[#F1F5F9]" />
                <div className="mb-1.5 h-2 w-5/6 rounded bg-[#F1F5F9]" />
                <div className="mt-3 h-6 w-14 rounded-md bg-[#10B981]/80" />
              </div>
              <div className="absolute right-0 top-4 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#2563EB] text-white shadow-lg shadow-blue-500/30">
                <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none">
                  <path
                    d="M4 11.5 20 4l-4.5 16-3.5-5.5L4 11.5Z"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>
        </section>

        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="space-y-5">
            <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-start gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB]">
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                    <path
                      d="M8.5 11.5a3.5 3.5 0 0 0 5 0l2-2a3.5 3.5 0 0 0-5-5l-.5.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                    <path
                      d="M11.5 8.5a3.5 3.5 0 0 0-5 0l-2 2a3.5 3.5 0 0 0 5 5l.5-.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </span>
                <div>
                  <h2 className="text-base font-semibold text-[#0B1F44]">Public form URL</h2>
                  <p className="text-sm text-[#64748B]">
                    Share this link with anyone to access your form.
                  </p>
                </div>
              </div>

              {url ? (
                <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
                  <input
                    readOnly
                    value={url}
                    className="w-full flex-1 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3.5 py-2.5 font-mono text-sm text-[#0B1F44] outline-none"
                  />
                  <div className="flex shrink-0 gap-2">
                    <CopyButton
                      text={url}
                      label="Copy URL"
                      className={btnGhost}
                    />
                    <a href={url} target="_blank" rel="noreferrer" className={`${btnPrimary} no-underline`}>
                      Open form
                      <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                        <path
                          d="M8 5H5.5A1.5 1.5 0 0 0 4 6.5v8A1.5 1.5 0 0 0 5.5 16h8a1.5 1.5 0 0 0 1.5-1.5V12M11 4h5v5M9 11 16 4"
                          stroke="currentColor"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </a>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-[#64748B]">
                  Publish with a valid slug to generate the public URL.
                </p>
              )}
            </section>

            <section id="embed" className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm sm:p-6">
              <div className="mb-4 flex items-start gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB]">
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                    <path
                      d="M6.5 7.5 3.5 10l3 2.5M13.5 7.5l3 2.5-3 2.5M11 5.5 9 14.5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <div>
                  <h2 className="text-base font-semibold text-[#0B1F44]">Embed your form</h2>
                  <p className="text-sm text-[#64748B]">
                    Add the following code to your website to embed the form.
                  </p>
                </div>
              </div>

              <div className="mb-3 flex gap-1 border-b border-[#E5E7EB]">
                <button
                  type="button"
                  onClick={() => setEmbedTab("iframe")}
                  className={`inline-flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium ${
                    embedTab === "iframe"
                      ? "border-[#2563EB] text-[#2563EB]"
                      : "border-transparent text-[#64748B] hover:text-[#0B1F44]"
                  }`}
                >
                  Iframe
                </button>
                <button
                  type="button"
                  onClick={() => setEmbedTab("js")}
                  className={`inline-flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium ${
                    embedTab === "js"
                      ? "border-[#2563EB] text-[#2563EB]"
                      : "border-transparent text-[#64748B] hover:text-[#0B1F44]"
                  }`}
                >
                  JavaScript
                </button>
              </div>

              <div className="relative overflow-hidden rounded-xl bg-[#0B1220] p-4">
                <div className="mb-3 flex items-center justify-between gap-2">
                  <span className="text-xs font-medium text-[#94A3B8]">
                    {embedTab === "iframe" ? "iframe snippet" : "JavaScript snippet"}
                  </span>
                  {activeCode ? (
                    <CopyButton
                      text={activeCode}
                      label="Copy code"
                      className="rounded-lg border border-white/10 bg-white/10 px-2.5 py-1.5 text-xs font-medium text-white hover:bg-white/15"
                    />
                  ) : null}
                </div>
                <pre className="max-h-56 overflow-auto font-mono text-[12px] leading-relaxed whitespace-pre-wrap text-[#E2E8F0]">
                  {activeCode || "Embed code unavailable for this slug."}
                </pre>
              </div>

              <p className="mt-3 flex items-start gap-2 text-xs text-[#64748B]">
                <svg viewBox="0 0 20 20" className="mt-0.5 h-3.5 w-3.5 shrink-0" fill="none" aria-hidden="true">
                  <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.4" />
                  <path d="M10 9v4M10 6.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
                </svg>
                Paste this code into your website where you want the form to appear. JavaScript
                embed requires <code className="font-mono">/embed.js</code> from the web build.
              </p>
            </section>
          </div>

          <aside className="space-y-5">
            <section className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm">
              <div className="mb-4 flex items-start gap-3">
                <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#EFF6FF] text-[#2563EB]">
                  <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                    <path
                      d="M10 3.5 12 8l4.5.5-3.4 3.1.9 4.4L10 14.2 5.9 16l.9-4.4L3.5 8.5 8 8l2-4.5Z"
                      stroke="currentColor"
                      strokeWidth="1.4"
                      strokeLinejoin="round"
                    />
                  </svg>
                </span>
                <div>
                  <h2 className="text-base font-semibold text-[#0B1F44]">Next steps</h2>
                  <p className="text-sm text-[#64748B]">Get the most out of your form.</p>
                </div>
              </div>

              <ul className="space-y-2">
                <li>
                  <a
                    href="#embed"
                    className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] px-3 py-3 no-underline hover:border-[#BFDBFE] hover:bg-[#F8FAFC]"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#2563EB]">
                      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                        <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
                        <path d="M3.5 10h13M10 3.5c2 2.2 2 10.8 0 13M10 3.5c-2 2.2-2 10.8 0 13" stroke="currentColor" strokeWidth="1.4" />
                      </svg>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-[#0B1F44]">Add to website</span>
                      <span className="block text-xs text-[#64748B]">
                        Copy the embed code and paste it on your site.
                      </span>
                    </span>
                    <span className="text-[#CBD5E1]">›</span>
                  </a>
                </li>
                <li>
                  <Link
                    to={`/forms/${id}/submissions`}
                    className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] px-3 py-3 no-underline hover:border-[#BFDBFE] hover:bg-[#F8FAFC]"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#2563EB]">
                      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                        <path d="M4 6h12M4 10h12M4 14h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-[#0B1F44]">View submissions</span>
                      <span className="block text-xs text-[#64748B]">
                        Check responses and manage your data.
                      </span>
                    </span>
                    <span className="text-[#CBD5E1]">›</span>
                  </Link>
                </li>
                <li>
                  <Link
                    to={`/forms/${id}`}
                    className="flex items-center gap-3 rounded-xl border border-[#E5E7EB] px-3 py-3 no-underline hover:border-[#BFDBFE] hover:bg-[#F8FAFC]"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#2563EB]">
                      <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
                        <path d="M12.5 4.5 15.5 7.5 8 15H5v-3L12.5 4.5Z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-[#0B1F44]">Back to editor</span>
                      <span className="block text-xs text-[#64748B]">Make changes to your form.</span>
                    </span>
                    <span className="text-[#CBD5E1]">›</span>
                  </Link>
                </li>
              </ul>
            </section>

            <section className="overflow-hidden rounded-2xl border border-[#BFDBFE] bg-gradient-to-br from-[#EFF6FF] to-[#DBEAFE] p-5 shadow-sm">
              <span className="inline-flex items-center gap-1 rounded-full bg-white/80 px-2.5 py-1 text-xs font-semibold text-[#047857] ring-1 ring-emerald-200">
                ✔ Your form is live
              </span>
              <h2 className="mt-3 text-lg font-semibold text-[#0B1F44]">See it in action</h2>
              <p className="mt-1 text-sm text-[#64748B]">
                Your form is now ready to collect responses from your audience.
              </p>
              {url ? (
                <a href={url} target="_blank" rel="noreferrer" className={`mt-4 ${btnPrimary} no-underline`}>
                  Open public form
                  <svg viewBox="0 0 20 20" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
                    <path
                      d="M8 5H5.5A1.5 1.5 0 0 0 4 6.5v8A1.5 1.5 0 0 0 5.5 16h8a1.5 1.5 0 0 0 1.5-1.5V12M11 4h5v5M9 11 16 4"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </a>
              ) : null}
            </section>
          </aside>
        </div>

        <div className="flex items-start gap-2 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] px-4 py-3 text-sm text-[#1E40AF]">
          <svg viewBox="0 0 20 20" className="mt-0.5 h-4 w-4 shrink-0" fill="none" aria-hidden="true">
            <circle cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.4" />
            <path d="M10 9v4M10 6.5v.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
          </svg>
          Submissions will go through the same public API, validation queue, and inbox as your other
          forms.
        </div>
      </div>
    </div>
  );
}
