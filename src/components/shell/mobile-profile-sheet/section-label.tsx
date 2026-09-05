import type { ReactNode } from "react";
import { Kicker } from "@/components/ui/typography-headings";

export function MobileProfileSectionLabel({ children }: { children: ReactNode }) {
  return (
    <Kicker size="sm" tone="muted" className="mb-1.5 block px-4 font-medium">
      {children}
    </Kicker>
  );
}
