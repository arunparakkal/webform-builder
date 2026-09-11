import { z } from "zod";
import type { FormDefinition, FormField, SubmissionPayload } from "./types.js";
import { isFieldVisible } from "./visibility.js";

function valueSchemaForField(field: FormField): z.ZodTypeAny {
  const { validation } = field;

  switch (field.type) {
    case "text":
    case "textarea": {
      let schema = z.string();
      if (validation.minLength !== undefined) schema = schema.min(validation.minLength);
      if (validation.maxLength !== undefined) schema = schema.max(validation.maxLength);
      return schema;
    }
    case "email": {
      let schema: z.ZodString = z.string().email();
      if (validation.minLength !== undefined) schema = schema.min(validation.minLength);
      if (validation.maxLength !== undefined) schema = schema.max(validation.maxLength);
      return schema;
    }
    case "number": {
      let schema = z.number().finite();
      if (validation.min !== undefined) schema = schema.min(validation.min);
      if (validation.max !== undefined) schema = schema.max(validation.max);
      return schema;
    }
    case "date": {
      return z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");
    }
    case "select":
    case "radio": {
      const values = field.options.map((o) => o.value) as [string, ...string[]];
      return z.enum(values);
    }
    case "multiselect":
    case "checkbox": {
      const values = field.options.map((o) => o.value);
      return z.array(z.string()).refine((arr) => arr.every((v) => values.includes(v)), {
        message: "Contains an invalid option",
      });
    }
    default: {
      const _exhaustive: never = field.type;
      return _exhaustive;
    }
  }
}

/**
 * Builds a Zod schema from a frozen published form definition.
 * Hidden (condition not met) fields are not required and must be omitted.
 * Unknown keys are rejected — never trust the client.
 */
export function submissionSchemaFrom(definition: FormDefinition) {
  return z.record(z.unknown()).superRefine((payload, ctx) => {
    const allowed = new Set<string>();

    for (const field of definition.fields) {
      const visible = isFieldVisible(field, definition, payload);
      if (!visible) {
        if (payload[field.name] !== undefined) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Field "${field.name}" must be omitted when hidden`,
            path: [field.name],
          });
        }
        continue;
      }

      allowed.add(field.name);
      const value = payload[field.name];
      const empty =
        value === undefined ||
        value === null ||
        value === "" ||
        (Array.isArray(value) && value.length === 0);

      if (empty) {
        if (field.required) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `Field "${field.name}" is required`,
            path: [field.name],
          });
        }
        continue;
      }

      const parsed = valueSchemaForField(field).safeParse(value);
      if (!parsed.success) {
        for (const issue of parsed.error.issues) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: issue.message,
            path: [field.name, ...issue.path],
          });
        }
      }
    }

    for (const key of Object.keys(payload)) {
      if (allowed.has(key)) continue;
      const field = definition.fields.find((f) => f.name === key);
      if (!field) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Unknown field "${key}"`,
          path: [key],
        });
      }
    }
  });
}

export function parseSubmission(definition: FormDefinition, payload: unknown) {
  if (payload === null || typeof payload !== "object" || Array.isArray(payload)) {
    return {
      success: false as const,
      error: new z.ZodError([
        {
          code: z.ZodIssueCode.custom,
          message: "Submission must be a JSON object",
          path: [],
        },
      ]),
    };
  }

  const result = submissionSchemaFrom(definition).safeParse(payload);
  if (!result.success) {
    return { success: false as const, error: result.error };
  }
  return { success: true as const, data: payload as SubmissionPayload };
}
