"use client";

import Link from "next/link";
import { useConvexAuth, useQuery } from "convex/react";
import { Loader2 } from "lucide-react";
import { api } from "../../../../convex/_generated/api";
import { useAuthDialog } from "@/components/auth/auth-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getTierListScopeLabel } from "@/components/community/tier-lists/utils";

function formatUpdatedAt(timestamp: number) {
  return new Intl.DateTimeFormat(undefined, {
    month: "short",
    day: "numeric",
  }).format(timestamp);
}

export function CommunityTierListsSidebarPanel() {
  const { isAuthenticated } = useConvexAuth();
  const { openAuthDialog } = useAuthDialog();
  const publicFeed = useQuery(api.tierLists.listPublicFeed, { limit: 32 });
  const myLists = useQuery(api.tierLists.listMine, isAuthenticated ? { limit: 32 } : "skip");

  return (
    <div className="flex h-full min-h-0 flex-col">
      <Tabs defaultValue="public" className="flex min-h-0 flex-1 flex-col gap-0">
        <div className="shrink-0 border-b border-border/30 px-3 pb-0 pt-2">
          <TabsList className="h-10 w-full max-w-none">
            <TabsTrigger value="public" className="flex-1">
              Public
            </TabsTrigger>
            <TabsTrigger value="mine" className="flex-1">
              My lists
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="public" className="mt-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden">
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {publicFeed === undefined ? (
              <div className="space-y-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : publicFeed.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground">No public tier lists yet.</p>
            ) : (
              <ul className="space-y-2">
                {publicFeed.map(({ tierList, author }) => (
                  <li key={tierList._id}>
                    <Link
                      href={`/community/tier-lists/${tierList._id}`}
                      className="block rounded-lg border border-border/50 bg-card/35 px-3 py-2.5 transition-colors hover:border-primary/25 hover:bg-primary/5"
                    >
                      <div className="line-clamp-2 text-sm font-medium leading-snug">{tierList.title}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <span className="text-[10px] text-muted-foreground">
                          {author?.username ?? author?.email ?? "Community"}
                        </span>
                        <Badge variant="outline" className="h-5 px-1.5 text-[9px] font-normal">
                          {getTierListScopeLabel(tierList.rankingScope)}
                        </Badge>
                        <span className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">
                          {formatUpdatedAt(tierList.updatedAt)}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </TabsContent>
        <TabsContent value="mine" className="mt-0 flex min-h-0 flex-1 flex-col data-[state=inactive]:hidden">
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {!isAuthenticated ? (
              <div className="flex flex-col items-center gap-3 py-6 text-center">
                <p className="text-xs text-muted-foreground">Sign in to see your tier lists here.</p>
                <Button size="sm" type="button" onClick={() => openAuthDialog()}>
                  Sign in
                </Button>
              </div>
            ) : myLists === undefined ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
              </div>
            ) : myLists.length === 0 ? (
              <p className="text-center text-xs text-muted-foreground">You have no tier lists yet.</p>
            ) : (
              <ul className="space-y-2">
                {myLists.map((tierList) => (
                  <li key={tierList._id}>
                    <Link
                      href={`/community/tier-lists/${tierList._id}`}
                      className="block rounded-lg border border-border/50 bg-card/35 px-3 py-2.5 transition-colors hover:border-primary/25 hover:bg-primary/5"
                    >
                      <div className="line-clamp-2 text-sm font-medium leading-snug">{tierList.title}</div>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5">
                        <Badge variant={tierList.isPublic ? "default" : "outline"} className="h-5 px-1.5 text-[9px]">
                          {tierList.isPublic ? "Public" : "Private"}
                        </Badge>
                        <Badge variant="outline" className="h-5 px-1.5 text-[9px] font-normal">
                          {getTierListScopeLabel(tierList.rankingScope)}
                        </Badge>
                        <span className="text-[10px] font-mono uppercase tracking-wide text-muted-foreground">
                          {formatUpdatedAt(tierList.updatedAt)}
                        </span>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
