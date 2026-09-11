/**
 * Creates + publishes a minimal form for load testing, prints the slug.
 * Usage: npm run load:setup
 */
import { parseArgs } from "node:util";

const { values } = parseArgs({
  options: {
    base: { type: "string", default: "http://127.0.0.1:3001" },
    slug: { type: "string", default: `load-${Date.now().toString(36)}` },
    title: { type: "string", default: "Load test form" },
  },
});

const base = (values.base ?? "http://127.0.0.1:3001").replace(/\/$/, "");
const slug = values.slug ?? `load-${Date.now().toString(36)}`;
const title = values.title ?? "Load test form";

const createRes = await fetch(`${base}/api/forms`, {
  method: "POST",
  headers: { "content-type": "application/json" },
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
  headers: { "content-type": "application/json" },
  body: JSON.stringify({ draftDefinition: definition }),
});
if (!patchRes.ok) {
  console.error("patch failed", patchRes.status, await patchRes.text());
  process.exit(1);
}

const publishRes = await fetch(`${base}/api/forms/${form.id}/publish`, {
  method: "POST",
});
if (!publishRes.ok) {
  console.error("publish failed", publishRes.status, await publishRes.text());
  process.exit(1);
}

const published = await publishRes.json();
console.log(JSON.stringify({ slug, formId: form.id, ...published }, null, 2));
console.log(`\nRun burst:\n  npm run load -- --slug=${slug} --concurrency=40 --requests=200`);
