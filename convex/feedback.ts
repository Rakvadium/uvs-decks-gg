import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { userFeedbackKindValidator } from "./validators";
import { requireAdmin } from "./utils/validation";

const MAX_MESSAGE_LEN = 12_000;
const MAX_PAGE_PATH_LEN = 2048;

export const submit = mutation({
  args: {
    kind: userFeedbackKindValidator,
    pagePath: v.string(),
    message: v.string(),
    submitAnonymously: v.boolean(),
  },
  handler: async (ctx, args) => {
    const rawPath = args.pagePath.trim();
    if (rawPath.length > MAX_PAGE_PATH_LEN) {
      throw new Error("Page path is too long");
    }
    const pagePath = rawPath.length > 0 ? rawPath : "/";
    const text = args.message.trim();
    if (!text) {
      throw new Error("Please enter a message");
    }
    if (text.length > MAX_MESSAGE_LEN) {
      throw new Error("Message is too long");
    }
    const authId = await getAuthUserId(ctx);
    let userId: typeof authId | undefined;
    if (args.submitAnonymously) {
      userId = undefined;
    } else {
      if (!authId) {
        throw new Error("Sign in to submit feedback with your account");
      }
      userId = authId;
    }
    await ctx.db.insert("userFeedback", {
      kind: args.kind,
      pagePath,
      message: text,
      isAnonymous: args.submitAnonymously,
      userId,
    });
    return null;
  },
});

export const listForAdmin = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const rows = await ctx.db.query("userFeedback").order("desc").take(200);
    const out = [];
    for (const row of rows) {
      let user: {
        username: string | undefined;
        email: string | undefined;
        image: string | undefined;
      } | null = null;
      if (row.userId) {
        const u = await ctx.db.get(row.userId);
        if (u) {
          user = {
            username: u.username ?? undefined,
            email: u.email ?? undefined,
            image: u.image ?? undefined,
          };
        }
      }
      out.push({
        _id: row._id,
        _creationTime: row._creationTime,
        kind: row.kind,
        pagePath: row.pagePath,
        message: row.message,
        isAnonymous: row.isAnonymous,
        user,
      });
    }
    return out;
  },
});
