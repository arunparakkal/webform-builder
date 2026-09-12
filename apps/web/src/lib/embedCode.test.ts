import { describe, expect, it } from "vitest";
import {
  buildIframeEmbedCode,
  buildJavaScriptEmbedCode,
  escapeHtmlAttr,
  getPublicWebOrigin,
  isSafeFormSlug,
  isSafeOwnerId,
  publicFormUrl,
  safeEmbedTargetId,
} from "./embedCode";

const OWNER = "11111111-1111-4111-8111-111111111111";

describe("embedCode helpers", () => {
  it("builds public URLs from origin + ownerId + slug", () => {
    expect(publicFormUrl("https://example.com", OWNER, "contact-us")).toBe(
      `https://example.com/f/${OWNER}/contact-us`,
    );
    expect(publicFormUrl("https://example.com/", OWNER, "contact-us", true)).toBe(
      `https://example.com/f/${OWNER}/contact-us?embed=true`,
    );
  });

  it("prefers VITE_PUBLIC_WEB_URL over window origin", () => {
    expect(getPublicWebOrigin("https://forms.example.com/", "http://localhost:5173")).toBe(
      "https://forms.example.com",
    );
    expect(getPublicWebOrigin(undefined, "http://localhost:5173")).toBe("http://localhost:5173");
  });

  it("validates and sanitizes slugs for target ids", () => {
    expect(isSafeFormSlug("contact-us")).toBe(true);
    expect(isSafeFormSlug("Bad Slug")).toBe(false);
    expect(isSafeOwnerId(OWNER)).toBe(true);
    expect(isSafeOwnerId("not-a-uuid")).toBe(false);
    expect(safeEmbedTargetId("contact-us")).toBe("webform-contact-us");
    expect(safeEmbedTargetId("!!hello!!")).toBe("webform-hello");
  });

  it("escapes HTML attributes in iframe titles", () => {
    expect(escapeHtmlAttr(`Contact "us" & <team>`)).toBe(
      "Contact &quot;us&quot; &amp; &lt;team&gt;",
    );
  });

  it("builds iframe embed markup with embed=true", () => {
    const code = buildIframeEmbedCode({
      origin: "https://example.com",
      ownerId: OWNER,
      slug: "contact-us",
      title: 'Contact "Us"',
      iframeHeight: 700,
    });
    expect(code).toContain(`src="https://example.com/f/${OWNER}/contact-us?embed=true"`);
    expect(code).toContain('height="700"');
    expect(code).toContain('title="Contact &quot;Us&quot;"');
    expect(code).toContain('loading="lazy"');
  });

  it("builds JavaScript embed markup pointing at /embed.js", () => {
    const code = buildJavaScriptEmbedCode({
      origin: "https://example.com",
      ownerId: OWNER,
      slug: "contact-us",
      title: "Contact us",
    });
    expect(code).toContain('<div id="webform-contact-us"></div>');
    expect(code).toContain('src="https://example.com/embed.js"');
    expect(code).toContain(`data-owner-id="${OWNER}"`);
    expect(code).toContain('data-form-slug="contact-us"');
    expect(code).toContain('data-target="webform-contact-us"');
  });
});
