"use client";

import { useCallback, useState } from "react";
import { useMutation, useQuery, useAction } from "convex/react";
import { api } from "../../../convex/_generated/api";
import { toast } from "sonner";
import type { Id } from "../../../convex/_generated/dataModel";
import { extractYoutubeVideoId } from "../../../shared/extract-youtube-video-id";

export function useAdminYoutubeCurationModel() {
  const data = useQuery(api.communityYoutube.listYoutubeCurationsForAdmin, {});
  const channels = useQuery(api.communityYoutubeChannels.listYoutubeChannelsForAdmin, {});
  const add = useMutation(api.communityYoutube.addYoutubeCuration);
  const update = useMutation(api.communityYoutube.updateYoutubeCuration);
  const remove = useMutation(api.communityYoutube.deleteYoutubeCuration);
  const reorder = useMutation(api.communityYoutube.reorderYoutubeCurations);
  const addChannel = useAction(api.communityYoutubeChannels.addYoutubeChannel);
  const setChannelEnabled = useMutation(api.communityYoutubeChannels.setYoutubeChannelEnabled);
  const updateChannelTargeting = useMutation(
    api.communityYoutubeChannels.updateYoutubeChannelTargeting
  );
  const removeChannel = useMutation(api.communityYoutubeChannels.removeYoutubeChannel);
  const requestRefresh = useAction(api.communityYoutube.requestAdminFeedRefresh);
  const [addUrl, setAddUrl] = useState("");
  const [channelUrl, setChannelUrl] = useState("");
  const [channelIncludes, setChannelIncludes] = useState("");
  const [channelExcludes, setChannelExcludes] = useState("");
  const [channelPlaylist, setChannelPlaylist] = useState("");

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

  const onAddChannel = useCallback(async () => {
    if (!channelUrl.trim()) {
      toast.error("Paste a YouTube channel URL, @handle, or channel id");
      return;
    }
    try {
      const result = await addChannel({
        urlOrHandle: channelUrl.trim(),
        titleIncludes: channelIncludes.trim() || undefined,
        titleExcludes: channelExcludes.trim() || undefined,
        playlistUrlOrId: channelPlaylist.trim() || undefined,
      });
      setChannelUrl("");
      setChannelIncludes("");
      setChannelExcludes("");
      setChannelPlaylist("");
      void requestRefresh({});
      toast.success(`${result.title} added to the watchlist`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Could not add channel");
    }
  }, [
    addChannel,
    channelExcludes,
    channelIncludes,
    channelPlaylist,
    channelUrl,
    requestRefresh,
  ]);

  const onSaveChannelTargeting = useCallback(
    async (
      channelDocId: Id<"communityYoutubeChannels">,
      args: { titleIncludes: string; titleExcludes: string; playlistUrlOrId: string }
    ) => {
      try {
        await updateChannelTargeting({
          channelDocId,
          titleIncludes: args.titleIncludes,
          titleExcludes: args.titleExcludes,
          playlistUrlOrId: args.playlistUrlOrId,
        });
        void requestRefresh({});
        toast.success("Channel targeting updated");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not update targeting");
      }
    },
    [requestRefresh, updateChannelTargeting]
  );

  const onToggleChannelEnabled = useCallback(
    async (channelDocId: Id<"communityYoutubeChannels">, enabled: boolean) => {
      try {
        await setChannelEnabled({ channelDocId, enabled });
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not update channel");
      }
    },
    [setChannelEnabled]
  );

  const onRemoveChannel = useCallback(
    async (channelDocId: Id<"communityYoutubeChannels">) => {
      try {
        await removeChannel({ channelDocId });
        toast.success("Channel removed from the watchlist");
      } catch (e) {
        toast.error(e instanceof Error ? e.message : "Could not remove channel");
      }
    },
    [removeChannel]
  );

  const onRefreshMetadata = useCallback(() => {
    void (async () => {
      const res = (await requestRefresh({})) as
        | { ok: true }
        | { ok: false; reason?: string }
        | undefined;
      if (res && res.ok) {
        toast.success("Channel uploads and metadata updated");
        return;
      }
      if (res && "reason" in res && res.reason) {
        if (res.reason === "missing_api_key") {
          toast.error("YOUTUBE_DATA_API_KEY is not set in Convex");
        } else if (res.reason === "rate_limited") {
          toast.error("Rate limited; try again in a few minutes");
        } else if (res.reason === "no_curations") {
          toast.error("No matching videos yet. Check title filters, then refresh again.");
        } else {
          toast.error(res.reason);
        }
        return;
      }
      toast.message("No metadata refresh (check Convex logs)");
    })();
  }, [requestRefresh]);

  return {
    data,
    channels,
    addUrl,
    setAddUrl,
    channelUrl,
    setChannelUrl,
    channelIncludes,
    setChannelIncludes,
    channelExcludes,
    setChannelExcludes,
    channelPlaylist,
    setChannelPlaylist,
    onAdd,
    onAddChannel,
    onSaveChannelTargeting,
    onToggleChannelEnabled,
    onRemoveChannel,
    onUpdateField,
    onDelete,
    onReorder,
    onRefreshMetadata,
  };
}
