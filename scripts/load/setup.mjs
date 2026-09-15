/**
 * Creates + publishes a minimal form for load testing, prints the slug.
 * Usage: npm run load:setup
 * Requires a seeded user (npm run seed) or set LOAD_EMAIL / LOAD_PASSWORD.
 */
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    base: { type: "string", default: "http://127.0.0.1:3001" },
    slug: { type: "string", default: `load-${Date.now().toString(36)}` },
    title: { type: "string", default: "Load test form" },
    email: { type: "string", default: process.env.LOAD_EMAIL ?? "owner@example.com" },
    password: { type: "string", default: process.env.LOAD_PASSWORD ?? "password123" },
  },
});

const base = (values.base ?? "http://127.0.0.1:3001").replace(/\/$/, "");
const slug = values.slug ?? `load-${Date.now().toString(36)}`;
const title = values.title ?? "Load test form";
const email = values.email ?? "owner@example.com";
const password = values.password ?? "password123";

const signinRes = await fetch(`${base}/api/auth/signin`, {
  method: "POST",
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ email, password }),
});
if (!signinRes.ok) {
  console.error(
    "signin failed",
    signinRes.status,
    await signinRes.text(),
    "\nRun `npm run seed` first, or pass --email / --password.",
  );
  process.exit(1);
}
const { token } = await signinRes.json();
const authHeaders = {
  "content-type": "application/json",
  authorization: `Bearer ${token}`,
};

const createRes = await fetch(`${base}/api/forms`, {
  method: "POST",
  headers: authHeaders,
  body: JSON.stringify({ title, slug }),
});
if (!createRes.ok) {
  console.error("create failed", createRes.status, await createRes.text());
  process.exit(1);
}
const form = await createRes.json();

const definition = {
  schemaVersion: 1,
  meta: { title, description: "Burst load target" },
  settings: { submitLabel: "Send", successMessage: "Thanks." },
  fields: [
    {
      id: "fld_email",
      type: "email",
      name: "email",
      label: "Email",
      placeholder: "",
      helpText: "",
      required: true,
      validation: { maxLength: 254 },
      options: [],
      visibility: { mode: "always" },
    },
  ],
};

const patchRes = await fetch(`${base}/api/forms/${form.id}`, {
  method: "PATCH",
  headers: authHeaders,
  body: JSON.stringify({ draftDefinition: definition }),
});
if (!patchRes.ok) {
  console.error("patch failed", patchRes.status, await patchRes.text());
  process.exit(1);
}

const publishRes = await fetch(`${base}/api/forms/${form.id}/publish`, {
  method: "POST",
  headers: authHeaders,
  body: "{}",
});
if (!publishRes.ok) {
  console.error("publish failed", publishRes.status, await publishRes.text());
  process.exit(1);
}

const published = await publishRes.json();
console.log(JSON.stringify({ slug, formId: form.id, ownerId: published.ownerId ?? form.ownerId, ...published }, null, 2));
const oid = published.ownerId ?? form.ownerId;
console.log(`\nRun measurements (keep requests at or under RATE_LIMIT_PER_MINUTE, or raise that env locally):
  npm run load -- --ownerId=${oid} --slug=${slug} --concurrency=20 --requests=50
  npm run load:recovery -- --ownerId=${oid} --slug=${slug}
  npm run load:volume -- --ownerId=${oid} --slug=${slug}`);
