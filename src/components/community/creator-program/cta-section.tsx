"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionHeading } from "@/components/ui/typography-headings";
import { useCreatorApply } from "./use-creator-apply";

export function CreatorProgramCtaSection() {
  const { startCreatorApply } = useCreatorApply();

  return (
    <section className="rounded-2xl border border-border/50 bg-card/80 p-6 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <SectionHeading className="text-xl font-display font-bold uppercase tracking-[0.18em]">Ready to Apply?</SectionHeading>
          <p className="text-sm text-muted-foreground">
            Share your best decklists and community wins, then submit your verification request.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button type="button" variant="neon" size="lg" onClick={startCreatorApply}>
            Start Verification
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/community">Return to Community</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
