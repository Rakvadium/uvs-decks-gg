"use client";

import { MobileLargeTitle } from "@/components/shell/mobile-large-title";
import { useMobileLayoutModeOptional, usesMenuChrome } from "@/components/shell/mobile-layout/mode";
import { useDecksOptional } from "@/providers/DecksProvider";

const SCOPE_TITLES = { "my-decks": "My Decks", public: "Public Decks", tournament: "Tournament Decks" } as const;

/** With Menu or Pannu the scope switch isn't in the page, so the title names the list being shown. */
export function DecksViewHeading() {
  const mode = useMobileLayoutModeOptional();
  const decks = useDecksOptional();
  const title = usesMenuChrome(mode) && decks ? SCOPE_TITLES[decks.state.activeTab] : "Decks";
  return <MobileLargeTitle>{title}</MobileLargeTitle>;
}
