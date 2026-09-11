const tech = [
  "React",
  "TypeScript",
  "Fastify",
  "Zod",
  "Prisma",
  "Supabase PostgreSQL",
  "Redis",
  "BullMQ",
];

export function TechTrust() {
  return (
    <section className="border-y border-line bg-surface/70 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 text-center sm:px-6">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          A modern stack for flexible forms
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-ink-muted">
          Shared validation schema, server-side checks, immutable revisions, queue-based ingestion,
          cursor pagination, and JSONB form definitions.
        </p>
        <ul className="mx-auto mt-8 flex max-w-3xl flex-wrap justify-center gap-2">
          {tech.map((item) => (
            <li
              key={item}
              className="rounded-full border border-line bg-paper px-3 py-1.5 text-xs font-medium text-ink sm:text-sm"
            >
              {item}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
