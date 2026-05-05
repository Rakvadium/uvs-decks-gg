import { query } from "../_generated/server";
import { v } from "convex/values";
import { getTeamViewerOrNull, hasCapability } from "./permissions";

const editorNoticeValidator = v.union(
  v.null(),
  v.object({ kind: v.literal("pending") }),
  v.object({ kind: v.literal("needs_review") }),
  v.object({ kind: v.literal("rejected") }),
);

const presentationValidator = v.object({
  displayUrl: v.union(v.string(), v.null()),
  editorNotice: editorNoticeValidator,
  canManageLogo: v.boolean(),
});

export const getTeamLogoPresentation = query({
  args: { teamId: v.id("teams") },
  returns: v.union(presentationValidator, v.null()),
  handler: async (ctx, args) => {
    const viewer = await getTeamViewerOrNull(ctx, args.teamId);
    if (!viewer) {
      return null;
    }
    const { team, role } = viewer;
    const canManage = hasCapability(role, "edit_team_settings");

    let displayUrl: string | null = null;
    if (team.logoAssetId) {
      const asset = await ctx.db.get(team.logoAssetId);
      if (asset && asset.status === "approved") {
        displayUrl = (await ctx.storage.getUrl(asset.storageId)) ?? null;
      }
    }
    if (!displayUrl && team.imageStorageId) {
      displayUrl = (await ctx.storage.getUrl(team.imageStorageId)) ?? null;
    }

    const assets = await ctx.db
      .query("mediaAssets")
      .withIndex("by_teamId_and_kind", (q) =>
        q.eq("teamId", team._id).eq("kind", "team_logo"),
      )
      .collect();
    assets.sort((a, b) => b.createdAt - a.createdAt);
    const latest = assets[0];

    let editorNotice:
      | null
      | { kind: "pending" }
      | { kind: "needs_review" }
      | { kind: "rejected" } = null;
    if (canManage && latest) {
      if (latest.status === "pending") {
        editorNotice = { kind: "pending" };
      } else if (latest.status === "needs_review") {
        editorNotice = { kind: "needs_review" };
      } else if (latest.status === "rejected") {
        editorNotice = { kind: "rejected" };
      }
    }

    return { displayUrl, editorNotice, canManageLogo: canManage };
  },
});
