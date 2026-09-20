import { existsSync, readFileSync } from "node:fs";
import Redis from "ioredis";
import { setTimeout as delay } from "node:timers/promises";
import { persistSubmission } from "@webform/db";
import { emitSubmissionEvent } from "../apps/api/src/submission-events.ts";

const envFile = new URL("../.env", import.meta.url);
if (existsSync(envFile)) {
  for (const rawLine of readFileSync(envFile, "utf8").split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

const { prisma } = await import("@webform/db");
const BASE = "http://127.0.0.1:3001";
const DAY = "2026-09-20";
const redis = new Redis(process.env.REDIS_URL ?? "redis://127.0.0.1:6379");

function utc(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return new Date(Date.UTC(2026, 8, 20, h, m, 0, 0));
}

function hourKey(d) {
  return d.toISOString().slice(0, 16).replace("T", " ");
}

const definition = {
  schemaVersion: 1,
  meta: { title: "Phase 6", description: "" },
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

async function publishForm(token, title, slug) {
  const auth = { "content-type": "application/json", authorization: `Bearer ${token}` };
  const createRes = await fetch(`${BASE}/api/forms`, {
    method: "POST",
    headers: auth,
    body: JSON.stringify({ title, slug }),
  });
  if (!createRes.ok) throw new Error(`create ${slug} ${createRes.status} ${await createRes.text()}`);
  const form = await createRes.json();
  const patchRes = await fetch(`${BASE}/api/forms/${form.id}`, {
    method: "PATCH",
    headers: auth,
    body: JSON.stringify({ draftDefinition: { ...definition, meta: { ...definition.meta, title } } }),
  });
  if (!patchRes.ok) throw new Error(`patch ${slug} ${patchRes.status} ${await patchRes.text()}`);
  const publishRes = await fetch(`${BASE}/api/forms/${form.id}/publish`, {
    method: "POST",
    headers: auth,
    body: "{}",
  });
  if (!publishRes.ok) throw new Error(`publish ${slug} ${publishRes.status} ${await publishRes.text()}`);
  const published = await publishRes.json();
  return {
    formId: form.id,
    formVersionId: published.versionId,
    ownerId: published.ownerId ?? form.ownerId,
    slug,
  };
}

async function timedSubmission(form, submittedAt, email) {
  const persisted = await persistSubmission(prisma, {
    formId: form.formId,
    formVersionId: form.formVersionId,
    payload: { email },
    idempotencyKey: `phase6-${form.slug}-${submittedAt.toISOString()}`,
  });
  await prisma.formSubmission.update({
    where: { id: persisted.submissionId },
    data: { createdAt: submittedAt },
  });
  await emitSubmissionEvent(redis, {
    submissionId: persisted.submissionId,
    formId: persisted.formId,
    submittedAt,
  });
  return { submissionId: persisted.submissionId, formId: persisted.formId, submittedAt };
}

try {
  const signin = await fetch(`${BASE}/api/auth/signin`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ email: "owner@example.com", password: "password123" }),
  });
  if (!signin.ok) throw new Error(`signin ${signin.status} ${await signin.text()}`);
  const { token } = await signin.json();

  const suffix = Date.now().toString(36);
  const formA = await publishForm(token, "Form A", `phase6-a-${suffix}`);
  const formB = await publishForm(token, "Form B", `phase6-b-${suffix}`);
  if (!formA.formVersionId || !formB.formVersionId) {
    const a = await prisma.form.findUnique({
      where: { id: formA.formId },
      include: { publishedVersion: true },
    });
    const b = await prisma.form.findUnique({
      where: { id: formB.formId },
      include: { publishedVersion: true },
    });
    formA.formVersionId = a.publishedVersion.id;
    formB.formVersionId = b.publishedVersion.id;
  }
  console.log(JSON.stringify({ step: "forms", formA, formB }));

  const created = [];
  created.push(await timedSubmission(formA, utc("10:05"), "a-1005@example.com"));
  created.push(await timedSubmission(formA, utc("10:10"), "a-1010@example.com"));
  created.push(await timedSubmission(formA, utc("10:30"), "a-1030@example.com"));
  created.push(await timedSubmission(formA, utc("11:05"), "a-1105@example.com"));
  created.push(await timedSubmission(formA, utc("11:20"), "a-1120@example.com"));
  created.push(await timedSubmission(formB, utc("10:15"), "b-1015@example.com"));
  created.push(await timedSubmission(formB, utc("10:25"), "b-1025@example.com"));
  console.log(JSON.stringify({ step: "persisted-and-emitted", created }));

  const expected = {
    [formA.formId]: {
      [`${DAY} 10:00`]: 3,
      [`${DAY} 11:00`]: 2,
    },
    [formB.formId]: {
      [`${DAY} 10:00`]: 2,
    },
  };

  let rows = [];
  for (let i = 0; i < 40; i++) {
    rows = await prisma.formHourlyStat.findMany({
      where: { formId: { in: [formA.formId, formB.formId] } },
      orderBy: [{ formId: "asc" }, { windowStart: "asc" }],
    });
    const actual = {};
    for (const r of rows) {
      const start = hourKey(r.windowStart).slice(0, 16);
      actual[r.formId] ??= {};
      actual[r.formId][start] = Number(r.submissionCount);
    }
    const a10 = actual[formA.formId]?.[`${DAY} 10:00`];
    const a11 = actual[formA.formId]?.[`${DAY} 11:00`];
    const b10 = actual[formB.formId]?.[`${DAY} 10:00`];
    if (a10 === 3 && a11 === 2 && b10 === 2) {
      console.log(JSON.stringify({ step: "hourly", matchedAtSec: i, actual, rows }));
      break;
    }
    if (i === 39) {
      console.log(JSON.stringify({ step: "hourly-timeout", actual, rows, expected }));
    }
    await delay(1000);
  }

  const aRows = rows.filter((r) => r.formId === formA.formId);
  const bRows = rows.filter((r) => r.formId === formB.formId);
  const a10 = aRows.find((r) => hourKey(r.windowStart).startsWith(`${DAY} 10:00`));
  const a11 = aRows.find((r) => hourKey(r.windowStart).startsWith(`${DAY} 11:00`));
  const b10 = bRows.find((r) => hourKey(r.windowStart).startsWith(`${DAY} 10:00`));
  const mixed =
    Number(a10?.submissionCount ?? 0) === 5 ||
    Number(b10?.submissionCount ?? 0) === 5 ||
    bRows.some((r) => hourKey(r.windowStart).startsWith(`${DAY} 11:00`));

  const result = {
    formA: {
      id: formA.formId,
      "10:00-11:00": Number(a10?.submissionCount ?? 0),
      "11:00-12:00": Number(a11?.submissionCount ?? 0),
      windows: aRows.map((r) => ({
        start: r.windowStart,
        end: r.windowEnd,
        count: r.submissionCount.toString(),
      })),
    },
    formB: {
      id: formB.formId,
      "10:00-11:00": Number(b10?.submissionCount ?? 0),
      "11:00-12:00": bRows
        .filter((r) => hourKey(r.windowStart).startsWith(`${DAY} 11:00`))
        .map((r) => Number(r.submissionCount))[0] ?? 0,
      windows: bRows.map((r) => ({
        start: r.windowStart,
        end: r.windowEnd,
        count: r.submissionCount.toString(),
      })),
    },
    formsMixed: mixed,
    pass:
      Number(a10?.submissionCount ?? 0) === 3 &&
      Number(a11?.submissionCount ?? 0) === 2 &&
      Number(b10?.submissionCount ?? 0) === 2 &&
      !mixed &&
      bRows.every((r) => r.formId === formB.formId) &&
      aRows.every((r) => r.formId === formA.formId),
  };
  console.log(JSON.stringify({ step: "result", ...result }, null, 2));
  if (!result.pass) process.exit(2);
} finally {
  await redis.quit().catch(() => undefined);
  await prisma.$disconnect().catch(() => undefined);
}
