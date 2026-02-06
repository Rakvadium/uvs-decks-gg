"use client";

import { CreatorProgramCtaSection } from "./cta-section";
import { CreatorProgramHeroSection } from "./hero-section";
import { CreatorProgramToolkitSection } from "./toolkit-section";
import { CreatorProgramVerificationSection } from "./verification-section";

export function CreatorProgramView() {
  return (
    <div className="relative space-y-10 pb-6">
      <div className="pointer-events-none absolute -top-24 left-1/4 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute right-8 top-1/2 h-80 w-80 rounded-full bg-secondary/10 blur-3xl" />
      <div className="pointer-events-none absolute inset-0 grid-pattern opacity-25" />

      <CreatorProgramHeroSection />
      <CreatorProgramToolkitSection />
      <CreatorProgramVerificationSection />
      <CreatorProgramCtaSection />
    </div>
  );
}
