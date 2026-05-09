"use client";

import { AppPageHeader } from "@/components/shell/app-page-header";
import { DeckCreateDialog } from "./create-dialog";
import { DecksViewContent } from "./content";
import { DecksViewHeading } from "./heading";
import { DecksPagePrimaryAction, DecksPageSearch, DecksPageTabs } from "./top-bar";

export function DecksView() {
  return (
    <div className="space-y-6">
      <div className="md:hidden">
        <DecksViewHeading />
      </div>

      <div className="hidden md:block">
        <AppPageHeader
          title="Deck Database"
          description="Build, browse, and manage decks."
          tabs={<DecksPageTabs />}
          toolbar={<DecksPageSearch />}
          actions={<DecksPagePrimaryAction />}
        />
      </div>

      <DeckCreateDialog />
      <DecksViewContent />
    </div>
  );
}
