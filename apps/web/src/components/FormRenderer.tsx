import { useMemo, useState, type CSSProperties, type FormEvent, type ReactNode } from "react";
import {
  isFieldVisible,
  parseSubmission,
  resolveFormTheme,
  type FormDefinition,
  type FormField,
  type FormTheme,
} from "@webform/form-schema";
import { fontFamily, inputRadius, radiusPx } from "../lib/formThemes";

type Props = {
  definition: FormDefinition;
  onSubmit?: (payload: Record<string, unknown>, honeypot: string) => Promise<void> | void;
  submitLabel?: string;
  readOnly?: boolean;
  showHoneypot?: boolean;
  framed?: boolean;
  compactFrame?: boolean;
  /** Highlight this field in the live preview (editor selection). */
  selectedFieldId?: string | null;
  /** Show submit button even when there is no onSubmit (editor preview). */
  previewSubmit?: boolean;
  onSelectField?: (fieldId: string) => void;
};

export function FormRenderer({
  definition,
  onSubmit,
  submitLabel,
  readOnly = false,
  showHoneypot = false,
  framed = false,
  compactFrame = false,
  selectedFieldId = null,
  previewSubmit = false,
  onSelectField,
}: Props) {
  const theme = resolveFormTheme(definition.theme);
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

  const gap = theme.density === "compact" ? "1rem" : "1.25rem";
  const form = (
    <form
      onSubmit={handleSubmit}
      className="relative"
      noValidate
      style={{
        fontFamily: fontFamily(theme.font),
        color: theme.colors.text,
        textAlign: theme.align,
        display: "flex",
        flexDirection: "column",
        gap,
      }}
    >
      <div>
        <h1
          className="font-display text-3xl font-semibold tracking-tight"
          style={{ color: theme.colors.title }}
        >
          {definition.meta.title}
        </h1>
        {definition.meta.description ? (
          <p className="mt-2" style={{ color: theme.colors.muted }}>
            {definition.meta.description}
          </p>
        ) : null}
      </div>

      {visibleFields.map((field, index) => (
        <FieldControl
          key={field.id}
          field={field}
          value={values[field.name]}
          error={errors[field.name]}
          disabled={readOnly || submitting}
          theme={theme}
          selected={selectedFieldId === field.id}
          number={theme.showQuestionNumbers ? index + 1 : undefined}
          onSelect={onSelectField ? () => onSelectField(field.id) : undefined}
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

      {formError ? <p className="text-sm" style={{ color: "#b42318" }}>{formError}</p> : null}

      {!readOnly && (onSubmit || previewSubmit) ? (
        <ThemedButton theme={theme} disabled={submitting || !onSubmit} preview={!onSubmit}>
          {submitting ? "Submitting…" : (submitLabel ?? definition.settings.submitLabel)}
        </ThemedButton>
      ) : null}
    </form>
  );

  if (!framed) return form;

  return (
    <ThemedFormFrame theme={theme} compact={compactFrame}>
      {form}
    </ThemedFormFrame>
  );
}

export function ThemedFormFrame({
  theme,
  compact = false,
  children,
}: {
  theme: FormTheme;
  compact?: boolean;
  children: ReactNode;
}) {
  const pad = compact ? "1rem" : theme.density === "compact" ? "1.25rem" : "2rem";
  const pagePad = compact ? "0.75rem" : "2.5rem 1rem";
  return (
    <div
      className="w-full"
      style={{
        background: theme.colors.page,
        padding: pagePad,
        minHeight: compact ? undefined : "100%",
        fontFamily: fontFamily(theme.font),
      }}
    >
      <div
        className="mx-auto w-full max-w-xl"
        style={{
          background: theme.colors.card,
          color: theme.colors.text,
          borderRadius: radiusPx(theme.radius),
          border: `1px solid ${theme.colors.border}`,
          boxShadow: theme.cardShadow ? "0 10px 30px rgba(15, 23, 42, 0.08)" : "none",
          padding: pad,
        }}
      >
        {children}
      </div>
    </div>
  );
}

export function ThemedSuccess({
  theme,
  message,
  compact = false,
}: {
  theme: FormTheme;
  message: string;
  compact?: boolean;
}) {
  return (
    <ThemedFormFrame theme={theme} compact={compact}>
      <div style={{ textAlign: theme.align }}>
        <h1 className="font-display text-3xl font-semibold tracking-tight" style={{ color: theme.colors.title }}>
          Submitted
        </h1>
        <p className="mt-3" style={{ color: theme.colors.muted }}>
          {message}
        </p>
      </div>
    </ThemedFormFrame>
  );
}

function emptyValue(field: FormField): unknown {
  if (field.type === "multiselect" || field.type === "checkbox") return [] as string[];
  if (field.type === "number") return "";
  return "";
}

function sizePadding(size: FormTheme["fieldSize"] | FormTheme["buttonSize"], kind: "field" | "button" = "field"): string {
  if (kind === "button") {
    if (size === "sm") return "0.45rem 1.1rem";
    if (size === "lg") return "0.75rem 1.75rem";
    return "0.55rem 1.4rem";
  }
  if (size === "sm") return "0.4rem 0.7rem";
  if (size === "lg") return "0.85rem 1.15rem";
  return "0.6rem 0.9rem";
}

function sizeFont(size: FormTheme["fieldSize"] | FormTheme["buttonSize"]): string {
  if (size === "sm") return "0.8125rem";
  if (size === "lg") return "1rem";
  return "0.875rem";
}

function ThemedButton({
  theme,
  disabled,
  preview,
  children,
}: {
  theme: FormTheme;
  disabled?: boolean;
  preview?: boolean;
  children: ReactNode;
}) {
  const radius = inputRadius(theme.radius);
  const base: CSSProperties = {
    borderRadius: radius,
    padding: sizePadding(theme.buttonSize, "button"),
    fontSize: sizeFont(theme.buttonSize),
    fontWeight: 600,
    width: theme.buttonWidth === "full" ? "100%" : "auto",
    minWidth: theme.buttonWidth === "full" ? undefined : "7.5rem",
    maxWidth: theme.buttonWidth === "full" ? undefined : "14rem",
    alignSelf: "center",
    display: "inline-flex",
    justifyContent: "center",
    alignItems: "center",
    marginTop: "0.25rem",
    marginLeft: "auto",
    marginRight: "auto",
    cursor: disabled || preview ? "default" : "pointer",
    opacity: disabled && !preview ? 0.6 : 1,
  };
  if (theme.buttonStyle === "outline") {
    return (
      <button
        type={preview ? "button" : "submit"}
        disabled={disabled}
        style={{
          ...base,
          background: "transparent",
          color: theme.colors.button,
          border: `2px solid ${theme.colors.button}`,
        }}
      >
        {children}
      </button>
    );
  }
  if (theme.buttonStyle === "soft") {
    return (
      <button
        type={preview ? "button" : "submit"}
        disabled={disabled}
        style={{
          ...base,
          background: `color-mix(in srgb, ${theme.colors.button} 16%, ${theme.colors.card})`,
          color: theme.colors.button,
          border: `1px solid ${theme.colors.button}`,
        }}
      >
        {children}
      </button>
    );
  }
  return (
    <button
      type={preview ? "button" : "submit"}
      disabled={disabled}
      style={{
        ...base,
        background: theme.colors.button,
        color: theme.colors.buttonText,
        border: "0",
      }}
    >
      {children}
    </button>
  );
}

type FieldControlProps = {
  field: FormField;
  value: unknown;
  error?: string;
  disabled?: boolean;
  theme: FormTheme;
  selected?: boolean;
  number?: number;
  onSelect?: () => void;
  onChange: (value: unknown) => void;
};

function FieldControl({
  field,
  value,
  error,
  disabled,
  theme,
  selected,
  number,
  onSelect,
  onChange,
}: FieldControlProps) {
  const inputId = `field-${field.id}`;
  const controlStyle: CSSProperties = {
    marginTop: "0.25rem",
    width: "100%",
    borderRadius: inputRadius(theme.radius),
    border: `1px solid ${theme.colors.border}`,
    background: theme.colors.input,
    color: theme.colors.text,
    padding: sizePadding(theme.fieldSize, "field"),
    fontSize: sizeFont(theme.fieldSize),
    outline: "none",
  };

  return (
    <div
      role={onSelect ? "button" : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={
        onSelect
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onSelect();
              }
            }
          : undefined
      }
      style={{
        textAlign: theme.align,
        borderRadius: inputRadius(theme.radius),
        outline: selected ? `2px solid ${theme.colors.button}` : undefined,
        outlineOffset: selected ? 4 : undefined,
        background: selected ? `color-mix(in srgb, ${theme.colors.button} 8%, transparent)` : undefined,
        padding: selected ? "0.5rem" : undefined,
        cursor: onSelect ? "pointer" : undefined,
      }}
    >
      <label htmlFor={inputId} className="block text-sm font-medium" style={{ color: theme.colors.text }}>
        {number != null ? <span style={{ color: theme.colors.muted }}>{number}. </span> : null}
        {field.label}
        {field.required ? <span className="ml-1" style={{ color: "#b42318" }}>*</span> : null}
      </label>
      {field.helpText ? (
        <p className="mt-0.5 text-xs" style={{ color: theme.colors.muted }}>
          {field.helpText}
        </p>
      ) : null}

      {field.type === "textarea" ? (
        <textarea
          id={inputId}
          style={controlStyle}
          placeholder={field.placeholder}
          value={String(value ?? "")}
          disabled={disabled}
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onChange(e.target.value)}
          rows={theme.fieldSize === "lg" ? 5 : theme.fieldSize === "sm" ? 3 : 4}
        />
      ) : field.type === "select" ? (
        <select
          id={inputId}
          style={controlStyle}
          value={String(value ?? "")}
          disabled={disabled}
          onClick={(e) => e.stopPropagation()}
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
        <div className="mt-2 space-y-2" onClick={(e) => e.stopPropagation()}>
          {field.options.map((opt) => (
            <label
              key={opt.id}
              className="flex items-center gap-2 text-sm"
              style={{
                color: theme.colors.text,
                justifyContent: theme.align === "center" ? "center" : "flex-start",
                fontSize: sizeFont(theme.fieldSize),
              }}
            >
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
        <div className="mt-2 space-y-2" onClick={(e) => e.stopPropagation()}>
          {field.options.map((opt) => {
            const selectedOpts = Array.isArray(value) ? (value as string[]) : [];
            return (
              <label
                key={opt.id}
                className="flex items-center gap-2 text-sm"
                style={{
                  color: theme.colors.text,
                  justifyContent: theme.align === "center" ? "center" : "flex-start",
                  fontSize: sizeFont(theme.fieldSize),
                }}
              >
                <input
                  type="checkbox"
                  checked={selectedOpts.includes(opt.value)}
                  disabled={disabled}
                  onChange={(e) => {
                    if (e.target.checked) onChange([...selectedOpts, opt.value]);
                    else onChange(selectedOpts.filter((v) => v !== opt.value));
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
          style={controlStyle}
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
          onClick={(e) => e.stopPropagation()}
          onChange={(e) => onChange(e.target.value)}
        />
      )}

      {error ? <p className="mt-1 text-xs" style={{ color: "#b42318" }}>{error}</p> : null}
    </div>
  );
}
