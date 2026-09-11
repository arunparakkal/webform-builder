export const FIELD_TYPES = [
  "text",
  "email",
  "number",
  "textarea",
  "select",
  "multiselect",
  "radio",
  "checkbox",
  "date",
] as const;

export type FieldType = (typeof FIELD_TYPES)[number];

export type Visibility =
  | { mode: "always" }
  | {
      mode: "when";
      fieldId: string;
      operator: "eq" | "neq";
      value: string;
    };

export type FieldOption = {
  id: string;
  label: string;
  value: string;
};

export type FieldValidation = {
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
};

export type FormField = {
  id: string;
  type: FieldType;
  name: string;
  label: string;
  placeholder: string;
  helpText: string;
  required: boolean;
  validation: FieldValidation;
  options: FieldOption[];
  visibility: Visibility;
};

export type FormDefinitionV1 = {
  schemaVersion: 1;
  meta: {
    title: string;
    description: string;
  };
  settings: {
    submitLabel: string;
    successMessage: string;
  };
  fields: FormField[];
};

export type FormDefinition = FormDefinitionV1;

export type SubmissionPayload = Record<string, unknown>;
