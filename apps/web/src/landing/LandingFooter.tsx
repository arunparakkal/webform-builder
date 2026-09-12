import { Link } from "react-router-dom";

export function LandingFooter() {
  return (
    <footer className="border-t border-[#E5E7EB] bg-[#F8FAFC]">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 sm:grid-cols-2 sm:px-6 lg:grid-cols-4">
        <div className="lg:col-span-2">
          <div className="flex items-center gap-2.5">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#2563EB] text-xs font-bold text-white">
              F
            </span>
            <p className="text-lg font-semibold text-[#0B1F44]">FormBuilder</p>
          </div>
          <p className="mt-3 max-w-md text-sm leading-relaxed text-[#64748B]">
            Build beautiful forms. Publish instantly. Own every submission.
          </p>
        </div>
        <div>
          <p className="text-sm font-semibold text-[#0B1F44]">Product</p>
          <ul className="mt-3 space-y-2 text-sm text-[#64748B]">
            <li>
              <a href="#features" className="no-underline hover:text-[#0B1F44]">
                Features
              </a>
            </li>
            <li>
              <a href="#how-it-works" className="no-underline hover:text-[#0B1F44]">
                How it works
              </a>
            </li>
            <li>
              <Link to="/app" className="no-underline hover:text-[#0B1F44]">
                Open app
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <p className="text-sm font-semibold text-[#0B1F44]">Resources</p>
          <ul className="mt-3 space-y-2 text-sm text-[#64748B]">
            <li>
              <a
                href="https://github.com/arunparakkal/webform-builder/blob/main/ARCHITECTURE.md"
                target="_blank"
                rel="noreferrer"
                className="no-underline hover:text-[#0B1F44]"
              >
                Architecture
              </a>
            </li>
            <li>
              <a
                href="https://github.com/arunparakkal/webform-builder"
                target="_blank"
                rel="noreferrer"
                className="no-underline hover:text-[#0B1F44]"
              >
                GitHub
              </a>
            </li>
            <li>
              <Link to="/signin" className="no-underline hover:text-[#0B1F44]">
                Sign in
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-[#E5E7EB] py-4 text-center text-xs text-[#94A3B8]">
        © {new Date().getFullYear()} FormBuilder. Assessment working slice.
      </div>
    </footer>
  );
}
