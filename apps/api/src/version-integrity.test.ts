import { randomUUID } from "node:crypto";
import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { prisma } from "@webform/db";
import {
  emptyFormDefinition,
  formDefinitionSchema,
  type FormDefinition,
} from "@webform/form-schema";
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

describe("submission integrity under form-version change", () => {
  const email = `test-${randomUUID()}@example.com`;
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

  it("keeps old submissions tied to the old immutable revision after republish", async ({
    skip,
  }) => {
    if (!dbReady) {
      skip("DATABASE_URL not reachable — start Postgres/Supabase to run this test");
    }

    const owner = await prisma.user.create({
      data: {
        email,
        passwordHash: "$2b$10$InvalidPlaceholderHashForTestsOnly000000000000000u",
        name: "Test Owner",
      },
    });
    ownerId = owner.id;

    const draftV1 = emptyFormDefinition("Contact");
    draftV1.fields.push({
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
        title: "Contact",
        slug: `contact-${randomUUID().slice(0, 8)}`,
        draftDefinition: draftV1,
      },
    });

    const published1 = await publishForm(form.id, ownerId);
    expect(published1.version.revision).toBe(1);

    const submission = await prisma.formSubmission.create({
      data: {
        formId: form.id,
        formVersionId: published1.version.id,
        payload: { email: "old@example.com" },
        idempotencyKey: randomUUID(),
      },
    });

    const draftV2 = structuredClone(draftV1) as FormDefinition;
    draftV2.fields.push({
      id: "fld_phone",
      type: "text",
      name: "phone",
      label: "Phone",
      placeholder: "",
      helpText: "",
      required: false,
      validation: {},
      options: [],
      visibility: { mode: "always" },
    });
    draftV2.meta.title = "Contact v2";

    await prisma.form.update({
      where: { id: form.id },
      data: { draftDefinition: draftV2 },
    });

    const published2 = await publishForm(form.id, ownerId);
    expect(published2.version.revision).toBe(2);
    expect(published2.version.id).not.toBe(published1.version.id);

    const stored = await prisma.formSubmission.findUniqueOrThrow({
      where: { id: submission.id },
      include: { formVersion: true },
    });

    expect(stored.formVersionId).toBe(published1.version.id);
    expect(stored.formVersion.revision).toBe(1);

    const frozen = formDefinitionSchema.parse(stored.formVersion.definition) as FormDefinition;
    expect(frozen.fields.map((f) => f.name)).toEqual(["email"]);
    expect(frozen.fields.some((f) => f.name === "phone")).toBe(false);

    const live = await prisma.formVersion.findUniqueOrThrow({
      where: { id: published2.version.id },
    });
    const liveDef = formDefinitionSchema.parse(live.definition) as FormDefinition;
    expect(liveDef.fields.map((f) => f.name)).toEqual(["email", "phone"]);
  });
});
