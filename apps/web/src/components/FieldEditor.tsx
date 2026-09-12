import { FIELD_TYPES, type FieldType, type FormDefinition, type FormField } from "@webform/form-schema";
import { useEffect, useId, useMemo, useState } from "react";
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

export function FieldTypeIcon({ type }: { type: FieldType }) {
  const cls = "h-4 w-4";
  switch (type) {
    case "text":
      return (
        <svg viewBox="0 0 20 20" className={cls} fill="none" aria-hidden="true">
          <path d="M5 15V5h3.2c1.8 0 3 1.1 3 2.7 0 1.1-.6 2-1.5 2.4L13 15h-2.2l-2.6-4.4H7.2V15H5Zm2.2-6.2h1c.8 0 1.4-.5 1.4-1.3S9 6.2 8.2 6.2h-1v2.6Z" fill="currentColor" />
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
      <span className="text-sm font-medium text-[#0B1F44]">{label}</span>
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

export function FieldListPanel({ definition, selectedFieldId, onSelectField, onChange }: Props) {
  const [libraryOpen, setLibraryOpen] = useState(false);

  function addField(type: FieldType) {
    const field = createField(type);
    field.label = FIELD_META[type].label;
    onChange({ ...definition, fields: [...definition.fields, field] });
    onSelectField(field.id);
    setLibraryOpen(false);
  }

  function moveField(id: string, direction: -1 | 1) {
    const index = definition.fields.findIndex((f) => f.id === id);
    if (index < 0) return;
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= definition.fields.length) return;
    const fields = [...definition.fields];
    const [item] = fields.splice(index, 1);
    fields.splice(nextIndex, 0, item!);
    onChange({ ...definition, fields });
  }

  function removeField(id: string) {
    onChange({
      ...definition,
      fields: definition.fields.filter((f) => f.id !== id),
    });
    if (selectedFieldId === id) onSelectField(null);
  }

  return (
    <div className="flex h-full flex-col gap-3 p-4">
      <button
        type="button"
        onClick={() => setLibraryOpen(true)}
        className="flex w-full items-start gap-3 rounded-2xl bg-[#2563EB] px-4 py-4 text-left text-white shadow-sm shadow-blue-500/20 hover:bg-[#1D4ED8]"
      >
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/15">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
            <path d="M10 4v12M4 10h12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
          </svg>
        </span>
        <span>
          <span className="block text-sm font-semibold">+ Add element</span>
          <span className="mt-0.5 block text-xs text-white/80">
            Open the field library and add fields to your form.
          </span>
        </span>
      </button>

      <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-[#E5E7EB] bg-white shadow-sm">
        <div className="border-b border-[#E5E7EB] px-4 py-3">
          <h2 className="text-sm font-semibold text-[#0B1F44]">Form outline</h2>
          <p className="text-xs text-[#64748B]">
            {definition.fields.length} field{definition.fields.length === 1 ? "" : "s"} · select to edit
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-3">
          {definition.fields.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[#E5E7EB] bg-[#F8FAFC] px-3 py-10 text-center">
              <p className="text-sm font-medium text-[#0B1F44]">No fields yet</p>
              <p className="mt-1 text-xs text-[#64748B]">Use + Add element to build your form.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {definition.fields.map((field, index) => {
                const selected = field.id === selectedFieldId;
                const meta = FIELD_META[field.type];
                return (
                  <li key={field.id}>
                    <div
                      className={`rounded-xl border transition ${
                        selected
                          ? "border-[#2563EB] bg-[#EFF6FF] ring-2 ring-[#2563EB]/15"
                          : "border-[#E5E7EB] bg-white hover:border-[#BFDBFE]"
                      }`}
                    >
                      <button
                        type="button"
                        className="flex w-full items-center gap-3 px-3 py-3 text-left"
                        onClick={() => onSelectField(field.id)}
                      >
                        <span
                          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
                            selected
                              ? "bg-[#2563EB] text-white"
                              : "bg-[#EFF6FF] text-[#2563EB]"
                          }`}
                        >
                          <FieldTypeIcon type={field.type} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-sm font-semibold text-[#0B1F44]">
                            {field.label || meta.label}
                          </span>
                          <span className="block truncate text-xs text-[#94A3B8]">
                            {meta.description}
                          </span>
                        </span>
                        <span className="text-[#CBD5E1]" aria-hidden="true">
                          <svg viewBox="0 0 12 16" className="h-4 w-3" fill="currentColor">
                            <circle cx="3" cy="3" r="1.2" />
                            <circle cx="9" cy="3" r="1.2" />
                            <circle cx="3" cy="8" r="1.2" />
                            <circle cx="9" cy="8" r="1.2" />
                            <circle cx="3" cy="13" r="1.2" />
                            <circle cx="9" cy="13" r="1.2" />
                          </svg>
                        </span>
                      </button>
                      {selected ? (
                        <div className="flex gap-1 border-t border-[#BFDBFE]/60 px-3 py-2">
                          <button
                            type="button"
                            className="rounded-md px-2 py-0.5 text-xs text-[#64748B] hover:bg-white"
                            disabled={index === 0}
                            onClick={() => moveField(field.id, -1)}
                          >
                            Up
                          </button>
                          <button
                            type="button"
                            className="rounded-md px-2 py-0.5 text-xs text-[#64748B] hover:bg-white"
                            disabled={index === definition.fields.length - 1}
                            onClick={() => moveField(field.id, 1)}
                          >
                            Down
                          </button>
                          <button
                            type="button"
                            className="ml-auto rounded-md px-2 py-0.5 text-xs text-[#DC2626] hover:bg-white"
                            onClick={() => removeField(field.id)}
                          >
                            Remove
                          </button>
                        </div>
                      ) : null}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>

      {libraryOpen ? (
        <AddElementModal onClose={() => setLibraryOpen(false)} onAdd={addField} />
      ) : null}
    </div>
  );
}

function AddElementModal({
  onClose,
  onAdd,
}: {
  onClose: () => void;
  onAdd: (type: FieldType) => void;
}) {
  const [query, setQuery] = useState("");
  const titleId = useId();

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return FIELD_TYPES.filter((type) => {
      if (!q) return true;
      const meta = FIELD_META[type];
      return meta.label.toLowerCase().includes(q) || type.includes(q);
    });
  }, [query]);

  const basic = filtered.filter((t) => FIELD_META[t].category === "basic");
  const choice = filtered.filter((t) => FIELD_META[t].category === "choice");

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#0B1F44]/40 p-4 backdrop-blur-[2px]"
      role="presentation"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-[#E5E7EB] px-5 py-4">
          <div>
            <h2 id={titleId} className="text-lg font-semibold text-[#0B1F44]">
              Add element
            </h2>
            <p className="mt-0.5 text-sm text-[#64748B]">Choose a field type to add to your form</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-[#94A3B8] hover:bg-[#F1F5F9] hover:text-[#0B1F44]"
            aria-label="Close"
          >
            <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
              <path d="M5 5l10 10M15 5L5 15" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="border-b border-[#E5E7EB] px-5 py-3">
          <input
            autoFocus
            className="w-full rounded-xl border border-[#E5E7EB] px-3.5 py-2.5 text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
            placeholder="Search fields…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-5 py-4">
          {basic.length > 0 ? (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                Basic fields
              </p>
              <div className="grid grid-cols-2 gap-2">
                {basic.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => onAdd(type)}
                    className="group flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white px-3 py-3 text-left hover:border-[#2563EB]/40 hover:bg-[#EFF6FF]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#2563EB] group-hover:bg-[#2563EB] group-hover:text-white">
                      <FieldTypeIcon type={type} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-[#0B1F44]">
                        {FIELD_META[type].label}
                      </span>
                      <span className="block truncate text-[11px] text-[#94A3B8]">
                        {FIELD_META[type].description}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {choice.length > 0 ? (
            <div>
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wider text-[#94A3B8]">
                Choice fields
              </p>
              <div className="grid grid-cols-2 gap-2">
                {choice.map((type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => onAdd(type)}
                    className="group flex items-center gap-3 rounded-xl border border-[#E5E7EB] bg-white px-3 py-3 text-left hover:border-[#2563EB]/40 hover:bg-[#EFF6FF]"
                  >
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#2563EB] group-hover:bg-[#2563EB] group-hover:text-white">
                      <FieldTypeIcon type={type} />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-sm font-medium text-[#0B1F44]">
                        {FIELD_META[type].label}
                      </span>
                      <span className="block truncate text-[11px] text-[#94A3B8]">
                        {FIELD_META[type].description}
                      </span>
                    </span>
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {filtered.length === 0 ? (
            <p className="py-8 text-center text-sm text-[#64748B]">No fields match your search.</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

type InspectorProps = {
  definition: FormDefinition;
  field: FormField;
  onChange: (next: FormDefinition) => void;
  onRemove?: () => void;
};

export function FieldInspector({ definition, field, onChange, onRemove }: InspectorProps) {
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
    "mt-1.5 w-full rounded-xl border border-[#E5E7EB] bg-white px-3 py-2.5 text-sm text-[#0B1F44] outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15";

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between gap-2 border-b border-[#E5E7EB] px-4 py-3">
        <div>
          <h2 className="text-sm font-semibold text-[#0B1F44]">Field settings</h2>
          <p className="text-xs text-[#64748B]">Options for the selected field</p>
        </div>
        {onRemove ? (
          <button
            type="button"
            onClick={onRemove}
            title="Delete field"
            aria-label="Delete field"
            className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-[#FECACA] bg-[#FEF2F2] text-[#DC2626] hover:border-[#F87171] hover:bg-[#FEE2E2]"
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
          </button>
        ) : null}
      </div>

      <div className="flex-1 space-y-4 overflow-y-auto px-4 py-4">
        <div className="flex items-center gap-3 rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] p-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-[#2563EB] shadow-sm">
            <FieldTypeIcon type={field.type} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-[#0B1F44]">{meta.label}</p>
            <p className="truncate text-xs text-[#64748B]">{meta.description}</p>
          </div>
        </div>

        <label className="block text-sm">
          <span className="font-medium text-[#0B1F44]">
            Field label <span className="text-[#DC2626]">*</span>
          </span>
          <input
            className={inputClass}
            value={field.label}
            onChange={(e) => updateField({ label: e.target.value })}
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-[#0B1F44]">
            Field name (snake_case) <span className="text-[#DC2626]">*</span>
          </span>
          <input
            className={`${inputClass} font-mono text-xs`}
            value={field.name}
            onChange={(e) => updateField({ name: e.target.value })}
          />
        </label>

        <label className="block text-sm">
          <span className="font-medium text-[#0B1F44]">Type</span>
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

        <label className="block text-sm">
          <span className="font-medium text-[#0B1F44]">Placeholder</span>
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
              <p className="text-sm font-medium text-[#0B1F44]">Email validation</p>
              <p className="text-xs text-[#64748B]">Always on for email fields</p>
            </div>
            <span className="relative h-6 w-11 shrink-0 rounded-full bg-[#2563EB]">
              <span className="absolute top-0.5 left-0.5 h-5 w-5 translate-x-5 rounded-full bg-white shadow" />
            </span>
          </div>
        ) : null}

        <label className="block text-sm">
          <span className="font-medium text-[#0B1F44]">Helper text</span>
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
              <span className="font-medium text-[#0B1F44]">Min length</span>
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
              <span className="font-medium text-[#0B1F44]">Max length</span>
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
              <span className="font-medium text-[#0B1F44]">Min</span>
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
              <span className="font-medium text-[#0B1F44]">Max</span>
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
              <span className="text-sm font-medium text-[#0B1F44]">Options</span>
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

        <div className="space-y-2 border-t border-[#E5E7EB] pt-4">
          <span className="text-sm font-medium text-[#0B1F44]">Visibility</span>
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
      </div>
    </div>
  );
}

/** Empty state for field settings when nothing is selected */
export function FieldSettingsEmpty() {
  return (
    <div className="flex h-full min-h-[24rem] flex-col items-center justify-center px-6 text-center">
      <span className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl bg-[#EFF6FF] text-[#2563EB]">
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
          <rect x="5" y="4" width="14" height="16" rx="2" stroke="currentColor" strokeWidth="1.7" />
          <path d="M8 9h8M8 13h6" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
        </svg>
      </span>
      <p className="text-sm font-semibold text-[#0B1F44]">No field selected</p>
      <p className="mt-1 text-sm text-[#64748B]">
        Select a field from Form outline, or add a new element.
      </p>
    </div>
  );
}
