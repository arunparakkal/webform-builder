const cases = [
  "Contact forms",
  "Customer feedback",
  "Event registration",
  "Lead capture",
  "Internal requests",
  "Surveys",
  "Application forms",
  "Support intake",
];

export function UseCases() {
  return (
    <section id="use-cases" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
        Built for everyday collection work
      </h2>
      <p className="mt-3 max-w-2xl text-ink-muted">
        Same builder, same versioning model — whether you are capturing leads or running internal
        intake.
      </p>
      <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
        {cases.map((item) => (
          <div
            key={item}
            className="rounded-xl border border-line bg-surface px-4 py-5 text-center text-sm font-medium text-ink shadow-sm"
          >
            {item}
          </div>
        ))}
      </div>
    </section>
  );
}
