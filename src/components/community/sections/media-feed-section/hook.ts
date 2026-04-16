"use client";

import { useQuery, useAction } from "convex/react";
import { useEffect, useRef } from "react";
import { api } from "../../../../../convex/_generated/api";

export function useCommunityMediaFeedModel() {
  const feed = useQuery(api.communityYoutube.getFeed, {});
  const bootstrap = useAction(api.communityYoutube.bootstrapYoutubeCurationIds);
  const refresh = useAction(api.communityYoutube.requestClientRefresh);

  const bootstrapRef = useRef(false);
  useEffect(() => {
    if (bootstrapRef.current) return;
    bootstrapRef.current = true;
    void bootstrap({});
  }, [bootstrap]);

  const initialRefreshRef = useRef(false);
  useEffect(() => {
    if (feed === undefined || initialRefreshRef.current) return;
    if (
      feed.feedKind === "pending_all" ||
      feed.feedKind === "partial" ||
      feed.feedKind === "error_all"
    ) {
      initialRefreshRef.current = true;
      void refresh({});
    }
  }, [feed, refresh]);

  return { feed };
}
