import type { ReactNode } from "react";
import { Link } from "react-router-dom";

const features = [
  {
    title: "Visual form builder",
    body: "Add fields, edit options, and preview live.",
    tone: "bg-[#FEF2F2] text-[#DC2626]",
  },
  {
    title: "One-click publish",
    body: "Ship a live version and share the public link.",
    tone: "bg-[#F5F3FF] text-[#7C3AED]",
  },
  {
    title: "Reliable inbox",
    body: "Validated submissions land in your inbox.",
    tone: "bg-[#ECFDF5] text-[#059669]",
  },
  {
    title: "Easy embeds",
    body: "Drop iframe or JavaScript onto any site.",
    tone: "bg-[#EFF6FF] text-[#2563EB]",
  },
];

type AuthLayoutProps = {
  mode: "signin" | "signup";
  children: ReactNode;
};

export function AuthLayout({ mode, children }: AuthLayoutProps) {
  const switchHref = mode === "signin" ? "/signup" : "/signin";
  const switchLabel = mode === "signin" ? "Sign up" : "Sign in";
  const switchPrompt =
    mode === "signin" ? "Don't have an account?" : "Already have an account?";

  return (
    <div className="min-h-screen bg-white text-[#0B1F44] lg:grid lg:grid-cols-2">
      <aside className="relative hidden overflow-hidden border-r border-[#E5E7EB] lg:flex lg:flex-col lg:justify-between lg:px-10 lg:py-8 xl:px-14">
        <div
          className="pointer-events-none absolute inset-0"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(ellipse 70% 50% at 20% 10%, rgba(191,219,254,0.7) 0%, transparent 55%), radial-gradient(ellipse 55% 45% at 90% 80%, rgba(221,214,254,0.55) 0%, transparent 50%), linear-gradient(180deg, #F8FAFF 0%, #EEF2FF 100%)",
          }}
        />

        <div className="relative z-10">
          <Link to="/" className="inline-flex items-center gap-2.5 no-underline">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2563EB] text-sm font-bold text-white shadow-sm shadow-blue-500/30">
              F
            </span>
            <span className="text-[15px] font-semibold tracking-tight">FormBuilder</span>
          </Link>

          <div className="mt-14 max-w-md">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-[#BFDBFE] bg-white/80 px-3 py-1 text-xs font-medium text-[#1D4ED8]">
              <span aria-hidden="true">✦</span>
              Build. Share. Collect. Grow.
            </span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight xl:text-[2.75rem] xl:leading-[1.1]">
              Turn your ideas into forms{" "}
              <span className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] bg-clip-text text-transparent">
                effortlessly
              </span>
            </h1>

            <ul className="mt-8 space-y-3">
              {features.map((feature) => (
                <li
                  key={feature.title}
                  className="flex items-start gap-3 rounded-2xl border border-white/70 bg-white/70 p-3 shadow-sm backdrop-blur"
                >
                  <span
                    className={`mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-sm font-bold ${feature.tone}`}
                  >
                    ✓
                  </span>
                  <span>
                    <span className="block text-sm font-semibold">{feature.title}</span>
                    <span className="block text-xs text-[#64748B]">{feature.body}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="relative z-10 mt-10 max-w-md rounded-2xl border border-white/80 bg-white/90 p-4 shadow-md backdrop-blur">
          <div className="flex items-center gap-0.5 text-[#F59E0B]" aria-label="5 star rating">
            {"★★★★★".split("").map((s, i) => (
              <span key={i} className="text-sm">
                {s}
              </span>
            ))}
          </div>
          <p className="mt-2 text-sm leading-relaxed text-[#475569]">
            “FormBuilder made publishing and embedding our intake form feel premium — and the inbox
            just works.”
          </p>
          <div className="mt-3 flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#2563EB] text-xs font-semibold text-white">
              R
            </span>
            <div>
              <p className="text-sm font-semibold">Roshin</p>
              <p className="text-xs text-[#64748B]">Product designer</p>
            </div>
          </div>
        </div>
      </aside>

      <section className="relative flex min-h-screen flex-col px-4 py-6 sm:px-8 lg:px-10">
        <div className="mb-6 flex items-center justify-between gap-3 lg:justify-end">
          <Link to="/" className="inline-flex items-center gap-2 no-underline lg:hidden">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563EB] text-xs font-bold text-white">
              F
            </span>
            <span className="text-sm font-semibold">FormBuilder</span>
          </Link>
          <p className="text-sm text-[#64748B]">
            {switchPrompt}{" "}
            <Link
              to={switchHref}
              className="rounded-xl border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1.5 text-sm font-semibold text-[#2563EB] no-underline hover:bg-[#DBEAFE]"
            >
              {switchLabel}
            </Link>
          </p>
        </div>

        <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center pb-8">
          {children}

          <ul className="mt-8 flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-[#64748B]">
            {["Secure & private", "Trusted by teams", "Access anywhere"].map((item) => (
              <li key={item} className="inline-flex items-center gap-1.5">
                <span className="text-[#10B981]">✓</span>
                {item}
              </li>
            ))}
          </ul>
        </div>

        <p className="text-center text-[11px] text-[#94A3B8]">
          © {new Date().getFullYear()} FormBuilder · Terms · Privacy · Support
        </p>
      </section>
    </div>
  );
}
