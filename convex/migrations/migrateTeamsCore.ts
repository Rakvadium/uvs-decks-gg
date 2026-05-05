import { mutation } from "../_generated/server";
import { v } from "convex/values";

export const teamsCoreMigrationStatus = mutation({
  args: {},
  returns: v.object({
    teamCount: v.number(),
    teamMemberCount: v.number(),
    teamInviteCount: v.number(),
  }),
  handler: async (ctx) => {
    const teamSample = await ctx.db.query("teams").take(10_000);
    const teamMemberSample = await ctx.db.query("teamMembers").take(10_000);
    const teamInviteSample = await ctx.db.query("teamInvites").take(10_000);
    return {
      teamCount: teamSample.length,
      teamMemberCount: teamMemberSample.length,
      teamInviteCount: teamInviteSample.length,
    };
  },
});
