import { Link } from "react-router-dom";
import { usePrefersReducedMotion } from "./usePrefersReducedMotion";

const outlineFields = [
  { icon: "T", label: "Text input", desc: "Single line answer", active: false },
  { icon: "@", label: "Email address", desc: "Validated email", active: true },
  { icon: "¶", label: "Textarea", desc: "Long form message", active: false },
  { icon: "▾", label: "Dropdown", desc: "Choose one option", active: false },
  { icon: "☑", label: "Checkbox", desc: "Select multiple", active: false },
  { icon: "Dt", label: "Date picker", desc: "Calendar date", active: false },
];

function EditorMockup() {
  return (
    <div
      className="relative"
      role="img"
      aria-label="FormBuilder editor preview with form outline and live form preview"
    >
      <div className="overflow-hidden rounded-2xl border border-[#E5E7EB] bg-white shadow-[0_30px_80px_-28px_rgba(37,99,235,0.35)]">
        <div className="grid min-h-[340px] grid-cols-[56px_1fr] sm:min-h-[400px] sm:grid-cols-[72px_1fr]">
          <aside className="flex flex-col items-center gap-4 border-r border-[#E5E7EB] bg-[#F8FAFC] py-4">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563EB] text-xs font-bold text-white">
              F
            </span>
            {["⌂", "☰", "▦", "▤", "⚙"].map((icon, i) => (
              <span
                key={icon}
                className={`flex h-8 w-8 items-center justify-center rounded-lg text-sm ${
                  i === 1 ? "bg-[#EFF6FF] text-[#2563EB]" : "text-[#94A3B8]"
                }`}
              >
                {icon}
              </span>
            ))}
          </aside>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#E5E7EB] px-3 py-2.5 sm:px-4">
              <div className="min-w-0">
                <p className="text-[10px] text-[#94A3B8] sm:text-xs">My Forms / Contact Form</p>
                <div className="mt-0.5 flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-[#0B1F44]">Contact Form</p>
                  <span className="inline-flex items-center gap-1 rounded-full bg-[#FFF7ED] px-2 py-0.5 text-[10px] font-medium text-[#C2410C]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#F97316]" />
                    Draft
                  </span>
                </div>
              </div>
              <div className="hidden items-center gap-1 rounded-lg bg-[#F1F5F9] p-0.5 text-[10px] sm:flex">
                <span className="rounded-md bg-white px-2 py-1 font-medium text-[#2563EB] shadow-sm">
                  Desktop
                </span>
                <span className="px-2 py-1 text-[#64748B]">Mobile</span>
                <span className="px-2 py-1 text-[#64748B]">Theme</span>
              </div>
            </div>

            <div className="grid gap-3 p-3 sm:grid-cols-[0.9fr_1.1fr] sm:p-4">
              <div className="rounded-xl border border-[#E5E7EB] bg-[#F8FAFC] p-2.5">
                <p className="mb-2 px-1 text-[11px] font-semibold text-[#0B1F44]">Form outline</p>
                <ul className="space-y-1.5">
                  {outlineFields.map((field) => (
                    <li
                      key={field.label}
                      className={`flex items-center gap-2 rounded-lg border px-2 py-1.5 ${
                        field.active
                          ? "border-[#2563EB] bg-[#EFF6FF]"
                          : "border-[#E5E7EB] bg-white"
                      }`}
                    >
                      <span className="text-[10px] leading-none text-[#CBD5E1]">⋮⋮</span>
                      <span
                        className={`flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-semibold ${
                          field.active
                            ? "bg-[#2563EB] text-white"
                            : "bg-[#EFF6FF] text-[#2563EB]"
                        }`}
                      >
                        {field.icon}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[11px] font-semibold text-[#0B1F44]">
                          {field.label}
                        </span>
                        <span className="block truncate text-[9px] text-[#94A3B8]">{field.desc}</span>
                      </span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="rounded-xl border border-[#E5E7EB] bg-white p-3 shadow-sm sm:p-4">
                <div className="mb-3 flex items-center gap-2">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#EFF6FF] text-[#2563EB]">
                    ✉
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-[#0B1F44]">Get in touch</p>
                    <p className="text-[10px] text-[#94A3B8]">We usually reply within a day</p>
                  </div>
                </div>
                <div className="space-y-2.5">
                  <label className="block">
                    <span className="text-[10px] font-medium text-[#64748B]">Your name</span>
                    <span className="mt-1 block h-8 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC]" />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-medium text-[#64748B]">Email address</span>
                    <span className="mt-1 block h-8 rounded-lg border border-[#BFDBFE] bg-[#EFF6FF] ring-2 ring-[#2563EB]/15" />
                  </label>
                  <label className="block">
                    <span className="text-[10px] font-medium text-[#64748B]">Message</span>
                    <span className="mt-1 block h-16 rounded-lg border border-[#E5E7EB] bg-[#F8FAFC]" />
                  </label>
                  <span className="mt-1 flex h-9 items-center justify-center rounded-lg bg-[#2563EB] text-xs font-semibold text-white">
                    Send message
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -top-3 right-2 z-10 flex max-w-[220px] items-start gap-2 rounded-xl border border-emerald-100 bg-white p-2.5 shadow-lg sm:right-4 sm:max-w-[240px]">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#10B981] text-white">
          <svg viewBox="0 0 20 20" className="h-4 w-4" fill="none" aria-hidden="true">
            <path d="M5 10.5 8.5 14 15 6.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </span>
        <div>
          <p className="text-xs font-semibold text-[#0B1F44]">Form published!</p>
          <p className="text-[10px] leading-snug text-[#64748B]">
            Your form is now live and ready to collect responses.
          </p>
        </div>
      </div>

      <div className="absolute -bottom-4 left-4 z-10 w-[170px] rounded-xl border border-[#E5E7EB] bg-white p-3 shadow-lg sm:left-8 sm:w-[190px]">
        <p className="text-[10px] font-medium text-[#64748B]">Total submissions</p>
        <div className="mt-1 flex items-end justify-between gap-2">
          <p className="text-lg font-semibold text-[#0B1F44]">2,847</p>
          <span className="rounded-full bg-[#ECFDF5] px-1.5 py-0.5 text-[10px] font-semibold text-[#047857]">
            +18%
          </span>
        </div>
        <div className="mt-2 flex h-8 items-end gap-0.5">
          {[40, 55, 45, 70, 60, 85, 75].map((h, i) => (
            <span
              key={i}
              className="flex-1 rounded-sm bg-gradient-to-t from-[#34D399] to-[#6EE7B7]"
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

export function Hero() {
  const reduced = usePrefersReducedMotion();

  return (
    <section className="relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 70% 50% at 15% 10%, rgba(191,219,254,0.55) 0%, transparent 55%), radial-gradient(ellipse 50% 40% at 90% 0%, rgba(221,214,254,0.45) 0%, transparent 50%), linear-gradient(180deg, #FFFFFF 0%, #F8FAFC 100%)",
        }}
      />

      <div className="mx-auto grid max-w-6xl gap-12 px-4 pb-20 pt-10 sm:px-6 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:gap-10 lg:pb-28 lg:pt-14">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-[#BFDBFE] bg-[#EFF6FF] px-3 py-1 text-xs font-medium text-[#1D4ED8]">
            <span aria-hidden="true">✦</span>
            Build forms. Collect insights. Grow faster.
          </span>

          <h1 className="mt-5 text-4xl font-semibold tracking-tight text-[#0B1F44] sm:text-5xl lg:text-[3.4rem] lg:leading-[1.08]">
            The simplest way to create{" "}
            <span className="bg-gradient-to-r from-[#2563EB] to-[#7C3AED] bg-clip-text text-transparent">
              powerful forms
            </span>
          </h1>

          <p className="mt-4 max-w-xl text-base leading-relaxed text-[#64748B] sm:text-lg">
            Design, publish, and embed beautiful forms in minutes. Versioned publishing, validated
            submissions, and an inbox your team can trust.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 rounded-xl bg-[#2563EB] px-5 py-3 text-sm font-semibold text-white no-underline shadow-lg shadow-blue-500/25 hover:bg-[#1D4ED8]"
            >
              Get started free
              <span aria-hidden="true">→</span>
            </Link>
            <a
              href="#product"
              className="inline-flex items-center gap-2 rounded-xl border border-[#E5E7EB] bg-white px-5 py-3 text-sm font-semibold text-[#0B1F44] no-underline hover:bg-[#F8FAFC]"
            >
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#EFF6FF] text-[#2563EB]">
                ▶
              </span>
              Watch demo
            </a>
          </div>

          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-[#64748B]">
            {["No credit card required", "Easy to use", "Loved by teams"].map((item) => (
              <li key={item} className="inline-flex items-center gap-1.5">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#ECFDF5] text-[10px] text-[#059669]">
                  ✓
                </span>
                {item}
              </li>
            ))}
          </ul>

          <p className="mt-5 hidden text-sm font-medium text-[#2563EB] sm:block">
            <span aria-hidden="true">↗ </span>
            Drag, drop, publish. Done!
          </p>
        </div>

        <div id="product" className={`pb-6 ${reduced ? "" : "landing-float"}`}>
          <EditorMockup />
        </div>
      </div>
    </section>
  );
}
