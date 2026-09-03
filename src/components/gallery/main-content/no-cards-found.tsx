import { LayoutGrid } from "lucide-react";
import { SectionHeading } from "@/components/ui/typography-headings";

export function NoCardsFound() {
  return (
    <div className="flex flex-col items-center justify-center py-24 text-center">
      <div className="relative mb-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-border/80" style={{ boxShadow: "var(--chrome-gallery-empty-icon-shadow)" }}>
          <LayoutGrid className="h-10 w-10 text-primary/50" />
        </div>
        <div className="absolute -inset-4 -z-10 rounded-2xl blur-xl" style={{ background: "var(--chrome-gallery-empty-wash)" }} />
      </div>
      <SectionHeading size="lg" className="mb-2">No Cards Found</SectionHeading>
      <p className="max-w-md text-sm tracking-wide text-muted-foreground">
        Try adjusting your search query or filters to find what you&apos;re looking for
      </p>
    </div>
  );
}
