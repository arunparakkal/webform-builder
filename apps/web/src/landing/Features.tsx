import {
  IconBranch,
  IconInbox,
  IconLayers,
  IconLock,
  IconQueue,
  IconShield,
} from "./icons";

const features = [
  {
    title: "Visual Form Builder",
    body: "Design forms with flexible fields, validation rules, help text, placeholders, and options.",
    icon: IconLayers,
  },
  {
    title: "Conditional Logic",
    body: "Show or hide fields based on previous answers — the same rules run on client and server.",
    icon: IconBranch,
  },
  {
    title: "Immutable Publishing",
    body: "Publish a version that stays unchanged even when you keep editing the draft.",
    icon: IconLock,
  },
  {
    title: "Reliable Submissions",
    body: "Accepted submits enter Redis and BullMQ before a worker stores them in PostgreSQL.",
    icon: IconQueue,
  },
  {
    title: "Server-Side Validation",
    body: "Every payload is validated against the exact published form definition — never trust the client.",
    icon: IconShield,
  },
  {
    title: "Submission Inbox",
    body: "Review, filter by revision, paginate, and export responses as CSV.",
    icon: IconInbox,
  },
];

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="max-w-2xl">
        <h2 className="font-display text-3xl font-semibold tracking-tight text-ink sm:text-4xl">
          Everything a serious form product needs
        </h2>
        <p className="mt-3 text-ink-muted">
          More than a form generator — versioned publishing, validated ingest, and an inbox you can
          operate.
        </p>
      </div>

      <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {features.map((feature) => (
          <article
            key={feature.title}
            className="rounded-2xl border border-line bg-surface p-5 shadow-sm transition-shadow hover:shadow-md"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-paper-2 text-accent">
              <feature.icon />
            </div>
            <h3 className="mt-4 text-base font-semibold text-ink">{feature.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-ink-muted">{feature.body}</p>
          </article>
        ))}
      </div>
    </section>
  );
}
