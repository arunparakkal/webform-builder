import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IconClose, IconMenu } from "./icons";

const links = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#use-cases", label: "Use cases" },
  { href: "#resources", label: "Resources" },
];

export function LandingNav() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className={`sticky top-0 z-50 border-b transition-[padding,background-color,box-shadow,border-color] duration-200 ${
        scrolled
          ? "border-[#E5E7EB]/80 bg-white/90 py-2.5 shadow-sm backdrop-blur-md"
          : "border-transparent bg-transparent py-4"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <a href="#top" className="flex items-center gap-2.5 no-underline">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#2563EB] text-sm font-bold text-white shadow-sm shadow-blue-500/30">
            F
          </span>
          <span className="text-[15px] font-semibold tracking-tight text-[#0B1F44]">FormBuilder</span>
        </a>

        <nav className="hidden items-center gap-7 text-sm md:flex" aria-label="Primary">
          {links.map((link) => (
            <a
              key={link.label}
              href={link.href}
              className="text-[#64748B] no-underline hover:text-[#0B1F44]"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/signin"
            className="rounded-xl px-2 py-1.5 text-sm font-medium text-[#64748B] no-underline hover:text-[#0B1F44]"
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className="inline-flex items-center gap-1.5 rounded-xl bg-[#2563EB] px-4 py-2.5 text-sm font-semibold text-white no-underline shadow-sm shadow-blue-500/25 hover:bg-[#1D4ED8]"
          >
            Get started free
            <span aria-hidden="true">→</span>
          </Link>
        </div>

        <button
          type="button"
          className="rounded-xl border border-[#E5E7EB] p-2 text-[#0B1F44] md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <IconClose /> : <IconMenu />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-[#E5E7EB] bg-white px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3 text-sm" aria-label="Mobile">
            {links.map((link) => (
              <a
                key={link.label}
                href={link.href}
                className="text-[#0B1F44] no-underline"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </a>
            ))}
            <Link to="/signin" className="text-[#0B1F44] no-underline" onClick={() => setOpen(false)}>
              Sign in
            </Link>
            <Link
              to="/signup"
              className="mt-1 rounded-xl bg-[#2563EB] px-3 py-2.5 text-center font-semibold text-white no-underline"
              onClick={() => setOpen(false)}
            >
              Get started free
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
