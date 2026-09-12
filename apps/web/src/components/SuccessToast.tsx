type Props = {
  open: boolean;
  title?: string;
  message?: string;
};

export function SuccessToast({
  open,
  title = "Published successfully",
  message = "Opening share & embed…",
}: Props) {
  if (!open) return null;

  return (
    <div
      className="pointer-events-none fixed inset-x-0 top-4 z-[60] flex justify-center px-4"
      role="status"
      aria-live="polite"
    >
      <div className="pointer-events-auto flex max-w-md items-start gap-3 rounded-2xl border border-emerald-200 bg-white px-4 py-3 shadow-lg shadow-emerald-500/10">
        <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#10B981] text-white">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
            <path
              d="M5 10.5 8.5 14 15 6.5"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
        <div>
          <p className="text-sm font-semibold text-[#0B1F44]">{title}</p>
          <p className="mt-0.5 text-xs text-[#64748B]">{message}</p>
        </div>
      </div>
    </div>
  );
}
