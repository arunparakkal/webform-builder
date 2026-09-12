import { useEffect } from "react";
import { Architecture } from "../landing/Architecture";
import { Features, LogoCloud } from "../landing/Features";
import { FinalCta } from "../landing/FinalCta";
import { Hero } from "../landing/Hero";
import { HowItWorks } from "../landing/HowItWorks";
import { InboxPreview } from "../landing/InboxPreview";
import { LandingFooter } from "../landing/LandingFooter";
import { LandingNav } from "../landing/LandingNav";
import { PublicFormPreview } from "../landing/PublicFormPreview";
import { TechTrust } from "../landing/TechTrust";
import { UseCases } from "../landing/UseCases";
import { Versioning } from "../landing/Versioning";

export function LandingPage() {
  useEffect(() => {
    document.title = "FormBuilder | The simplest way to create powerful forms";
    const desc =
      "Design, publish, and embed beautiful forms. Versioned publishing, validated submissions, and an inbox your team can trust.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);
  }, []);

  return (
    <div id="top" className="min-h-screen bg-white text-[#0B1F44]">
      <LandingNav />
      <main>
        <Hero />
        <LogoCloud />
        <Features />
        <HowItWorks />
        <Versioning />
        <Architecture />
        <UseCases />
        <PublicFormPreview />
        <InboxPreview />
        <TechTrust />
        <div id="resources">
          <FinalCta />
        </div>
      </main>
      <LandingFooter />
    </div>
  );
}
