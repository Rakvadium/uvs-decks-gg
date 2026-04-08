"use client";

import { CommunityRankingsView } from "@/components/community/community-rankings-view";
import { useRegisterSlot } from "@/components/shell/shell-slot-provider";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TierListBrowserCard } from "./browser-card";
import { useCommunityTierListsPageContext } from "./context";
import { CommunityTierListsPageCreateDialog } from "./create-dialog";
import { CommunityTierListsPageEmptyState } from "./empty-state";
import { CommunityTierListsPageLoadingState } from "./loading-state";
import { CommunityTierListsPageTopBar } from "./top-bar";

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
    <div className="relative flex h-full flex-col overflow-y-auto">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(59,130,246,0.08),transparent_28%),radial-gradient(circle_at_80%_10%,rgba(20,184,166,0.10),transparent_24%)]" />

      <div className="relative z-10 flex min-h-full flex-col p-4 md:p-6">
        <div className="flex-1">
          {activeTab === "rankings" ? (
            <CommunityRankingsView embedded />
          ) : activeTab === "mine" && !isAuthenticated ? (
            <Card className="border-dashed border-border/60 bg-card/65">
              <CardContent className="flex flex-col items-center gap-4 py-14 text-center">
                <p className="max-w-lg text-sm text-muted-foreground">
                  Sign in to keep private tier lists, manage your published ones, and jump straight into editing.
                </p>
                <Button onClick={openAuthDialog}>Sign in to view your lists</Button>
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
    </div>
  );
}
