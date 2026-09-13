import { describe, expect, it } from "vitest";
import { normalizeAiDefinition } from "./ai-forms.js";

describe("normalizeAiDefinition", () => {
  it("fills defaults and validates a contact-style form", () => {
    const definition = normalizeAiDefinition(
      {
        meta: { title: "Contact us", description: "Say hello" },
        settings: { submitLabel: "Send", successMessage: "Thanks!" },
        fields: [
          {
            type: "text",
            name: "full_name",
            label: "Name",
            required: true,
            options: [],
          },
          {
            type: "email",
            label: "Email",
            required: true,
            options: [],
          },
          {
            type: "select",
            label: "Topic",
            required: false,
            options: [
              { label: "Sales", value: "sales" },
              { label: "Support", value: "support" },
            ],
          },
        ],
      },
      "Fallback",
    );

    expect(definition.schemaVersion).toBe(1);
    expect(definition.meta.title).toBe("Contact us");
    expect(definition.fields).toHaveLength(3);
    expect(definition.fields[1]?.name).toMatch(/^[a-z]/);
    expect(definition.fields[2]?.options.length).toBeGreaterThanOrEqual(2);
    expect(definition.theme).toBeDefined();
  });

  it("rejects empty field lists that still parse but have bad types", () => {
    expect(() =>
      normalizeAiDefinition(
        {
          fields: [{ type: "not-a-type", label: "X", options: [] }],
        },
        "Bad",
      ),
    ).toThrow(/invalid/i);
  });
});
