import { v } from "convex/values";
import { getAuthUserId } from "@convex-dev/auth/server";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
  type ActionCtx,
} from "./_generated/server";
import { internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { requireAdmin } from "./utils/validation";
import { extractYoutubeChannelRef } from "../shared/extract-youtube-channel-ref";
import { extractYoutubePlaylistId } from "../shared/extract-youtube-playlist-id";
import { parseKeywordList, titleMatchesFilters } from "../shared/youtube-title-filters";

const DEFAULT_MAX_VIDEOS = 8;
const PLAYLIST_FETCH_CAP = 20;
const FILTERED_PLAYLIST_FETCH_CAP = 50;

const youtubeChannelDocValidator = v.object({
  _id: v.id("communityYoutubeChannels"),
  _creationTime: v.number(),
  channelId: v.string(),
  title: v.string(),
  handle: v.optional(v.string()),
  uploadsPlaylistId: v.string(),
  topicPlaylistId: v.optional(v.string()),
  titleIncludes: v.optional(v.array(v.string())),
  titleExcludes: v.optional(v.array(v.string())),
  enabled: v.boolean(),
  maxVideos: v.number(),
  lastSyncedAt: v.optional(v.number()),
  lastSyncError: v.optional(v.string()),
});
const YOUTUBE_CHANNELS_API = "https://www.googleapis.com/youtube/v3/channels";
const YOUTUBE_PLAYLIST_ITEMS_API = "https://www.googleapis.com/youtube/v3/playlistItems";

function parsePublishedAt(iso?: string): number | undefined {
  if (!iso) return undefined;
  const n = Date.parse(iso);
  return Number.isFinite(n) ? n : undefined;
}

type ResolvedChannel = {
  channelId: string;
  title: string;
  handle?: string;
  uploadsPlaylistId: string;
};

type ChannelListItem = {
  id?: string;
  snippet?: {
    title?: string;
    customUrl?: string;
  };
  contentDetails?: {
    relatedPlaylists?: {
      uploads?: string;
    };
  };
};

async function resolveYoutubeChannel(
  apiKey: string,
  ref: ReturnType<typeof extractYoutubeChannelRef>
): Promise<ResolvedChannel | null> {
  if (!ref) return null;
  const url = new URL(YOUTUBE_CHANNELS_API);
  url.searchParams.set("part", "snippet,contentDetails");
  url.searchParams.set("key", apiKey);
  if (ref.kind === "id") {
    url.searchParams.set("id", ref.channelId);
  } else if (ref.kind === "handle") {
    url.searchParams.set("forHandle", ref.handle);
  } else {
    url.searchParams.set("forUsername", ref.username);
  }

  const res = await fetch(url.toString(), { method: "GET" });
  const json = (await res.json()) as {
    items?: ChannelListItem[];
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(json.error?.message ?? `http_${res.status}`);
  }
  const item = json.items?.[0];
  const channelId = item?.id;
  const uploadsPlaylistId = item?.contentDetails?.relatedPlaylists?.uploads;
  if (!channelId || !uploadsPlaylistId) {
    return null;
  }
  const customUrl = item.snippet?.customUrl?.replace(/^@/, "");
  return {
    channelId,
    title: item.snippet?.title?.trim() || channelId,
    handle: customUrl || (ref.kind === "handle" ? ref.handle : undefined),
    uploadsPlaylistId,
  };
}

async function fetchUploads(
  apiKey: string,
  uploadsPlaylistId: string,
  maxResults: number
): Promise<Array<{ youtubeVideoId: string; title: string; publishedAt?: number }>> {
  const url = new URL(YOUTUBE_PLAYLIST_ITEMS_API);
  url.searchParams.set("part", "snippet,contentDetails");
  url.searchParams.set("playlistId", uploadsPlaylistId);
  url.searchParams.set("maxResults", String(Math.min(50, Math.max(1, maxResults))));
  url.searchParams.set("key", apiKey);

  const res = await fetch(url.toString(), { method: "GET" });
  const json = (await res.json()) as {
    items?: Array<{
      contentDetails?: { videoId?: string };
      snippet?: {
        title?: string;
        resourceId?: { videoId?: string };
        publishedAt?: string;
      };
    }>;
    error?: { message?: string };
  };
  if (!res.ok) {
    throw new Error(json.error?.message ?? `http_${res.status}`);
  }

  const rows: Array<{ youtubeVideoId: string; title: string; publishedAt?: number }> = [];
  const seen = new Set<string>();
  for (const item of json.items ?? []) {
    const youtubeVideoId =
      item.contentDetails?.videoId ?? item.snippet?.resourceId?.videoId;
    if (!youtubeVideoId || seen.has(youtubeVideoId)) continue;
    seen.add(youtubeVideoId);
    rows.push({
      youtubeVideoId,
      title: item.snippet?.title ?? "",
      publishedAt: parsePublishedAt(item.snippet?.publishedAt),
    });
  }
  return rows;
}

export const listEnabledChannelsInternal = internalQuery({
  args: {},
  returns: v.array(youtubeChannelDocValidator),
  handler: async (ctx) => {
    const rows = await ctx.db.query("communityYoutubeChannels").collect();
    return rows.filter((row) => row.enabled);
  },
});

export const getChannelByYoutubeId = internalQuery({
  args: { channelId: v.string() },
  returns: v.union(v.null(), youtubeChannelDocValidator),
  handler: async (ctx, args) => {
    return await ctx.db
      .query("communityYoutubeChannels")
      .withIndex("by_channelId", (q) => q.eq("channelId", args.channelId))
      .unique();
  },
});

export const upsertResolvedChannel = internalMutation({
  args: {
    channelId: v.string(),
    title: v.string(),
    handle: v.optional(v.string()),
    uploadsPlaylistId: v.string(),
    maxVideos: v.optional(v.number()),
    topicPlaylistId: v.optional(v.string()),
    titleIncludes: v.optional(v.array(v.string())),
    titleExcludes: v.optional(v.array(v.string())),
  },
  returns: v.id("communityYoutubeChannels"),
  handler: async (ctx, args): Promise<Id<"communityYoutubeChannels">> => {
    const existing = await ctx.db
      .query("communityYoutubeChannels")
      .withIndex("by_channelId", (q) => q.eq("channelId", args.channelId))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        title: args.title,
        handle: args.handle,
        uploadsPlaylistId: args.uploadsPlaylistId,
        topicPlaylistId: args.topicPlaylistId ?? existing.topicPlaylistId,
        titleIncludes: args.titleIncludes ?? existing.titleIncludes,
        titleExcludes: args.titleExcludes ?? existing.titleExcludes,
      });
      return existing._id;
    }
    return await ctx.db.insert("communityYoutubeChannels", {
      channelId: args.channelId,
      title: args.title,
      handle: args.handle,
      uploadsPlaylistId: args.uploadsPlaylistId,
      topicPlaylistId: args.topicPlaylistId,
      titleIncludes: args.titleIncludes,
      titleExcludes: args.titleExcludes,
      enabled: true,
      maxVideos: args.maxVideos ?? DEFAULT_MAX_VIDEOS,
    });
  },
});

export const markChannelSync = internalMutation({
  args: {
    channelDocId: v.id("communityYoutubeChannels"),
    lastSyncedAt: v.number(),
    lastSyncError: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.channelDocId, {
      lastSyncedAt: args.lastSyncedAt,
      lastSyncError: args.lastSyncError,
    });
  },
});

export const applyChannelUploads = internalMutation({
  args: {
    channelId: v.string(),
    maxVideos: v.number(),
    titleIncludes: v.optional(v.array(v.string())),
    titleExcludes: v.optional(v.array(v.string())),
    videos: v.array(
      v.object({
        youtubeVideoId: v.string(),
        title: v.string(),
        publishedAt: v.optional(v.number()),
      })
    ),
  },
  handler: async (ctx, args) => {
    const remaining = await ctx.db.query("communityYoutubeCurations").collect();
    const exclusions =
      remaining.length === 0
        ? []
        : await ctx.db.query("communityYoutubeFeedExclusions").collect();
    const excluded = new Set(exclusions.map((row) => row.youtubeVideoId));

    const incoming = args.videos.filter(
      (video) =>
        !excluded.has(video.youtubeVideoId) &&
        titleMatchesFilters(video.title, args.titleIncludes, args.titleExcludes)
    );
    const keepIds = new Set(
      incoming.slice(0, Math.max(1, args.maxVideos)).map((video) => video.youtubeVideoId)
    );

    for (const video of incoming) {
      if (!keepIds.has(video.youtubeVideoId)) continue;
      const existing = await ctx.db
        .query("communityYoutubeCurations")
        .withIndex("by_youtubeVideoId", (q) =>
          q.eq("youtubeVideoId", video.youtubeVideoId)
        )
        .unique();
      if (existing) {
        const patch: {
          source?: "manual" | "channel";
          sourceChannelId?: string;
          publishedAt?: number;
        } = {};
        if (existing.source !== "manual") {
          patch.source = "channel";
          patch.sourceChannelId = args.channelId;
        }
        if (video.publishedAt !== undefined && existing.publishedAt !== video.publishedAt) {
          patch.publishedAt = video.publishedAt;
        }
        if (Object.keys(patch).length > 0) {
          await ctx.db.patch(existing._id, patch);
        }
        continue;
      }
      await ctx.db.insert("communityYoutubeCurations", {
        youtubeVideoId: video.youtubeVideoId,
        sortOrder: video.publishedAt ?? Date.now(),
        source: "channel",
        sourceChannelId: args.channelId,
        publishedAt: video.publishedAt,
      });
    }

    const sourced = await ctx.db
      .query("communityYoutubeCurations")
      .withIndex("by_sourceChannelId", (q) => q.eq("sourceChannelId", args.channelId))
      .collect();
    for (const row of sourced) {
      if (row.source === "manual") continue;
      if (keepIds.has(row.youtubeVideoId)) continue;
      await ctx.db.delete(row._id);
    }
  },
});

export const listYoutubeChannelsForAdmin = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("communityYoutubeChannels").collect();
    rows.sort((a, b) => a.title.localeCompare(b.title));
    return rows.map((row) => ({
      channelDocId: row._id,
      channelId: row.channelId,
      title: row.title,
      handle: row.handle,
      enabled: row.enabled,
      maxVideos: row.maxVideos,
      topicPlaylistId: row.topicPlaylistId,
      titleIncludes: row.titleIncludes,
      titleExcludes: row.titleExcludes,
      lastSyncedAt: row.lastSyncedAt,
      lastSyncError: row.lastSyncError,
    }));
  },
});

export const updateYoutubeChannelTargeting = mutation({
  args: {
    channelDocId: v.id("communityYoutubeChannels"),
    titleIncludes: v.optional(v.string()),
    titleExcludes: v.optional(v.string()),
    playlistUrlOrId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const row = await ctx.db.get(args.channelDocId);
    if (!row) {
      throw new Error("Channel not found");
    }
    const patch: {
      titleIncludes?: string[];
      titleExcludes?: string[];
      topicPlaylistId?: string;
    } = {};
    if (args.titleIncludes !== undefined) {
      const parsed = parseKeywordList(args.titleIncludes);
      patch.titleIncludes = parsed.length > 0 ? parsed : undefined;
    }
    if (args.titleExcludes !== undefined) {
      const parsed = parseKeywordList(args.titleExcludes);
      patch.titleExcludes = parsed.length > 0 ? parsed : undefined;
    }
    if (args.playlistUrlOrId !== undefined) {
      const trimmed = args.playlistUrlOrId.trim();
      if (trimmed === "") {
        patch.topicPlaylistId = undefined;
      } else {
        const playlistId = extractYoutubePlaylistId(trimmed);
        if (!playlistId) {
          throw new Error("Could not read a YouTube playlist id from that URL or text");
        }
        patch.topicPlaylistId = playlistId;
      }
    }
    await ctx.db.patch(args.channelDocId, patch);
  },
});

export const setYoutubeChannelEnabled = mutation({
  args: {
    channelDocId: v.id("communityYoutubeChannels"),
    enabled: v.boolean(),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const row = await ctx.db.get(args.channelDocId);
    if (!row) {
      throw new Error("Channel not found");
    }
    await ctx.db.patch(args.channelDocId, { enabled: args.enabled });
  },
});

export const removeYoutubeChannel = mutation({
  args: { channelDocId: v.id("communityYoutubeChannels") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const row = await ctx.db.get(args.channelDocId);
    if (!row) {
      throw new Error("Channel not found");
    }
    const sourced = await ctx.db
      .query("communityYoutubeCurations")
      .withIndex("by_sourceChannelId", (q) => q.eq("sourceChannelId", row.channelId))
      .collect();
    for (const curation of sourced) {
      if (curation.source === "manual") continue;
      await ctx.db.delete(curation._id);
    }
    await ctx.db.delete(args.channelDocId);
  },
});

async function syncOneChannel(
  ctx: ActionCtx,
  apiKey: string,
  channel: {
    _id: Id<"communityYoutubeChannels">;
    channelId: string;
    uploadsPlaylistId: string;
    topicPlaylistId?: string;
    titleIncludes?: string[];
    titleExcludes?: string[];
    maxVideos: number;
  }
): Promise<void> {
  try {
    const hasFilters =
      (channel.titleIncludes?.length ?? 0) > 0 ||
      (channel.titleExcludes?.length ?? 0) > 0;
    const limit = hasFilters
      ? FILTERED_PLAYLIST_FETCH_CAP
      : Math.min(PLAYLIST_FETCH_CAP, Math.max(channel.maxVideos, DEFAULT_MAX_VIDEOS));
    const videos = await fetchUploads(
      apiKey,
      channel.topicPlaylistId ?? channel.uploadsPlaylistId,
      limit
    );
    await ctx.runMutation(internal.communityYoutubeChannels.applyChannelUploads, {
      channelId: channel.channelId,
      maxVideos: channel.maxVideos,
      titleIncludes: channel.titleIncludes,
      titleExcludes: channel.titleExcludes,
      videos,
    });
    await ctx.runMutation(internal.communityYoutubeChannels.markChannelSync, {
      channelDocId: channel._id,
      lastSyncedAt: Date.now(),
    });
  } catch (error) {
    await ctx.runMutation(internal.communityYoutubeChannels.markChannelSync, {
      channelDocId: channel._id,
      lastSyncedAt: Date.now(),
      lastSyncError: error instanceof Error ? error.message : "sync_failed",
    });
  }
}

export const syncEnabledChannels = internalAction({
  args: {},
  returns: v.object({
    ok: v.boolean(),
    reason: v.optional(v.literal("missing_api_key")),
  }),
  handler: async (
    ctx
  ): Promise<{ ok: boolean; reason?: "missing_api_key" }> => {
    const apiKey = process.env.YOUTUBE_DATA_API_KEY?.trim() ?? "";
    if (apiKey === "") {
      return { ok: false as const, reason: "missing_api_key" as const };
    }

    const officialId = process.env.UNIVERSUS_YOUTUBE_CHANNEL_ID?.trim() ?? "";
    if (officialId) {
      const existing = await ctx.runQuery(
        internal.communityYoutubeChannels.getChannelByYoutubeId,
        { channelId: officialId }
      );
      if (!existing) {
        try {
          const resolved = await resolveYoutubeChannel(apiKey, {
            kind: "id",
            channelId: officialId,
          });
          if (resolved) {
            await ctx.runMutation(internal.communityYoutubeChannels.upsertResolvedChannel, {
              channelId: resolved.channelId,
              title: resolved.title,
              handle: resolved.handle,
              uploadsPlaylistId: resolved.uploadsPlaylistId,
            });
          }
        } catch {
          void 0;
        }
      }
    }

    const channels = await ctx.runQuery(
      internal.communityYoutubeChannels.listEnabledChannelsInternal,
      {}
    );
    for (const channel of channels) {
      await syncOneChannel(ctx, apiKey, channel);
    }
    return { ok: true as const };
  },
});

export const addYoutubeChannel = action({
  args: {
    urlOrHandle: v.string(),
    titleIncludes: v.optional(v.string()),
    titleExcludes: v.optional(v.string()),
    playlistUrlOrId: v.optional(v.string()),
  },
  returns: v.object({
    channelDocId: v.id("communityYoutubeChannels"),
    channelId: v.string(),
    title: v.string(),
  }),
  handler: async (
    ctx,
    args
  ): Promise<{
    channelDocId: Id<"communityYoutubeChannels">;
    channelId: string;
    title: string;
  }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    await ctx.runMutation(internal.admin.ensureAdminForAction, { userId });

    const ref = extractYoutubeChannelRef(args.urlOrHandle);
    if (!ref) {
      throw new Error("Could not read a YouTube channel id or handle from that URL or text");
    }

    const apiKey = process.env.YOUTUBE_DATA_API_KEY?.trim() ?? "";
    if (apiKey === "") {
      throw new Error("YOUTUBE_DATA_API_KEY is not set on this Convex deployment");
    }

    const resolved = await resolveYoutubeChannel(apiKey, ref);
    if (!resolved) {
      throw new Error("YouTube did not return a channel for that id or handle");
    }

    const existing = await ctx.runQuery(
      internal.communityYoutubeChannels.getChannelByYoutubeId,
      { channelId: resolved.channelId }
    );
    if (existing) {
      throw new Error("That channel is already on the watchlist");
    }

    let topicPlaylistId: string | undefined;
    if (args.playlistUrlOrId?.trim()) {
      const playlistId = extractYoutubePlaylistId(args.playlistUrlOrId);
      if (!playlistId) {
        throw new Error("Could not read a YouTube playlist id from that URL or text");
      }
      topicPlaylistId = playlistId;
    }
    const titleIncludes = args.titleIncludes
      ? parseKeywordList(args.titleIncludes)
      : undefined;
    const titleExcludes = args.titleExcludes
      ? parseKeywordList(args.titleExcludes)
      : undefined;

    const channelDocId: Id<"communityYoutubeChannels"> = await ctx.runMutation(
      internal.communityYoutubeChannels.upsertResolvedChannel,
      {
        channelId: resolved.channelId,
        title: resolved.title,
        handle: resolved.handle,
        uploadsPlaylistId: resolved.uploadsPlaylistId,
        topicPlaylistId,
        titleIncludes:
          titleIncludes && titleIncludes.length > 0 ? titleIncludes : undefined,
        titleExcludes:
          titleExcludes && titleExcludes.length > 0 ? titleExcludes : undefined,
      }
    );

    const row = await ctx.runQuery(
      internal.communityYoutubeChannels.getChannelByYoutubeId,
      { channelId: resolved.channelId }
    );
    if (row) {
      await syncOneChannel(ctx, apiKey, row);
    }

    return { channelDocId, channelId: resolved.channelId, title: resolved.title };
  },
});

export const requestAdminChannelSync = action({
  args: {},
  returns: v.object({
    ok: v.boolean(),
    reason: v.optional(v.literal("missing_api_key")),
  }),
  handler: async (
    ctx
  ): Promise<{ ok: boolean; reason?: "missing_api_key" }> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }
    await ctx.runMutation(internal.admin.ensureAdminForAction, { userId });
    const result: { ok: boolean; reason?: "missing_api_key" } = await ctx.runAction(
      internal.communityYoutubeChannels.syncEnabledChannels,
      {}
    );
    return result;
  },
});
