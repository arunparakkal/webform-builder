import { existsSync, readFileSync, writeFileSync } from "node:fs";
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
const STATE_FILE = "D:/tmp/phase7-state.json";
const redis = new Redis(process.env.REDIS_URL ?? "redis://127.0.0.1:6379");
const mode = process.argv[2] ?? "seed";

const definition = {
  schemaVersion: 1,
  meta: { title: "Phase 7 crash", description: "" },
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

async function flinkCheckpoints() {
  const jobs = await fetch("http://127.0.0.1:8081/jobs").then((r) => r.json());
  const job = jobs.jobs?.[0];
  if (!job) return { job: null };
  const checkpoints = await fetch(`http://127.0.0.1:8081/jobs/${job.id}/checkpoints`).then((r) =>
    r.json(),
  );
  return { job, checkpoints };
}

async function hourlyCount(formId) {
  const rows = await prisma.formHourlyStat.findMany({
    where: { formId },
    orderBy: { windowStart: "asc" },
  });
  return rows.map((r) => ({
    windowStart: r.windowStart.toISOString(),
    windowEnd: r.windowEnd.toISOString(),
    submissionCount: Number(r.submissionCount),
  }));
}

async function emitMany(form, count, startAt, emailPrefix) {
  const created = [];
  for (let i = 0; i < count; i++) {
    const submittedAt = new Date(startAt.getTime() + i * 1000);
    const persisted = await persistSubmission(prisma, {
      formId: form.formId,
      formVersionId: form.formVersionId,
      payload: { email: `${emailPrefix}-${i}@example.com` },
      idempotencyKey: `phase7-${form.slug}-${submittedAt.toISOString()}`,
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
    created.push(persisted.submissionId);
  }
  return created;
}

async function waitForCount(formId, expected, seconds) {
  for (let i = 0; i < seconds; i++) {
    const rows = await hourlyCount(formId);
    const total = rows.reduce((s, r) => s + r.submissionCount, 0);
    if (total === expected) return { ok: true, seconds: i, rows, total };
    await delay(1000);
  }
  const rows = await hourlyCount(formId);
  return { ok: false, rows, total: rows.reduce((s, r) => s + r.submissionCount, 0) };
}

try {
  if (mode === "seed") {
    const signin = await fetch(`${BASE}/api/auth/signin`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "owner@example.com", password: "password123" }),
    });
    if (!signin.ok) throw new Error(`signin ${signin.status} ${await signin.text()}`);
    const { token } = await signin.json();
    const auth = { "content-type": "application/json", authorization: `Bearer ${token}` };
    const slug = `phase7-${Date.now().toString(36)}`;
    const createRes = await fetch(`${BASE}/api/forms`, {
      method: "POST",
      headers: auth,
      body: JSON.stringify({ title: "Phase 7 crash", slug }),
    });
    if (!createRes.ok) throw new Error(`create ${createRes.status} ${await createRes.text()}`);
    const formRow = await createRes.json();
    const patchRes = await fetch(`${BASE}/api/forms/${formRow.id}`, {
      method: "PATCH",
      headers: auth,
      body: JSON.stringify({ draftDefinition: definition }),
    });
    if (!patchRes.ok) throw new Error(`patch ${patchRes.status} ${await patchRes.text()}`);
    const publishRes = await fetch(`${BASE}/api/forms/${formRow.id}/publish`, {
      method: "POST",
      headers: auth,
      body: "{}",
    });
    if (!publishRes.ok) throw new Error(`publish ${publishRes.status} ${await publishRes.text()}`);
    const published = await publishRes.json();
    const form = {
      formId: formRow.id,
      formVersionId: published.versionId,
      slug,
    };
    const startAt = new Date("2026-09-20T14:00:00.000Z");
    const beforeLen = Number(await redis.xlen("submission-events"));
    const ids = await emitMany(form, 50, startAt, "p7a");
    const afterLen = Number(await redis.xlen("submission-events"));
    const agg = await waitForCount(form.formId, 50, 40);
    let checkpoint = null;
    for (let i = 0; i < 25; i++) {
      const info = await flinkCheckpoints();
      const completed = info.checkpoints?.latest?.completed;
      if (completed && Number(info.checkpoints.counts?.completed) >= 1) {
        checkpoint = {
          jobId: info.job.id,
          checkpointId: completed.id,
          externalPath: completed.external_path,
          completedCount: info.checkpoints.counts.completed,
          restoredCount: info.checkpoints.counts.restored,
        };
        break;
      }
      await delay(1000);
    }
    const state = {
      form,
      preCrashCount: agg.total,
      preCrashRows: agg.rows,
      checkpoint,
      streamBefore: beforeLen,
      streamAfter: afterLen,
      submissionIds: ids.length,
    };
    writeFileSync(STATE_FILE, JSON.stringify(state, null, 2));
    console.log(JSON.stringify({ step: "seed", ok: agg.ok, ...state }, null, 2));
    if (!agg.ok) process.exit(2);
    if (!checkpoint) process.exit(3);
  } else if (mode === "after-restart") {
    const state = JSON.parse(readFileSync(STATE_FILE, "utf8"));
    const info = await flinkCheckpoints();
    const restored = info.checkpoints?.latest?.restored;
    const still = await hourlyCount(state.form.formId);
    const stillTotal = still.reduce((s, r) => s + r.submissionCount, 0);
    console.log(
      JSON.stringify({
        step: "after-restart-before-new-events",
        jobId: info.job?.id,
        restored,
        restoredCount: info.checkpoints?.counts?.restored,
        hourlyStill: still,
        stillTotal,
        preCrashCount: state.preCrashCount,
      }, null, 2),
    );
    const startAt = new Date("2026-09-20T14:00:50.000Z");
    await emitMany(state.form, 25, startAt, "p7b");
    const agg = await waitForCount(state.form.formId, 75, 40);
    const result = {
      step: "final",
      restoredFromCheckpoint: Boolean(restored) || Number(info.checkpoints?.counts?.restored) > 0,
      restored,
      preCrashCount: state.preCrashCount,
      afterRestartBeforeNew: stillTotal,
      finalCount: agg.total,
      finalRows: agg.rows,
      expectedFinal: 75,
      stateNotLost: stillTotal === state.preCrashCount,
      didNotResetToOnlyNewEvents: agg.total !== 25,
      pass:
        stillTotal === 50 &&
        agg.total === 75 &&
        agg.rows.length === 1 &&
        agg.rows[0].submissionCount === 75,
    };
    console.log(JSON.stringify(result, null, 2));
    if (!result.pass) process.exit(2);
  } else {
    throw new Error(`unknown mode ${mode}`);
  }
} finally {
  await redis.quit().catch(() => undefined);
  await prisma.$disconnect().catch(() => undefined);
}
