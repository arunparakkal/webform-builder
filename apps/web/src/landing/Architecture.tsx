const nodes = [
  "Public Form",
  "Fastify API",
  "Server Validation",
  "Redis + BullMQ",
  "Worker",
  "Supabase PostgreSQL",
];

export function Architecture() {
  return (
    <section id="architecture" className="border-y border-line bg-surface/70 py-16 sm:py-20">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="max-w-2xl">
          <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
            Reliable under bursty traffic
          </h2>
          <p className="mt-4 leading-relaxed text-ink-muted">
            Designed for bursty traffic and reliable processing, with production infrastructure
            improvements documented for future deployment.
          </p>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-2 sm:gap-3">
          {nodes.map((node, i) => (
            <div key={node} className="flex items-center gap-2 sm:gap-3">
              <span className="rounded-full border border-line bg-paper px-3 py-2 text-xs font-medium text-ink sm:text-sm">
                {node}
              </span>
              {i < nodes.length - 1 ? (
                <span className="text-ink-muted" aria-hidden>
                  →
                </span>
              ) : null}
            </div>
          ))}
        </div>

        <ul className="mt-8 grid gap-3 text-sm text-ink-muted sm:grid-cols-2">
          <li className="rounded-xl border border-line bg-paper/40 px-4 py-3">
            Public requests are validated on the server against the published revision.
          </li>
          <li className="rounded-xl border border-line bg-paper/40 px-4 py-3">
            Accepted submissions enter a queue; the API returns 202 after enqueue.
          </li>
          <li className="rounded-xl border border-line bg-paper/40 px-4 py-3">
            A worker stores submissions durably; retries help when the database is temporarily slow.
          </li>
          <li className="rounded-xl border border-line bg-paper/40 px-4 py-3">
            Each record keeps its form version ID so republishing cannot rewrite history.
          </li>
        </ul>
      </div>
    </section>
  );
}
