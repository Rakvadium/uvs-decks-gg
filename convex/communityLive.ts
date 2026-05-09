import { v } from "convex/values";
import { action, internalMutation, internalQuery, query } from "./_generated/server";
import { internal } from "./_generated/api";

const CACHE_KEY = "singleton" as const;
const MIN_REFRESH_MS = 55_000;

const liveStatusValidator = v.object({
  checkedAt: v.number(),
  youtubeLive: v.optional(
    v.object({
      videoId: v.string(),
      title: v.string(),
      thumbnailUrl: v.optional(v.string()),
      channelTitle: v.optional(v.string()),
    })
  ),
  twitchLive: v.optional(
    v.object({
      login: v.string(),
      title: v.string(),
      thumbnailUrl: v.optional(v.string()),
      viewerCount: v.optional(v.number()),
    })
  ),
});

export const getLiveStatus = query({
  args: {},
  returns: v.union(v.null(), liveStatusValidator),
  handler: async (ctx) => {
    const row = await ctx.db
      .query("communityLiveStatusCache")
      .withIndex("by_key", (q) => q.eq("key", CACHE_KEY))
      .unique();
    if (!row) return null;
    return {
      checkedAt: row.checkedAt,
      youtubeLive: row.youtubeLive,
      twitchLive: row.twitchLive,
    };
  },
});

export const getCacheInternal = internalQuery({
  args: {},
  returns: v.union(
    v.null(),
    v.object({
      _id: v.id("communityLiveStatusCache"),
      checkedAt: v.number(),
    })
  ),
  handler: async (ctx) => {
    const row = await ctx.db
      .query("communityLiveStatusCache")
      .withIndex("by_key", (q) => q.eq("key", CACHE_KEY))
      .unique();
    if (!row) return null;
    return { _id: row._id, checkedAt: row.checkedAt };
  },
});

export const writeCacheInternal = internalMutation({
  args: {
    checkedAt: v.number(),
    youtubeLive: v.optional(
      v.object({
        videoId: v.string(),
        title: v.string(),
        thumbnailUrl: v.optional(v.string()),
        channelTitle: v.optional(v.string()),
      })
    ),
    twitchLive: v.optional(
      v.object({
        login: v.string(),
        title: v.string(),
        thumbnailUrl: v.optional(v.string()),
        viewerCount: v.optional(v.number()),
      })
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("communityLiveStatusCache")
      .withIndex("by_key", (q) => q.eq("key", CACHE_KEY))
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        checkedAt: args.checkedAt,
        youtubeLive: args.youtubeLive,
        twitchLive: args.twitchLive,
      });
    } else {
      await ctx.db.insert("communityLiveStatusCache", {
        key: CACHE_KEY,
        checkedAt: args.checkedAt,
        youtubeLive: args.youtubeLive,
        twitchLive: args.twitchLive,
      });
    }
    return null;
  },
});

export const refreshLiveStatus = action({
  args: {},
  returns: v.object({
    ok: v.boolean(),
    skipped: v.boolean(),
  }),
  handler: async (ctx) => {
    const cached = await ctx.runQuery(internal.communityLive.getCacheInternal, {});
    if (cached && Date.now() - cached.checkedAt < MIN_REFRESH_MS) {
      return { ok: true, skipped: true };
    }

    let youtubeLive:
      | {
          videoId: string;
          title: string;
          thumbnailUrl?: string;
          channelTitle?: string;
        }
      | undefined;
    let twitchLive:
      | {
          login: string;
          title: string;
          thumbnailUrl?: string;
          viewerCount?: number;
        }
      | undefined;

    const ytKey = process.env.YOUTUBE_DATA_API_KEY?.trim() ?? "";
    const ytChannel = process.env.UNIVERSUS_YOUTUBE_CHANNEL_ID?.trim() ?? "";
    if (ytKey && ytChannel) {
      try {
        const url = new URL("https://www.googleapis.com/youtube/v3/search");
        url.searchParams.set("part", "snippet");
        url.searchParams.set("channelId", ytChannel);
        url.searchParams.set("type", "video");
        url.searchParams.set("eventType", "live");
        url.searchParams.set("maxResults", "1");
        url.searchParams.set("key", ytKey);
        const res = await fetch(url.toString());
        if (res.ok) {
          const data = (await res.json()) as {
            items?: Array<{
              id?: { videoId?: string };
              snippet?: {
                title?: string;
                channelTitle?: string;
                thumbnails?: { high?: { url?: string }; medium?: { url?: string } };
              };
            }>;
          };
          const item = data.items?.[0];
          const vid = item?.id?.videoId;
          if (vid) {
            const th = item.snippet?.thumbnails;
            youtubeLive = {
              videoId: vid,
              title: item.snippet?.title ?? "Live",
              channelTitle: item.snippet?.channelTitle,
              thumbnailUrl: th?.high?.url ?? th?.medium?.url,
            };
          }
        }
      } catch {
        youtubeLive = undefined;
      }
    }

    const twId = process.env.TWITCH_CLIENT_ID?.trim() ?? "";
    const twSecret = process.env.TWITCH_CLIENT_SECRET?.trim() ?? "";
    const twLogin = process.env.TWITCH_CHANNEL_LOGIN?.trim() ?? "";
    if (twId && twSecret && twLogin) {
      try {
        const tokenUrl = new URL("https://id.twitch.tv/oauth2/token");
        tokenUrl.searchParams.set("client_id", twId);
        tokenUrl.searchParams.set("client_secret", twSecret);
        tokenUrl.searchParams.set("grant_type", "client_credentials");
        const tokenRes = await fetch(tokenUrl.toString(), { method: "POST" });
        if (tokenRes.ok) {
          const tokenJson = (await tokenRes.json()) as { access_token?: string };
          const bearer = tokenJson.access_token;
          if (bearer) {
            const streamUrl = new URL("https://api.twitch.tv/helix/streams");
            streamUrl.searchParams.set("user_login", twLogin);
            const streamRes = await fetch(streamUrl.toString(), {
              headers: {
                "Client-Id": twId,
                Authorization: `Bearer ${bearer}`,
              },
            });
            if (streamRes.ok) {
              const streamJson = (await streamRes.json()) as {
                data?: Array<{
                  user_login: string;
                  title: string;
                  thumbnail_url?: string;
                  viewer_count?: number;
                }>;
              };
              const s = streamJson.data?.[0];
              if (s) {
                twitchLive = {
                  login: s.user_login,
                  title: s.title,
                  thumbnailUrl: s.thumbnail_url
                    ? s.thumbnail_url.replace("{width}", "320").replace("{height}", "180")
                    : undefined,
                  viewerCount: s.viewer_count,
                };
              }
            }
          }
        }
      } catch {
        twitchLive = undefined;
      }
    }

    const checkedAt = Date.now();
    await ctx.runMutation(internal.communityLive.writeCacheInternal, {
      checkedAt,
      youtubeLive,
      twitchLive,
    });

    return { ok: true, skipped: false };
  },
});
