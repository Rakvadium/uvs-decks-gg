"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CreatorProgramView } from "@/components/community/creator-program-view";
import { FloatingBackPill, FloatingPageBar, FloatingPageLayout } from "@/components/shell/floating-page-bar";
import { Button } from "@/components/ui/button";

export default function CreatorProgramPage() {
  return (
    <FloatingPageLayout
      bar={
        <FloatingPageBar
          left={<FloatingBackPill href="/community" label="Community" iconOnly />}
        />
      }
    >
      <div className="md:hidden mb-4">
        <Button variant="ghost" size="icon" className="-ml-2" asChild>
          <Link href="/community" aria-label="Community">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
      </div>
      <CreatorProgramView />
    </FloatingPageLayout>
  );
}
