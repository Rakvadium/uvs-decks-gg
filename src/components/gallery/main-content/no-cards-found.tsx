import { LayoutGrid } from "lucide-react";
import { motion } from "framer-motion";
import { usePrefersReducedMotion } from "@/lib/reduced-motion";
import { SectionHeading } from "@/components/ui/typography-headings";

export function NoCardsFound() {
  const prefersReducedMotion = usePrefersReducedMotion();

  return (
    <motion.div
      initial={false}
      animate={prefersReducedMotion ? {} : { opacity: 1, scale: 1 }}
      className="flex flex-col items-center justify-center py-24 text-center"
    >
      <div className="relative mb-6">
        <div className="flex h-20 w-20 items-center justify-center rounded-xl border border-primary/30 bg-primary/5" style={{ boxShadow: "var(--chrome-gallery-empty-icon-shadow)" }}>
          <LayoutGrid className="h-10 w-10 text-primary/50" />
        </div>
        <div className="absolute -inset-4 -z-10 rounded-2xl blur-xl" style={{ background: "var(--chrome-gallery-empty-wash)" }} />
      </div>
      <SectionHeading className="mb-2 text-xl font-display font-bold uppercase tracking-widest sm:text-xl">No Cards Found</SectionHeading>
      <p className="max-w-md text-sm font-mono tracking-wide text-muted-foreground">
        Try adjusting your search query or filters to find what you&apos;re looking for
      </p>
    </motion.div>
  );
}
