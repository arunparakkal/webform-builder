import { z } from "zod";
import { FIELD_TYPES } from "./types.js";

const hexColor = z.string().regex(/^#[0-9A-Fa-f]{6}$/, "Color must be a hex value like #0f6e56");

export const formThemeSchema = z.object({
  presetId: z.string().min(1),
  colors: z.object({
    page: hexColor,
    card: hexColor,
    title: hexColor,
    text: hexColor,
    muted: hexColor,
    border: hexColor,
    input: hexColor,
    button: hexColor,
    buttonText: hexColor,
  }),
  font: z.enum(["sans", "serif", "rounded"]),
  align: z.enum(["left", "center"]),
  radius: z.enum(["none", "md", "xl"]),
  density: z.enum(["compact", "comfortable"]),
  fieldSize: z.enum(["sm", "md", "lg"]).default("md"),
  buttonSize: z.enum(["sm", "md", "lg"]).default("md"),
  buttonWidth: z.enum(["auto", "full"]).default("auto"),
  buttonStyle: z.enum(["filled", "outline", "soft"]),
  showQuestionNumbers: z.boolean(),
  cardShadow: z.boolean(),
  pageBackgroundImage: z
    .union([
      z.literal(""),
      z
        .string()
        .url()
        .refine((value) => value.startsWith("https://"), {
          message: "Background image must be an https URL",
        }),
    ])
    .optional(),
  pageBackgroundOverlay: z.string().max(120).optional(),
  cardStyle: z.enum(["solid", "glass", "flat"]).optional().default("solid"),
  inputStyle: z.enum(["box", "underline", "outline"]).optional().default("box"),
  labelUppercase: z.boolean().optional().default(false),
  fieldBands: z.boolean().optional().default(false),
  formLayout: z.enum(["classic", "card"]).optional().default("classic"),
});


const fieldNameSchema = z
  .string()
  .min(1)
  .regex(/^[a-z][a-z0-9_]*$/, "Field name must be snake_case starting with a letter");

const fieldOptionSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  value: z.string().min(1),
});

const fieldValidationSchema = z
  .object({
    minLength: z.number().int().nonnegative().optional(),
    maxLength: z.number().int().positive().optional(),
    min: z.number().optional(),
    max: z.number().optional(),
  })
  .refine(
    (v) =>
      v.minLength === undefined ||
      v.maxLength === undefined ||
      v.minLength <= v.maxLength,
    { message: "minLength cannot exceed maxLength" },
  )
  .refine(
    (v) => v.min === undefined || v.max === undefined || v.min <= v.max,
    { message: "min cannot exceed max" },
  );

const visibilitySchema = z.union([
  z.object({ mode: z.literal("always") }),
  z.object({
    mode: z.literal("when"),
    fieldId: z.string().min(1),
    operator: z.enum(["eq", "neq"]),
    value: z.string(),
  }),
]);

const choiceTypes = new Set(["select", "multiselect", "radio", "checkbox"]);

export const formFieldSchema = z
  .object({
    id: z.string().min(1),
    type: z.enum(FIELD_TYPES),
    name: fieldNameSchema,
    label: z.string().min(1),
    placeholder: z.string(),
    helpText: z.string(),
    required: z.boolean(),
    validation: fieldValidationSchema,
    options: z.array(fieldOptionSchema),
    visibility: visibilitySchema,
  })
  .superRefine((field, ctx) => {
    if (choiceTypes.has(field.type) && field.options.length < 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${field.type} fields require at least one option`,
        path: ["options"],
      });
    }
    if (!choiceTypes.has(field.type) && field.options.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `${field.type} fields must not include options`,
        path: ["options"],
      });
    }
  });

export const formDefinitionSchema = z
  .object({
    schemaVersion: z.literal(1),
    meta: z.object({
      title: z.string().min(1),
      description: z.string(),
    }),
    settings: z.object({
      submitLabel: z.string().min(1),
      successMessage: z.string().min(1),
    }),
    theme: formThemeSchema.optional(),
    fields: z.array(formFieldSchema),
  })
  .superRefine((definition, ctx) => {
    const ids = new Set<string>();
    const names = new Set<string>();

    for (const [index, field] of definition.fields.entries()) {
      if (ids.has(field.id)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate field id: ${field.id}`,
          path: ["fields", index, "id"],
        });
      }
      ids.add(field.id);

      if (names.has(field.name)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Duplicate field name: ${field.name}`,
          path: ["fields", index, "name"],
        });
      }
      names.add(field.name);

      if (field.visibility.mode === "when") {
        const { fieldId } = field.visibility;
        if (fieldId === field.id) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "visibility cannot reference the same field",
            path: ["fields", index, "visibility", "fieldId"],
          });
        } else if (!definition.fields.some((f) => f.id === fieldId)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: `visibility references unknown fieldId: ${fieldId}`,
            path: ["fields", index, "visibility", "fieldId"],
          });
        }
      }
    }
  });

export type ParsedFormDefinition = z.infer<typeof formDefinitionSchema>;
