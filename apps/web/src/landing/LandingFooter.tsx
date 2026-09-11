import { Link } from "react-router-dom";

export function LandingFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <p className="font-display text-lg font-semibold text-ink">Webform Builder</p>
          <p className="mt-2 max-w-md text-sm leading-relaxed text-ink-muted">
            Build beautiful forms. Publish instantly. Own every submission.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">Product</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-muted">
            <li>
              <a href="#features" className="no-underline hover:text-ink">
                Features
              </a>
            </li>
            <li>
              <a href="#how-it-works" className="no-underline hover:text-ink">
                How it works
              </a>
            </li>
            <li>
              <Link to="/app" className="no-underline hover:text-ink">
                Open app
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-ink">Resources</p>
          <ul className="mt-3 space-y-2 text-sm text-ink-muted">
            <li>
              <a
                href="https://github.com/arunparakkal/webform-builder/blob/main/ARCHITECTURE.md"
                target="_blank"
                rel="noreferrer"
                className="no-underline hover:text-ink"
              >
                Architecture
              </a>
            </li>
            <li>
              <a
                href="https://github.com/arunparakkal/webform-builder"
                target="_blank"
                rel="noreferrer"
                className="no-underline hover:text-ink"
              >
                GitHub
              </a>
            </li>
            <li>
              <span className="cursor-default" title="Placeholder — not connected">
                Contact <span className="text-xs">(soon)</span>
              </span>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-line py-4 text-center text-xs text-ink-muted">
        © {new Date().getFullYear()} Webform Builder. Assessment working slice.
      </div>
    </footer>
  );
}
