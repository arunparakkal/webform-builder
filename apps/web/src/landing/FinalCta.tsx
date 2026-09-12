import { Link } from "react-router-dom";

export function FinalCta() {
  return (
    <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-24">
      <div className="overflow-hidden rounded-3xl bg-gradient-to-br from-[#2563EB] via-[#3B82F6] to-[#7C3AED] px-6 py-12 text-center text-white shadow-lg shadow-blue-500/20 sm:px-12">
        <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
          Your next form should be easier to build.
        </h2>
        <p className="mx-auto mt-4 max-w-xl text-sm text-white/85 sm:text-base">
          Create a form, publish it, and start collecting structured responses in minutes.
        </p>
        <Link
          to="/signup"
          className="mt-8 inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-semibold text-[#2563EB] no-underline hover:bg-[#F8FAFC]"
        >
          Create your first form
          <span aria-hidden="true">→</span>
        </Link>
      </div>
    </section>
  );
}
