const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Keep only characters safe for HTML element ids derived from a slug. */
export function safeEmbedTargetId(slug: string): string {
  const cleaned = slug
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
  const base = cleaned || "form";
  return `webform-${base}`;
}

export function isSafeFormSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug);
}

/** Escape text for use inside an HTML attribute value. */
export function escapeHtmlAttr(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function getPublicWebOrigin(envUrl?: string | undefined, windowOrigin?: string): string {
  const fromEnv = envUrl?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (windowOrigin) return windowOrigin.replace(/\/$/, "");
  return "";
}

export function publicFormUrl(origin: string, slug: string, embed = false): string {
  const base = `${origin.replace(/\/$/, "")}/f/${slug}`;
  return embed ? `${base}?embed=true` : base;
}

export type EmbedSnippetInput = {
  origin: string;
  slug: string;
  title: string;
  iframeHeight?: number;
};

export function buildIframeEmbedCode(input: EmbedSnippetInput): string {
  const height = Math.min(Math.max(input.iframeHeight ?? 650, 200), 4000);
  const src = publicFormUrl(input.origin, input.slug, true);
  const title = escapeHtmlAttr(input.title || "Form");
  return [
    `<iframe`,
    `  src="${escapeHtmlAttr(src)}"`,
    `  width="100%"`,
    `  height="${height}"`,
    `  style="border:0;"`,
    `  loading="lazy"`,
    `  title="${title}">`,
    `</iframe>`,
  ].join("\n");
}

export function buildJavaScriptEmbedCode(input: EmbedSnippetInput): string {
  const targetId = safeEmbedTargetId(input.slug);
  const origin = input.origin.replace(/\/$/, "");
  const scriptSrc = `${origin}/embed.js`;
  return [
    `<div id="${escapeHtmlAttr(targetId)}"></div>`,
    ``,
    `<script`,
    `  src="${escapeHtmlAttr(scriptSrc)}"`,
    `  data-form-slug="${escapeHtmlAttr(input.slug)}"`,
    `  data-target="${escapeHtmlAttr(targetId)}">`,
    `</script>`,
  ].join("\n");
}
