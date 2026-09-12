/**
 * Lightweight customer-site embed loader.
 * Reads data-form-slug + data-target from its own <script> tag and mounts an iframe
 * pointing at /f/:slug?embed=true on this origin.
 */
(function webformEmbed() {
  const current = document.currentScript as HTMLScriptElement | null;
  if (!current) return;

  const slug = (current.getAttribute("data-form-slug") || "").trim();
  const targetId = (current.getAttribute("data-target") || "").trim();
  const heightAttr = (current.getAttribute("data-height") || "").trim();
  const height = Math.min(Math.max(Number(heightAttr) || 650, 200), 4000);

  const slugOk = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(slug);
  if (!slugOk || !targetId) return;

  const target = document.getElementById(targetId);
  if (!target) return;

  if (target.querySelector("iframe[data-webform-embed]")) return;

  let origin = "";
  try {
    origin = new URL(current.src).origin;
  } catch {
    origin = window.location.origin;
  }

  const iframe = document.createElement("iframe");
  iframe.setAttribute("data-webform-embed", "1");
  iframe.src = `${origin}/f/${encodeURIComponent(slug)}?embed=true`;
  iframe.width = "100%";
  iframe.height = String(height);
  iframe.loading = "lazy";
  iframe.title = `Webform ${slug}`;
  iframe.style.border = "0";
  iframe.style.width = "100%";
  iframe.setAttribute("referrerpolicy", "no-referrer-when-downgrade");

  target.appendChild(iframe);
})();
