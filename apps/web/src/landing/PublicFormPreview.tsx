export function PublicFormPreview() {
  return (
    <section className="border-y border-line bg-surface/70 py-16 sm:py-20">
      <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-2 lg:items-center">
        <div>
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            A clean public form experience
          </h2>
          <p className="mt-4 leading-relaxed text-ink-muted">
            Published forms render from their definition — including required markers, selects, and
            conditional fields — with client checks that match the server rules.
          </p>
        </div>

        <div
          className="rounded-2xl border border-line bg-surface p-5 shadow-sm sm:p-6"
          role="img"
          aria-label="Preview of a published public form with name, email, plan select, and conditional details"
        >
          <p className="font-display text-xl font-semibold text-ink">Newsletter interest</p>
          <p className="mt-1 text-sm text-ink-muted">Tell us how to reach you.</p>
          <div className="mt-5 space-y-3 text-sm">
            <label className="block">
              <span className="text-ink-muted">
                Full name <span className="text-danger">*</span>
              </span>
              <input
                readOnly
                className="mt-1 w-full rounded-md border border-line px-3 py-2"
                placeholder="Alex Morgan"
              />
            </label>
            <label className="block">
              <span className="text-ink-muted">
                Email <span className="text-danger">*</span>
              </span>
              <input
                readOnly
                className="mt-1 w-full rounded-md border border-line px-3 py-2"
                placeholder="alex@company.com"
              />
            </label>
            <label className="block">
              <span className="text-ink-muted">Plan interest</span>
              <select disabled className="mt-1 w-full rounded-md border border-line px-3 py-2 text-ink-muted">
                <option>Other</option>
              </select>
            </label>
            <label className="block">
              <span className="text-ink-muted">
                Tell us more <span className="text-danger">*</span>
              </span>
              <input
                readOnly
                className="mt-1 w-full rounded-md border border-line px-3 py-2"
                placeholder="Shown because Plan = Other"
              />
            </label>
            <button
              type="button"
              className="mt-2 w-full rounded-md bg-accent px-4 py-2.5 text-sm font-medium text-white"
            >
              Submit
            </button>
            <p className="rounded-md bg-paper-2 px-3 py-2 text-xs text-accent">
              Success state: “Thanks — we received your response.”
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
