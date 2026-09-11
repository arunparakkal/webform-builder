import type { FormDefinitionV1 } from "./types.js";

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
    fields: [],
  };
}
