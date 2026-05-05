import { v } from "convex/values";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  mutation,
  query,
  type ActionCtx,
  type QueryCtx,
} from "./_generated/server";
import { internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { extractYoutubeVideoId } from "../shared/extract-youtube-video-id";
import { requireAdmin } from "./utils/validation";

const CACHE_TTL_MS = 6 * 60 * 60 * 1000;
const CLIENT_REFRESH_COOLDOWN_MS = 5 * 60 * 1000;
const SETTINGS_KEY = "global";
const YOUTUBE_API = "https://www.googleapis.com/youtube/v3/videos";

const DEFAULT_CURATED_VIDEOS = [
  {
    youtubeVideoId: "bcSojOdcJwI",
    label: "Learn to play",
    accentClass: "from-primary/20 via-primary/5 to-transparent",
    sortOrder: 0,
  },
  {
    youtubeVideoId: "rJ-ntApwIcs",
    label: "Basics",
    accentClass: "from-secondary/20 via-secondary/5 to-transparent",
    sortOrder: 1,
  },
  {
    youtubeVideoId: "LsBRTRaReGM",
    label: "Event coverage",
    accentClass: "from-emerald-400/20 via-emerald-400/5 to-transparent",
    sortOrder: 2,
  },
  {
    youtubeVideoId: "0FGx0oXfkzY",
    label: "Across the Ages",
    accentClass: "from-primary/20 via-primary/5 to-transparent",
    sortOrder: 3,
  },
] as const;

function parseIso8601Duration(iso: string): number {
  const match = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/.exec(iso);
  if (!match) return 0;
  const h = Number(match[1] ?? 0);
  const m = Number(match[2] ?? 0);
  const s = Number(match[3] ?? 0);
  return h * 3600 + m * 60 + s;
}

function formatDurationLabel(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) {
    return `${h}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
  }
  return `${m}:${s.toString().padStart(2, "0")}`;
}

function formatViewCount(n: number): string {
  if (n >= 1_000_000) {
    return `${(n / 1_000_000).toFixed(1).replace(/\.0$/, "")}M`;
  }
  if (n >= 1000) {
    return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  }
  return String(n);
}

function pickThumbnail(snippet: {
  thumbnails?: {
    maxres?: { url?: string };
    high?: { url?: string };
    medium?: { url?: string };
    default?: { url?: string };
  };
}): string {
  const t = snippet.thumbnails;
  return (
    t?.maxres?.url ??
    t?.high?.url ??
    t?.medium?.url ??
    t?.default?.url ??
    ""
  );
}

type YoutubeFeedItemWithCuration = {
  curationId: Id<"communityYoutubeCurations">;
  youtubeVideoId: string;
  sortOrder: number;
  editorialLabel?: string;
  accentClass?: string;
  title?: string;
  channelTitle?: string;
  durationLabel?: string;
  viewCountLabel?: string;
  thumbnailUrl?: string;
  watchUrl: string;
  fetchedAt?: number;
  rowStatus: "ok" | "pending" | "error";
  fetchError?: string;
};

async function buildFeedItemForCuration(
  ctx: QueryCtx,
  c: Doc<"communityYoutubeCurations">
): Promise<YoutubeFeedItemWithCuration> {
  const cache = await ctx.db
    .query("youtubeVideoMetadataCache")
    .withIndex("by_youtubeVideoId", (q) => q.eq("youtubeVideoId", c.youtubeVideoId))
    .unique();

  const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(c.youtubeVideoId)}`;

  if (!cache) {
    return {
      curationId: c._id,
      youtubeVideoId: c.youtubeVideoId,
      sortOrder: c.sortOrder,
      editorialLabel: c.label,
      accentClass: c.accentClass,
      watchUrl,
      rowStatus: "pending",
    };
  }

  if (cache.fetchError) {
    return {
      curationId: c._id,
      youtubeVideoId: c.youtubeVideoId,
      sortOrder: c.sortOrder,
      editorialLabel: c.label,
      accentClass: c.accentClass,
      watchUrl,
      fetchedAt: cache.fetchedAt,
      rowStatus: "error",
      fetchError: cache.fetchError,
    };
  }

  if (!cache.title) {
    return {
      curationId: c._id,
      youtubeVideoId: c.youtubeVideoId,
      sortOrder: c.sortOrder,
      editorialLabel: c.label,
      accentClass: c.accentClass,
      watchUrl,
      fetchedAt: cache.fetchedAt,
      rowStatus: "pending",
    };
  }

  return {
    curationId: c._id,
    youtubeVideoId: c.youtubeVideoId,
    sortOrder: c.sortOrder,
    editorialLabel: c.label,
    accentClass: c.accentClass,
    title: cache.title,
    channelTitle: cache.channelTitle,
    durationLabel: formatDurationLabel(cache.durationSeconds),
    viewCountLabel: formatViewCount(cache.viewCount),
    thumbnailUrl: cache.thumbnailUrl || undefined,
    watchUrl,
    fetchedAt: cache.fetchedAt,
    rowStatus: "ok",
  };
}

function stripCurationId(
  row: YoutubeFeedItemWithCuration
): Omit<YoutubeFeedItemWithCuration, "curationId"> {
  const { curationId: _omit, ...rest } = row;
  void _omit;
  return rest;
}

export const listCurationsOrdered = internalQuery({
  args: {},
  handler: async (ctx) => {
    const rows = await ctx.db.query("communityYoutubeCurations").collect();
    rows.sort((a, b) => a.sortOrder - b.sortOrder);
    return rows;
  },
});

export const ensureDefaultCurations = internalMutation({
  args: {},
  handler: async (ctx) => {
    const init = await ctx.db
      .query("communityYoutubeCurationInitState")
      .withIndex("by_key", (q) => q.eq("key", "global"))
      .unique();
    if (init) {
      return;
    }

    const existing = await ctx.db.query("communityYoutubeCurations").collect();
    if (existing.length > 0) {
      await ctx.db.insert("communityYoutubeCurationInitState", { key: "global" });
      return;
    }

    for (const row of DEFAULT_CURATED_VIDEOS) {
      const present = await ctx.db
        .query("communityYoutubeCurations")
        .withIndex("by_youtubeVideoId", (q) =>
          q.eq("youtubeVideoId", row.youtubeVideoId)
        )
        .unique();
      if (present) {
        continue;
      }
      await ctx.db.insert("communityYoutubeCurations", {
        youtubeVideoId: row.youtubeVideoId,
        label: row.label,
        accentClass: row.accentClass,
        sortOrder: row.sortOrder,
      });
    }
    await ctx.db.insert("communityYoutubeCurationInitState", { key: "global" });
  },
});

export const takeClientRefreshSlot = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = Date.now();
    const row = await ctx.db
      .query("youtubeFeedRefreshSettings")
      .withIndex("by_key", (q) => q.eq("key", SETTINGS_KEY))
      .unique();

    if (!row) {
      await ctx.db.insert("youtubeFeedRefreshSettings", {
        key: SETTINGS_KEY,
        lastRefreshAttemptAt: now,
      });
      return { allowed: true as const };
    }

    if (now - row.lastRefreshAttemptAt < CLIENT_REFRESH_COOLDOWN_MS) {
      return { allowed: false as const };
    }

    await ctx.db.patch(row._id, { lastRefreshAttemptAt: now });
    return { allowed: true as const };
  },
});

type NormalizedVideo = {
  youtubeVideoId: string;
  title: string;
  channelTitle: string;
  durationSeconds: number;
  viewCount: number;
  thumbnailUrl: string;
  fetchedAt: number;
};

export const upsertVideoCacheBatch = internalMutation({
  args: {
    videos: v.array(
      v.object({
        youtubeVideoId: v.string(),
        title: v.string(),
        channelTitle: v.string(),
        durationSeconds: v.number(),
        viewCount: v.number(),
        thumbnailUrl: v.string(),
        fetchedAt: v.number(),
      })
    ),
    errors: v.array(
      v.object({
        youtubeVideoId: v.string(),
        message: v.string(),
        fetchedAt: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    for (const vrow of args.videos) {
      const existing = await ctx.db
        .query("youtubeVideoMetadataCache")
        .withIndex("by_youtubeVideoId", (q) =>
          q.eq("youtubeVideoId", vrow.youtubeVideoId)
        )
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          title: vrow.title,
          channelTitle: vrow.channelTitle,
          durationSeconds: vrow.durationSeconds,
          viewCount: vrow.viewCount,
          thumbnailUrl: vrow.thumbnailUrl,
          fetchedAt: vrow.fetchedAt,
          fetchError: undefined,
        });
      } else {
        await ctx.db.insert("youtubeVideoMetadataCache", {
          youtubeVideoId: vrow.youtubeVideoId,
          title: vrow.title,
          channelTitle: vrow.channelTitle,
          durationSeconds: vrow.durationSeconds,
          viewCount: vrow.viewCount,
          thumbnailUrl: vrow.thumbnailUrl,
          fetchedAt: vrow.fetchedAt,
        });
      }
    }

    for (const er of args.errors) {
      const existing = await ctx.db
        .query("youtubeVideoMetadataCache")
        .withIndex("by_youtubeVideoId", (q) =>
          q.eq("youtubeVideoId", er.youtubeVideoId)
        )
        .unique();

      if (existing) {
        await ctx.db.patch(existing._id, {
          fetchError: er.message,
          fetchedAt: er.fetchedAt,
        });
      } else {
        await ctx.db.insert("youtubeVideoMetadataCache", {
          youtubeVideoId: er.youtubeVideoId,
          title: "",
          channelTitle: "",
          durationSeconds: 0,
          viewCount: 0,
          thumbnailUrl: "",
          fetchedAt: er.fetchedAt,
          fetchError: er.message,
        });
      }
    }
  },
});

type YoutubeListItem = {
  id?: string;
  snippet?: {
    title?: string;
    channelTitle?: string;
    thumbnails?: {
      maxres?: { url?: string };
      high?: { url?: string };
      medium?: { url?: string };
      default?: { url?: string };
    };
  };
  contentDetails?: { duration?: string };
  statistics?: { viewCount?: string };
};

async function fetchAndStoreYoutubeVideos(
  ctx: ActionCtx,
  apiKey: string
): Promise<{ ok: boolean; reason?: string }> {
  const curations = await ctx.runQuery(
    internal.communityYoutube.listCurationsOrdered,
    {}
  );

  if (curations.length === 0) {
    return { ok: false, reason: "no_curations" };
  }

  const ids = curations.map((c: Doc<"communityYoutubeCurations">) => c.youtubeVideoId);
  const now = Date.now();
  const normalized: NormalizedVideo[] = [];
  const errors: { youtubeVideoId: string; message: string; fetchedAt: number }[] =
    [];

  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const url = new URL(YOUTUBE_API);
    url.searchParams.set("part", "snippet,contentDetails,statistics");
    url.searchParams.set("id", chunk.join(","));
    url.searchParams.set("key", apiKey);

    let json: {
      items?: YoutubeListItem[];
      error?: { message?: string };
    };

    try {
      const res = await fetch(url.toString(), { method: "GET" });
      json = (await res.json()) as typeof json;
      if (!res.ok) {
        const msg = json.error?.message ?? `http_${res.status}`;
        for (const id of chunk) {
          errors.push({
            youtubeVideoId: id,
            message: msg,
            fetchedAt: now,
          });
        }
        continue;
      }
    } catch {
      for (const id of chunk) {
        errors.push({
          youtubeVideoId: id,
          message: "network_error",
          fetchedAt: now,
        });
      }
      continue;
    }

    const seen = new Set<string>();
    for (const item of json.items ?? []) {
      const id = item.id;
      if (!id) continue;
      seen.add(id);
      const title = item.snippet?.title ?? "";
      const channelTitle = item.snippet?.channelTitle ?? "";
      const durationRaw = item.contentDetails?.duration ?? "PT0S";
      const durationSeconds = parseIso8601Duration(durationRaw);
      const viewRaw = item.statistics?.viewCount ?? "0";
      const viewCount = Number.parseInt(viewRaw, 10) || 0;
      const thumbnailUrl = item.snippet ? pickThumbnail(item.snippet) : "";

      normalized.push({
        youtubeVideoId: id,
        title,
        channelTitle,
        durationSeconds,
        viewCount,
        thumbnailUrl,
        fetchedAt: now,
      });
    }

    for (const id of chunk) {
      if (!seen.has(id)) {
        errors.push({
          youtubeVideoId: id,
          message: "not_found",
          fetchedAt: now,
        });
      }
    }
  }

  await ctx.runMutation(internal.communityYoutube.upsertVideoCacheBatch, {
    videos: normalized,
    errors,
  });

  return { ok: true };
}

export const cronRefreshFeed = internalAction({
  args: {},
  handler: async (ctx) => {
    await ctx.runMutation(internal.communityYoutube.ensureDefaultCurations, {});
    const apiKey = process.env.YOUTUBE_DATA_API_KEY?.trim() ?? "";
    if (apiKey === "") {
      return;
    }
    await fetchAndStoreYoutubeVideos(ctx, apiKey);
  },
});

export const bootstrapYoutubeCurationIds = action({
  args: {},
  handler: async (ctx) => {
    await ctx.runMutation(internal.communityYoutube.ensureDefaultCurations, {});
    return { ok: true as const };
  },
});

export const requestClientRefresh = action({
  args: {},
  handler: async (ctx) => {
    await ctx.runMutation(internal.communityYoutube.ensureDefaultCurations, {});
    const apiKey = process.env.YOUTUBE_DATA_API_KEY?.trim() ?? "";
    if (apiKey === "") {
      return { ok: false as const, reason: "missing_api_key" as const };
    }
    const gate = await ctx.runMutation(
      internal.communityYoutube.takeClientRefreshSlot,
      {}
    );
    if (!gate.allowed) {
      return { ok: false as const, reason: "rate_limited" as const };
    }
    return await fetchAndStoreYoutubeVideos(ctx, apiKey);
  },
});

export const getFeed = query({
  args: {},
  handler: async (ctx) => {
    const curations = await ctx.db.query("communityYoutubeCurations").collect();
    curations.sort((a, b) => a.sortOrder - b.sortOrder);

    if (curations.length === 0) {
      return {
        feedKind: "empty" as const,
        items: [],
        cacheTtlMs: CACHE_TTL_MS,
      };
    }

    const withIds = await Promise.all(
      curations.map((c) => buildFeedItemForCuration(ctx, c))
    );
    const items = withIds.map((row) => stripCurationId(row));

    let okCount = 0;
    let errorCount = 0;
    let pendingCount = 0;

    for (const it of withIds) {
      if (it.rowStatus === "ok") okCount += 1;
      else if (it.rowStatus === "error") errorCount += 1;
      else pendingCount += 1;
    }

    const feedKind =
      okCount === items.length
        ? ("ready" as const)
        : okCount === 0 && pendingCount === items.length
          ? ("pending_all" as const)
          : okCount === 0 && errorCount === items.length
            ? ("error_all" as const)
            : ("partial" as const);

    return {
      feedKind,
      items,
      cacheTtlMs: CACHE_TTL_MS,
    };
  },
});

export const listYoutubeCurationsForAdmin = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const curations = await ctx.db.query("communityYoutubeCurations").collect();
    curations.sort((a, b) => a.sortOrder - b.sortOrder);
    if (curations.length === 0) {
      return { feedKind: "empty" as const, items: [] as YoutubeFeedItemWithCuration[], cacheTtlMs: CACHE_TTL_MS };
    }
    const withIds = await Promise.all(
      curations.map((c) => buildFeedItemForCuration(ctx, c))
    );
    let okCount = 0;
    let errorCount = 0;
    let pendingCount = 0;
    for (const it of withIds) {
      if (it.rowStatus === "ok") okCount += 1;
      else if (it.rowStatus === "error") errorCount += 1;
      else pendingCount += 1;
    }
    const feedKind =
      okCount === withIds.length
        ? ("ready" as const)
        : okCount === 0 && pendingCount === withIds.length
          ? ("pending_all" as const)
          : okCount === 0 && errorCount === withIds.length
            ? ("error_all" as const)
            : ("partial" as const);
    return { feedKind, items: withIds, cacheTtlMs: CACHE_TTL_MS };
  },
});

export const addYoutubeCuration = mutation({
  args: { urlOrId: v.string() },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const videoId = extractYoutubeVideoId(args.urlOrId);
    if (!videoId) {
      throw new Error("Could not read a YouTube video id from that URL or text");
    }
    const dup = await ctx.db
      .query("communityYoutubeCurations")
      .withIndex("by_youtubeVideoId", (q) => q.eq("youtubeVideoId", videoId))
      .unique();
    if (dup) {
      throw new Error("That video is already in the curation list");
    }
    const all = await ctx.db.query("communityYoutubeCurations").collect();
    let maxOrder = -1;
    for (const c of all) {
      if (c.sortOrder > maxOrder) maxOrder = c.sortOrder;
    }
    const curationId = await ctx.db.insert("communityYoutubeCurations", {
      youtubeVideoId: videoId,
      sortOrder: maxOrder + 1,
    });
    return curationId;
  },
});

export const updateYoutubeCuration = mutation({
  args: {
    curationId: v.id("communityYoutubeCurations"),
    label: v.optional(v.string()),
    accentClass: v.optional(v.string()),
    sortOrder: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const row = await ctx.db.get(args.curationId);
    if (!row) {
      throw new Error("Curation not found");
    }
    const patch: {
      label?: string;
      accentClass?: string;
      sortOrder?: number;
    } = {};
    if (args.label !== undefined) {
      patch.label = args.label.length > 0 ? args.label : undefined;
    }
    if (args.accentClass !== undefined) {
      patch.accentClass = args.accentClass.length > 0 ? args.accentClass : undefined;
    }
    if (args.sortOrder !== undefined) patch.sortOrder = args.sortOrder;
    if (
      args.label !== undefined ||
      args.accentClass !== undefined ||
      args.sortOrder !== undefined
    ) {
      await ctx.db.patch(args.curationId, patch);
    }
  },
});

export const deleteYoutubeCuration = mutation({
  args: { curationId: v.id("communityYoutubeCurations") },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const row = await ctx.db.get(args.curationId);
    if (!row) {
      throw new Error("Curation not found");
    }
    await ctx.db.delete(args.curationId);
    const rest = await ctx.db.query("communityYoutubeCurations").collect();
    rest.sort((a, b) => a.sortOrder - b.sortOrder);
    for (let i = 0; i < rest.length; i += 1) {
      if (rest[i].sortOrder !== i) {
        await ctx.db.patch(rest[i]._id, { sortOrder: i });
      }
    }
  },
});

export const reorderYoutubeCurations = mutation({
  args: { orderedCurationIds: v.array(v.id("communityYoutubeCurations")) },
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const all = await ctx.db.query("communityYoutubeCurations").collect();
    if (all.length !== args.orderedCurationIds.length) {
      throw new Error("Reorder list must include every curation row exactly once");
    }
    const idSet = new Set(all.map((r) => r._id));
    for (const id of args.orderedCurationIds) {
      if (!idSet.has(id)) {
        throw new Error("Invalid curation id in reorder list");
      }
    }
    if (new Set(args.orderedCurationIds).size !== args.orderedCurationIds.length) {
      throw new Error("Duplicate id in reorder list");
    }
    for (let i = 0; i < args.orderedCurationIds.length; i += 1) {
      await ctx.db.patch(args.orderedCurationIds[i], { sortOrder: i });
    }
  },
});
