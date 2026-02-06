import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export function CreatorProgramCtaSection() {
  return (
    <section className="rounded-2xl border border-border/60 bg-card/60 p-6 md:p-8">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <h2 className="text-xl font-display font-bold uppercase tracking-[0.18em]">Ready to Apply?</h2>
          <p className="text-sm text-muted-foreground">
            Share your best decklists and community wins, then submit your verification request.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="neon" size="lg">
            Start Verification
            <ArrowUpRight className="ml-2 h-4 w-4" />
          </Button>
          <Link href="/community">
            <Button variant="outline" size="lg">
              Return to Community
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
}
