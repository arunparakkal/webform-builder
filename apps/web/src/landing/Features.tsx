import { Link } from "react-router-dom";

const logos = ["Google", "Notion", "Slack", "Dropbox", "Spotify", "Figma"];

const features = [
  {
    title: "Drag & drop builder",
    body: "Add fields, reorder your outline, and edit options in a clean three-column editor.",
    iconBg: "bg-[#FEF2F2] text-[#DC2626]",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
        <path d="M13 3 4 14h7l-1 7 10-12h-7l1-6Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    title: "Ready to use templates",
    body: "Start from contact, feedback, and intake patterns — then customize labels and validation.",
    iconBg: "bg-[#F5F3FF] text-[#7C3AED]",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
        <rect x="4" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <rect x="13" y="4" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <rect x="4" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
        <rect x="13" y="13" width="7" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.8" />
      </svg>
    ),
  },
  {
    title: "Real-time analytics",
    body: "Track publishes and submissions in your inbox with revision-aware history.",
    iconBg: "bg-[#ECFDF5] text-[#059669]",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
        <path d="M5 19V10M12 19V5M19 19v-7" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    title: "Easy to embed",
    body: "Share a public link or embed with iframe / JavaScript — same validated API path.",
    iconBg: "bg-[#EFF6FF] text-[#2563EB]",
    icon: (
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
        <path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 5l-4 14" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
];

export function LogoCloud() {
  return (
    <section className="border-y border-[#E5E7EB] bg-white/70 py-10">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <p className="text-center text-sm text-[#64748B]">
          Trusted by creators, startups, and teams building forms that last
        </p>
        <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-10 gap-y-4">
          {logos.map((name) => (
            <li key={name} className="text-sm font-semibold tracking-wide text-[#94A3B8]">
              {name}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

export function Features() {
  return (
    <section id="features" className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20">
      <div className="mx-auto max-w-2xl text-center">
        <h2 className="text-3xl font-semibold tracking-tight text-[#0B1F44] sm:text-4xl">
          Powerful features,{" "}
          <span className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] bg-clip-text text-transparent">
            made simple
          </span>
        </h2>
        <p className="mt-3 text-[#64748B]">
          Everything you need to design, publish, embed, and collect responses — without the clutter.
        </p>
      </div>

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature) => (
          <article
            key={feature.title}
            className="rounded-2xl border border-[#E5E7EB] bg-white p-5 shadow-sm transition hover:border-[#BFDBFE] hover:shadow-md"
          >
            <div className={`flex h-11 w-11 items-center justify-center rounded-xl ${feature.iconBg}`}>
              {feature.icon}
            </div>
            <h3 className="mt-4 text-base font-semibold text-[#0B1F44]">{feature.title}</h3>
            <p className="mt-2 text-sm leading-relaxed text-[#64748B]">{feature.body}</p>
          </article>
        ))}
      </div>

      <div className="mt-10 text-center">
        <Link
          to="/signup"
          className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white no-underline hover:bg-[#1D4ED8]"
        >
          Start building free
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
