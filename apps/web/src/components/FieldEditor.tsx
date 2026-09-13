import { FIELD_TYPES, type FieldType, type FormDefinition, type FormField } from "@webform/form-schema";
import { useMemo, useState } from "react";
import { createField, isChoiceType } from "../lib/fields";

type Props = {
  definition: FormDefinition;
  selectedFieldId: string | null;
  onSelectField: (id: string | null) => void;
  onChange: (next: FormDefinition) => void;
};

export const FIELD_META: Record<
  FieldType,
  { label: string; description: string; category: "basic" | "choice" }
> = {
  text: { label: "Text input", description: "Single-line text answer", category: "basic" },
  email: { label: "Email address", description: "Collect a valid email", category: "basic" },
  number: { label: "Number", description: "Numeric values only", category: "basic" },
  textarea: { label: "Textarea", description: "Multi-line long answer", category: "basic" },
  date: { label: "Date picker", description: "Pick a calendar date", category: "basic" },
  select: { label: "Dropdown", description: "Choose one from a list", category: "choice" },
  radio: { label: "Radio buttons", description: "Pick a single option", category: "choice" },
  checkbox: { label: "Checkboxes", description: "Select multiple options", category: "choice" },
  multiselect: { label: "Multi-select", description: "Select many from a list", category: "choice" },
};

type LibraryItem = {
  id: string;
  label: string;
  tone: string;
  type?: FieldType;
  soon?: boolean;
};

const BASIC_ITEMS: LibraryItem[] = [
  { id: "text", label: "Text input", type: "text", tone: "bg-[#EEF2FF] text-[#4F46E5]" },
  { id: "textarea", label: "Textarea", type: "textarea", tone: "bg-[#ECFDF5] text-[#059669]" },
  { id: "number", label: "Number", type: "number", tone: "bg-[#FFF7ED] text-[#EA580C]" },
  { id: "select", label: "Dropdown", type: "select", tone: "bg-[#EFF6FF] text-[#2563EB]" },
  { id: "checkbox", label: "Checkbox", type: "checkbox", tone: "bg-[#F0FDF4] text-[#16A34A]" },
  { id: "radio", label: "Radio buttons", type: "radio", tone: "bg-[#FDF2F8] text-[#DB2777]" },
  { id: "date", label: "Date picker", type: "date", tone: "bg-[#F5F3FF] text-[#7C3AED]" },
  { id: "file", label: "File upload", soon: true, tone: "bg-[#F1F5F9] text-[#64748B]" },
];

const ADVANCED_ITEMS: LibraryItem[] = [
  { id: "email", label: "Email", type: "email", tone: "bg-[#EFF6FF] text-[#2563EB]" },
  { id: "phone", label: "Phone", soon: true, tone: "bg-[#ECFEFF] text-[#0891B2]" },
  { id: "url", label: "URL", soon: true, tone: "bg-[#EEF2FF] text-[#6366F1]" },
  { id: "rating", label: "Rating", soon: true, tone: "bg-[#FFFBEB] text-[#D97706]" },
  { id: "captcha", label: "Captcha", soon: true, tone: "bg-[#F8FAFC] text-[#64748B]" },
  { id: "divider", label: "Divider", soon: true, tone: "bg-[#F1F5F9] text-[#475569]" },
  { id: "heading", label: "Heading", soon: true, tone: "bg-[#FEF3C7] text-[#B45309]" },
  { id: "paragraph", label: "Paragraph", soon: true, tone: "bg-[#F0FDF4] text-[#15803D]" },
  { id: "multiselect", label: "Multi-select", type: "multiselect", tone: "bg-[#EEF2FF] text-[#4F46E5]" },
];

const LAYOUT_ITEMS: LibraryItem[] = [
  { id: "container", label: "Container", soon: true, tone: "bg-[#F8FAFC] text-[#64748B]" },
  { id: "columns", label: "Columns", soon: true, tone: "bg-[#F8FAFC] text-[#64748B]" },
];

export function FieldTypeIcon({ type }: { type: FieldType }) {
  const cls = "h-5 w-5";
  switch (type) {
    case "text":
      return (
        <svg viewBox="0 0 20 20" className={cls} fill="none" aria-hidden="true">
          <path
            d="M5 15V5h3.2c1.8 0 3 1.1 3 2.7 0 1.1-.6 2-1.5 2.4L13 15h-2.2l-2.6-4.4H7.2V15H5Zm2.2-6.2h1c.8 0 1.4-.5 1.4-1.3S9 6.2 8.2 6.2h-1v2.6Z"
            fill="currentColor"
          />
        </svg>
      );
    case "email":
      return (
        <svg viewBox="0 0 20 20" className={cls} fill="none" aria-hidden="true">
          <rect x="3" y="5" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="m4 7 6 4 6-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "number":
      return (
        <svg viewBox="0 0 20 20" className={cls} fill="none" aria-hidden="true">
          <path d="M7 4v12M13 4v12M4 8h12M4 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "textarea":
      return (
        <svg viewBox="0 0 20 20" className={cls} fill="none" aria-hidden="true">
          <rect x="3.5" y="4" width="13" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M6.5 8h7M6.5 11h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "date":
      return (
        <svg viewBox="0 0 20 20" className={cls} fill="none" aria-hidden="true">
          <rect x="3.5" y="4.5" width="13" height="12" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="M3.5 8h13M7 3.5v2M13 3.5v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
    case "select":
      return (
        <svg viewBox="0 0 20 20" className={cls} fill="none" aria-hidden="true">
          <rect x="3.5" y="5" width="13" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
          <path d="m8 9 2 2 2-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case "radio":
      return (
        <svg viewBox="0 0 20 20" className={cls} fill="none" aria-hidden="true">
          <circle cx="10" cy="10" r="5.5" stroke="currentColor" strokeWidth="1.5" />
          <circle cx="10" cy="10" r="2.2" fill="currentColor" />
        </svg>
      );
    case "checkbox":
      return (
        <svg viewBox="0 0 20 20" className={cls} fill="none" aria-hidden="true">
          <rect x="4" y="4" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
          <path d="m7 10 2 2 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    default:
      return (
        <svg viewBox="0 0 20 20" className={cls} fill="none" aria-hidden="true">
          <path d="M5 7h10M5 10h10M5 13h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );
  }
}

function LibraryGlyph({ item }: { item: LibraryItem }) {
  if (item.type) return <FieldTypeIcon type={item.type} />;
  return (
    <svg viewBox="0 0 20 20" className="h-5 w-5" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="12" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
      <path d="M7 10h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-3">
      <span className="text-sm font-medium text-[#0F172A]">{label}</span>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition ${
          checked ? "bg-[#2563EB]" : "bg-[#CBD5E1]"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </label>
  );
}

function ElementGrid({
  items,
  onAdd,
}: {
  items: LibraryItem[];
  onAdd: (type: FieldType) => void;
}) {
  return (
    <div className="grid grid-cols-3 gap-2">
      {items.map((item) => (
        <button
          key={item.id}
          type="button"
          disabled={item.soon || !item.type}
          title={item.soon ? "Coming soon" : `Add ${item.label}`}
          onClick={() => item.type && onAdd(item.type)}
          className="flex flex-col items-center gap-1.5 rounded-xl bg-[#F1F5F9] px-1.5 py-3 text-center transition hover:bg-[#E8EEF5] hover:ring-1 hover:ring-[#BFDBFE] disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span
            className={`flex h-10 w-10 items-center justify-center rounded-lg ${item.tone}`}
          >
            <LibraryGlyph item={item} />
          </span>
          <span className="w-full px-0.5 text-[11px] leading-tight font-medium text-[#334155]">
            {item.label}
            {item.soon ? (
              <span className="mt-0.5 block text-[9px] font-medium text-[#94A3B8]">Soon</span>
            ) : null}
          </span>
        </button>
      ))}
    </div>
  );
}

/** Left column: searchable element palette (mockup layout). */
export function FieldListPanel({ definition, selectedFieldId, onSelectField, onChange }: Props) {
  const [query, setQuery] = useState("");

  function addField(type: FieldType) {
    const field = createField(type);
    field.label = FIELD_META[type].label;
    onChange({ ...definition, fields: [...definition.fields, field] });
    onSelectField(field.id);
  }

  const q = query.trim().toLowerCase();
  const filterItems = (items: LibraryItem[]) =>
    items.filter((item) => !q || item.label.toLowerCase().includes(q) || item.id.includes(q));

  const basic = useMemo(() => filterItems(BASIC_ITEMS), [q]);
  const advanced = useMemo(() => filterItems(ADVANCED_ITEMS), [q]);
  const layout = useMemo(() => filterItems(LAYOUT_ITEMS), [q]);

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="border-b border-[#E5E7EB] px-3 py-3">
        <label className="relative block">
          <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-[#94A3B8]">
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
              <circle cx="9" cy="9" r="5.5" stroke="currentColor" strokeWidth="1.5" />
              <path d="m13.5 13.5 3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </span>
          <input
            className="w-full rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] py-2.5 pr-3 pl-9 text-sm outline-none placeholder:text-[#94A3B8] focus:border-[#2563EB] focus:bg-white focus:ring-2 focus:ring-[#2563EB]/15"
            placeholder="Search elements..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        {selectedFieldId ? (
          <p className="mt-2 text-[11px] text-[#64748B]">
            Tip: click a field in the live preview to edit it.
          </p>
        ) : null}
      </div>

      <div className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
        {basic.length > 0 ? (
          <section>
            <h3 className="mb-2 text-[11px] font-semibold tracking-wide text-[#94A3B8] uppercase">
              Basic elements
            </h3>
            <ElementGrid items={basic} onAdd={addField} />
          </section>
        ) : null}
        {advanced.length > 0 ? (
          <section>
            <h3 className="mb-2 text-[11px] font-semibold tracking-wide text-[#94A3B8] uppercase">
              Advanced elements
            </h3>
            <ElementGrid items={advanced} onAdd={addField} />
          </section>
        ) : null}
        {layout.length > 0 ? (
          <section>
            <h3 className="mb-2 text-[11px] font-semibold tracking-wide text-[#94A3B8] uppercase">
              Layout elements
            </h3>
            <ElementGrid items={layout} onAdd={addField} />
          </section>
        ) : null}
        {basic.length + advanced.length + layout.length === 0 ? (
          <p className="py-8 text-center text-sm text-[#64748B]">No elements match your search.</p>
        ) : null}
      </div>
    </div>
  );
}

type InspectorProps = {
  definition: FormDefinition;
  field: FormField;
  onChange: (next: FormDefinition) => void;
  onRemove?: () => void;
  onBack?: () => void;
};

export function FieldInspector({ definition, field, onChange, onRemove, onBack }: InspectorProps) {
  const [advancedOpen, setAdvancedOpen] = useState(false);

  function updateField(patch: Partial<FormField>) {
    onChange({
      ...definition,
      fields: definition.fields.map((f) => (f.id === field.id ? { ...f, ...patch } : f)),
    });
  }

  function changeType(type: FieldType) {
    const next: FormField = {
      ...field,
      type,
      options: isChoiceType(type)
        ? field.options.length > 0
          ? field.options
          : [{ id: crypto.randomUUID(), label: "Option 1", value: "option_1" }]
        : [],
    };
    updateField(next);
  }

  function updateOption(optionId: string, patch: { label?: string; value?: string }) {
    updateField({
      options: field.options.map((o) => (o.id === optionId ? { ...o, ...patch } : o)),
    });
  }

  function addOption() {
    const n = field.options.length + 1;
    updateField({
      options: [
        ...field.options,
        { id: crypto.randomUUID(), label: `Option ${n}`, value: `option_${n}` },
      ],
    });
  }

  function removeOption(optionId: string) {
    updateField({ options: field.options.filter((o) => o.id !== optionId) });
  }

  const otherFields = definition.fields.filter((f) => f.id !== field.id);
  const meta = FIELD_META[field.type];
  const inputClass =
    "mt-1.5 w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-[#0F172A] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15";

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="flex items-center justify-between gap-2 border-b border-[#E5E7EB] px-4 py-3">
        <button
          type="button"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0F172A] hover:text-[#2563EB]"
          onClick={onBack}
        >
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
            <path d="M12 5 7 10l5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Field settings
        </button>
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#DC2626] hover:text-[#B91C1C]"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
              <path
                d="M7.5 4.5V3.75A1.25 1.25 0 0 1 8.75 2.5h2.5A1.25 1.25 0 0 1 12.5 3.75V4.5M4 5.5h12M8.25 8.5v5M11.75 8.5v5M6.5 5.5l.5 10a1.5 1.5 0 0 0 1.5 1.4h3a1.5 1.5 0 0 0 1.5-1.4l.5-10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Delete field
          </button>
        ) : null}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <div className="flex items-center gap-3 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#2563EB] shadow-sm">
            <FieldTypeIcon type={field.type} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#0F172A]">{meta.label}</p>
            <p className="truncate text-xs text-[#64748B]">{meta.description}</p>
          </div>
        </div>

        <label className="block text-sm">
          <span className="font-medium text-[#0F172A]">
            Field label <span className="text-[#DC2626]">*</span>
          </span>
          <input
            className={inputClass}
            value={field.label}
            onChange={(e) => updateField({ label: e.target.value })}
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-[#0F172A]">
            Field name (snake_case) <span className="text-[#DC2626]">*</span>
          </span>
          <input
            className={`${inputClass} font-mono text-xs`}
            value={field.name}
            onChange={(e) => updateField({ name: e.target.value })}
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-[#0F172A]">Placeholder</span>
          <input
            className={inputClass}
            value={field.placeholder}
            onChange={(e) => updateField({ placeholder: e.target.value })}
          />
        </label>

        <Toggle
          label="Required field"
          checked={field.required}
          onChange={(required) => updateField({ required })}
        />

        {field.type === "email" ? (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] px-3 py-3 opacity-90">
            <div>
              <p className="text-sm font-medium text-[#0F172A]">Email validation</p>
              <p className="text-xs text-[#64748B]">Always on for email fields</p>
            </div>
            <span className="relative h-6 w-11 shrink-0 rounded-full bg-[#2563EB]">
              <span className="absolute top-0.5 left-0.5 h-5 w-5 translate-x-5 rounded-full bg-white shadow" />
            </span>
          </div>
        ) : null}

        <label className="block text-sm">
          <span className="font-medium text-[#0F172A]">Helper text</span>
          <textarea
            className={`${inputClass} min-h-[72px] resize-y`}
            value={field.helpText}
            onChange={(e) => updateField({ helpText: e.target.value })}
            placeholder="Shown below the field"
          />
        </label>

        {(field.type === "text" || field.type === "textarea" || field.type === "email") && (
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="font-medium text-[#0F172A]">Min length</span>
              <input
                type="number"
                className={inputClass}
                value={field.validation.minLength ?? ""}
                onChange={(e) =>
                  updateField({
                    validation: {
                      ...field.validation,
                      minLength: e.target.value === "" ? undefined : Number(e.target.value),
                    },
                  })
                }
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-[#0F172A]">Max length</span>
              <input
                type="number"
                className={inputClass}
                value={field.validation.maxLength ?? ""}
                onChange={(e) =>
                  updateField({
                    validation: {
                      ...field.validation,
                      maxLength: e.target.value === "" ? undefined : Number(e.target.value),
                    },
                  })
                }
              />
            </label>
          </div>
        )}

        {field.type === "number" && (
          <div className="grid grid-cols-2 gap-3">
            <label className="block text-sm">
              <span className="font-medium text-[#0F172A]">Min</span>
              <input
                type="number"
                className={inputClass}
                value={field.validation.min ?? ""}
                onChange={(e) =>
                  updateField({
                    validation: {
                      ...field.validation,
                      min: e.target.value === "" ? undefined : Number(e.target.value),
                    },
                  })
                }
              />
            </label>
            <label className="block text-sm">
              <span className="font-medium text-[#0F172A]">Max</span>
              <input
                type="number"
                className={inputClass}
                value={field.validation.max ?? ""}
                onChange={(e) =>
                  updateField({
                    validation: {
                      ...field.validation,
                      max: e.target.value === "" ? undefined : Number(e.target.value),
                    },
                  })
                }
              />
            </label>
          </div>
        )}

        {isChoiceType(field.type) ? (
          <div className="space-y-2 rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-[#0F172A]">Options</span>
              <button
                type="button"
                className="text-xs font-semibold text-[#2563EB] hover:underline"
                onClick={addOption}
              >
                + Add option
              </button>
            </div>
            {field.options.map((opt) => (
              <div key={opt.id} className="flex gap-2">
                <input
                  className={inputClass}
                  value={opt.label}
                  onChange={(e) => updateOption(opt.id, { label: e.target.value })}
                  placeholder="Label"
                />
                <input
                  className={`${inputClass} font-mono text-xs`}
                  value={opt.value}
                  onChange={(e) => updateOption(opt.id, { value: e.target.value })}
                  placeholder="value"
                />
                <button
                  type="button"
                  className="mt-1.5 shrink-0 rounded-lg px-2 text-sm text-[#DC2626] hover:bg-[#FEF2F2]"
                  onClick={() => removeOption(opt.id)}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
        ) : null}

        <div className="space-y-2">
          <span className="text-sm font-medium text-[#0F172A]">Visibility</span>
          <select
            className={inputClass}
            value={field.visibility.mode}
            onChange={(e) => {
              if (e.target.value === "always") {
                updateField({ visibility: { mode: "always" } });
              } else {
                updateField({
                  visibility: {
                    mode: "when",
                    fieldId: otherFields[0]?.id ?? "",
                    operator: "eq",
                    value: "",
                  },
                });
              }
            }}
          >
            <option value="always">Always show</option>
            <option value="when">Show when…</option>
          </select>

          {field.visibility.mode === "when" ? (
            <div className="space-y-2">
              <select
                className={inputClass}
                value={field.visibility.fieldId}
                onChange={(e) => {
                  if (field.visibility.mode !== "when") return;
                  updateField({
                    visibility: {
                      mode: "when",
                      fieldId: e.target.value,
                      operator: field.visibility.operator,
                      value: field.visibility.value,
                    },
                  });
                }}
              >
                <option value="" disabled>
                  Choose field…
                </option>
                {otherFields.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.label} ({f.name})
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-2 gap-2">
                <select
                  className={inputClass}
                  value={field.visibility.operator}
                  onChange={(e) => {
                    if (field.visibility.mode !== "when") return;
                    updateField({
                      visibility: {
                        mode: "when",
                        fieldId: field.visibility.fieldId,
                        operator: e.target.value as "eq" | "neq",
                        value: field.visibility.value,
                      },
                    });
                  }}
                >
                  <option value="eq">equals</option>
                  <option value="neq">not equals</option>
                </select>
                <input
                  className={inputClass}
                  value={field.visibility.value}
                  onChange={(e) => {
                    if (field.visibility.mode !== "when") return;
                    updateField({
                      visibility: {
                        mode: "when",
                        fieldId: field.visibility.fieldId,
                        operator: field.visibility.operator,
                        value: e.target.value,
                      },
                    });
                  }}
                  placeholder="Value"
                />
              </div>
            </div>
          ) : null}
        </div>

        <div className="overflow-hidden rounded-xl border border-[#E5E7EB]">
          <button
            type="button"
            className="flex w-full items-center justify-between bg-[#F8FAFC] px-3 py-3 text-left text-sm font-medium text-[#0F172A]"
            onClick={() => setAdvancedOpen((v) => !v)}
          >
            Advanced options
            <svg
              viewBox="0 0 20 20"
              className={`h-4 w-4 text-[#94A3B8] transition ${advancedOpen ? "rotate-90" : ""}`}
              fill="none"
              aria-hidden="true"
            >
              <path d="m8 5 5 5-5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
          </button>
          {advancedOpen ? (
            <div className="space-y-3 border-t border-[#E5E7EB] px-3 py-3">
              <label className="block text-sm">
                <span className="font-medium text-[#0F172A]">Type</span>
                <select
                  className={inputClass}
                  value={field.type}
                  onChange={(e) => changeType(e.target.value as FieldType)}
                >
                  {FIELD_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {FIELD_META[type].label}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function FieldSettingsEmpty() {
  return (
    <div className="flex h-full min-h-[24rem] flex-col items-center justify-center px-6 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#2563EB]">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <rect x="5" y="4" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.7" />
          <path d="M8 9h8M8 13h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      </span>
      <p className="text-sm font-semibold text-[#0F172A]">No field selected</p>
      <p className="mt-1 text-sm text-[#64748B]">
        Add an element on the left, or click a field in the live preview.
      </p>
    </div>
  );
}
