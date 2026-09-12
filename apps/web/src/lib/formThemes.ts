import type { FormTheme, FormThemeColors } from "@webform/form-schema";
import { DEFAULT_FORM_THEME } from "@webform/form-schema";

export type ThemePreset = { id: string; name: string; colors: FormThemeColors };

export const THEME_PRESETS: ThemePreset[] = [
  { id: "classic", name: "Classic", colors: DEFAULT_FORM_THEME.colors },
  {
    id: "ocean",
    name: "Ocean",
    colors: {
      page: "#e8f3fb",
      card: "#ffffff",
      title: "#0b4f8a",
      text: "#12324d",
      muted: "#5b7a90",
      border: "#c5d8e8",
      input: "#ffffff",
      button: "#1570c7",
      buttonText: "#ffffff",
    },
  },
  {
    id: "midnight",
    name: "Midnight",
    colors: {
      page: "#12151c",
      card: "#1c2230",
      title: "#f4f7fb",
      text: "#e4eaf2",
      muted: "#9aa8b8",
      border: "#334155",
      input: "#151a24",
      button: "#60a5fa",
      buttonText: "#0b1220",
    },
  },
  {
    id: "sunset",
    name: "Sunset",
    colors: {
      page: "#fff4ec",
      card: "#ffffff",
      title: "#c2410c",
      text: "#3f2a1d",
      muted: "#8a6a55",
      border: "#f0d4c2",
      input: "#fffaf7",
      button: "#ea580c",
      buttonText: "#ffffff",
    },
  },
  {
    id: "berry",
    name: "Berry",
    colors: {
      page: "#f8eef8",
      card: "#ffffff",
      title: "#6d28d9",
      text: "#2e1065",
      muted: "#7c6a99",
      border: "#e4d4f0",
      input: "#ffffff",
      button: "#7c3aed",
      buttonText: "#ffffff",
    },
  },
  {
    id: "forest",
    name: "Forest",
    colors: {
      page: "#eef6ef",
      card: "#ffffff",
      title: "#166534",
      text: "#14532d",
      muted: "#5b7c66",
      border: "#cde3d2",
      input: "#ffffff",
      button: "#15803d",
      buttonText: "#ffffff",
    },
  },
  {
    id: "sand",
    name: "Sand",
    colors: {
      page: "#f4efe6",
      card: "#fffcf7",
      title: "#8a5a2b",
      text: "#3f3428",
      muted: "#7a6c5d",
      border: "#e4d6c4",
      input: "#ffffff",
      button: "#b45309",
      buttonText: "#ffffff",
    },
  },
  {
    id: "contrast",
    name: "Contrast",
    colors: {
      page: "#111111",
      card: "#1a1a1a",
      title: "#facc15",
      text: "#f5f5f5",
      muted: "#a3a3a3",
      border: "#404040",
      input: "#0a0a0a",
      button: "#facc15",
      buttonText: "#111111",
    },
  },
  {
    id: "sky",
    name: "Sky",
    colors: {
      page: "#f0f9ff",
      card: "#ffffff",
      title: "#0369a1",
      text: "#0c4a6e",
      muted: "#64748b",
      border: "#bae6fd",
      input: "#ffffff",
      button: "#0284c7",
      buttonText: "#ffffff",
    },
  },
  {
    id: "rose",
    name: "Rose",
    colors: {
      page: "#fff1f2",
      card: "#ffffff",
      title: "#be123c",
      text: "#3f1d2b",
      muted: "#9f6b78",
      border: "#fecdd3",
      input: "#fff7f8",
      button: "#e11d48",
      buttonText: "#ffffff",
    },
  },
];

export function themeFromPreset(id: string, current: FormTheme): FormTheme {
  const preset = THEME_PRESETS.find((p) => p.id === id);
  if (!preset) return { ...current, presetId: "custom" };
  return { ...current, presetId: preset.id, colors: { ...preset.colors } };
}

export function fontFamily(font: FormTheme["font"]): string {
  if (font === "serif") return '"Fraunces", Georgia, serif';
  return '"DM Sans", ui-sans-serif, system-ui, sans-serif';
}

export function radiusPx(radius: FormTheme["radius"]): string {
  if (radius === "none") return "0px";
  if (radius === "xl") return "24px";
  return "12px";
}

export function inputRadius(radius: FormTheme["radius"]): string {
  if (radius === "none") return "0px";
  if (radius === "xl") return "14px";
  return "8px";
}
