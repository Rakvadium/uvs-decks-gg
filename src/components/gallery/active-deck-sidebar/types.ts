import type { CachedCard } from "@/lib/universus";

export interface SectionGroup {
  type: string;
  label: string;
  total: number;
  cards: Array<{ card: CachedCard; count: number }>;
}
