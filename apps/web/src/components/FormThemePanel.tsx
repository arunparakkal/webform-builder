import { useState } from "react";
import { DEFAULT_FORM_THEME, resolveFormTheme, type FormDefinition, type FormTheme } from "@webform/form-schema";
import {
  BACKGROUND_THEME_PACKS,
  THEME_PRESETS,
  themeFromBackgroundPack,
  themeFromPreset,
} from "../lib/formThemes";

type Props = {
  definition: FormDefinition;
  onChange: (definition: FormDefinition) => void;
  onClose: () => void;
};

type DesignerTab = "colors" | "styles" | "themes" | "layout";

const TABS: Array<{ id: DesignerTab; label: string }> = [
  { id: "colors", label: "Colors" },
  { id: "styles", label: "Styles" },
  { id: "themes", label: "Themes" },
  { id: "layout", label: "Layout" },
];

const COLOR_FIELDS: Array<{ key: keyof FormTheme["colors"]; label: string }> = [
  { key: "page", label: "Page background" },
  { key: "card", label: "Form card" },
  { key: "title", label: "Title" },
  { key: "text", label: "Body text" },
  { key: "muted", label: "Help text" },
  { key: "border", label: "Borders" },
  { key: "input", label: "Input fill" },
  { key: "button", label: "Button" },
  { key: "buttonText", label: "Button text" },
];

const selectClass =
  "mt-1.5 w-full rounded-lg border border-white/15 bg-[#1a2332] px-3 py-2 text-sm text-white outline-none focus:border-[#F97316] focus:ring-1 focus:ring-[#F97316]/40";

export function FormThemePanel({ definition, onChange, onClose }: Props) {
  const [tab, setTab] = useState<DesignerTab>("colors");
  const theme = resolveFormTheme(definition.theme);

  function patchTheme(next: FormTheme) {
    onChange({ ...definition, theme: next });
  }

  return (
    <aside className="flex h-full flex-col bg-[#0f1724] text-white">
      <div className="flex items-center justify-between border-b border-white/10 px-4 py-4">
        <p className="text-base font-semibold tracking-tight">Form Designer</p>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg p-1.5 text-white/60 hover:bg-white/10 hover:text-white"
          aria-label="Close form designer"
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
            <path d="M5 5l10 10M15 5 5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </button>
      </div>

      <nav className="flex gap-1 border-b border-white/10 px-2" aria-label="Designer sections">
        {TABS.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`relative flex-1 px-2 py-3 text-[11px] font-semibold uppercase tracking-wider ${
                active ? "text-white" : "text-white/45 hover:text-white/80"
              }`}
            >
              {item.label}
              {active ? (
                <span className="absolute inset-x-2 bottom-0 h-0.5 rounded-full bg-[#F97316]" />
              ) : null}
            </button>
          );
        })}
      </nav>

      <div className="flex-1 overflow-y-auto p-4">
        {tab === "colors" ? <ColorsTab theme={theme} onPatch={patchTheme} /> : null}
        {tab === "styles" ? <StylesTab theme={theme} onPatch={patchTheme} /> : null}
        {tab === "themes" ? <ThemesTab theme={theme} onPatch={patchTheme} /> : null}
        {tab === "layout" ? <LayoutTab theme={theme} onPatch={patchTheme} /> : null}
      </div>

      <div className="border-t border-white/10 p-3">
        <button
          type="button"
          className="w-full rounded-lg border border-white/15 px-3 py-2.5 text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white"
          onClick={() => patchTheme({ ...DEFAULT_FORM_THEME, colors: { ...DEFAULT_FORM_THEME.colors } })}
        >
          Reset to Classic
        </button>
      </div>
    </aside>
  );
}

function ColorsTab({
  theme,
  onPatch,
}: {
  theme: FormTheme;
  onPatch: (next: FormTheme) => void;
}) {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-semibold text-white">Color Scheme</h3>
        <p className="mt-1 text-xs text-white/50">Pick a palette â€” live preview updates instantly.</p>
        <div className="mt-4 grid grid-cols-6 gap-2.5">
          {THEME_PRESETS.map((preset) => {
            const selected = theme.presetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                title={preset.name}
                aria-label={`Apply ${preset.name} colors`}
                aria-pressed={selected}
                onClick={() => onPatch(themeFromPreset(preset.id, theme))}
                className={`relative aspect-square rounded-md transition ${
                  selected ? "ring-2 ring-[#F97316] ring-offset-2 ring-offset-[#0f1724]" : "hover:opacity-90"
                }`}
                style={{ background: preset.colors.border }}
              >
                <span
                  className="absolute inset-[18%] flex items-center justify-center rounded-[3px] text-sm font-bold"
                  style={{ background: preset.colors.card, color: preset.colors.title }}
                >
                  A
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section className="rounded-xl border border-white/10 bg-white/[0.03] p-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-white">Fine-tune colors</h3>
          <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-white/60">
            Extra
          </span>
        </div>
        <p className="mt-1 text-xs text-white/45">Override any part of the scheme after picking a preset.</p>
        <div className="mt-3 space-y-2.5">
          {COLOR_FIELDS.map((field) => (
            <label key={field.key} className="flex items-center justify-between gap-3 text-sm">
              <span className="text-white/65">{field.label}</span>
              <span className="flex items-center gap-2">
                <input
                  type="color"
                  className="h-8 w-9 cursor-pointer rounded border border-white/20 bg-transparent p-0"
                  value={theme.colors[field.key]}
                  onChange={(e) =>
                    onPatch({
                      ...theme,
                      presetId: "custom",
                      colors: { ...theme.colors, [field.key]: e.target.value },
                    })
                  }
                />
                <input
                  className="w-[5.5rem] rounded-md border border-white/15 bg-[#1a2332] px-2 py-1 font-mono text-[11px] text-white/90 outline-none focus:border-[#F97316]"
                  value={theme.colors[field.key]}
                  onChange={(e) =>
                    onPatch({
                      ...theme,
                      presetId: "custom",
                      colors: { ...theme.colors, [field.key]: e.target.value },
                    })
                  }
                />
              </span>
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}

function StylesTab({
  theme,
  onPatch,
}: {
  theme: FormTheme;
  onPatch: (next: FormTheme) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-xs text-white/45">Typography and visual style.</p>
      <label className="block text-sm">
        <span className="text-white/65">Font</span>
        <select
          className={selectClass}
          value={theme.font}
          onChange={(e) => onPatch({ ...theme, font: e.target.value as FormTheme["font"] })}
        >
          <option value="sans">Sans</option>
          <option value="serif">Serif</option>
          <option value="rounded">Rounded</option>
        </select>
      </label>
      <label className="block text-sm">
        <span className="text-white/65">Corners</span>
        <select
          className={selectClass}
          value={theme.radius}
          onChange={(e) => onPatch({ ...theme, radius: e.target.value as FormTheme["radius"] })}
        >
          <option value="none">Square</option>
          <option value="md">Rounded</option>
          <option value="xl">Soft</option>
        </select>
      </label>
      <label className="block text-sm">
        <span className="text-white/65">Submit button style</span>
        <select
          className={selectClass}
          value={theme.buttonStyle}
          onChange={(e) => onPatch({ ...theme, buttonStyle: e.target.value as FormTheme["buttonStyle"] })}
        >
          <option value="filled">Filled</option>
          <option value="outline">Outline</option>
          <option value="soft">Soft</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm text-white/85">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-white/30 bg-[#1a2332] text-[#F97316]"
          checked={theme.cardShadow}
          onChange={(e) => onPatch({ ...theme, cardShadow: e.target.checked })}
        />
        Card shadow
      </label>
    </div>
  );
}

function ThemesTab({
  theme,
  onPatch,
}: {
  theme: FormTheme;
  onPatch: (next: FormTheme) => void;
}) {
  return (
    <div className="space-y-6">
      <section>
        <h3 className="text-sm font-semibold text-white">Scene themes</h3>
        <p className="mt-1 text-xs text-white/45">
          Click a theme to restyle the whole form â€” background, card, inputs, and type.
        </p>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          {BACKGROUND_THEME_PACKS.map((pack) => {
            const selected = theme.presetId === pack.id;
            return (
              <button
                key={pack.id}
                type="button"
                onClick={() => onPatch(themeFromBackgroundPack(pack.id, theme))}
                className={`group relative overflow-hidden rounded-xl border text-left transition ${
                  selected
                    ? "border-[#3B82F6] ring-2 ring-[#3B82F6]/40"
                    : "border-white/10 hover:border-white/25"
                }`}
              >
                <span
                  className="block h-28 bg-cover bg-center"
                  style={{
                    backgroundColor: pack.colors.page,
                    backgroundImage: pack.previewImage
                      ? pack.pageBackgroundImage
                        ? `linear-gradient(${pack.pageBackgroundOverlay || "transparent"}, ${pack.pageBackgroundOverlay || "transparent"}), url(${pack.previewImage})`
                        : `url(${pack.previewImage})`
                      : undefined,
                  }}
                />
                <span className="pointer-events-none absolute inset-x-0 top-0 flex h-28 items-center justify-center bg-[#0f1724]/0 opacity-0 transition group-hover:bg-[#0f1724]/35 group-hover:opacity-100">
                  <span className="rounded-lg bg-[#6366F1] px-3 py-1.5 text-xs font-semibold text-white shadow-lg">
                    Use Theme
                  </span>
                </span>
                {selected ? (
                  <span className="absolute right-2 top-2 flex h-6 w-6 items-center justify-center rounded-full bg-white text-[#2563EB] shadow">
                    â˜…
                  </span>
                ) : null}
                <span className="block bg-white px-2 py-2 text-center text-xs font-semibold text-[#6366F1]">
                  {pack.name}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      <section>
        <h3 className="text-sm font-semibold text-white">Solid color themes</h3>
        <div className="mt-3 grid grid-cols-1 gap-2">
          {THEME_PRESETS.map((preset) => {
            const selected = theme.presetId === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => onPatch(themeFromPreset(preset.id, theme))}
                className={`flex items-center gap-3 rounded-xl border p-2.5 text-left transition ${
                  selected
                    ? "border-[#F97316] bg-[#F97316]/10"
                    : "border-white/10 hover:border-white/25 hover:bg-white/[0.03]"
                }`}
              >
                <span className="flex h-10 w-14 overflow-hidden rounded-md">
                  {(["page", "title", "button", "card"] as const).map((k) => (
                    <span key={k} className="h-full flex-1" style={{ background: preset.colors[k] }} />
                  ))}
                </span>
                <span className="text-sm font-medium text-white">{preset.name}</span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function LayoutTab({
  theme,
  onPatch,
}: {
  theme: FormTheme;
  onPatch: (next: FormTheme) => void;
}) {
  const layout = theme.formLayout ?? "classic";

  return (
    <div className="space-y-5">
      <section>
        <h3 className="text-sm font-semibold text-white">Form layout</h3>
        <p className="mt-1 text-xs text-white/45">Choose how questions are presented.</p>
        <div className="mt-3 grid grid-cols-2 gap-2.5">
          <button
            type="button"
            onClick={() => onPatch({ ...theme, formLayout: "classic" })}
            className={`overflow-hidden rounded-xl border text-left transition ${
              layout === "classic"
                ? "border-[#3B82F6] ring-2 ring-[#3B82F6]/35"
                : "border-white/10 hover:border-white/25"
            }`}
          >
            <span className="flex h-28 flex-col justify-center gap-1.5 bg-[#60a5fa] px-4 py-3">
              <span className="h-2 w-16 rounded bg-white/90" />
              <span className="h-6 rounded bg-white/95" />
              <span className="h-2 w-12 rounded bg-white/80" />
              <span className="h-6 rounded bg-white/95" />
              <span className="mt-1 h-5 w-14 self-end rounded bg-[#22c55e]" />
            </span>
            <span className="block bg-[#dbeafe] px-3 py-2.5">
              <span className="block text-sm font-semibold text-[#1e3a8a]">Classic Form</span>
              <span className="mt-0.5 block text-xs text-[#3b82f6]">All questions on one page</span>
            </span>
          </button>

          <button
            type="button"
            onClick={() => onPatch({ ...theme, formLayout: "card" })}
            className={`overflow-hidden rounded-xl border text-left transition ${
              layout === "card"
                ? "border-[#3B82F6] ring-2 ring-[#3B82F6]/35"
                : "border-white/10 hover:border-white/25"
            }`}
          >
            <span className="flex h-28 flex-col justify-center gap-2 bg-[#38bdf8] px-4 py-3">
              <span className="h-2 w-12 rounded bg-white/90" />
              <span className="h-8 rounded bg-white" />
              <span className="flex items-center justify-between gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded bg-[#16a34a] text-[10px] text-white">
                  â†
                </span>
                <span className="h-1.5 flex-1 rounded-full bg-white/50" />
                <span className="flex h-6 w-6 items-center justify-center rounded bg-[#16a34a] text-[10px] text-white">
                  â†’
                </span>
              </span>
            </span>
            <span className="block bg-white px-3 py-2.5">
              <span className="block text-sm font-semibold text-[#1e3a8a]">Card Form</span>
              <span className="mt-0.5 block text-xs text-[#64748b]">Single question per page</span>
            </span>
          </button>
        </div>
      </section>

      <p className="text-xs text-white/45">Spacing and structure</p>
      <label className="block text-sm">
        <span className="text-white/65">Alignment</span>
        <select
          className={selectClass}
          value={theme.align}
          onChange={(e) => onPatch({ ...theme, align: e.target.value as FormTheme["align"] })}
        >
          <option value="left">Left</option>
          <option value="center">Center</option>
        </select>
      </label>
      <label className="block text-sm">
        <span className="text-white/65">Spacing</span>
        <select
          className={selectClass}
          value={theme.density}
          onChange={(e) => onPatch({ ...theme, density: e.target.value as FormTheme["density"] })}
        >
          <option value="comfortable">Comfortable</option>
          <option value="compact">Compact</option>
        </select>
      </label>
      <label className="block text-sm">
        <span className="text-white/65">Field size</span>
        <select
          className={selectClass}
          value={theme.fieldSize}
          onChange={(e) => onPatch({ ...theme, fieldSize: e.target.value as FormTheme["fieldSize"] })}
        >
          <option value="sm">Small</option>
          <option value="md">Medium</option>
          <option value="lg">Large</option>
        </select>
      </label>
      <label className="block text-sm">
        <span className="text-white/65">Button size</span>
        <select
          className={selectClass}
          value={theme.buttonSize}
          onChange={(e) => onPatch({ ...theme, buttonSize: e.target.value as FormTheme["buttonSize"] })}
        >
          <option value="sm">Small</option>
          <option value="md">Medium</option>
          <option value="lg">Large</option>
        </select>
      </label>
      <label className="block text-sm">
        <span className="text-white/65">Button width</span>
        <select
          className={selectClass}
          value={theme.buttonWidth}
          onChange={(e) => onPatch({ ...theme, buttonWidth: e.target.value as FormTheme["buttonWidth"] })}
        >
          <option value="auto">Normal</option>
          <option value="full">Full width</option>
        </select>
      </label>
      <label className="flex items-center gap-2 text-sm text-white/85">
        <input
          type="checkbox"
          className="h-4 w-4 rounded border-white/30 bg-[#1a2332] text-[#F97316]"
          checked={theme.showQuestionNumbers}
          onChange={(e) => onPatch({ ...theme, showQuestionNumbers: e.target.checked })}
        />
        Number questions
      </label>
    </div>
  );
}
