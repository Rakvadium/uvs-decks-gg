import type { Id } from "../../../../convex/_generated/dataModel";

export type TeamHubCaps = {
  viewerUserId: Id<"users">;
  canPostChat: boolean;
  canPostAnnouncements: boolean;
  canPinAnnouncements: boolean;
  canModerateChat: boolean;
  canManageEvents: boolean;
  canInviteMembers: boolean;
};
