const rows = [
  { email: "alex@startup.io", rev: "v2", when: "2 min ago", status: "Stored" },
  { email: "sam@agency.co", rev: "v2", when: "14 min ago", status: "Stored" },
  { email: "jordan@brand.com", rev: "v1", when: "Yesterday", status: "Stored" },
];

export function InboxPreview() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div
          className="order-2 overflow-hidden rounded-2xl border border-line bg-surface shadow-sm lg:order-1"
          role="img"
          aria-label="Preview of the submissions inbox with version, time, and export controls"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-line px-4 py-3">
            <p className="text-sm font-semibold text-ink">Submissions</p>
            <div className="flex gap-2 text-[11px]">
              <span className="rounded border border-line px-2 py-1 text-ink-muted">Revision: all</span>
              <span className="rounded bg-accent px-2 py-1 font-medium text-white">Export CSV</span>
            </div>
          </div>
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-paper-2/70 text-ink-muted">
              <tr>
                <th className="px-4 py-2 font-medium">Email</th>
                <th className="px-2 py-2 font-medium">Version</th>
                <th className="px-2 py-2 font-medium">When</th>
                <th className="px-4 py-2 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr key={row.email} className="border-t border-line">
                  <td className="px-4 py-2.5 text-ink">{row.email}</td>
                  <td className="px-2 py-2.5 text-ink-muted">{row.rev}</td>
                  <td className="px-2 py-2.5 text-ink-muted">{row.when}</td>
                  <td className="px-4 py-2.5 text-accent">{row.status}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="border-t border-line px-4 py-2 text-[11px] text-ink-muted">Page 1 · cursor pagination</div>
        </div>

        <div className="order-1 lg:order-2">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            An inbox that stays structured
          </h2>
          <p className="mt-4 leading-relaxed text-ink-muted">
            Filter by form revision, page through responses, and export CSV — with labels that still
            match the version each person actually filled out.
          </p>
        </div>
      </div>
    </section>
  );
}
