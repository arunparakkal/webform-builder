import { useEffect } from "react";
import { Architecture } from "../landing/Architecture";
import { Features } from "../landing/Features";
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
    document.title = "Webform Builder | Build, Publish, and Manage Forms";
    const desc =
      "Design dynamic forms, publish immutable versions, and collect reliable submissions with Webform Builder.";
    let meta = document.querySelector('meta[name="description"]');
    if (!meta) {
      meta = document.createElement("meta");
      meta.setAttribute("name", "description");
      document.head.appendChild(meta);
    }
    meta.setAttribute("content", desc);
  }, []);

  return (
    <div id="top" className="min-h-screen bg-transparent">
      <LandingNav />
      <main>
        <Hero />
        <Features />
        <HowItWorks />
        <Versioning />
        <Architecture />
        <UseCases />
        <PublicFormPreview />
        <InboxPreview />
        <TechTrust />
        <FinalCta />
      </main>
      <LandingFooter />
    </div>
  );
}
