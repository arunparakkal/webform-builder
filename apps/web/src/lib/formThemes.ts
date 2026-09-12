import type { CSSProperties } from "react";
import type { FormTheme, FormThemeColors } from "@webform/form-schema";
import { DEFAULT_FORM_THEME } from "@webform/form-schema";

export type ThemePreset = { id: string; name: string; colors: FormThemeColors };

export type BackgroundThemePack = {
  id: string;
  name: string;
  previewImage: string;
  pageBackgroundImage: string;
  pageBackgroundOverlay: string;
  colors: FormThemeColors;
  font?: FormTheme["font"];
  radius?: FormTheme["radius"];
  cardShadow?: boolean;
  cardStyle?: NonNullable<FormTheme["cardStyle"]>;
  inputStyle?: NonNullable<FormTheme["inputStyle"]>;
  labelUppercase?: boolean;
  fieldBands?: boolean;
  buttonStyle?: FormTheme["buttonStyle"];
  buttonWidth?: FormTheme["buttonWidth"];
  align?: FormTheme["align"];
  density?: FormTheme["density"];
};

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

/** Full look-and-feel scene themes (background + card + inputs + type). */
export const BACKGROUND_THEME_PACKS: BackgroundThemePack[] = [
  {
    id: "bg-sunset-hair",
    name: "Sunset Hair",
    previewImage:
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb30?auto=format&fit=crop&w=640&q=80",
    pageBackgroundImage:
      "https://images.unsplash.com/photo-1529626455594-4ff0802cfb30?auto=format&fit=crop&w=1600&q=80",
    pageBackgroundOverlay: "rgba(15, 10, 20, 0.25)",
    colors: {
      page: "#1a1020",
      card: "#141018",
      title: "#ffffff",
      text: "#ffffff",
      muted: "#e2e8f0",
      border: "#ffffff",
      input: "#ffffff",
      button: "#7c3aed",
      buttonText: "#ffffff",
    },
    cardStyle: "glass",
    inputStyle: "box",
    radius: "md",
    cardShadow: true,
    buttonStyle: "filled",
  },
  {
    id: "bg-vintage-star",
    name: "Vintage Star",
    previewImage:
      "https://images.unsplash.com/photo-1557683316-973673baf926?auto=format&fit=crop&w=640&q=80",
    pageBackgroundImage: "",
    pageBackgroundOverlay: "",
    colors: {
      page: "#f3eee4",
      card: "#f7f1e6",
      title: "#3f2a1d",
      text: "#3f2a1d",
      muted: "#8a6a55",
      border: "#c4b49a",
      input: "#ffffff",
      button: "#5c4033",
      buttonText: "#ffffff",
    },
    font: "serif",
    cardStyle: "flat",
    inputStyle: "outline",
    radius: "none",
    cardShadow: false,
    align: "center",
  },
  {
    id: "bg-brick-wall",
    name: "Brick Wall",
    previewImage:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=640&q=80",
    pageBackgroundImage:
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1600&q=80",
    pageBackgroundOverlay: "rgba(40, 20, 12, 0.2)",
    colors: {
      page: "#2a1810",
      card: "#2a1810",
      title: "#ffffff",
      text: "#ffffff",
      muted: "#f1e7e0",
      border: "#ffffff",
      input: "#ffffff",
      button: "#ffffff",
      buttonText: "#2a1810",
    },
    cardStyle: "glass",
    inputStyle: "underline",
    radius: "md",
    cardShadow: true,
    buttonStyle: "filled",
  },
  {
    id: "bg-clever-colorful",
    name: "Clever Colorful",
    previewImage:
      "https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&w=640&q=80",
    pageBackgroundImage:
      "https://images.unsplash.com/photo-1557682250-33bd709cbe85?auto=format&fit=crop&w=1600&q=80",
    pageBackgroundOverlay: "rgba(15, 118, 110, 0.2)",
    colors: {
      page: "#0f766e",
      card: "#0f766e",
      title: "#ffffff",
      text: "#ffffff",
      muted: "#e0f2fe",
      border: "#ffffff",
      input: "#ffffff",
      button: "#ea580c",
      buttonText: "#ffffff",
    },
    cardStyle: "flat",
    inputStyle: "box",
    fieldBands: true,
    radius: "xl",
    cardShadow: false,
    buttonStyle: "filled",
  },
  {
    id: "bg-cool-minimal",
    name: "Cool and Minimal",
    previewImage:
      "https://images.unsplash.com/photo-1557683311-eac922347aa1?auto=format&fit=crop&w=640&q=80",
    pageBackgroundImage: "",
    pageBackgroundOverlay: "",
    colors: {
      page: "#5b7c86",
      card: "#5b7c86",
      title: "#ffffff",
      text: "#ffffff",
      muted: "#e2e8f0",
      border: "#ffffff",
      input: "#5b7c86",
      button: "#ffffff",
      buttonText: "#5b7c86",
    },
    cardStyle: "flat",
    inputStyle: "underline",
    labelUppercase: true,
    radius: "none",
    cardShadow: false,
    align: "center",
    density: "comfortable",
    buttonStyle: "filled",
    buttonWidth: "full",
  },
  {
    id: "bg-techy",
    name: "Techy",
    previewImage:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=640&q=80",
    pageBackgroundImage:
      "https://images.unsplash.com/photo-1498050108023-c5249f4df085?auto=format&fit=crop&w=1600&q=80",
    pageBackgroundOverlay: "rgba(15, 23, 42, 0.35)",
    colors: {
      page: "#0f172a",
      card: "#0f172a",
      title: "#ffffff",
      text: "#ffffff",
      muted: "#cbd5e1",
      border: "#e2e8f0",
      input: "#ffffff",
      button: "#2563eb",
      buttonText: "#ffffff",
    },
    cardStyle: "glass",
    inputStyle: "box",
    radius: "md",
    cardShadow: true,
  },
  {
    id: "bg-pet-lover",
    name: "Pet Lover",
    previewImage:
      "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=640&q=80",
    pageBackgroundImage:
      "https://images.unsplash.com/photo-1552053831-71594a27632d?auto=format&fit=crop&w=1600&q=80",
    pageBackgroundOverlay: "rgba(15, 23, 42, 0.15)",
    colors: {
      page: "#1e293b",
      card: "#1e293b",
      title: "#ffffff",
      text: "#ffffff",
      muted: "#e2e8f0",
      border: "#ffffff",
      input: "#1e293b",
      button: "#ffffff",
      buttonText: "#0f172a",
    },
    cardStyle: "glass",
    inputStyle: "outline",
    radius: "xl",
    cardShadow: true,
    buttonStyle: "filled",
  },
  {
    id: "bg-green-nature",
    name: "Green Nature",
    previewImage:
      "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=640&q=80",
    pageBackgroundImage: "",
    pageBackgroundOverlay: "",
    colors: {
      page: "#eef2f6",
      card: "#ffffff",
      title: "#0f172a",
      text: "#1e293b",
      muted: "#64748b",
      border: "#dbe3ee",
      input: "#ffffff",
      button: "#16a34a",
      buttonText: "#ffffff",
    },
    cardStyle: "solid",
    inputStyle: "box",
    radius: "xl",
    cardShadow: true,
    buttonStyle: "filled",
  },
];

export const FIELD_BAND_COLORS = ["#f97316", "#38bdf8", "#84cc16", "#a855f7", "#f43f5e", "#14b8a6"];

export function themeFromPreset(id: string, current: FormTheme): FormTheme {
  const preset = THEME_PRESETS.find((p) => p.id === id);
  if (!preset) return { ...current, presetId: "custom" };
  return {
    ...current,
    presetId: preset.id,
    colors: { ...preset.colors },
    pageBackgroundImage: "",
    pageBackgroundOverlay: "",
    cardStyle: "solid",
    inputStyle: "box",
    labelUppercase: false,
    fieldBands: false,
  };
}

export function themeFromBackgroundPack(id: string, current: FormTheme): FormTheme {
  const pack = BACKGROUND_THEME_PACKS.find((p) => p.id === id);
  if (!pack) return { ...current, presetId: "custom" };
  return {
    ...current,
    presetId: pack.id,
    colors: { ...pack.colors },
    font: pack.font ?? current.font,
    radius: pack.radius ?? current.radius,
    cardShadow: pack.cardShadow ?? current.cardShadow,
    pageBackgroundImage: pack.pageBackgroundImage,
    pageBackgroundOverlay: pack.pageBackgroundOverlay,
    cardStyle: pack.cardStyle ?? "solid",
    inputStyle: pack.inputStyle ?? "box",
    labelUppercase: pack.labelUppercase ?? false,
    fieldBands: pack.fieldBands ?? false,
    buttonStyle: pack.buttonStyle ?? current.buttonStyle,
    buttonWidth: pack.buttonWidth ?? current.buttonWidth,
    align: pack.align ?? current.align,
    density: pack.density ?? current.density,
  };
}

export function pageSurfaceStyle(theme: FormTheme): CSSProperties {
  const image = theme.pageBackgroundImage?.trim();
  // Only allow https backgrounds (blocks javascript:/data: CSS url injection).
  const safeImage = image && image.startsWith("https://") ? image.replace(/["'\\]/g, "") : "";
  if (!safeImage) {
    return { backgroundColor: theme.colors.page };
  }
  const overlay = theme.pageBackgroundOverlay?.trim() || "rgba(15, 23, 42, 0.35)";
  return {
    backgroundColor: theme.colors.page,
    backgroundImage: `linear-gradient(${overlay}, ${overlay}), url("${safeImage}")`,
    backgroundSize: "cover",
    backgroundPosition: "center",
    backgroundRepeat: "no-repeat",
  };
}

export function cardSurfaceStyle(theme: FormTheme): CSSProperties {
  const style = theme.cardStyle ?? "solid";
  if (style === "glass") {
    return {
      background: `color-mix(in srgb, ${theme.colors.card} 72%, transparent)`,
      backdropFilter: "blur(10px)",
      WebkitBackdropFilter: "blur(10px)",
      border: `1px solid color-mix(in srgb, ${theme.colors.border} 55%, transparent)`,
      boxShadow: theme.cardShadow ? "0 18px 40px rgba(0,0,0,0.28)" : "none",
    };
  }
  if (style === "flat") {
    return {
      background: "transparent",
      border: "none",
      boxShadow: "none",
    };
  }
  return {
    background: theme.colors.card,
    border: `1px solid ${theme.colors.border}`,
    boxShadow: theme.cardShadow ? "0 10px 30px rgba(15, 23, 42, 0.08)" : "none",
  };
}

export function inputControlStyle(theme: FormTheme): CSSProperties {
  const style = theme.inputStyle ?? "box";
  const base: CSSProperties = {
    marginTop: "0.35rem",
    width: "100%",
    color: style === "box" ? "#0f172a" : theme.colors.text,
    fontSize: theme.fieldSize === "lg" ? "1.05rem" : theme.fieldSize === "sm" ? "0.875rem" : "0.95rem",
    outline: "none",
  };

  if (style === "underline") {
    return {
      ...base,
      borderRadius: 0,
      border: "none",
      borderBottom: `1.5px solid ${theme.colors.border}`,
      background: "transparent",
      padding: "0.55rem 0.1rem",
    };
  }

  if (style === "outline") {
    return {
      ...base,
      borderRadius: inputRadius(theme.radius),
      border: `1.5px solid ${theme.colors.border}`,
      background: "transparent",
      padding: theme.fieldSize === "lg" ? "0.85rem 1rem" : theme.fieldSize === "sm" ? "0.45rem 0.7rem" : "0.65rem 0.85rem",
    };
  }

  return {
    ...base,
    borderRadius: inputRadius(theme.radius),
    border: `1px solid ${theme.colors.border}`,
    background: theme.colors.input,
    padding: theme.fieldSize === "lg" ? "0.85rem 1rem" : theme.fieldSize === "sm" ? "0.45rem 0.7rem" : "0.65rem 0.85rem",
  };
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
