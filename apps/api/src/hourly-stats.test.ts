import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { persistSubmission, prisma } from "@webform/db";
import { emptyFormDefinition } from "@webform/form-schema";
import { publishForm } from "./services/forms.js";

async function canReachDatabase(): Promise<boolean> {
  if (!process.env.DATABASE_URL) return false;
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

describe("submission persist for Flink analytics", () => {
  const email = `stats-${randomUUID()}@example.com`;
  let ownerId = "";
  let dbReady = false;

  beforeAll(async () => {
    dbReady = await canReachDatabase();
  });

  afterAll(async () => {
    if (ownerId) {
      await prisma.user.delete({ where: { id: ownerId } }).catch(() => undefined);
    }
    await prisma.$disconnect().catch(() => undefined);
  });

  it("stores each submission once and leaves hourly stats to Flink", async ({ skip }) => {
    if (!dbReady) {
      skip("DATABASE_URL not reachable — start Postgres/Supabase to run this test");
    }

    const owner = await prisma.user.create({
      data: {
        email,
        passwordHash: "$2b$10$InvalidPlaceholderHashForTestsOnly000000000000000u",
        name: "Stats Owner",
      },
    });
    ownerId = owner.id;

    const draft = emptyFormDefinition("Signups");
    draft.fields.push({
      id: "fld_email",
      type: "email",
      name: "email",
      label: "Email",
      placeholder: "",
      helpText: "",
      required: true,
      validation: {},
      options: [],
      visibility: { mode: "always" },
    });

    const form = await prisma.form.create({
      data: {
        ownerId,
        title: "Signups",
        slug: `signups-${randomUUID().slice(0, 8)}`,
        draftDefinition: draft,
      },
    });
    const published = await publishForm(form.id, ownerId);

    const firstKey = randomUUID();
    const first = await persistSubmission(prisma, {
      formId: form.id,
      formVersionId: published.version.id,
      payload: { email: "a@example.com" },
      idempotencyKey: firstKey,
    });
    expect(first.stored).toBe(true);
    expect(first.submissionId).toBeTruthy();
    expect(first.formId).toBe(form.id);
    expect(first.submittedAt).toBeInstanceOf(Date);

    // Flink (not the worker) writes form_hourly_stats.
    expect(await prisma.formHourlyStat.count({ where: { formId: form.id } })).toBe(0);

    const replay = await persistSubmission(prisma, {
      formId: form.id,
      formVersionId: published.version.id,
      payload: { email: "a@example.com" },
      idempotencyKey: firstKey,
    });
    expect(replay.stored).toBe(false);
    expect(replay.submissionId).toBe(first.submissionId);
    expect(replay.submittedAt.getTime()).toBe(first.submittedAt.getTime());
    expect(await prisma.formSubmission.count({ where: { formId: form.id } })).toBe(1);

    const second = await persistSubmission(prisma, {
      formId: form.id,
      formVersionId: published.version.id,
      payload: { email: "b@example.com" },
      idempotencyKey: randomUUID(),
    });
    expect(second.stored).toBe(true);
    expect(await prisma.formSubmission.count({ where: { formId: form.id } })).toBe(2);
    expect(await prisma.formHourlyStat.count({ where: { formId: form.id } })).toBe(0);

    await prisma.form.delete({ where: { id: form.id } });
  });
});
