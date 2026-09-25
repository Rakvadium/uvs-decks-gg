"use client";

import { DecksView } from "@/components/decks";
import { DecksFloatingTopBar } from "@/components/decks/decks-view/floating-top-bar";
import { FloatingPageLayout } from "@/components/shell/floating-page-bar";

export default function DecksPage() {
  return (
    <FloatingPageLayout bar={<DecksFloatingTopBar />}>
      <DecksView />
    </FloatingPageLayout>
  );
}
