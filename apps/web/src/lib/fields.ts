import type { FieldType, FormField } from "@webform/form-schema";

const CHOICE_TYPES = new Set<FieldType>(["select", "multiselect", "radio", "checkbox"]);

export function isChoiceType(type: FieldType): boolean {
  return CHOICE_TYPES.has(type);
}

export function createField(type: FieldType = "text"): FormField {
  const id = crypto.randomUUID();
  const short = id.replaceAll("-", "").slice(0, 8);
  return {
    id,
    type,
    name: `field_${short}`,
    label: "New field",
    placeholder: "",
    helpText: "",
    required: false,
    validation: {},
    options: isChoiceType(type)
      ? [{ id: crypto.randomUUID(), label: "Option 1", value: "option_1" }]
      : [],
    visibility: { mode: "always" },
  };
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64);
}

export function formatDate(value: string): string {
  return new Date(value).toLocaleString(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  });
}
