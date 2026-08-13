"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCreatorApply } from "../use-creator-apply";

export function CreatorProgramHeroActions() {
  const { startCreatorApply } = useCreatorApply();

  return (
    <div className="flex flex-wrap gap-3">
      <Button
        type="button"
        variant="default"
        size="lg"
        onClick={startCreatorApply}
        aria-label="Sign up to apply for creator verification"
      >
        Apply for Verification
      </Button>
      <Button variant="outline" size="lg" asChild>
        <Link href="#creator-toolkit">View Creator Toolkit</Link>
      </Button>
    </div>
  );
}
