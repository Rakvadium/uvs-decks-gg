"use client";

import {
  FloatingPageBar,
  FloatingPageLayout,
  FloatingPageTitle,
} from "@/components/shell/floating-page-bar";
import { TeamsDecksBody } from "./body";
import { TeamsDecksHeading } from "./heading";

const TITLE = "Team decks";
const DESCRIPTION =
  "Decks shared with your team (view-only or team-editable). Open your hub for chat, news, and member tools.";

export function TeamsDecksView() {
  return (
    <FloatingPageLayout
      bar={
        <FloatingPageBar
          left={
            <FloatingPageTitle>{TITLE}</FloatingPageTitle>
          }
        />
      }
      contentClassName="relative"
    >
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="h-full w-full bg-gradient-to-b from-primary/[0.07] via-primary/[0.03] via-40% to-transparent to-100%" />
      </div>
      <div className="relative z-10">
        <div className="md:hidden">
          <TeamsDecksHeading title={TITLE} description={DESCRIPTION} />
        </div>
        <div className="flex-1 pt-4 pb-6 md:pt-0 md:pb-8">
          <TeamsDecksBody />
        </div>
      </div>
    </FloatingPageLayout>
  );
}
