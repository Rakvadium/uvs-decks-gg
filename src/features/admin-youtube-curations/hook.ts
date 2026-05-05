"use client";

import { useCallback, useState } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "../../../convex/_generated/dataModel";
import { extractYoutubeVideoId } from "../../../shared/extract-youtube-video-id";

export function useAdminYoutubeCurationModel() {
  const data = useQuery(api.communityYoutube.listYoutubeCurationsForAdmin, {});
  const add = useMutation(api.communityYoutube.addYoutubeCuration);
  const update = useMutation(api.communityYoutube.updateYoutubeCuration);
  const remove = useMutation(api.communityYoutube.deleteYoutubeCuration);
  const reorder = useMutation(api.communityYoutube.reorderYoutubeCurations);
  const requestRefresh = useAction(api.communityYoutube.requestClientRefresh);
  const [addUrl, setAddUrl] = useState("");

  const onAdd = useCallback(async () => {
    if (!addUrl.trim()) {
      toast.error("Paste a YouTube link or video id");
      return;
    }
    const parsedId = extractYoutubeVideoId(addUrl);
    if (!parsedId) {
      toast.error("Could not read a YouTube video id from that URL or text");
      return;
    }
    const ids = new Set(
      (data?.items ?? []).map((r) => r.youtubeVideoId)
    );
    if (ids.has(parsedId)) {
      toast.error("That video is already in the curation list");
      return;
    }
    try {
      await add({ urlOrId: addUrl.trim() });
      setAddUrl("");
      void requestRefresh({});
      toast.success("Video added to the curation");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add video");
    }
  }, [add, addUrl, data?.items, requestRefresh]);

  const onUpdateField = useCallback(
    async (args: {
      curationId: Id<"communityYoutubeCurations">;
      label?: string;
      accentClass?: string;
    }) => {
      try {
        await update({
          curationId: args.curationId,
          label: args.label,
          accentClass: args.accentClass,
        });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Update failed");
      }
    },
    [update]
  );

  const onDelete = useCallback(
    async (curationId: Id<"communityYoutubeCurations">) => {
      try {
        await remove({ curationId });
        toast.success("Removed from curation");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Delete failed");
      }
    },
    [remove]
  );

  const onReorder = useCallback(
    async (orderedCurationIds: Id<"communityYoutubeCurations">[]) => {
      try {
        await reorder({ orderedCurationIds });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Reorder failed");
      }
    },
    [reorder]
  );

  const onRefreshMetadata = useCallback(() => {
    void (async () => {
      const res = (await requestRefresh({})) as
        | { ok: true }
        | { ok: false; reason: "missing_api_key" | "rate_limited" }
        | undefined;
      if (res && res.ok) {
        toast.success("YouTube metadata updated");
        return;
      }
      if (res && "reason" in res) {
        if (res.reason === "missing_api_key") {
          toast.error("YOUTUBE_DATA_API_KEY is not set in Convex");
        } else {
          toast.error("Rate limited; try again in a few minutes");
        }
        return;
      }
      toast.message("No metadata refresh (check Convex logs)");
    })();
  }, [requestRefresh]);

  return {
    data,
    addUrl,
    setAddUrl,
    onAdd,
    onUpdateField,
    onDelete,
    onReorder,
    onRefreshMetadata,
  };
}
