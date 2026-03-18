import { v } from "convex/values";

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
  copyLimit: v.optional(v.number())
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
});

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
});

export const tierDefinitionValidator = v.object({
  id: v.string(),
  label: v.string(),
  color: v.string(),
  order: v.number(),
});

export const tierListValidator = v.object({
  _id: v.id("tierLists"),
  _creationTime: v.number(),
  userId: v.id("users"),
  title: v.string(),
  description: v.optional(v.string()),
  isPublic: v.boolean(),
  selectedSetCodes: v.array(v.string()),
  previewCardIds: v.array(v.id("cards")),
  tiers: v.array(tierDefinitionValidator),
  itemCount: v.number(),
  tierCount: v.number(),
  likeCount: v.number(),
  commentCount: v.number(),
  featuredCardId: v.optional(v.id("cards")),
  updatedAt: v.number(),
});

export const tierListItemValidator = v.object({
  _id: v.id("tierListItems"),
  _creationTime: v.number(),
  tierListId: v.id("tierLists"),
  cardId: v.id("cards"),
  laneKey: v.string(),
  order: v.number(),
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
  v.union(v.literal("light"), v.literal("dark"), v.literal("system"))
);

export const colorSchemeValidator = v.optional(
  v.union(
    v.literal("default"),
    v.literal("calm-storm"),
    v.literal("cyberpunk"),
    v.literal("bubblegum"),
    v.literal("caffeine"),
    v.literal("darkmatter"),
    v.literal("holoterminal")
  )
);

export const sessionValidator = v.object({
  _id: v.id("sessions"),
  _creationTime: v.number(),
  userId: v.id("users"),
  activeDeckId: v.optional(v.id("decks")),
  theme: themePreferenceValidator,
  colorScheme: colorSchemeValidator,
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
