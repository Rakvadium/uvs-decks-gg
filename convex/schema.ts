import { defineSchema, defineTable } from "convex/server";
import { authTables } from "@convex-dev/auth/server";
import { v } from "convex/values";
import {
  chromePreferenceValidator,
  chromeVariantValidator,
  colorSchemeValidator,
  colorSourceValidator,
  userFeedbackKindValidator,
  deckBuilderUiStateV1Validator,
  deckTeamCollaborationValidator,
  deckVisibilityValidator,
  teamMemberStatusValidator,
  teamRoleValidator,
} from "./validators";

export default defineSchema({
  ...authTables,

  cardDataVersion: defineTable({
    version: v.number(),
    updatedAt: v.number(),
    cardCount: v.number(),
  }),

  cardFacetSnapshot: defineTable({
    key: v.literal("default"),
    rarities: v.array(v.string()),
    types: v.array(v.string()),
    setCodes: v.array(v.string()),
    updatedAt: v.number(),
  }).index("by_key", ["key"]),

  users: defineTable({
    username: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    image: v.optional(v.string()),
    isAnonymous: v.optional(v.boolean()),
    role: v.optional(v.string()),
    profanityFilterEnabled: v.optional(v.boolean()),
    accountStatus: v.optional(
      v.union(
        v.literal("active"),
        v.literal("suspended"),
        v.literal("banned"),
        v.literal("write_restricted")
      )
    ),
    statusReason: v.optional(v.string()),
    statusSetAt: v.optional(v.number()),
    statusSetBy: v.optional(v.id("users")),
    statusExpiresAt: v.optional(v.number()),
    userFacingMessage: v.optional(v.string()),
    adminSearchText: v.optional(v.string()),
    hasVerifiedEmail: v.optional(v.boolean()),
  })
    .index("by_email", ["email"])
    .index("by_username", ["username"])
    .index("by_accountStatus", ["accountStatus"])
    .index("by_role", ["role"])
    .index("by_hasVerifiedEmail", ["hasVerifiedEmail"])
    .searchIndex("search_admin_users", {
      searchField: "adminSearchText",
      filterFields: ["accountStatus", "role", "isAnonymous", "hasVerifiedEmail"],
    }),

  sets: defineTable({
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
  })
    .index("by_code", ["code"])
    .index("by_setNumber", ["setNumber"])
    .index("by_isRotating", ["isRotating"])
    .index("by_isFuture", ["isFuture"]),

  cards: defineTable({
    oracleId: v.optional(v.string()),
    name: v.string(),
    imageUrl: v.optional(v.string()),
    backCardId: v.optional(v.id("cards")),
    frontCardId: v.optional(v.id("cards")),
    isFrontFace: v.optional(v.boolean()),
    isVariant: v.optional(v.boolean()),
    number: v.optional(v.number()),
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
    contentRevisionAt: v.optional(v.number()),
    setCode: v.optional(v.string()),
    setName: v.optional(v.string()),
    setNumber: v.optional(v.number()),
    legality: v.optional(v.string()),
  })
    .index("by_setCode_and_collectorNumber", ["setCode", "collectorNumber"])
    .index("by_setCode_and_name", ["setCode", "name"])
    .index("by_setName", ["setName"])
    .index("by_setNumber", ["setNumber"])
    .index("by_rarity", ["rarity"])
    .index("by_type", ["type"])
    .index("by_type_and_name", ["type", "name"])
    .index("by_difficulty", ["difficulty"])
    .index("by_oracleId", ["oracleId"])
    .index("by_backCardId", ["backCardId"])
    .index("by_frontCardId", ["frontCardId"])
    .index("by_isVariant", ["isVariant"])
    .index("by_collectorNumber", ["collectorNumber"])
    .index("by_control", ["control"])
    .index("by_speed", ["speed"])
    .searchIndex("search_tier1_name", {
      searchField: "searchName",
      filterFields: [],
    })
    .searchIndex("search_tier2_keywords", {
      searchField: "searchText",
      filterFields: ["type", "rarity"],
    })
    .searchIndex("search_tier3_all", {
      searchField: "searchAll",
      filterFields: ["type", "rarity"],
    })
    .searchIndex("search_gallery_name", {
      searchField: "searchName",
      filterFields: ["setCode", "type", "rarity"],
    }),

  decks: defineTable({
    userId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    visibility: v.optional(deckVisibilityValidator),
    teamId: v.optional(v.id("teams")),
    teamCollaboration: v.optional(deckTeamCollaborationValidator),
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
    cardLayouts: v.optional(v.record(v.string(), v.object({
      columns: v.array(v.object({
        id: v.string(),
        name: v.string(),
        color: v.string(),
        cardIds: v.array(v.string()),
      })),
      unassignedCardIds: v.array(v.string()),
    }))),
    revision: v.optional(v.number()),
  })
    .index("by_user", ["userId"])
    .index("by_isPublic", ["isPublic"])
    .index("by_visibility", ["visibility"])
    .index("by_teamId", ["teamId"])
    .index("by_format", ["format"]),

  deckShares: defineTable({
    deckId: v.id("decks"),
    userId: v.id("users"),
    status: v.union(v.literal("pending"), v.literal("accepted")),
    invitedBy: v.id("users"),
    createdAt: v.number(),
  })
    .index("by_deck", ["deckId"])
    .index("by_deck_and_user", ["deckId", "userId"])
    .index("by_user_and_status", ["userId", "status"]),

  mediaAssets: defineTable({
    kind: v.union(v.literal("team_logo"), v.literal("profile_avatar")),
    teamId: v.optional(v.id("teams")),
    userId: v.optional(v.id("users")),
    storageId: v.id("_storage"),
    uploadedByUserId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("approved"),
      v.literal("rejected"),
      v.literal("needs_review"),
    ),
    moderationProvider: v.optional(v.string()),
    moderationResult: v.optional(v.any()),
    createdAt: v.number(),
    resolvedAt: v.optional(v.number()),
    reviewedAt: v.optional(v.number()),
    reviewerUserId: v.optional(v.id("users")),
  })
    .index("by_status", ["status"])
    .index("by_teamId", ["teamId"])
    .index("by_teamId_and_kind", ["teamId", "kind"])
    .index("by_kind_and_status", ["kind", "status"]),

  teams: defineTable({
    name: v.string(),
    slug: v.optional(v.string()),
    captainUserId: v.id("users"),
    description: v.optional(v.string()),
    imageStorageId: v.optional(v.id("_storage")),
    logoAssetId: v.optional(v.id("mediaAssets")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_slug", ["slug"])
    .index("by_captainUserId", ["captainUserId"]),

  teamMembers: defineTable({
    teamId: v.id("teams"),
    userId: v.id("users"),
    role: teamRoleValidator,
    joinedAt: v.number(),
    status: teamMemberStatusValidator,
  })
    .index("by_teamId_and_userId", ["teamId", "userId"])
    .index("by_userId", ["userId"])
    .index("by_teamId", ["teamId"]),

  teamInvites: defineTable({
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
  })
    .index("by_teamId", ["teamId"])
    .index("by_tokenHash", ["tokenHash"])
    .index("by_email_and_teamId", ["email", "teamId"]),

  teamAnnouncements: defineTable({
    teamId: v.id("teams"),
    authorUserId: v.id("users"),
    title: v.string(),
    body: v.string(),
    pinned: v.boolean(),
    createdAt: v.number(),
  }).index("by_teamId_and_createdAt", ["teamId", "createdAt"]),

  teamChatMessages: defineTable({
    teamId: v.id("teams"),
    authorUserId: v.id("users"),
    body: v.string(),
    createdAt: v.number(),
    textModerationProvider: v.optional(v.string()),
    textModerationResult: v.optional(v.any()),
  })
    .index("by_teamId_and_createdAt", ["teamId", "createdAt"])
    .index("by_authorUserId", ["authorUserId"]),

  teamEvents: defineTable({
    teamId: v.id("teams"),
    title: v.string(),
    description: v.optional(v.string()),
    startsAt: v.number(),
    endsAt: v.optional(v.number()),
    createdByUserId: v.id("users"),
    createdAt: v.number(),
  }).index("by_teamId_and_startsAt", ["teamId", "startsAt"]),

  deckBuilderSessions: defineTable({
    deckId: v.id("decks"),
    teamId: v.id("teams"),
    updatedAt: v.number(),
    uiState: deckBuilderUiStateV1Validator,
    deckRevision: v.optional(v.number()),
  }).index("by_deckId", ["deckId"]),

  deckPresence: defineTable({
    deckId: v.id("decks"),
    userId: v.id("users"),
    sessionId: v.string(),
    color: v.string(),
    label: v.string(),
    cursor: v.object({
      x: v.number(),
      y: v.number(),
      viewportW: v.number(),
      viewportH: v.number(),
      normX: v.number(),
      normY: v.number(),
    }),
    lastSeenAt: v.number(),
  })
    .index("by_deckId", ["deckId"])
    .index("by_deckId_and_userId_and_sessionId", ["deckId", "userId", "sessionId"]),

  tierLists: defineTable({
    userId: v.id("users"),
    title: v.string(),
    description: v.optional(v.string()),
    isPublic: v.boolean(),
    rankingScope: v.optional(v.union(
      v.literal("unranked"),
      v.literal("global"),
      v.literal("set_scope")
    )),
    rankingScopeKey: v.optional(v.string()),
    selectedSetCodes: v.array(v.string()),
    poolScopes: v.optional(
      v.array(
        v.object({
          setCode: v.string(),
          cardType: v.string(),
        })
      )
    ),
    previewCardIds: v.array(v.id("cards")),
    tiers: v.array(v.object({
      id: v.string(),
      label: v.string(),
      color: v.string(),
      order: v.number(),
    })),
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
  })
    .index("by_user_and_updatedAt", ["userId", "updatedAt"])
    .index("by_isPublic_and_updatedAt", ["isPublic", "updatedAt"])
    .index("by_isPublic_and_rankingScope_and_updatedAt", ["isPublic", "rankingScope", "updatedAt"])
    .index("by_isPublic_and_rankingScope_and_scopeKey_and_updatedAt", ["isPublic", "rankingScope", "rankingScopeKey", "updatedAt"])
    .index("by_userId_and_listModerationStatus", ["userId", "listModerationStatus"]),

  tierListItems: defineTable({
    tierListId: v.id("tierLists"),
    cardId: v.id("cards"),
    laneKey: v.string(),
    order: v.number(),
  })
    .index("by_tierList", ["tierListId"])
    .index("by_tierList_and_laneKey_and_order", ["tierListId", "laneKey", "order"]),

  communityCardRankings: defineTable({
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
  })
    .index("by_scope", ["scopeType", "scopeKey"])
    .index("by_scope_and_adjustedScore", ["scopeType", "scopeKey", "adjustedScore"]),

  communityTierSnapshots: defineTable({
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
  })
    .index("by_scope", ["scopeType", "scopeKey"])
    .index("by_scopeType_and_lastComputedAt", ["scopeType", "lastComputedAt"]),

  collections: defineTable({
    userId: v.id("users"),
    cardId: v.id("cards"),
    quantity: v.number(),
    condition: v.optional(v.string()),
    isFoil: v.optional(v.boolean()),
  })
    .index("by_user", ["userId"])
    .index("by_user_and_card", ["userId", "cardId"]),

  sessions: defineTable({
    userId: v.id("users"),
    activeDeckId: v.optional(v.id("decks")),
    theme: v.optional(v.union(v.literal("light"), v.literal("dark"), v.literal("system"))),
    chrome: v.optional(chromeVariantValidator),
    colorSource: v.optional(colorSourceValidator),
    colorScheme: colorSchemeValidator,
    chromePreference: chromePreferenceValidator,
    galleryFilters: v.optional(v.any()),
    rightSidebarAction: v.optional(v.string()),
    lastActiveAt: v.number(),
  })
    .index("by_user", ["userId"]),

  subscriptions: defineTable({
    userId: v.id("users"),
    plan: v.string(),
    status: v.string(),
    expiresAt: v.optional(v.number()),
  }).index("by_user", ["userId"]),

  deckLikes: defineTable({
    userId: v.id("users"),
    deckId: v.id("decks"),
  })
    .index("by_user", ["userId"])
    .index("by_deck", ["deckId"])
    .index("by_user_and_deck", ["userId", "deckId"]),

  tierListLikes: defineTable({
    userId: v.id("users"),
    tierListId: v.id("tierLists"),
  })
    .index("by_user", ["userId"])
    .index("by_tierList", ["tierListId"])
    .index("by_user_and_tierList", ["userId", "tierListId"]),

  tierListComments: defineTable({
    tierListId: v.id("tierLists"),
    userId: v.id("users"),
    content: v.string(),
    status: v.union(
      v.literal("approved"),
      v.literal("pending"),
      v.literal("flagged"),
      v.literal("rejected")
    ),
    moderationReason: v.optional(v.string()),
    textModerationProvider: v.optional(v.string()),
    textModerationResult: v.optional(v.any()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_tierList", ["tierListId"])
    .index("by_user", ["userId"])
    .index("by_tierList_and_status_and_createdAt", ["tierListId", "status", "createdAt"]),

  deckViews: defineTable({
    userId: v.id("users"),
    deckId: v.id("decks"),
    viewedAt: v.number(),
  })
    .index("by_user", ["userId"])
    .index("by_deck", ["deckId"])
    .index("by_user_and_deck", ["userId", "deckId"]),

  follows: defineTable({
    followerId: v.id("users"),
    followingId: v.id("users"),
  })
    .index("by_follower", ["followerId"])
    .index("by_following", ["followingId"])
    .index("by_follower_and_following", ["followerId", "followingId"]),

  ingestionJobs: defineTable({
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
  })
    .index("by_user", ["userId"])
    .index("by_status", ["status"]),

  adminAuditLog: defineTable({
    userId: v.id("users"),
    action: v.string(),
    at: v.number(),
    detail: v.optional(v.string()),
  }).index("by_user", ["userId"]),

  moderationAuditLog: defineTable({
    actorId: v.id("users"),
    targetUserId: v.optional(v.id("users")),
    action: v.string(),
    payload: v.optional(v.string()),
  })
    .index("by_targetUser", ["targetUserId"])
    .index("by_actor", ["actorId"]),

  formats: defineTable({
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
    subFormats: v.optional(v.array(v.object({
      key: v.string(),
      name: v.string(),
    }))),
  })
    .index("by_key", ["key"]),

  cardLegality: defineTable({
    formatKey: v.string(),
    cardId: v.id("cards"),
    status: v.union(
      v.literal("legal"),
      v.literal("banned"),
      v.literal("restricted")
    ),
    copyLimitOverride: v.optional(v.number()),
    effectiveDate: v.optional(v.number()),
  })
    .index("by_format", ["formatKey"])
    .index("by_card", ["cardId"])
    .index("by_format_card", ["formatKey", "cardId"]),

  setLegality: defineTable({
    formatKey: v.string(),
    setCode: v.string(),
    isLegal: v.boolean(),
    rotatesOutAt: v.optional(v.number()),
  })
    .index("by_format", ["formatKey"])
    .index("by_format_set", ["formatKey", "setCode"]),

  communityYoutubeCurations: defineTable({
    youtubeVideoId: v.string(),
    label: v.optional(v.string()),
    accentClass: v.optional(v.string()),
    sortOrder: v.number(),
  })
    .index("by_sortOrder", ["sortOrder"])
    .index("by_youtubeVideoId", ["youtubeVideoId"]),

  youtubeVideoMetadataCache: defineTable({
    youtubeVideoId: v.string(),
    title: v.string(),
    channelTitle: v.string(),
    durationSeconds: v.number(),
    viewCount: v.number(),
    thumbnailUrl: v.string(),
    fetchedAt: v.number(),
    fetchError: v.optional(v.string()),
  }).index("by_youtubeVideoId", ["youtubeVideoId"]),

  youtubeFeedRefreshSettings: defineTable({
    key: v.string(),
    lastRefreshAttemptAt: v.number(),
  }).index("by_key", ["key"]),

  communityYoutubeCurationInitState: defineTable({
    key: v.string(),
  }).index("by_key", ["key"]),

  communityLiveStatusCache: defineTable({
    key: v.literal("singleton"),
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
  }).index("by_key", ["key"]),

  userFeedback: defineTable({
    kind: userFeedbackKindValidator,
    pagePath: v.string(),
    message: v.string(),
    isAnonymous: v.boolean(),
    userId: v.optional(v.id("users")),
  }),
});
