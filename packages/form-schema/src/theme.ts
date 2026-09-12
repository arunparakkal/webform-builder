import type { FormTheme } from "./types.js";

export const DEFAULT_FORM_THEME: FormTheme = {
  presetId: "classic",
  colors: {
    page: "#f3f4f6",
    card: "#ffffff",
    title: "#1a2332",
    text: "#1a2332",
    muted: "#5c6b7a",
    border: "#d8d2c6",
    input: "#ffffff",
    button: "#0f6e56",
    buttonText: "#ffffff",
  },
  font: "sans",
  align: "left",
  radius: "md",
  density: "comfortable",
  fieldSize: "md",
  buttonSize: "md",
  buttonWidth: "auto",
  buttonStyle: "filled",
  showQuestionNumbers: false,
  cardShadow: true,
};

export function resolveFormTheme(theme?: FormTheme | null): FormTheme {
  if (!theme) return { ...DEFAULT_FORM_THEME, colors: { ...DEFAULT_FORM_THEME.colors } };
  return {
    ...DEFAULT_FORM_THEME,
    ...theme,
    colors: { ...DEFAULT_FORM_THEME.colors, ...theme.colors },
    fieldSize: theme.fieldSize ?? DEFAULT_FORM_THEME.fieldSize,
    buttonSize: theme.buttonSize ?? DEFAULT_FORM_THEME.buttonSize,
    buttonWidth: theme.buttonWidth ?? "auto",
  };
}
