import { query } from "../_generated/server";
import { v } from "convex/values";
import { getTeamViewerOrNull, hasCapability } from "./permissions";

const hubCapabilitiesValidator = v.object({
  viewerUserId: v.id("users"),
  canPostChat: v.boolean(),
  canPostAnnouncements: v.boolean(),
  canPinAnnouncements: v.boolean(),
  canModerateChat: v.boolean(),
  canManageEvents: v.boolean(),
  canInviteMembers: v.boolean(),
});

export const getHubCapabilities = query({
  args: {
    teamId: v.id("teams"),
  },
  returns: v.union(v.null(), hubCapabilitiesValidator),
  handler: async (ctx, args) => {
    const ctxRow = await getTeamViewerOrNull(ctx, args.teamId);
    if (!ctxRow) {
      return null;
    }
    const { userId, role } = ctxRow;
    return {
      viewerUserId: userId,
      canPostChat: hasCapability(role, "post_team_chat"),
      canPostAnnouncements: hasCapability(role, "post_team_announcements"),
      canPinAnnouncements: hasCapability(role, "pin_team_announcements"),
      canModerateChat: hasCapability(role, "moderate_team_chat"),
      canManageEvents: hasCapability(role, "manage_team_events"),
      canInviteMembers: hasCapability(role, "invite_members"),
    };
  },
});
