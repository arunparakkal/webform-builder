import { useMemo, useState } from "react";
import { CopyButton } from "./CopyButton";
import {
  buildIframeEmbedCode,
  buildJavaScriptEmbedCode,
  getPublicWebOrigin,
  isSafeFormSlug,
  publicFormUrl,
} from "../lib/embedCode";

type Props = {
  slug: string;
  title: string;
  revision?: number;
  highlight?: boolean;
};

export function ShareAndEmbed({ slug, title, revision, highlight = false }: Props) {
  const [iframeHeight, setIframeHeight] = useState(650);

  const origin = useMemo(
    () =>
      getPublicWebOrigin(
        import.meta.env.VITE_PUBLIC_WEB_URL as string | undefined,
        typeof window !== "undefined" ? window.location.origin : undefined,
      ),
    [],
  );

  const safeSlug = isSafeFormSlug(slug);
  const url = safeSlug && origin ? publicFormUrl(origin, slug, false) : "";
  const iframeCode =
    safeSlug && origin
      ? buildIframeEmbedCode({ origin, slug, title, iframeHeight })
      : "";
  const jsCode =
    safeSlug && origin ? buildJavaScriptEmbedCode({ origin, slug, title }) : "";

  if (!safeSlug) {
    return (
      <div className="rounded-xl border border-line bg-surface p-5 text-sm text-ink-muted">
        Publish with a valid lowercase slug to generate share and embed codes.
      </div>
    );
  }

  return (
    <section
      className={`space-y-5 rounded-xl border p-5 sm:p-6 ${
        highlight
          ? "border-accent/40 bg-accent/5 shadow-sm"
          : "border-line bg-surface shadow-sm"
      }`}
      aria-label="Share and embed"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="font-display text-xl font-semibold tracking-tight text-ink">
              Your form is published
            </h2>
            <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800">
              Published{revision != null ? ` · r${revision}` : ""}
            </span>
          </div>
          <p className="mt-1 text-sm text-ink-muted">
            <span className="font-medium text-ink">{title}</span> is available through a public
            URL and can be embedded into another website.
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <p className="text-sm font-medium text-ink">Public form URL</p>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
          <code className="block flex-1 overflow-x-auto rounded-md border border-line bg-paper-2 px-3 py-2 font-mono text-xs text-ink">
            {url || "Set VITE_PUBLIC_WEB_URL or open this app in a browser."}
          </code>
          <div className="flex shrink-0 gap-2">
            {url ? <CopyButton text={url} label="Copy URL" /> : null}
            {url ? (
              <a
                href={url}
                target="_blank"
                rel="noreferrer"
                className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-white no-underline hover:bg-accent-hover"
              >
                Open form
              </a>
            ) : null}
          </div>
        </div>
      </div>

      <div>
        <h3 className="font-display text-lg font-semibold text-ink">Share and Embed</h3>
        <p className="mt-1 text-sm text-ink-muted">
          Copy either snippet into your website. Submissions still go through the same public API,
          validation, queue, and inbox.
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="flex flex-col rounded-xl border border-line bg-surface p-4">
          <h4 className="font-semibold text-ink">Embed with iframe</h4>
          <p className="mt-1 text-sm text-ink-muted">
            Add your form to any website using a simple iframe.
          </p>
          <label className="mt-3 block text-xs text-ink-muted">
            iframe height (px)
            <input
              type="number"
              min={200}
              max={4000}
              step={10}
              className="mt-1 w-full rounded-md border border-line px-2 py-1.5 font-mono text-sm"
              value={iframeHeight}
              onChange={(e) => setIframeHeight(Number(e.target.value) || 650)}
            />
          </label>
          <pre className="mt-3 max-h-48 flex-1 overflow-auto rounded-md border border-line bg-paper-2 p-3 font-mono text-[11px] leading-relaxed text-ink whitespace-pre-wrap">
            {iframeCode}
          </pre>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-ink-muted">Paste into any HTML page where the form should appear.</p>
            <CopyButton text={iframeCode} label="Copy iframe code" />
          </div>
        </article>

        <article className="flex flex-col rounded-xl border border-line bg-surface p-4">
          <h4 className="font-semibold text-ink">Embed with JavaScript</h4>
          <p className="mt-1 text-sm text-ink-muted">
            Load the form dynamically into any element on your website.
          </p>
          <pre className="mt-3 max-h-48 flex-1 overflow-auto rounded-md border border-line bg-paper-2 p-3 font-mono text-[11px] leading-relaxed text-ink whitespace-pre-wrap">
            {jsCode}
          </pre>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs text-ink-muted">
              Paste this code into your website where you want the form to appear. Requires{" "}
              <code className="font-mono">/embed.js</code> from the web build.
            </p>
            <CopyButton text={jsCode} label="Copy JavaScript code" />
          </div>
        </article>
      </div>
    </section>
  );
}
