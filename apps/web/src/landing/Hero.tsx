import { Link } from "react-router-dom";
import { ProductPreview } from "./ProductPreview";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

export function Hero() {
  const reduced = usePrefersReducedMotion();

  return (
    <section className="mx-auto grid max-w-6xl gap-10 px-4 pb-16 pt-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-12 lg:pb-24 lg:pt-16">
      <div>
        <p className="text-xs font-semibold tracking-[0.14em] text-accent">FORMS WITHOUT THE FRICTION</p>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight text-ink sm:text-5xl lg:text-[3.25rem] lg:leading-[1.1]">
          Build forms that work as hard as your business.
        </h1>
        <p className="mt-4 max-w-xl text-base leading-relaxed text-ink-muted sm:text-lg">
          Design dynamic forms, publish immutable versions, and collect reliable submissions with a
          workflow built for real-world traffic.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            to="/app"
            className="rounded-md bg-accent px-5 py-3 text-sm font-medium text-white no-underline hover:bg-accent-hover"
          >
            Start building
          </Link>
          <a
            href="#product"
            className="rounded-md border border-line bg-surface px-5 py-3 text-sm font-medium text-ink no-underline hover:bg-paper-2"
          >
            Explore the product
          </a>
        </div>
        <p className="mt-5 text-xs text-ink-muted sm:text-sm">
          Built with React, TypeScript, PostgreSQL, Redis, and BullMQ.
        </p>
      </div>

      <div
        id="product"
        className={reduced ? "" : "landing-float"}
      >
        <ProductPreview />
      </div>
    </section>
  );
}
