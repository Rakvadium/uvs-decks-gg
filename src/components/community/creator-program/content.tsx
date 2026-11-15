"use client";

import { CreatorProgramCtaSection } from "./cta-section";
import { CreatorProgramHeroSection } from "./hero-section";
import { CreatorProgramToolkitSection } from "./toolkit-section";
import { CreatorProgramVerificationSection } from "./verification-section";

export function CreatorProgramView() {
  return (
    <div className="space-y-10 pb-6">
      <CreatorProgramHeroSection />
      <CreatorProgramToolkitSection />
      <CreatorProgramVerificationSection />
      <CreatorProgramCtaSection />
    </div>
  );
}
