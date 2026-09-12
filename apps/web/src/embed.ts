/**
 * Lightweight customer-site embed loader.
 * Reads data-owner-id + data-form-slug + data-target from its own <script> tag and mounts an iframe
 * pointing at /f/:ownerId/:slug?embed=true on this origin.
 */
(() => {
  const current = document.currentScript as HTMLScriptElement | null;
  if (!current) return;

  const ownerId = (current.getAttribute("data-owner-id") || "").trim();
  const slug = (current.getAttribute("data-form-slug") || "").trim();
  const targetId = (current.getAttribute("data-target") || "").trim();
  const origin = new URL(current.src).origin;

  const ownerOk =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(ownerId);
  const slugOk = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
  if (!ownerOk || !slugOk || !targetId) return;

  const target = document.getElementById(targetId);
  if (!target) return;
  if (target.querySelector("iframe[data-webform-embed]")) return;

  const iframe = document.createElement("iframe");
  iframe.src = `${origin}/f/${encodeURIComponent(ownerId)}/${encodeURIComponent(slug)}?embed=true`;
  iframe.width = "100%";
  iframe.height = "650";
  iframe.style.border = "0";
  iframe.loading = "lazy";
  iframe.title = `Webform ${slug}`;
  iframe.setAttribute("data-webform-embed", "1");
  target.appendChild(iframe);
})();
