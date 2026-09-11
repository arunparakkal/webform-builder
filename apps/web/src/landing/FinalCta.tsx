import { Link } from "react-router-dom";

export function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="rounded-3xl border border-line bg-ink px-6 py-12 text-center text-white sm:px-12">
        <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Your next form should be easier to build.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm text-white/75 sm:text-base">
          Create a form, publish it, and start collecting structured responses.
        </p>
        <Link
          to="/app"
          className="mt-8 inline-flex rounded-md bg-accent px-5 py-3 text-sm font-medium text-white no-underline hover:bg-accent-hover"
        >
          Create your first form
        </Link>
      </div>
    </section>
  );
}
