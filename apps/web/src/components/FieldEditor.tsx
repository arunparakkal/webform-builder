import { FIELD_TYPES, type FieldType, type FormDefinition, type FormField } from "@webform/form-schema";
import { createField, isChoiceType } from "../lib/fields";

type Props = {
  definition: FormDefinition;
  selectedFieldId: string | null;
  onSelectField: (id: string | null) => void;
  onChange: (next: FormDefinition) => void;
};

export function FieldListPanel({ definition, selectedFieldId, onSelectField, onChange }: Props) {
  function addField(type: FieldType) {
    const field = createField(type);
    onChange({ ...definition, fields: [...definition.fields, field] });
    onSelectField(field.id);
  }

  function moveField(id: string, direction: -1 | 1) {
    const index = definition.fields.findIndex((f) => f.id === id);
    if (index < 0) return;
    const nextIndex = index + direction;
    if (nextIndex < 0 || nextIndex >= definition.fields.length) return;
    const fields = [...definition.fields];
    const [item] = fields.splice(index, 1);
    fields.splice(nextIndex, 0, item);
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
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Fields</h2>
        <select
          className="rounded-md border border-line bg-surface px-2 py-1.5 text-sm"
          defaultValue=""
          onChange={(e) => {
            const type = e.target.value as FieldType;
            if (!type) return;
            addField(type);
            e.target.value = "";
          }}
        >
          <option value="" disabled>
            Add field…
          </option>
          {FIELD_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </div>

      {definition.fields.length === 0 ? (
        <p className="rounded-md border border-dashed border-line bg-paper-2/60 px-3 py-6 text-center text-sm text-ink-muted">
          No fields yet. Add one to start building.
        </p>
      ) : (
        <ul className="space-y-2">
          {definition.fields.map((field, index) => {
            const selected = field.id === selectedFieldId;
            return (
              <li
                key={field.id}
                className={`rounded-md border px-3 py-2 ${
                  selected ? "border-accent bg-accent/5" : "border-line bg-surface"
                }`}
              >
                <button
                  type="button"
                  className="w-full text-left"
                  onClick={() => onSelectField(field.id)}
                >
                  <div className="text-sm font-medium text-ink">{field.label}</div>
                  <div className="text-xs text-ink-muted">
                    {field.type} · {field.name}
                  </div>
                </button>
                <div className="mt-2 flex gap-1">
                  <button
                    type="button"
                    className="rounded px-2 py-0.5 text-xs text-ink-muted hover:bg-paper-2"
                    disabled={index === 0}
                    onClick={() => moveField(field.id, -1)}
                  >
                    Up
                  </button>
                  <button
                    type="button"
                    className="rounded px-2 py-0.5 text-xs text-ink-muted hover:bg-paper-2"
                    disabled={index === definition.fields.length - 1}
                    onClick={() => moveField(field.id, 1)}
                  >
                    Down
                  </button>
                  <button
                    type="button"
                    className="ml-auto rounded px-2 py-0.5 text-xs text-danger hover:bg-paper-2"
                    onClick={() => removeField(field.id)}
                  >
                    Remove
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

type InspectorProps = {
  definition: FormDefinition;
  field: FormField;
  onChange: (next: FormDefinition) => void;
};

export function FieldInspector({ definition, field, onChange }: InspectorProps) {
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

  return (
    <div className="space-y-4">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-ink-muted">Field settings</h2>

      <label className="block text-sm">
        <span className="text-ink-muted">Type</span>
        <select
          className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
          value={field.type}
          onChange={(e) => changeType(e.target.value as FieldType)}
        >
          {FIELD_TYPES.map((type) => (
            <option key={type} value={type}>
              {type}
            </option>
          ))}
        </select>
      </label>

      <label className="block text-sm">
        <span className="text-ink-muted">Label</span>
        <input
          className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
          value={field.label}
          onChange={(e) => updateField({ label: e.target.value })}
        />
      </label>

      <label className="block text-sm">
        <span className="text-ink-muted">Name (snake_case)</span>
        <input
          className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 font-mono text-xs"
          value={field.name}
          onChange={(e) => updateField({ name: e.target.value })}
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={field.required}
          onChange={(e) => updateField({ required: e.target.checked })}
        />
        Required
      </label>

      <label className="block text-sm">
        <span className="text-ink-muted">Placeholder</span>
        <input
          className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
          value={field.placeholder}
          onChange={(e) => updateField({ placeholder: e.target.value })}
        />
      </label>

      <label className="block text-sm">
        <span className="text-ink-muted">Help text</span>
        <input
          className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
          value={field.helpText}
          onChange={(e) => updateField({ helpText: e.target.value })}
        />
      </label>

      {(field.type === "text" || field.type === "textarea" || field.type === "email") && (
        <div className="grid grid-cols-2 gap-3">
          <label className="block text-sm">
            <span className="text-ink-muted">Min length</span>
            <input
              type="number"
              className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
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
            <span className="text-ink-muted">Max length</span>
            <input
              type="number"
              className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
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
            <span className="text-ink-muted">Min</span>
            <input
              type="number"
              className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
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
            <span className="text-ink-muted">Max</span>
            <input
              type="number"
              className="mt-1 w-full rounded-md border border-line bg-surface px-3 py-2"
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
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm text-ink-muted">Options</span>
            <button
              type="button"
              className="text-xs font-medium text-accent hover:underline"
              onClick={addOption}
            >
              Add option
            </button>
          </div>
          {field.options.map((opt) => (
            <div key={opt.id} className="flex gap-2">
              <input
                className="w-full rounded-md border border-line bg-surface px-2 py-1.5 text-sm"
                value={opt.label}
                onChange={(e) => updateOption(opt.id, { label: e.target.value })}
                placeholder="Label"
              />
              <input
                className="w-full rounded-md border border-line bg-surface px-2 py-1.5 font-mono text-xs"
                value={opt.value}
                onChange={(e) => updateOption(opt.id, { value: e.target.value })}
                placeholder="value"
              />
              <button
                type="button"
                className="shrink-0 text-xs text-danger"
                onClick={() => removeOption(opt.id)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      ) : null}

      <div className="space-y-2 border-t border-line pt-4">
        <span className="text-sm text-ink-muted">Visibility</span>
        <select
          className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
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
              className="w-full rounded-md border border-line bg-surface px-3 py-2 text-sm"
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
                className="rounded-md border border-line bg-surface px-3 py-2 text-sm"
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
                className="rounded-md border border-line bg-surface px-3 py-2 text-sm"
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
  );
}
