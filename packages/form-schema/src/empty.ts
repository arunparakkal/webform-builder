import type { FormDefinitionV1 } from "./types.js";
import { DEFAULT_FORM_THEME } from "./theme.js";

export function emptyFormDefinition(title = "Untitled form"): FormDefinitionV1 {
  return {
    schemaVersion: 1,
    meta: {
      title,
      description: "",
    },
    settings: {
      submitLabel: "Submit",
      successMessage: "Thanks for your submission.",
    },
    theme: { ...DEFAULT_FORM_THEME, colors: { ...DEFAULT_FORM_THEME.colors } },
    fields: [],
  };
}
