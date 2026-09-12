const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const OWNER_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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

export function isSafeOwnerId(ownerId: string): boolean {
  return OWNER_ID_PATTERN.test(ownerId);
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

/** Public form path: /f/:ownerId/:slug (slug is unique per owner). */
export function publicFormUrl(
  origin: string,
  ownerId: string,
  slug: string,
  embed = false,
): string {
  const base = `${origin.replace(/\/$/, "")}/f/${encodeURIComponent(ownerId)}/${encodeURIComponent(slug)}`;
  return embed ? `${base}?embed=true` : base;
}

export type EmbedSnippetInput = {
  origin: string;
  ownerId: string;
  slug: string;
  title: string;
  iframeHeight?: number;
};

export function buildIframeEmbedCode(input: EmbedSnippetInput): string {
  const height = Math.min(Math.max(input.iframeHeight ?? 650, 200), 4000);
  const src = publicFormUrl(input.origin, input.ownerId, input.slug, true);
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
    `  data-owner-id="${escapeHtmlAttr(input.ownerId)}"`,
    `  data-form-slug="${escapeHtmlAttr(input.slug)}"`,
    `  data-target="${escapeHtmlAttr(targetId)}">`,
    `</script>`,
  ].join("\n");
}
