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
      <span className="font-medium text-[#0B1F44]">{label}</span>
      <span className="relative mt-1.5 block">
        <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-[#94A3B8]">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
            <rect x="4" y="8" width="12" height="9" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 8V6.5a3 3 0 0 1 6 0V8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </span>
        <input
          {...props}
          id={inputId}
          type={visible ? "text" : "password"}
          className={
            className ??
            "w-full rounded-xl border border-[#E5E7EB] bg-white py-2.5 pl-10 pr-10 text-sm outline-none focus:border-[#2563EB] focus:ring-2 focus:ring-[#2563EB]/15"
          }
        />
        <button
          type="button"
          tabIndex={-1}
          className="absolute inset-y-0 right-0 flex items-center px-3 text-[#94A3B8] hover:text-[#0B1F44]"
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((v) => !v)}
        >
          <IconEye open={visible} />
        </button>
      </span>
      {error ? <p className="mt-1 text-xs text-[#DC2626]">{error}</p> : null}
      {!error && hint ? <p className="mt-1 text-xs text-[#64748B]">{hint}</p> : null}
    </label>
  );
}
