import type { FormDefinition, FormField, SubmissionPayload, Visibility } from "./types.js";

function readComparableValue(payload: SubmissionPayload, field: FormField | undefined): string | undefined {
  if (!field) return undefined;
  const raw = payload[field.name];
  if (raw === undefined || raw === null) return undefined;
  if (Array.isArray(raw)) {
    return raw.map(String).join(",");
  }
  return String(raw);
}

export function isFieldVisible(
  field: FormField,
  definition: FormDefinition,
  payload: SubmissionPayload,
): boolean {
  const rule: Visibility = field.visibility;
  if (rule.mode === "always") return true;

  const controller = definition.fields.find((f) => f.id === rule.fieldId);
  const actual = readComparableValue(payload, controller);
  if (actual === undefined) {
    return rule.operator === "neq";
  }

  const matches = actual === rule.value;
  return rule.operator === "eq" ? matches : !matches;
}
