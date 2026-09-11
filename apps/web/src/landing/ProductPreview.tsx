/** Isolated mock UI for the landing page — not connected to API/DB. */

export function ProductPreview({ className = "" }: { className?: string }) {
  return (
    <div
      className={`overflow-hidden rounded-2xl border border-line bg-surface shadow-[0_24px_60px_-28px_rgba(26,35,50,0.35)] ${className}`}
      role="img"
      aria-label="Product preview of the Webform Builder dashboard, form editor, and submissions"
    >
      <div className="flex items-center gap-2 border-b border-line bg-paper-2/80 px-3 py-2">
        <span className="h-2.5 w-2.5 rounded-full bg-[#e2b6b0]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#e2d4a8]" />
        <span className="h-2.5 w-2.5 rounded-full bg-[#b5d4c4]" />
        <span className="ml-2 truncate font-mono text-[11px] text-ink-muted">app.webform.local / forms</span>
      </div>

      <div className="grid min-h-[320px] grid-cols-[88px_1fr] sm:grid-cols-[140px_1.1fr_0.9fr] lg:min-h-[380px]">
        <aside className="border-r border-line bg-paper-2/40 p-3 text-[11px] sm:text-xs">
          <p className="mb-3 font-semibold text-ink">Workspace</p>
          <ul className="space-y-2 text-ink-muted">
            <li className="rounded-md bg-surface px-2 py-1.5 font-medium text-accent shadow-sm">Forms</li>
            <li className="px-2 py-1.5">Submissions</li>
            <li className="px-2 py-1.5">Settings</li>
          </ul>
        </aside>

        <div className="border-r border-line p-3 sm:p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <div>
              <p className="text-xs font-semibold text-ink sm:text-sm">Contact lead form</p>
              <p className="text-[10px] text-ink-muted sm:text-xs">Draft · 4 fields</p>
            </div>
            <div className="flex gap-1.5">
              <span className="rounded border border-line px-2 py-1 text-[10px] text-ink-muted">Preview</span>
              <span className="rounded bg-accent px-2 py-1 text-[10px] font-medium text-white">Publish</span>
            </div>
          </div>

          <div className="space-y-2">
            {[
              { label: "Full name", type: "text", req: true },
              { label: "Work email", type: "email", req: true },
              { label: "Plan interest", type: "select", req: false },
              { label: "Tell us more", type: "text", req: true, note: "Show if Plan = Other" },
            ].map((field) => (
              <div key={field.label} className="rounded-lg border border-line bg-paper/60 px-2.5 py-2">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-[11px] font-medium text-ink sm:text-xs">
                    {field.label}
                    {field.req ? <span className="text-danger"> *</span> : null}
                  </span>
                  <span className="rounded bg-paper-2 px-1.5 py-0.5 font-mono text-[9px] text-ink-muted">
                    {field.type}
                  </span>
                </div>
                {field.note ? <p className="mt-1 text-[10px] text-accent">{field.note}</p> : null}
              </div>
            ))}
          </div>
        </div>

        <div className="hidden flex-col gap-3 p-4 sm:flex">
          <div>
            <p className="text-xs font-semibold text-ink">Field settings</p>
            <p className="mt-1 text-[11px] text-ink-muted">Required · help text · visibility</p>
          </div>
          <div className="rounded-lg border border-line p-3 text-[11px]">
            <p className="font-medium text-ink">Visibility</p>
            <p className="mt-1 text-ink-muted">Show when Plan interest equals Other</p>
          </div>
          <div className="rounded-lg border border-line p-3">
            <p className="text-xs font-semibold text-ink">Submissions</p>
            <p className="mt-1 font-display text-2xl text-accent">128</p>
            <p className="text-[11px] text-ink-muted">this published version</p>
          </div>
          <div className="mt-auto space-y-1.5 text-[11px]">
            <p className="font-medium text-ink">Recent</p>
            <p className="text-ink-muted">alex@startup.io · v2 · 2m ago</p>
            <p className="text-ink-muted">sam@agency.co · v2 · 14m ago</p>
          </div>
        </div>
      </div>
    </div>
  );
}
