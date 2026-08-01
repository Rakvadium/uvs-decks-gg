"use client";

import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { CommunityRankingsView } from "@/components/community/community-rankings-view";
import { useRegisterSlot } from "@/components/shell/shell-slot-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TierListBrowserCard } from "./browser-card";
import { useCommunityTierListsPageContext } from "./context";
import { CommunityTierListsPageCreateDialog } from "./create-dialog";
import { CommunityTierListsPageEmptyState } from "./empty-state";
import { CommunityMobileDestinationNav } from "@/components/community/community-mobile-destination-nav";
import { CommunityTierListsPageHeading } from "./heading";
import { CommunityTierListsPageLoadingState } from "./loading-state";
import {
  CommunityTierListsPagePrimaryAction,
  CommunityTierListsPageTopBar,
} from "./top-bar";

export function CommunityTierListsPageView() {
  const {
    activeTab,
    isAuthenticated,
    openAuthDialog,
    isLoadingActiveTab,
    filteredPublicLists,
    filteredMyLists,
    cardMap,
    handleOpenCreateDialog,
  } = useCommunityTierListsPageContext();

  useRegisterSlot("top-bar", "community-tier-lists-page", CommunityTierListsPageTopBar);

  return (
    <div className="space-y-6">
      <div className="md:hidden space-y-3">
        <Button variant="ghost" size="sm" className="-ml-2 h-8 w-fit gap-2 px-2" asChild>
          <Link href="/community">
            <ArrowLeft className="h-4 w-4 shrink-0" />
            Back to community
          </Link>
        </Button>
        <div className="flex min-w-0 items-center gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <CommunityMobileDestinationNav />
        </div>
        <CommunityTierListsPageHeading />
        <CommunityTierListsPagePrimaryAction className="w-full justify-center" label="New Tier List" />
      </div>

      <div className="flex-1 pt-2 md:pt-0">
        {activeTab === "rankings" ? (
          <CommunityRankingsView embedded />
        ) : activeTab === "mine" && !isAuthenticated ? (
          <Card className="border-dashed border-border/50 bg-card/80">
            <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
              <p className="max-w-lg text-sm text-muted-foreground">
                Sign in to keep private tier lists, manage your published ones, and jump straight into editing.
              </p>
              <Button onClick={() => openAuthDialog()}>Sign in to view your lists</Button>
            </CardContent>
          </Card>
        ) : isLoadingActiveTab ? (
          <CommunityTierListsPageLoadingState />
        ) : activeTab === "public" && filteredPublicLists.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredPublicLists.map((entry) => (
              <TierListBrowserCard
                key={entry.tierList._id}
                tierList={entry.tierList}
                authorLabel={entry.author?.username ?? entry.author?.email ?? "Unknown duelist"}
                cardMap={cardMap}
                href={`/community/tier-lists/${entry.tierList._id}`}
              />
            ))}
          </div>
        ) : activeTab === "mine" && filteredMyLists.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredMyLists.map((tierList) => (
              <TierListBrowserCard
                key={tierList._id}
                tierList={tierList}
                authorLabel="Your list"
                cardMap={cardMap}
                href={`/community/tier-lists/${tierList._id}`}
              />
            ))}
          </div>
        ) : (
          <CommunityTierListsPageEmptyState
            message={
              activeTab === "mine"
                ? "No saved tier lists match that search yet."
                : "No public tier lists match that search yet."
            }
            action={
              activeTab === "mine" ? (
                <Button onClick={handleOpenCreateDialog}>Create your first list</Button>
              ) : undefined
            }
          />
        )}
      </div>

      <CommunityTierListsPageCreateDialog />
    </div>
  );
}
