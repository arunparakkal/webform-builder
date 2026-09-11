import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { IconClose, IconMenu } from "./icons";

const links = [
  { href: "#features", label: "Features" },
  { href: "#how-it-works", label: "How it works" },
  { href: "#use-cases", label: "Use cases" },
  { href: "/ARCHITECTURE.md", label: "Architecture", external: true },
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
          ? "border-line/80 bg-surface/95 py-2.5 shadow-sm backdrop-blur-md"
          : "border-transparent bg-transparent py-4"
      }`}
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <a href="#top" className="flex items-baseline gap-2 no-underline">
          <span className="font-display text-xl font-semibold tracking-tight text-ink">Webform</span>
          <span className="text-sm text-ink-muted">Builder</span>
        </a>

        <nav className="hidden items-center gap-6 text-sm md:flex" aria-label="Primary">
          {links.map((link) =>
            link.external ? (
              <a
                key={link.label}
                href="https://github.com/arunparakkal/webform-builder/blob/main/ARCHITECTURE.md"
                target="_blank"
                rel="noreferrer"
                className="text-ink-muted no-underline hover:text-ink"
              >
                {link.label}
              </a>
            ) : (
              <a key={link.label} href={link.href} className="text-ink-muted no-underline hover:text-ink">
                {link.label}
              </a>
            ),
          )}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <Link
            to="/signin"
            className="rounded-md px-2 py-1 text-sm text-ink-muted no-underline hover:text-ink"
          >
            Sign in
          </Link>
          <Link
            to="/signup"
            className="rounded-md bg-accent px-3.5 py-2 text-sm font-medium text-white no-underline hover:bg-accent-hover"
          >
            Get started
          </Link>
        </div>

        <button
          type="button"
          className="rounded-md border border-line p-2 text-ink md:hidden"
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <IconClose /> : <IconMenu />}
        </button>
      </div>

      {open ? (
        <div className="border-t border-line bg-surface px-4 py-4 md:hidden">
          <nav className="flex flex-col gap-3 text-sm" aria-label="Mobile">
            {links.map((link) =>
              link.external ? (
                <a
                  key={link.label}
                  href="https://github.com/arunparakkal/webform-builder/blob/main/ARCHITECTURE.md"
                  target="_blank"
                  rel="noreferrer"
                  className="text-ink no-underline"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </a>
              ) : (
                <a
                  key={link.label}
                  href={link.href}
                  className="text-ink no-underline"
                  onClick={() => setOpen(false)}
                >
                  {link.label}
                </a>
              ),
            )}
            <Link
              to="/signin"
              className="text-ink no-underline"
              onClick={() => setOpen(false)}
            >
              Sign in
            </Link>
            <Link
              to="/signup"
              className="mt-2 rounded-md bg-accent px-3 py-2 text-center font-medium text-white no-underline"
              onClick={() => setOpen(false)}
            >
              Get started
            </Link>
          </nav>
        </div>
      ) : null}
    </header>
  );
}
