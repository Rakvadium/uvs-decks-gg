import { R2 } from "@convex-dev/r2";
import { components } from "./_generated/api";
import { query } from "./_generated/server";
import { v } from "convex/values";

export const r2 = new R2(components.r2);

export const getImageUrl = query({
  args: { key: v.string() },
  returns: v.union(v.string(), v.null()),
  handler: async (ctx, args) => {
    if (!args.key) return null;
    try {
      return await r2.getUrl(args.key, { expiresIn: 86400 });
    } catch (error) {
      console.error(`R2 getUrl error for key "${args.key}":`, error);
      return null;
    }
  },
});

export const getImageUrls = query({
  args: { keys: v.array(v.string()) },
  returns: v.record(v.string(), v.union(v.string(), v.null())),
  handler: async (ctx, args) => {
    const urls: Record<string, string | null> = {};
    await Promise.all(
      args.keys.map(async (key) => {
        if (key) {
          try {
            urls[key] = await r2.getUrl(key, { expiresIn: 86400 });
          } catch (error) {
            console.error(`R2 getUrl error for key "${key}":`, error);
            urls[key] = null;
          }
        }
      })
    );
    return urls;
  },
});
