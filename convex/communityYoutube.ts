import { v } from "convex/values";
import {
  action,
  internalAction,
  internalMutation,
  internalQuery,
  query,
  type ActionCtx,
} from "./_generated/server";
import { internal } from "./_generated/api";

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
    const existing = await ctx.db.query("communityYoutubeCurations").take(1);
    if (existing.length > 0) return;

    for (const row of DEFAULT_CURATED_VIDEOS) {
      await ctx.db.insert("communityYoutubeCurations", {
        youtubeVideoId: row.youtubeVideoId,
        label: row.label,
        accentClass: row.accentClass,
        sortOrder: row.sortOrder,
      });
    }
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

  const ids = curations.map((c) => c.youtubeVideoId);
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

    const items: Array<{
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
    }> = [];

    let okCount = 0;
    let errorCount = 0;
    let pendingCount = 0;

    for (const c of curations) {
      const cache = await ctx.db
        .query("youtubeVideoMetadataCache")
        .withIndex("by_youtubeVideoId", (q) =>
          q.eq("youtubeVideoId", c.youtubeVideoId)
        )
        .unique();

      const watchUrl = `https://www.youtube.com/watch?v=${encodeURIComponent(c.youtubeVideoId)}`;

      if (!cache) {
        pendingCount += 1;
        items.push({
          youtubeVideoId: c.youtubeVideoId,
          sortOrder: c.sortOrder,
          editorialLabel: c.label,
          accentClass: c.accentClass,
          watchUrl,
          rowStatus: "pending",
        });
        continue;
      }

      if (cache.fetchError) {
        errorCount += 1;
        items.push({
          youtubeVideoId: c.youtubeVideoId,
          sortOrder: c.sortOrder,
          editorialLabel: c.label,
          accentClass: c.accentClass,
          watchUrl,
          fetchedAt: cache.fetchedAt,
          rowStatus: "error",
          fetchError: cache.fetchError,
        });
        continue;
      }

      if (!cache.title) {
        pendingCount += 1;
        items.push({
          youtubeVideoId: c.youtubeVideoId,
          sortOrder: c.sortOrder,
          editorialLabel: c.label,
          accentClass: c.accentClass,
          watchUrl,
          fetchedAt: cache.fetchedAt,
          rowStatus: "pending",
        });
        continue;
      }

      okCount += 1;
      items.push({
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
      });
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
