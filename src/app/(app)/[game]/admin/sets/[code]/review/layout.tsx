import type { ReactNode } from "react";
import { requireGameFeature } from "@/lib/routing/game-feature-route";

/** Card draft review (image → draft OCR) is only for games with `features.cardOcrDrafts`. */
export default async function AdminSetReviewLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ game: string; code: string }>;
}) {
  await requireGameFeature(params, "cardOcrDrafts");
  return children;
}
