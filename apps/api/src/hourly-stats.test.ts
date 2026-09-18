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

describe("hourly submission aggregation", () => {
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

  it("counts each submission once, even when the job is replayed", async ({ skip }) => {
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

    const buckets = await prisma.formHourlyStat.findMany({ where: { formId: form.id } });
    expect(buckets).toHaveLength(1);
    expect(Number(buckets[0]!.submissionCount)).toBe(1);

    // Window bounds must be exactly one hour and align to the stored row's hour.
    const bucket = buckets[0]!;
    expect(bucket.windowEnd.getTime() - bucket.windowStart.getTime()).toBe(3_600_000);
    const stored = await prisma.formSubmission.findUniqueOrThrow({
      where: { idempotencyKey: firstKey },
    });
    expect(stored.createdAt.getTime()).toBeGreaterThanOrEqual(bucket.windowStart.getTime());
    expect(stored.createdAt.getTime()).toBeLessThan(bucket.windowEnd.getTime());

    // Replaying the same job must not insert a row or bump the count.
    const replay = await persistSubmission(prisma, {
      formId: form.id,
      formVersionId: published.version.id,
      payload: { email: "a@example.com" },
      idempotencyKey: firstKey,
    });
    expect(replay.stored).toBe(false);

    expect(await prisma.formSubmission.count({ where: { formId: form.id } })).toBe(1);
    const afterReplay = await prisma.formHourlyStat.findMany({ where: { formId: form.id } });
    expect(afterReplay).toHaveLength(1);
    expect(Number(afterReplay[0]!.submissionCount)).toBe(1);

    // A genuinely new submission in the same hour increments the same bucket.
    const second = await persistSubmission(prisma, {
      formId: form.id,
      formVersionId: published.version.id,
      payload: { email: "b@example.com" },
      idempotencyKey: randomUUID(),
    });
    expect(second.stored).toBe(true);

    const afterSecond = await prisma.formHourlyStat.findMany({ where: { formId: form.id } });
    expect(afterSecond).toHaveLength(1);
    expect(Number(afterSecond[0]!.submissionCount)).toBe(2);
    expect(afterSecond[0]!.updatedAt.getTime()).toBeGreaterThanOrEqual(
      bucket.updatedAt.getTime(),
    );

    // Crash mid-stream: persist + count is one transaction. If the job is replayed
    // after a worker death, both tables stay at the same totals.
    const crashKey = randomUUID();
    const beforeCrashRows = await prisma.formSubmission.count({ where: { formId: form.id } });
    await persistSubmission(prisma, {
      formId: form.id,
      formVersionId: published.version.id,
      payload: { email: "c@example.com" },
      idempotencyKey: crashKey,
    });
    const afterCrash = await persistSubmission(prisma, {
      formId: form.id,
      formVersionId: published.version.id,
      payload: { email: "c@example.com" },
      idempotencyKey: crashKey,
    });
    expect(afterCrash.stored).toBe(false);
    expect(await prisma.formSubmission.count({ where: { formId: form.id } })).toBe(
      beforeCrashRows + 1,
    );
    expect(Number((await prisma.formHourlyStat.findMany({ where: { formId: form.id } }))[0]!.submissionCount)).toBe(3);

    // Deleting the form cascades the aggregates away.
    await prisma.form.delete({ where: { id: form.id } });
    expect(await prisma.formHourlyStat.count({ where: { formId: form.id } })).toBe(0);
  });
});
