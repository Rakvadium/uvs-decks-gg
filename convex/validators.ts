import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";

export const deckVisibilityValidator = v.union(
  v.literal("private"),
  v.literal("share"),
  v.literal("unlisted"),
  v.literal("public"),
  v.literal("tournament"),
  v.literal("team"),
);

export const deckTeamCollaborationValidator = v.union(
  v.literal("none"),
  v.literal("team_viewable"),
  v.literal("team_editable"),
);

export const deckBuilderUiStateV1Validator = v.object({
  v: v.literal(1),
  rightSidebarAction: v.optional(v.string()),
  galleryFilters: v.optional(v.any()),
  activeDeckSection: v.optional(
    v.union(v.literal("main"), v.literal("side"), v.literal("reference")),
  ),
});

export const deckPresenceCursorValidator = v.object({
  x: v.number(),
  y: v.number(),
  viewportW: v.number(),
  viewportH: v.number(),
  normX: v.number(),
  normY: v.number(),
});

export const tierListRankingScopeValidator = v.union(
  v.literal("unranked"),
  v.literal("global"),
  v.literal("set_scope")
);

export const cardValidator = v.object({
  _id: v.id("cards"),
  _creationTime: v.number(),
  oracleId: v.optional(v.string()),
  name: v.string(),
  imageUrl: v.optional(v.string()),
  backCardId: v.optional(v.id("cards")),
  frontCardId: v.optional(v.id("cards")),
  isFrontFace: v.optional(v.boolean()),
  isVariant: v.optional(v.boolean()),
  number: v.optional(v.number()),
  setCode: v.optional(v.string()),
  setName: v.optional(v.string()),
  setNumber: v.optional(v.number()),
  collectorNumber: v.optional(v.string()),
  rarity: v.optional(v.string()),
  type: v.optional(v.string()),
  difficulty: v.optional(v.number()),
  control: v.optional(v.number()),
  speed: v.optional(v.number()),
  damage: v.optional(v.number()),
  blockModifier: v.optional(v.number()),
  handSize: v.optional(v.number()),
  health: v.optional(v.number()),
  stamina: v.optional(v.number()),
  attackZone: v.optional(v.string()),
  blockZone: v.optional(v.string()),
  text: v.optional(v.string()),
  keywords: v.optional(v.string()),
  symbols: v.optional(v.string()),
  searchName: v.optional(v.string()),
  searchText: v.optional(v.string()),
  searchAll: v.optional(v.string()),
  copyLimit: v.optional(v.number()),
  legality: v.optional(v.string()),
  contentRevisionAt: v.optional(v.number()),
});

export const userValidator = v.object({
  _id: v.id("users"),
  _creationTime: v.number(),
  username: v.optional(v.string()),
  email: v.optional(v.string()),
  emailVerificationTime: v.optional(v.number()),
  image: v.optional(v.string()),
  isAnonymous: v.optional(v.boolean()),
  role: v.optional(v.string()),
  profanityFilterEnabled: v.boolean(),
});

export const currentUserSelfValidator = v.object({
  _id: v.id("users"),
  _creationTime: v.number(),
  username: v.optional(v.string()),
  email: v.optional(v.string()),
  emailVerificationTime: v.optional(v.number()),
  image: v.optional(v.string()),
  isAnonymous: v.optional(v.boolean()),
  role: v.optional(v.string()),
  profanityFilterEnabled: v.boolean(),
  accountStatus: v.optional(
    v.union(
      v.literal("active"),
      v.literal("suspended"),
      v.literal("banned"),
      v.literal("write_restricted")
    )
  ),
  statusExpiresAt: v.optional(v.number()),
  userFacingMessage: v.optional(v.string()),
});

export function publicUserFromDocument(doc: Doc<"users">) {
  return {
    ...doc,
    profanityFilterEnabled: doc.profanityFilterEnabled !== false,
  };
}

export const cardLayoutColumnValidator = v.object({
  id: v.string(),
  name: v.string(),
  color: v.string(),
  cardIds: v.array(v.string()),
});

export const cardLayoutValidator = v.object({
  columns: v.array(cardLayoutColumnValidator),
  unassignedCardIds: v.array(v.string()),
});

export const deckValidator = v.object({
  _id: v.id("decks"),
  _creationTime: v.number(),
  userId: v.id("users"),
  name: v.string(),
  description: v.optional(v.string()),
  visibility: v.optional(deckVisibilityValidator),
  isPublic: v.boolean(),
  format: v.optional(v.string()),
  subFormat: v.optional(v.string()),
  startingCharacterId: v.optional(v.id("cards")),
  selectedIdentity: v.optional(v.string()),
  imageCardId: v.optional(v.id("cards")),
  mainCardIds: v.array(v.id("cards")),
  mainQuantities: v.record(v.string(), v.number()),
  sideCardIds: v.array(v.id("cards")),
  sideQuantities: v.record(v.string(), v.number()),
  referenceCardIds: v.array(v.id("cards")),
  referenceQuantities: v.record(v.string(), v.number()),
  cardLayouts: v.optional(v.record(v.string(), cardLayoutValidator)),
  teamId: v.optional(v.id("teams")),
  teamCollaboration: v.optional(deckTeamCollaborationValidator),
  revision: v.optional(v.number()),
});

export const deckCardMutationResultValidator = v.object({
  revision: v.number(),
});

export const deckShareEntryValidator = v.object({
  _id: v.id("deckShares"),
  userId: v.id("users"),
  status: v.union(v.literal("pending"), v.literal("accepted")),
  username: v.optional(v.string()),
  image: v.optional(v.string()),
  createdAt: v.number(),
});

export const tierDefinitionValidator = v.object({
  id: v.string(),
  label: v.string(),
  color: v.string(),
  order: v.number(),
});

export const tierListPoolScopeValidator = v.object({
  setCode: v.string(),
  cardType: v.string(),
});

export const tierListValidator = v.object({
  _id: v.id("tierLists"),
  _creationTime: v.number(),
  userId: v.id("users"),
  title: v.string(),
  description: v.optional(v.string()),
  isPublic: v.boolean(),
  rankingScope: v.optional(tierListRankingScopeValidator),
  rankingScopeKey: v.optional(v.string()),
  selectedSetCodes: v.array(v.string()),
  poolScopes: v.optional(v.array(tierListPoolScopeValidator)),
  previewCardIds: v.array(v.id("cards")),
  tiers: v.array(tierDefinitionValidator),
  itemCount: v.number(),
  tierCount: v.number(),
  likeCount: v.number(),
  commentCount: v.number(),
  featuredCardId: v.optional(v.id("cards")),
  updatedAt: v.number(),
  listModerationStatus: v.optional(
    v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected")
    )
  ),
});

export const tierListItemValidator = v.object({
  _id: v.id("tierListItems"),
  _creationTime: v.number(),
  tierListId: v.id("tierLists"),
  cardId: v.id("cards"),
  laneKey: v.string(),
  order: v.number(),
});

export const communityCardRankingValidator = v.object({
  _id: v.id("communityCardRankings"),
  _creationTime: v.number(),
  scopeType: v.union(v.literal("global"), v.literal("set_scope")),
  scopeKey: v.string(),
  scopeLabel: v.string(),
  cardId: v.id("cards"),
  voteCount: v.number(),
  rawMeanScore: v.number(),
  adjustedScore: v.number(),
  topLaneRate: v.number(),
  bottomLaneRate: v.number(),
  lastComputedAt: v.number(),
});

export const communityTierSnapshotValidator = v.object({
  _id: v.id("communityTierSnapshots"),
  _creationTime: v.number(),
  scopeType: v.union(v.literal("global"), v.literal("set_scope")),
  scopeKey: v.string(),
  scopeLabel: v.string(),
  setCodes: v.array(v.string()),
  contributorCount: v.number(),
  rankedCardCount: v.number(),
  insufficientCardCount: v.number(),
  tiers: v.array(v.object({
    id: v.string(),
    label: v.string(),
    color: v.string(),
    cardIds: v.array(v.id("cards")),
  })),
  insufficientDataCardIds: v.array(v.id("cards")),
  lastComputedAt: v.number(),
});

export const tierListLikeValidator = v.object({
  _id: v.id("tierListLikes"),
  _creationTime: v.number(),
  userId: v.id("users"),
  tierListId: v.id("tierLists"),
});

export const tierListCommentStatusValidator = v.union(
  v.literal("approved"),
  v.literal("pending"),
  v.literal("flagged"),
  v.literal("rejected")
);

export const tierListCommentValidator = v.object({
  _id: v.id("tierListComments"),
  _creationTime: v.number(),
  tierListId: v.id("tierLists"),
  userId: v.id("users"),
  content: v.string(),
  status: tierListCommentStatusValidator,
  moderationReason: v.optional(v.string()),
  textModerationProvider: v.optional(v.string()),
  textModerationResult: v.optional(v.any()),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const collectionEntryValidator = v.object({
  _id: v.id("collections"),
  _creationTime: v.number(),
  userId: v.id("users"),
  cardId: v.id("cards"),
  quantity: v.number(),
  condition: v.optional(v.string()),
  isFoil: v.optional(v.boolean()),
});

export const deckSectionValidator = v.union(
  v.literal("main"),
  v.literal("side"),
  v.literal("reference")
);

export const legalityValidator = v.optional(v.string());

export const galleryFiltersValidator = v.object({
  search: v.optional(v.string()),
  searchMode: v.optional(v.union(v.literal("name"), v.literal("text"), v.literal("all"))),
  rarity: v.optional(v.array(v.string())),
  type: v.optional(v.array(v.string())),
  set: v.optional(v.array(v.string())),
  format: v.optional(v.string()),
  symbols: v.optional(v.array(v.string())),
});

export const themePreferenceValidator = v.optional(
  v.union(v.literal("light"), v.literal("dark"), v.literal("system")),
);

export const colorSchemeValidator = v.optional(
  v.union(
    v.literal("default"),
    v.literal("calm-storm"),
    v.literal("cyberpunk"),
    v.literal("bubblegum"),
    v.literal("cotton-candy"),
    v.literal("caffeine"),
    v.literal("darkmatter"),
    v.literal("holoterminal"),
  ),
);

export const chromePreferenceValidator = v.optional(
  v.union(v.literal("auto"), v.literal("calm"), v.literal("expressive")),
);

export const chromeVariantValidator = v.union(
  v.literal("calm"),
  v.literal("expressive"),
  v.literal("holoterminal"),
  v.literal("bubblegum"),
  v.literal("darkmatter"),
);

export const colorPresetValidator = v.union(
  v.literal("default"),
  v.literal("calm-storm"),
  v.literal("cyberpunk"),
  v.literal("cotton-candy"),
  v.literal("caffeine"),
  v.literal("aurora"),
  v.literal("sorbet"),
  v.literal("singularity"),
);

export const appearancePrimarySecondaryValidator = v.object({
  primary: v.string(),
  secondary: v.string(),
});

export const appearanceModePairValidator = v.object({
  light: appearancePrimarySecondaryValidator,
  dark: appearancePrimarySecondaryValidator,
});

export const appearanceCustomValidator = v.object({
  fallback: appearanceModePairValidator,
  byChrome: v.optional(
    v.object({
      calm: v.optional(appearanceModePairValidator),
      expressive: v.optional(appearanceModePairValidator),
      holoterminal: v.optional(appearanceModePairValidator),
      bubblegum: v.optional(appearanceModePairValidator),
      darkmatter: v.optional(appearanceModePairValidator),
    }),
  ),
});

export const colorSourceValidator = v.union(
  v.object({
    kind: v.literal("preset"),
    preset: colorPresetValidator,
  }),
  v.object({
    kind: v.literal("custom"),
    custom: appearanceCustomValidator,
  }),
);

export const sessionValidator = v.object({
  _id: v.id("sessions"),
  _creationTime: v.number(),
  userId: v.id("users"),
  activeDeckId: v.optional(v.id("decks")),
  theme: themePreferenceValidator,
  chrome: v.optional(chromeVariantValidator),
  colorSource: v.optional(colorSourceValidator),
  colorScheme: colorSchemeValidator,
  chromePreference: chromePreferenceValidator,
  galleryFilters: v.optional(galleryFiltersValidator),
  rightSidebarAction: v.optional(v.string()),
  lastActiveAt: v.number(),
});

export const subFormatValidator = v.object({
  key: v.string(),
  name: v.string(),
});

export const formatValidator = v.object({
  _id: v.id("formats"),
  _creationTime: v.number(),
  key: v.string(),
  name: v.string(),
  description: v.optional(v.string()),
  isDefault: v.boolean(),
  minDeckSize: v.number(),
  maxDeckSize: v.optional(v.number()),
  sideboardRule: v.string(),
  defaultCopyLimit: v.number(),
  requiresStartingCharacter: v.boolean(),
  requiresIdentity: v.boolean(),
  subFormats: v.optional(v.array(subFormatValidator)),
});

export const cardLegalityValidator = v.object({
  _id: v.id("cardLegality"),
  _creationTime: v.number(),
  formatKey: v.string(),
  cardId: v.id("cards"),
  status: v.union(
    v.literal("legal"),
    v.literal("banned"),
    v.literal("restricted")
  ),
  copyLimitOverride: v.optional(v.number()),
  effectiveDate: v.optional(v.number()),
});

export const setLegalityValidator = v.object({
  _id: v.id("setLegality"),
  _creationTime: v.number(),
  formatKey: v.string(),
  setCode: v.string(),
  isLegal: v.boolean(),
  rotatesOutAt: v.optional(v.number()),
});

export const setDocValidator = v.object({
  _id: v.id("sets"),
  _creationTime: v.number(),
  code: v.string(),
  name: v.string(),
  setNumber: v.optional(v.number()),
  releasedAt: v.optional(v.number()),
  cardCount: v.optional(v.number()),
  iconUrl: v.optional(v.string()),
  legality: v.optional(v.string()),
  isRotating: v.optional(v.boolean()),
  isFuture: v.optional(v.boolean()),
  spotlightIP: v.optional(v.string()),
  updatedAt: v.optional(v.number()),
  updatedBy: v.optional(v.id("users")),
});

export const cardInputValidator = v.object({
  oracleId: v.optional(v.string()),
  name: v.string(),
  imageUrl: v.optional(v.string()),
  backCardId: v.optional(v.id("cards")),
  frontCardId: v.optional(v.id("cards")),
  isFrontFace: v.optional(v.boolean()),
  isVariant: v.optional(v.boolean()),
  setCode: v.optional(v.string()),
  setName: v.optional(v.string()),
  setNumber: v.optional(v.number()),
  collectorNumber: v.optional(v.string()),
  rarity: v.optional(v.string()),
  type: v.optional(v.string()),
  difficulty: v.optional(v.number()),
  control: v.optional(v.number()),
  speed: v.optional(v.number()),
  damage: v.optional(v.number()),
  blockModifier: v.optional(v.number()),
  handSize: v.optional(v.number()),
  health: v.optional(v.number()),
  stamina: v.optional(v.number()),
  attackZone: v.optional(v.string()),
  blockZone: v.optional(v.string()),
  text: v.optional(v.string()),
  keywords: v.optional(v.string()),
  symbols: v.optional(v.string()),
  searchName: v.optional(v.string()),
  searchText: v.optional(v.string()),
  searchAll: v.optional(v.string()),
  copyLimit: v.optional(v.number()),
});

export const ingestionJobValidator = v.object({
  _id: v.id("ingestionJobs"),
  _creationTime: v.number(),
  userId: v.id("users"),
  status: v.union(
    v.literal("pending"),
    v.literal("processing"),
    v.literal("completed"),
    v.literal("failed")
  ),
  totalRecords: v.number(),
  processedRecords: v.number(),
  failedRecords: v.number(),
  errorMessages: v.optional(v.array(v.string())),
  startedAt: v.number(),
  completedAt: v.optional(v.number()),
});

export const cardDataVersionValidator = v.object({
  _id: v.id("cardDataVersion"),
  _creationTime: v.number(),
  version: v.number(),
  updatedAt: v.number(),
  cardCount: v.number(),
});

export const teamRoleValidator = v.union(
  v.literal("captain"),
  v.literal("co_captain"),
  v.literal("architect"),
  v.literal("analyst"),
  v.literal("scout"),
  v.literal("pilot"),
);

export const teamMemberStatusValidator = v.union(
  v.literal("active"),
  v.literal("removed"),
);

export const teamValidator = v.object({
  _id: v.id("teams"),
  _creationTime: v.number(),
  name: v.string(),
  slug: v.optional(v.string()),
  captainUserId: v.id("users"),
  description: v.optional(v.string()),
  imageStorageId: v.optional(v.id("_storage")),
  logoAssetId: v.optional(v.id("mediaAssets")),
  createdAt: v.number(),
  updatedAt: v.number(),
});

export const teamMemberValidator = v.object({
  _id: v.id("teamMembers"),
  _creationTime: v.number(),
  teamId: v.id("teams"),
  userId: v.id("users"),
  role: teamRoleValidator,
  joinedAt: v.number(),
  status: teamMemberStatusValidator,
});

export const teamInviteValidator = v.object({
  _id: v.id("teamInvites"),
  _creationTime: v.number(),
  teamId: v.id("teams"),
  email: v.optional(v.string()),
  invitedUserId: v.optional(v.id("users")),
  tokenHash: v.string(),
  role: teamRoleValidator,
  invitedByUserId: v.id("users"),
  createdAt: v.number(),
  expiresAt: v.number(),
  acceptedAt: v.optional(v.number()),
  declinedAt: v.optional(v.number()),
});

export const teamAnnouncementValidator = v.object({
  _id: v.id("teamAnnouncements"),
  _creationTime: v.number(),
  teamId: v.id("teams"),
  authorUserId: v.id("users"),
  title: v.string(),
  body: v.string(),
  pinned: v.boolean(),
  createdAt: v.number(),
});

export const teamChatMessageValidator = v.object({
  _id: v.id("teamChatMessages"),
  _creationTime: v.number(),
  teamId: v.id("teams"),
  authorUserId: v.id("users"),
  body: v.string(),
  createdAt: v.number(),
  textModerationProvider: v.optional(v.string()),
  textModerationResult: v.optional(v.any()),
});

export const teamEventValidator = v.object({
  _id: v.id("teamEvents"),
  _creationTime: v.number(),
  teamId: v.id("teams"),
  title: v.string(),
  description: v.optional(v.string()),
  startsAt: v.number(),
  endsAt: v.optional(v.number()),
  createdByUserId: v.id("users"),
  createdAt: v.number(),
});

export const userFeedbackKindValidator = v.union(
  v.literal("general"),
  v.literal("feature_idea"),
  v.literal("bug"),
  v.literal("enhancement"),
  v.literal("other"),
);
