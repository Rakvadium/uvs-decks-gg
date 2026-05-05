import { v } from "convex/values";
import { query } from "./_generated/server";
import {
  getPublishTextModerationProviderForDiagnostics,
  isPublishTextModerationEnabled,
} from "./lib/moderation/textPublish";

export const publishGate = query({
  args: {},
  returns: v.object({
    enabled: v.boolean(),
    provider: v.string(),
    tierListPublicComments: v.boolean(),
    teamChat: v.boolean(),
  }),
  handler: async () => {
    const provider = getPublishTextModerationProviderForDiagnostics();
    const enabled = isPublishTextModerationEnabled();
    return {
      enabled,
      provider,
      tierListPublicComments: enabled,
      teamChat: enabled,
    };
  },
});
