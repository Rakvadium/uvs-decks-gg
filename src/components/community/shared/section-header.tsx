import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { SectionHeading } from "@/components/ui/typography-headings";

interface CommunitySectionHeaderProps {
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function CommunitySectionHeader({
  title,
  description,
  action,
  className,
}: CommunitySectionHeaderProps) {
  return (
    <div className={cn("flex flex-wrap items-center justify-between gap-3", className)}>
      <div>
        <SectionHeading className="text-xl font-display font-bold uppercase tracking-[0.18em]">{title}</SectionHeading>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      {action}
    </div>
  );
}
