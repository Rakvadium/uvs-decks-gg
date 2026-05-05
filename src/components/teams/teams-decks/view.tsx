"use client";

import { AppPageHeader } from "@/components/shell/app-page-header";
import { TeamsDecksBody } from "./body";
import { TeamsDecksHeading } from "./heading";

const TITLE = "Team decks";
const DESCRIPTION =
  "Decks shared with your team (view-only or team-editable). Open your hub for chat, news, and member tools.";

export function TeamsDecksView() {
  return (
    <div className="relative min-h-0">
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
        <div className="h-full w-full bg-gradient-to-b from-primary/[0.06] via-cyan-500/[0.03] via-40% to-transparent to-100%" />
      </div>
      <div className="relative z-10 px-4 py-2 md:px-6 md:py-4">
        <div className="md:hidden">
          <TeamsDecksHeading title={TITLE} description={DESCRIPTION} />
        </div>
        <div className="hidden md:block">
          <AppPageHeader
            className="rounded-none border-x-0"
            innerClassName="!px-0"
            title={TITLE}
            description={DESCRIPTION}
          />
        </div>
        <div className="flex-1 pt-4 pb-6 md:pt-6 md:pb-8">
          <TeamsDecksBody />
        </div>
      </div>
    </div>
  );
}
