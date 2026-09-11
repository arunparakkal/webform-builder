import { useState, type InputHTMLAttributes } from "react";

type PasswordFieldProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & {
  label: string;
  error?: string;
  hint?: string;
};

function IconEye({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path
          d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A10.4 10.4 0 0 1 12 5c5 0 9.3 3.1 11 7.5a11.5 11.5 0 0 1-4.2 5.1M6.1 6.1A11.5 11.5 0 0 0 1 12.5C2.7 16.9 7 20 12 20c1.6 0 3.1-.3 4.5-.9"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    );
  }
  return (
    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M2 12.5C3.7 8.1 8 5 13 5s9.3 3.1 11 7.5c-1.7 4.4-6 7.5-11 7.5S3.7 16.9 2 12.5Z"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <circle cx="13" cy="12.5" r="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

export function PasswordField({ label, error, hint, className, id, ...props }: PasswordFieldProps) {
  const [visible, setVisible] = useState(false);
  const inputId = id ?? props.name ?? "password";

  return (
    <label className="block text-sm" htmlFor={inputId}>
      <span className="text-ink-muted">{label}</span>
      <span className="relative mt-1 block">
        <input
          {...props}
          id={inputId}
          type={visible ? "text" : "password"}
          className={`w-full rounded-md border border-line px-3 py-2 pr-10 ${className ?? ""}`}
        />
        <button
          type="button"
          tabIndex={-1}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-ink-muted hover:text-ink"
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((v) => !v)}
        >
          <IconEye open={visible} />
        </button>
      </span>
      {error ? <p className="mt-1 text-xs text-red-600">{error}</p> : null}
      {!error && hint ? <p className="mt-1 text-xs text-ink-muted">{hint}</p> : null}
    </label>
  );
}
