import {
  isFieldVisible,
  parseSubmission,
  type FormDefinition,
  type FormField,
} from "@webform/form-schema";
import { useMemo, useState, type FormEvent } from "react";

type Props = {
  definition: FormDefinition;
  onSubmit?: (payload: Record<string, unknown>, honeypot: string) => Promise<void> | void;
  submitLabel?: string;
  readOnly?: boolean;
  showHoneypot?: boolean;
};

function emptyValue(field: FormField): unknown {
  if (field.type === "multiselect" || field.type === "checkbox") return [] as string[];
  if (field.type === "number") return "";
  return "";
}

export function FormRenderer({
  definition,
  onSubmit,
  submitLabel,
  readOnly = false,
  showHoneypot = false,
}: Props) {
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {};
    for (const field of definition.fields) {
      initial[field.name] = emptyValue(field);
    }
    return initial;
  });
  const [website, setWebsite] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const visibleFields = useMemo(
    () => definition.fields.filter((field) => isFieldVisible(field, definition, values)),
    [definition, values],
  );

  function setFieldValue(name: string, value: unknown) {
    setValues((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => {
      if (!prev[name]) return prev;
      const next = { ...prev };
      delete next[name];
      return next;
    });
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (readOnly || !onSubmit) return;

    setFormError(null);
    const payload: Record<string, unknown> = {};
    for (const field of definition.fields) {
      const visible = isFieldVisible(field, definition, values);
      if (!visible) continue;
      const raw = values[field.name];
      if (field.type === "number") {
        if (raw === "" || raw === undefined || raw === null) {
          // omit empty optional numbers
        } else {
          payload[field.name] = Number(raw);
        }
      } else if (
        (field.type === "multiselect" || field.type === "checkbox") &&
        Array.isArray(raw) &&
        raw.length === 0
      ) {
        // omit empty arrays so parseSubmission treats as empty
      } else if (raw === "" || raw === undefined || raw === null) {
        // omit empties
      } else {
        payload[field.name] = raw;
      }
    }

    const parsed = parseSubmission(definition, payload);
    if (!parsed.success) {
      const next: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "_form");
        if (!next[key]) next[key] = issue.message;
      }
      setErrors(next);
      setFormError("Please fix the highlighted fields.");
      return;
    }

    try {
      setSubmitting(true);
      await onSubmit(parsed.data, website);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative space-y-5" noValidate>
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight text-ink">
          {definition.meta.title}
        </h1>
        {definition.meta.description ? (
          <p className="mt-2 text-ink-muted">{definition.meta.description}</p>
        ) : null}
      </div>

      {visibleFields.map((field) => (
        <FieldControl
          key={field.id}
          field={field}
          value={values[field.name]}
          error={errors[field.name]}
          disabled={readOnly || submitting}
          onChange={(value) => setFieldValue(field.name, value)}
        />
      ))}

      {showHoneypot ? (
        <div className="absolute -left-[9999px] h-0 w-0 overflow-hidden opacity-0" aria-hidden="true">
          <label htmlFor="website">Website</label>
          <input
            id="website"
            name="website"
            tabIndex={-1}
            autoComplete="off"
            value={website}
            onChange={(e) => setWebsite(e.target.value)}
          />
        </div>
      ) : null}

      {formError ? <p className="text-sm text-danger">{formError}</p> : null}

      {!readOnly && onSubmit ? (
        <button
          type="submit"
          disabled={submitting}
          className="rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-white hover:bg-accent-hover disabled:opacity-60"
        >
          {submitting ? "Submitting…" : (submitLabel ?? definition.settings.submitLabel)}
        </button>
      ) : null}
    </form>
  );
}

type FieldControlProps = {
  field: FormField;
  value: unknown;
  error?: string;
  disabled?: boolean;
  onChange: (value: unknown) => void;
};

function FieldControl({ field, value, error, disabled, onChange }: FieldControlProps) {
  const inputId = `field-${field.id}`;
  const common =
    "mt-1 w-full rounded-md border border-line bg-surface px-3 py-2 text-sm outline-none focus:border-accent";

  return (
    <div>
      <label htmlFor={inputId} className="block text-sm font-medium text-ink">
        {field.label}
        {field.required ? <span className="ml-1 text-danger">*</span> : null}
      </label>
      {field.helpText ? <p className="mt-0.5 text-xs text-ink-muted">{field.helpText}</p> : null}

      {field.type === "textarea" ? (
        <textarea
          id={inputId}
          className={common}
          placeholder={field.placeholder}
          value={String(value ?? "")}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
          rows={4}
        />
      ) : field.type === "select" ? (
        <select
          id={inputId}
          className={common}
          value={String(value ?? "")}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Select…</option>
          {field.options.map((opt) => (
            <option key={opt.id} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      ) : field.type === "radio" ? (
        <div className="mt-2 space-y-2">
          {field.options.map((opt) => (
            <label key={opt.id} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={field.name}
                value={opt.value}
                checked={value === opt.value}
                disabled={disabled}
                onChange={() => onChange(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      ) : field.type === "multiselect" || field.type === "checkbox" ? (
        <div className="mt-2 space-y-2">
          {field.options.map((opt) => {
            const selected = Array.isArray(value) ? (value as string[]) : [];
            return (
              <label key={opt.id} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected.includes(opt.value)}
                  disabled={disabled}
                  onChange={(e) => {
                    if (e.target.checked) onChange([...selected, opt.value]);
                    else onChange(selected.filter((v) => v !== opt.value));
                  }}
                />
                {opt.label}
              </label>
            );
          })}
        </div>
      ) : (
        <input
          id={inputId}
          className={common}
          type={
            field.type === "email"
              ? "email"
              : field.type === "number"
                ? "number"
                : field.type === "date"
                  ? "date"
                  : "text"
          }
          placeholder={field.placeholder}
          value={value === undefined || value === null ? "" : String(value)}
          disabled={disabled}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {error ? <p className="mt-1 text-xs text-danger">{error}</p> : null}
    </div>
  );
}
