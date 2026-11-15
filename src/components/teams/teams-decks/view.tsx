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
      pageWash="fade"
    >
      <div className="md:hidden">
        <TeamsDecksHeading title={TITLE} description={DESCRIPTION} />
      </div>
      <div className="flex-1 pt-4 pb-6 md:pt-0 md:pb-8">
        <TeamsDecksBody />
      </div>
    </FloatingPageLayout>
  );
}
