import { describe, expect, it } from "vitest";
import { formDefinitionSchema } from "./definition.js";
import { emptyFormDefinition } from "./empty.js";
import { parseSubmission } from "./submission.js";
import type { FormDefinitionV1 } from "./types.js";
import { isFieldVisible } from "./visibility.js";

const baseDefinition: FormDefinitionV1 = {
  schemaVersion: 1,
  meta: { title: "Lead form", description: "" },
  settings: { submitLabel: "Send", successMessage: "Thanks." },
  fields: [
    {
      id: "fld_email",
      type: "email",
      name: "email",
      label: "Email",
      placeholder: "",
      helpText: "Work email",
      required: true,
      validation: { maxLength: 254 },
      options: [],
      visibility: { mode: "always" },
    },
    {
      id: "fld_plan",
      type: "select",
      name: "plan",
      label: "Plan",
      placeholder: "",
      helpText: "",
      required: true,
      validation: {},
      options: [
        { id: "opt_basic", label: "Basic", value: "basic" },
        { id: "opt_other", label: "Other", value: "other" },
      ],
      visibility: { mode: "always" },
    },
    {
      id: "fld_details",
      type: "text",
      name: "details",
      label: "Details",
      placeholder: "",
      helpText: "Tell us more",
      required: true,
      validation: { minLength: 3 },
      options: [],
      visibility: {
        mode: "when",
        fieldId: "fld_plan",
        operator: "eq",
        value: "other",
      },
    },
  ],
};

describe("formDefinitionSchema", () => {
  it("accepts a valid dynamic definition", () => {
    const result = formDefinitionSchema.safeParse(baseDefinition);
    expect(result.success).toBe(true);
  });

  it("rejects duplicate field names", () => {
    const bad = structuredClone(baseDefinition);
    bad.fields[1]!.name = "email";
    const result = formDefinitionSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("rejects show-if that references a missing field", () => {
    const bad = structuredClone(baseDefinition);
    bad.fields[2]!.visibility = {
      mode: "when",
      fieldId: "fld_missing",
      operator: "eq",
      value: "x",
    };
    const result = formDefinitionSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });

  it("rejects select without options", () => {
    const bad = structuredClone(baseDefinition);
    bad.fields[1]!.options = [];
    const result = formDefinitionSchema.safeParse(bad);
    expect(result.success).toBe(false);
  });
});

describe("submissionSchemaFrom (server validation from a dynamic definition)", () => {
  it("accepts a valid payload when the conditional field is hidden", () => {
    const result = parseSubmission(baseDefinition, {
      email: "a@b.com",
      plan: "basic",
    });
    expect(result.success).toBe(true);
  });

  it("requires the conditional field when its rule matches", () => {
    const result = parseSubmission(baseDefinition, {
      email: "a@b.com",
      plan: "other",
    });
    expect(result.success).toBe(false);
  });

  it("accepts the conditional field when visible and valid", () => {
    const result = parseSubmission(baseDefinition, {
      email: "a@b.com",
      plan: "other",
      details: "Need enterprise",
    });
    expect(result.success).toBe(true);
  });

  it("rejects a hidden conditional field if it is still sent", () => {
    const result = parseSubmission(baseDefinition, {
      email: "a@b.com",
      plan: "basic",
      details: "should not be here",
    });
    expect(result.success).toBe(false);
  });

  it("rejects invalid email from the definition rules", () => {
    const result = parseSubmission(baseDefinition, {
      email: "not-an-email",
      plan: "basic",
    });
    expect(result.success).toBe(false);
  });

  it("rejects unknown keys (never trust the client)", () => {
    const result = parseSubmission(baseDefinition, {
      email: "a@b.com",
      plan: "basic",
      hacker: "1",
    });
    expect(result.success).toBe(false);
  });

  it("rejects option values not in the definition", () => {
    const result = parseSubmission(baseDefinition, {
      email: "a@b.com",
      plan: "enterprise",
    });
    expect(result.success).toBe(false);
  });
});

describe("isFieldVisible", () => {
  it("hides details unless plan is other", () => {
    const details = baseDefinition.fields[2]!;
    expect(isFieldVisible(details, baseDefinition, { plan: "basic" })).toBe(false);
    expect(isFieldVisible(details, baseDefinition, { plan: "other" })).toBe(true);
  });
});

describe("emptyFormDefinition", () => {
  it("produces a schemaVersion 1 draft that validates", () => {
    const draft = emptyFormDefinition("Newsletter");
    expect(formDefinitionSchema.safeParse(draft).success).toBe(true);
  });
});
