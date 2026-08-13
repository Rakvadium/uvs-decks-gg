"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { useCreatorApply } from "../use-creator-apply";

export function CreatorProgramHeroActions() {
  const { startCreatorApply } = useCreatorApply();

  return (
    <div className="flex flex-wrap gap-3">
      <Button type="button" variant="neon" size="lg" onClick={startCreatorApply}>
        Apply for Verification
      </Button>
      <Button variant="outline" size="lg" asChild>
        <Link href="#creator-toolkit">View Creator Toolkit</Link>
      </Button>
      <Button variant="ghost" size="lg" asChild>
        <Link href="/community">Back to Community</Link>
      </Button>
    </div>
  );
}
