import { DEFAULT_FORM_THEME, resolveFormTheme, type FormDefinition, type FormTheme } from "@webform/form-schema";
import { THEME_PRESETS, themeFromPreset } from "../lib/formThemes";

type Props = {
  definition: FormDefinition;
  onChange: (definition: FormDefinition) => void;
  onClose: () => void;
};

const COLOR_FIELDS: Array<{ key: keyof FormTheme["colors"]; label: string }> = [
  { key: "page", label: "Page" },
  { key: "card", label: "Form card" },
  { key: "title", label: "Title" },
  { key: "text", label: "Text" },
  { key: "muted", label: "Help text" },
  { key: "border", label: "Borders" },
  { key: "input", label: "Input fill" },
  { key: "button", label: "Button" },
  { key: "buttonText", label: "Button text" },
];

const inputClass =
  "mt-1 w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-2 text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15";

export function FormThemePanel({ definition, onChange, onClose }: Props) {
  const theme = resolveFormTheme(definition.theme);

  function patchTheme(next: FormTheme) {
    onChange({ ...definition, theme: next });
  }

  return (
    <aside className="flex h-full flex-col border-l border-[#E5E7EB] bg-white">
      <div className="flex items-center justify-between border-b border-[#E5E7EB] px-4 py-4">
        <div>
          <p className="text-sm font-semibold text-[#0B1F44]">Form designer</p>
          <p className="text-xs text-[#64748B]">Colors, themes, and layout</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-[#64748B] hover:bg-[#F1F5F9] hover:text-[#0B1F44]"
        >
          Close
        </button>
      </div>

      <div className="flex-1 space-y-6 overflow-y-auto p-4">
        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">Themes</h3>
          <p className="mt-1 text-xs text-[#64748B]">Click a color combination to apply it.</p>
          <div className="mt-3 grid grid-cols-2 gap-2">
            {THEME_PRESETS.map((preset) => {
              const selected = theme.presetId === preset.id;
              return (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => patchTheme(themeFromPreset(preset.id, theme))}
                  className={`rounded-xl border p-2 text-left transition ${
                    selected
                      ? "border-[#2563EB] ring-2 ring-[#2563EB]/20"
                      : "border-[#E5E7EB] hover:border-[#BFDBFE]"
                  }`}
                >
                  <span className="mb-2 flex overflow-hidden rounded-lg">
                    {(["page", "title", "button", "card"] as const).map((k) => (
                      <span key={k} className="h-7 flex-1" style={{ background: preset.colors[k] }} />
                    ))}
                  </span>
                  <span className="text-xs font-medium text-[#0B1F44]">{preset.name}</span>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">Colors</h3>
          <div className="mt-3 space-y-2">
            {COLOR_FIELDS.map((field) => (
              <label key={field.key} className="flex items-center justify-between gap-3 text-sm">
                <span className="text-[#64748B]">{field.label}</span>
                <span className="flex items-center gap-2">
                  <input
                    type="color"
                    className="h-8 w-10 cursor-pointer rounded-lg border border-[#E5E7EB] bg-transparent p-0"
                    value={theme.colors[field.key]}
                    onChange={(e) =>
                      patchTheme({
                        ...theme,
                        presetId: "custom",
                        colors: { ...theme.colors, [field.key]: e.target.value },
                      })
                    }
                  />
                  <input
                    className="w-24 rounded-lg border border-[#E5E7EB] px-2 py-1 font-mono text-xs outline-none focus:border-[#2563EB]"
                    value={theme.colors[field.key]}
                    onChange={(e) =>
                      patchTheme({
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

        <section className="space-y-3 rounded-2xl border border-[#E5E7EB] bg-[#F8FAFC] p-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
            Button &amp; fields
          </h3>
          <label className="flex items-center justify-between gap-3 text-sm">
            <span className="text-[#64748B]">Button color</span>
            <span className="flex items-center gap-2">
              <input
                type="color"
                className="h-8 w-10 cursor-pointer rounded-lg border border-[#E5E7EB] bg-transparent p-0"
                value={theme.colors.button}
                onChange={(e) =>
                  patchTheme({
                    ...theme,
                    presetId: "custom",
                    colors: { ...theme.colors, button: e.target.value },
                  })
                }
              />
            </span>
          </label>
          <label className="flex items-center justify-between gap-3 text-sm">
            <span className="text-[#64748B]">Button text color</span>
            <input
              type="color"
              className="h-8 w-10 cursor-pointer rounded-lg border border-[#E5E7EB] bg-transparent p-0"
              value={theme.colors.buttonText}
              onChange={(e) =>
                patchTheme({
                  ...theme,
                  presetId: "custom",
                  colors: { ...theme.colors, buttonText: e.target.value },
                })
              }
            />
          </label>
          <label className="block text-sm">
            <span className="text-[#64748B]">Button size</span>
            <select
              className={inputClass}
              value={theme.buttonSize}
              onChange={(e) =>
                patchTheme({ ...theme, buttonSize: e.target.value as FormTheme["buttonSize"] })
              }
            >
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-[#64748B]">Button width</span>
            <select
              className={inputClass}
              value={theme.buttonWidth}
              onChange={(e) =>
                patchTheme({ ...theme, buttonWidth: e.target.value as FormTheme["buttonWidth"] })
              }
            >
              <option value="auto">Normal (centered)</option>
              <option value="full">Full width</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-[#64748B]">Field size</span>
            <select
              className={inputClass}
              value={theme.fieldSize}
              onChange={(e) =>
                patchTheme({ ...theme, fieldSize: e.target.value as FormTheme["fieldSize"] })
              }
            >
              <option value="sm">Small</option>
              <option value="md">Medium</option>
              <option value="lg">Large</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-[#64748B]">Submit button style</span>
            <select
              className={inputClass}
              value={theme.buttonStyle}
              onChange={(e) =>
                patchTheme({ ...theme, buttonStyle: e.target.value as FormTheme["buttonStyle"] })
              }
            >
              <option value="filled">Filled</option>
              <option value="outline">Outline</option>
              <option value="soft">Soft</option>
            </select>
          </label>
        </section>

        <section className="space-y-3">
          <h3 className="text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">Style</h3>
          <label className="block text-sm">
            <span className="text-[#64748B]">Font</span>
            <select
              className={inputClass}
              value={theme.font}
              onChange={(e) => patchTheme({ ...theme, font: e.target.value as FormTheme["font"] })}
            >
              <option value="sans">Sans</option>
              <option value="serif">Serif</option>
              <option value="rounded">Rounded</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-[#64748B]">Alignment</span>
            <select
              className={inputClass}
              value={theme.align}
              onChange={(e) => patchTheme({ ...theme, align: e.target.value as FormTheme["align"] })}
            >
              <option value="left">Left</option>
              <option value="center">Center</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-[#64748B]">Corners</span>
            <select
              className={inputClass}
              value={theme.radius}
              onChange={(e) => patchTheme({ ...theme, radius: e.target.value as FormTheme["radius"] })}
            >
              <option value="none">Square</option>
              <option value="md">Rounded</option>
              <option value="xl">Soft</option>
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-[#64748B]">Spacing</span>
            <select
              className={inputClass}
              value={theme.density}
              onChange={(e) => patchTheme({ ...theme, density: e.target.value as FormTheme["density"] })}
            >
              <option value="comfortable">Comfortable</option>
              <option value="compact">Compact</option>
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-[#0B1F44]">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-[#CBD5E1] text-[#2563EB]"
              checked={theme.showQuestionNumbers}
              onChange={(e) => patchTheme({ ...theme, showQuestionNumbers: e.target.checked })}
            />
            Number questions
          </label>
          <label className="flex items-center gap-2 text-sm text-[#0B1F44]">
            <input
              type="checkbox"
              className="h-4 w-4 rounded border-[#CBD5E1] text-[#2563EB]"
              checked={theme.cardShadow}
              onChange={(e) => patchTheme({ ...theme, cardShadow: e.target.checked })}
            />
            Card shadow
          </label>
        </section>

        <button
          type="button"
          className="w-full rounded-xl border border-[#E5E7EB] px-3 py-2.5 text-sm font-medium text-[#64748B] hover:bg-[#F8FAFC]"
          onClick={() => patchTheme({ ...DEFAULT_FORM_THEME, colors: { ...DEFAULT_FORM_THEME.colors } })}
        >
          Reset to Classic
        </button>
      </div>
    </aside>
  );
}
