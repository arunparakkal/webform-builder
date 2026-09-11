export function Versioning() {
  return (
    <section id="versioning" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Publishing that protects history
          </h2>
          <p className="mt-4 text-ink-muted leading-relaxed">
            When you publish, Webform Builder freezes that form definition. Keep editing the draft —
            the live form stays stable. Every submission remembers the exact version it answered.
          </p>
          <p className="mt-3 text-sm text-ink-muted">
            That means adding a “Phone” field later cannot change how last week’s responses are read.
          </p>
        </div>

        <div className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6">
          <ol className="space-y-4 text-sm">
            <li className="rounded-xl border border-dashed border-line bg-paper/50 px-4 py-3">
              <p className="font-medium text-ink">Draft</p>
              <p className="text-ink-muted">Editable by the form owner</p>
            </li>
            <li className="pl-4 text-xs font-medium uppercase tracking-wide text-accent">Publish ↓</li>
            <li className="rounded-xl border border-line bg-paper-2/60 px-4 py-3">
              <p className="font-medium text-ink">Published version 1</p>
              <p className="text-ink-muted">Immutable · public URL serves this JSON</p>
            </li>
            <li className="pl-4 text-xs font-medium uppercase tracking-wide text-ink-muted">
              Later draft edits → live form unchanged
            </li>
            <li className="rounded-xl border border-line px-4 py-3">
              <p className="font-medium text-ink">Publish again → version 2</p>
              <p className="text-ink-muted">New live pointer · version 1 still exists for old submissions</p>
            </li>
          </ol>
        </div>
      </div>
    </section>
  );
}
