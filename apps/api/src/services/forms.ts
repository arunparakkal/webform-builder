import {
  emptyFormDefinition,
  formDefinitionSchema,
  type FormDefinition,
} from "@webform/form-schema";
import { prisma } from "@webform/db";

function isUniqueViolation(err: unknown): boolean {
  return Boolean(
    err &&
      typeof err === "object" &&
      "code" in err &&
      (err as { code?: string }).code === "P2002",
  );
}

export async function createForm(ownerId: string, title: string, slug: string) {
  const taken = await prisma.form.findUnique({
    where: { slug },
    select: { id: true },
  });
  if (taken) {
    throw Object.assign(
      new Error(`Slug "${slug}" is already taken. Choose a different slug.`),
      { statusCode: 409 },
    );
  }

  const draft = emptyFormDefinition(title);
  try {
    return await prisma.form.create({
      data: {
        ownerId,
        title,
        slug,
        status: "draft",
        draftDefinition: draft,
      },
    });
  } catch (err) {
    if (isUniqueViolation(err)) {
      throw Object.assign(
        new Error(`Slug "${slug}" is already taken. Choose a different slug.`),
        { statusCode: 409 },
      );
    }
    throw err;
  }
}

export async function publishForm(formId: string, ownerId: string) {
  return prisma.$transaction(async (tx) => {
    const form = await tx.form.findFirst({
      where: { id: formId, ownerId },
    });
    if (!form) {
      throw Object.assign(new Error("Form not found"), { statusCode: 404 });
    }

    const parsed = formDefinitionSchema.safeParse(form.draftDefinition);
    if (!parsed.success) {
      throw Object.assign(new Error(parsed.error.message), { statusCode: 400 });
    }
    const definition = parsed.data as FormDefinition;

    const last = await tx.formVersion.findFirst({
      where: { formId },
      orderBy: { revision: "desc" },
    });
    const revision = (last?.revision ?? 0) + 1;

    const version = await tx.formVersion.create({
      data: {
        formId,
        revision,
        schemaVersion: definition.schemaVersion,
        definition,
      },
    });

    const updated = await tx.form.update({
      where: { id: formId },
      data: {
        status: "published",
        publishedVersionId: version.id,
        title: definition.meta.title,
      },
    });

    return { form: updated, version };
  });
}
