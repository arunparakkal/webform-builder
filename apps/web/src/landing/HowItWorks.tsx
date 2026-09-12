const steps = [
  {
    n: "01",
    title: "Design",
    body: "Create a form in the visual builder with fields, validation, and conditional visibility.",
  },
  {
    n: "02",
    title: "Publish",
    body: "Publish an immutable version. Draft edits never rewrite what is already live.",
  },
  {
    n: "03",
    title: "Share",
    body: "Share the public URL (/f/:slug) or copy iframe / JavaScript embed code from the editor.",
  },
  {
    n: "04",
    title: "Collect",
    body: "Receive server-validated submissions and manage them in a paginated inbox with CSV export.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="border-y border-line bg-surface/70 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          How it works
        </h2>
        <p className="mt-3 max-w-2xl text-ink-muted">
          A clear path from draft to durable data — the same loop the working product implements today.
        </p>

        <ol className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.n} className="relative rounded-2xl border border-line bg-paper/40 p-5">
              {index < steps.length - 1 ? (
                <span
                  className="pointer-events-none absolute right-[-0.6rem] top-1/2 hidden h-px w-3 bg-line lg:block"
                  aria-hidden
                />
              ) : null}
              <p className="font-mono text-xs text-accent">{step.n}</p>
              <h3 className="mt-2 text-lg font-semibold text-ink">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
