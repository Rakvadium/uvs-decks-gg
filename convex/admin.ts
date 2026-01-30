import {
  query,
  mutation,
  action,
  internalMutation,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";
import { cardValidator, cardInputValidator, subFormatValidator, ingestionJobValidator } from "./validators";
import { requireAdmin } from "./utils/validation";

export const releaseCards = mutation({
  args: {},
  returns: v.object({
    version: v.number(),
    cardCount: v.number(),
    previousVersion: v.union(v.number(), v.null()),
  }),
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const cards = await ctx.db.query("cards").collect();
    const cardCount = cards.filter(
      (card) => card.isFrontFace !== false && card.isVariant !== true
    ).length;

    const now = Date.now();
    const existingVersion = await ctx.db.query("cardDataVersion").first();

    if (existingVersion) {
      const newVersion = existingVersion.version + 1;
      await ctx.db.patch(existingVersion._id, {
        version: newVersion,
        updatedAt: now,
        cardCount,
      });
      return {
        version: newVersion,
        cardCount,
        previousVersion: existingVersion.version,
      };
    } else {
      await ctx.db.insert("cardDataVersion", {
        version: 1,
        updatedAt: now,
        cardCount,
      });
      return {
        version: 1,
        cardCount,
        previousVersion: null,
      };
    }
  },
});

export const listUnreleasedCards = query({
  args: {},
  returns: v.array(cardValidator),
  handler: async (ctx) => {
    await requireAdmin(ctx);

    return await ctx.db
      .query("cards")
      .collect();
  },
});

export const createSet = mutation({
  args: {
    code: v.string(),
    name: v.string(),
    releasedAt: v.optional(v.number()),
    cardCount: v.optional(v.number()),
    iconUrl: v.optional(v.string()),
    setNumber: v.optional(v.number()),
    legality: v.optional(v.string()),
    isRotating: v.optional(v.boolean()),
    isFuture: v.optional(v.boolean()),
  },
  returns: v.id("sets"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const existing = await ctx.db
      .query("sets")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();
    if (existing) {
      throw new Error(`Set with code "${args.code}" already exists`);
    }

    return await ctx.db.insert("sets", args);
  },
});

export const updateSet = mutation({
  args: {
    setId: v.id("sets"),
    name: v.optional(v.string()),
    releasedAt: v.optional(v.number()),
    cardCount: v.optional(v.number()),
    iconUrl: v.optional(v.string()),
    setNumber: v.optional(v.number()),
    legality: v.optional(v.string()),
    isRotating: v.optional(v.boolean()),
    isFuture: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const { setId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );

    if (Object.keys(filteredUpdates).length > 0) {
      await ctx.db.patch(setId, filteredUpdates);
    }
    return null;
  },
});

export const deleteSet = mutation({
  args: {
    setId: v.id("sets"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.setId);
    return null;
  },
});

export const createFormat = mutation({
  args: {
    key: v.string(),
    name: v.string(),
    description: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
    minDeckSize: v.number(),
    maxDeckSize: v.optional(v.number()),
    sideboardRule: v.string(),
    defaultCopyLimit: v.number(),
    requiresStartingCharacter: v.optional(v.boolean()),
    requiresIdentity: v.optional(v.boolean()),
    subFormats: v.optional(v.array(v.object({
      key: v.string(),
      name: v.string(),
    }))),
  },
  returns: v.id("formats"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const existing = await ctx.db
      .query("formats")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .unique();
    if (existing) {
      throw new Error(`Format with key "${args.key}" already exists`);
    }

    if (args.isDefault) {
      const existingFormats = await ctx.db.query("formats").collect();
      for (const format of existingFormats) {
        if (format.isDefault) {
          await ctx.db.patch(format._id, { isDefault: false });
        }
      }
    }

    return await ctx.db.insert("formats", {
      key: args.key,
      name: args.name,
      description: args.description,
      isDefault: args.isDefault ?? false,
      minDeckSize: args.minDeckSize,
      maxDeckSize: args.maxDeckSize,
      sideboardRule: args.sideboardRule,
      defaultCopyLimit: args.defaultCopyLimit,
      requiresStartingCharacter: args.requiresStartingCharacter ?? false,
      requiresIdentity: args.requiresIdentity ?? false,
      subFormats: args.subFormats,
    });
  },
});

export const updateFormat = mutation({
  args: {
    formatId: v.id("formats"),
    name: v.optional(v.string()),
    description: v.optional(v.string()),
    isDefault: v.optional(v.boolean()),
    minDeckSize: v.optional(v.number()),
    maxDeckSize: v.optional(v.number()),
    sideboardRule: v.optional(v.string()),
    defaultCopyLimit: v.optional(v.number()),
    requiresStartingCharacter: v.optional(v.boolean()),
    requiresIdentity: v.optional(v.boolean()),
    subFormats: v.optional(v.array(v.object({
      key: v.string(),
      name: v.string(),
    }))),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const format = await ctx.db.get(args.formatId);
    if (!format) {
      throw new Error("Format not found");
    }

    if (args.isDefault && !format.isDefault) {
      const existingFormats = await ctx.db.query("formats").collect();
      for (const existingFormat of existingFormats) {
        if (existingFormat.isDefault && existingFormat._id !== args.formatId) {
          await ctx.db.patch(existingFormat._id, { isDefault: false });
        }
      }
    }

    const { formatId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([, v]) => v !== undefined)
    );

    if (Object.keys(filteredUpdates).length > 0) {
      await ctx.db.patch(args.formatId, filteredUpdates);
    }
    return null;
  },
});

export const deleteFormat = mutation({
  args: {
    formatId: v.id("formats"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.formatId);
    return null;
  },
});

export const seedFormats = mutation({
  args: {},
  returns: v.object({
    created: v.number(),
    skipped: v.number(),
  }),
  handler: async (ctx) => {
    const defaultFormats = [
      {
        key: "standard",
        name: "Standard",
        description: "The primary competitive format featuring the most recent sets.",
        isDefault: true,
        minDeckSize: 60,
        maxDeckSize: undefined,
        sideboardRule: "optional",
        defaultCopyLimit: 4,
        requiresStartingCharacter: true,
        requiresIdentity: false,
      },
      {
        key: "heroic",
        name: "Heroic",
        description: "An extended format including older sets.",
        isDefault: false,
        minDeckSize: 60,
        maxDeckSize: undefined,
        sideboardRule: "optional",
        defaultCopyLimit: 4,
        requiresStartingCharacter: true,
        requiresIdentity: false,
      },
      {
        key: "retro",
        name: "Retro",
        description: "A legacy format including all sets from the game's history.",
        isDefault: false,
        minDeckSize: 60,
        maxDeckSize: undefined,
        sideboardRule: "optional",
        defaultCopyLimit: 4,
        requiresStartingCharacter: true,
        requiresIdentity: false,
      },
    ];

    let created = 0;
    let skipped = 0;

    for (const format of defaultFormats) {
      const existing = await ctx.db
        .query("formats")
        .withIndex("by_key", (q) => q.eq("key", format.key))
        .unique();

      if (existing) {
        skipped++;
        continue;
      }

      await ctx.db.insert("formats", format);
      created++;
    }

    return { created, skipped };
  },
});

export const createCard = mutation({
  args: {
    card: cardInputValidator,
  },
  returns: v.id("cards"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const searchName = args.card.searchName ?? args.card.name;

    return await ctx.db.insert("cards", {
      ...args.card,
      searchName
    });
  },
});

export const updateCard = mutation({
  args: {
    cardId: v.id("cards"),
    updates: v.object({
      name: v.optional(v.string()),
      imageUrl: v.optional(v.string()),
      backCardId: v.optional(v.id("cards")),
      frontCardId: v.optional(v.id("cards")),
      isFrontFace: v.optional(v.boolean()),
      isVariant: v.optional(v.boolean()),
      variantType: v.optional(v.string()),
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
      keywords: v.optional(v.array(v.string())),
      keywordSearch: v.optional(v.string()),
      symbols: v.optional(v.array(v.string())),
      symbolSearch: v.optional(v.string()),
      searchName: v.optional(v.string()),
      searchText: v.optional(v.string()),
      searchAll: v.optional(v.string()),
      copyLimit: v.optional(v.number())
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const filteredUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(args.updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }

    if (filteredUpdates.name) {
      if (!filteredUpdates.searchName) {
        filteredUpdates.searchName = filteredUpdates.name;
      }
    }

    if (Object.keys(filteredUpdates).length > 0) {
      await ctx.db.patch(args.cardId, filteredUpdates);
    }
    return null;
  },
});

export const deleteCard = mutation({
  args: {
    cardId: v.id("cards"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    await ctx.db.delete(args.cardId);
    return null;
  },
});

interface CardImportData {
  oracleId?: string;
  name: string;
  imageUrl?: string;
  backCardId?: Id<"cards">;
  frontCardId?: Id<"cards">;
  isFrontFace?: boolean;
  setCode?: string;
  setName?: string;
  setNumber?: number;
  collectorNumber?: string;
  rarity?: string;
  type?: string;
  difficulty?: number;
  control?: number;
  speed?: number;
  damage?: number;
  blockModifier?: number;
  handSize?: number;
  health?: number;
  stamina?: number;
  attackZone?: string;
  blockZone?: string;
  text?: string;
  keywords?: string;
  symbols?: string;
  searchName?: string;
  searchText?: string;
  searchAll?: string;
  copyLimit?: number;
}

export const insertCardBatch = internalMutation({
  args: {
    cards: v.array(v.any()),
    jobId: v.id("ingestionJobs"),
  },
  returns: v.object({
    inserted: v.number(),
    failed: v.number(),
    errors: v.array(v.string()),
  }),
  handler: async (ctx, args) => {
    let inserted = 0;
    let failed = 0;
    const errors: Array<string> = [];

    for (const card of args.cards as CardImportData[]) {
      try {
        if (!card.name) {
          throw new Error("Card must have and name");
        }

        const existing = await ctx.db
          .query("cards")
          .unique();

        const searchName = card.searchName ?? card.name;

        if (existing) {
          await ctx.db.patch(existing._id, {
            ...card,
            searchName
          });
        } else {
          await ctx.db.insert("cards", {
            ...card,
            searchName
          });
        }
        inserted++;
      } catch (e) {
        failed++;
        errors.push(`Card "${card.name}": ${(e as Error).message}`);
      }
    }

    const job = await ctx.db.get(args.jobId);
    if (job) {
      await ctx.db.patch(args.jobId, {
        processedRecords: job.processedRecords + inserted,
        failedRecords: job.failedRecords + failed,
        errorMessages: [...(job.errorMessages ?? []), ...errors].slice(-100),
      });
    }

    return { inserted, failed, errors };
  },
});

export const bulkImportCards = action({
  args: {
    format: v.union(v.literal("json")),
    data: v.string(),
  },
  returns: v.object({
    jobId: v.id("ingestionJobs"),
    totalRecords: v.number(),
  }),
  handler: async (ctx, args): Promise<{ jobId: Id<"ingestionJobs">; totalRecords: number }> => {
    let cards: CardImportData[];
    if (args.format === "json") {
      try {
        cards = JSON.parse(args.data) as CardImportData[];
        if (!Array.isArray(cards)) {
          throw new Error("JSON data must be an array of cards");
        }
      } catch (e) {
        throw new Error(`Invalid JSON: ${(e as Error).message}`);
      }
    } else {
      throw new Error("Only JSON format is currently supported");
    }

    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const jobId = await ctx.runMutation(internal.admin.createIngestionJob, {
      userId,
      totalRecords: cards.length,
    });

    const BATCH_SIZE = 100;
    for (let i = 0; i < cards.length; i += BATCH_SIZE) {
      const batch = cards.slice(i, i + BATCH_SIZE);
      await ctx.runMutation(internal.admin.insertCardBatch, {
        cards: batch,
        jobId,
      });
    }

    await ctx.runMutation(internal.admin.completeIngestionJob, { jobId });

    return { jobId, totalRecords: cards.length };
  },
});

export const createIngestionJob = internalMutation({
  args: {
    userId: v.id("users"),
    totalRecords: v.number(),
  },
  returns: v.id("ingestionJobs"),
  handler: async (ctx, args) => {
    return await ctx.db.insert("ingestionJobs", {
      userId: args.userId,
      status: "processing" as const,
      totalRecords: args.totalRecords,
      processedRecords: 0,
      failedRecords: 0,
      errorMessages: [],
      startedAt: Date.now(),
    });
  },
});

export const completeIngestionJob = internalMutation({
  args: {
    jobId: v.id("ingestionJobs"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const job = await ctx.db.get(args.jobId);
    if (job) {
      const status = job.failedRecords > 0 && job.processedRecords === 0
        ? ("failed" as const)
        : ("completed" as const);
      await ctx.db.patch(args.jobId, {
        status,
        completedAt: Date.now(),
      });
    }
    return null;
  },
});

export const getIngestionJob = query({
  args: {
    jobId: v.id("ingestionJobs"),
  },
  returns: v.union(ingestionJobValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.jobId);
  },
});

export const deleteCardsBatch = internalMutation({
  args: {
    limit: v.number(),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const cards = await ctx.db
      .query("cards")
      .take(args.limit);

    for (const card of cards) {
      await ctx.db.delete(card._id);
    }

    return cards.length;
  },
});

export const deleteCardsBatchWithKey = mutation({
  args: {
    adminApiKey: v.string(),
    limit: v.number(),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    validateAdminApiKey(args.adminApiKey);

    const cards = await ctx.db
      .query("cards")
      .take(args.limit);

    for (const card of cards) {
      await ctx.db.delete(card._id);
    }

    return cards.length;
  },
});

export const clearAllCards = action({
  args: {},
  returns: v.object({
    deletedCount: v.number(),
  }),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const BATCH_SIZE = 500;
    let totalDeleted = 0;
    let deletedInBatch = BATCH_SIZE;

    while (deletedInBatch === BATCH_SIZE) {
      deletedInBatch = await ctx.runMutation(internal.admin.deleteCardsBatch, {
        limit: BATCH_SIZE,
      });
      totalDeleted += deletedInBatch;
    }

    return { deletedCount: totalDeleted };
  },
});

export const getCardCount = query({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    let count = 0;
    const query = ctx.db.query("cards");

    for await (const _ of query) {
      count++;
    }
    return count;
  },
});

export const importCardsBatch = internalMutation({
  args: {
    cards: v.array(v.any()),
  },
  returns: v.object({
    inserted: v.number(),
    failed: v.number(),
  }),
  handler: async (ctx, args) => {
    let inserted = 0;
    let failed = 0;

    for (const card of args.cards as CardImportData[]) {
      try {
        if (!card.name) {
          throw new Error("Card must have a name");
        }

        const searchName = card.searchName ?? card.name;
        const searchText = [
          card.name,
          card.keywords ?? "",
          card.text ?? "",
        ].join(" ");
        const searchAll = [
          searchName,
          searchText,
          card.setName ?? "",
          card.type ?? "",
          card.rarity ?? "",
        ].join(" ");

        await ctx.db.insert("cards", {
          ...card,
          searchName,
          searchText,
          searchAll
        });
        inserted++;
      } catch {
        failed++;
      }
    }

    return { inserted, failed };
  },
});

export const importUniversusCards = action({
  args: {
    cardsJson: v.string(),
  },
  returns: v.object({
    totalCards: v.number(),
    inserted: v.number(),
    failed: v.number(),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    let cards: CardImportData[];
    try {
      cards = JSON.parse(args.cardsJson) as CardImportData[];
      if (!Array.isArray(cards)) {
        throw new Error("JSON data must be an array of cards");
      }
    } catch (e) {
      throw new Error(`Invalid JSON: ${(e as Error).message}`);
    }

    const BATCH_SIZE = 50;
    let totalInserted = 0;
    let totalFailed = 0;

    for (let i = 0; i < cards.length; i += BATCH_SIZE) {
      const batch = cards.slice(i, i + BATCH_SIZE);
      const result = await ctx.runMutation(internal.admin.importCardsBatch, {
        cards: batch,
      });
      totalInserted += result.inserted;
      totalFailed += result.failed;
    }

    return {
      totalCards: cards.length,
      inserted: totalInserted,
      failed: totalFailed,
    };
  },
});

export const importCardsOnly = action({
  args: {
    cards: v.array(v.any()),
  },
  returns: v.object({
    imported: v.number(),
    failed: v.number(),
    errors: v.optional(v.array(v.string())),
  }),
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const result: { inserted: number; failed: number } = await ctx.runMutation(internal.admin.importCardsBatch, {
      cards: args.cards,
    });

    return {
      imported: result.inserted,
      failed: result.failed,
      errors: [],
    };
  },
});

export const migrateCardFieldsBatch = internalMutation({
  args: {
    limit: v.number(),
    cursor: v.optional(v.string()),
  },
  returns: v.object({
    migrated: v.number(),
    cursor: v.union(v.string(), v.null()),
    isDone: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const result = await ctx.db
      .query("cards")
      .paginate({ numItems: args.limit, cursor: args.cursor ?? null });

    let migrated = 0;

    for (const card of result.page) {
      const rawCard = card as Record<string, unknown>;
      const updates: Record<string, unknown> = {};

      if ("primaryCost" in rawCard && rawCard.primaryCost !== undefined) {
        updates.difficulty = rawCard.primaryCost;
      }
      if ("secondaryCost" in rawCard && rawCard.secondaryCost !== undefined) {
        updates.control = rawCard.secondaryCost;
      }
      if ("stat1" in rawCard && rawCard.stat1 !== undefined) {
        updates.speed = rawCard.stat1;
      }
      if ("stat2" in rawCard && rawCard.stat2 !== undefined) {
        updates.damage = rawCard.stat2;
      }
      if ("stat3" in rawCard && rawCard.stat3 !== undefined) {
        updates.blockModifier = rawCard.stat3;
      }
      if ("stat4" in rawCard && rawCard.stat4 !== undefined) {
        updates.handSize = rawCard.stat4;
      }
      if ("stat5" in rawCard && rawCard.stat5 !== undefined) {
        updates.health = rawCard.stat5;
      }
      if ("stat6" in rawCard && rawCard.stat6 !== undefined) {
        updates.stamina = rawCard.stat6;
      }

      if (Object.keys(updates).length > 0) {
        await ctx.db.patch(card._id, updates);
        migrated++;
      }
    }

    return {
      migrated,
      cursor: result.continueCursor,
      isDone: result.isDone,
    };
  },
});

export const migrateCardFieldNames = action({
  args: {},
  returns: v.object({
    totalMigrated: v.number(),
    batchesProcessed: v.number(),
  }),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    let totalMigrated = 0;
    let batchesProcessed = 0;
    let cursor: string | null = null;
    let isDone = false;

    while (!isDone) {
      const result: {
        migrated: number;
        cursor: string | null;
        isDone: boolean;
      } = await ctx.runMutation(internal.admin.migrateCardFieldsBatch, {
        limit: 100,
        cursor: cursor ?? undefined,
      });

      totalMigrated += result.migrated;
      batchesProcessed++;
      cursor = result.cursor;
      isDone = result.isDone;
    }

    return {
      totalMigrated,
      batchesProcessed,
    };
  },
});

function validateAdminApiKey(apiKey: string): void {
  const validKey = process.env.ADMIN_API_KEY;
  if (!validKey) {
    throw new Error("ADMIN_API_KEY environment variable not set");
  }
  if (apiKey !== validKey) {
    throw new Error("Invalid admin API key");
  }
}

export const upsertSet = mutation({
  args: {
    adminApiKey: v.string(),
    code: v.string(),
    name: v.string(),
    setNumber: v.optional(v.number()),
    legality: v.optional(v.string()),
    isRotating: v.optional(v.boolean()),
    isFuture: v.optional(v.boolean()),
    spotlightIP: v.optional(v.string()),
  },
  returns: v.id("sets"),
  handler: async (ctx, args) => {
    validateAdminApiKey(args.adminApiKey);

    const existing = await ctx.db
      .query("sets")
      .withIndex("by_code", (q) => q.eq("code", args.code))
      .unique();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        setNumber: args.setNumber,
        legality: args.legality,
        isRotating: args.isRotating,
        isFuture: args.isFuture,
        spotlightIP: args.spotlightIP,
      });
      return existing._id;
    }

    return await ctx.db.insert("sets", {
      code: args.code,
      name: args.name,
      setNumber: args.setNumber,
      legality: args.legality,
      isRotating: args.isRotating,
      isFuture: args.isFuture,
      spotlightIP: args.spotlightIP,
    });
  },
});

export const upsertCardsBatch = mutation({
  args: {
    adminApiKey: v.string(),
    cards: v.array(v.any()),
  },
  returns: v.object({
    inserted: v.number(),
    updated: v.number(),
    failed: v.number(),
  }),
  handler: async (ctx, args) => {
    validateAdminApiKey(args.adminApiKey);
    let inserted = 0;
    let updated = 0;
    let failed = 0;

    for (const rawCard of args.cards) {
      try {
        const card = rawCard as {
          oracleId?: string;
          name: string;
          imageUrl?: string;
          isFrontFace?: boolean;
          isVariant?: boolean;
          number?: number;
          collectorNumber?: string;
          rarity?: string;
          type?: string;
          difficulty?: number;
          control?: number;
          speed?: number;
          damage?: number;
          blockModifier?: number;
          handSize?: number;
          health?: number;
          stamina?: number;
          attackZone?: string;
          blockZone?: string;
          keywords?: string;
          symbols?: string;
          abilities?: string;
          searchName?: string;
          searchText?: string;
          searchAll?: string;
          copyLimit?: number;
          setName?: string;
          setNumber?: number;
          setCode?: string;
          legality?: string;
        };

        if (!card.name) {
          failed++;
          continue;
        }

        const cardData = {
          oracleId: card.oracleId,
          name: card.name,
          imageUrl: card.imageUrl,
          isFrontFace: card.isFrontFace,
          isVariant: card.isVariant,
          collectorNumber: card.collectorNumber,
          rarity: card.rarity,
          type: card.type,
          difficulty: card.difficulty,
          control: card.control,
          speed: card.speed,
          damage: card.damage,
          blockModifier: card.blockModifier,
          handSize: card.handSize,
          health: card.health,
          stamina: card.stamina,
          attackZone: card.attackZone,
          blockZone: card.blockZone,
          text: card.abilities,
          keywords: card.keywords,
          symbols: card.symbols,
          searchName: card.searchName ?? card.name.toLowerCase(),
          searchText: card.searchText,
          searchAll: card.searchAll,
          copyLimit: card.copyLimit,
          setName: card.setName,
          setNumber: card.setNumber,
          setCode: card.setCode,
        };

        const existing = card.setCode && card.collectorNumber
          ? await ctx.db
              .query("cards")
              .withIndex("by_setCode_and_collectorNumber", (q) =>
                q.eq("setCode", card.setCode!).eq("collectorNumber", card.collectorNumber!)
              )
              .first()
          : null;

        if (existing) {
          await ctx.db.patch(existing._id, cardData);
          updated++;
        } else {
          await ctx.db.insert("cards", cardData);
          inserted++;
        }
      } catch {
        failed++;
      }
    }

    return { inserted, updated, failed };
  },
});

export const linkCardFaces = mutation({
  args: {
    adminApiKey: v.string(),
    links: v.array(v.object({
      frontOracleId: v.string(),
      backOracleId: v.string(),
    })),
  },
  returns: v.object({
    linked: v.number(),
    failed: v.number(),
  }),
  handler: async (ctx, args) => {
    validateAdminApiKey(args.adminApiKey);
    let linked = 0;
    let failed = 0;

    for (const link of args.links) {
      try {
        const frontCard = await ctx.db
          .query("cards")
          .withIndex("by_oracleId", (q) => q.eq("oracleId", link.frontOracleId))
          .first();

        const backCard = await ctx.db
          .query("cards")
          .withIndex("by_oracleId", (q) => q.eq("oracleId", link.backOracleId))
          .first();

        if (!frontCard || !backCard) {
          failed++;
          continue;
        }

        await ctx.db.patch(frontCard._id, { backCardId: backCard._id });
        await ctx.db.patch(backCard._id, { frontCardId: frontCard._id });
        linked++;
      } catch {
        failed++;
      }
    }

    return { linked, failed };
  },
});

export const deleteSetsBatch = internalMutation({
  args: {
    limit: v.number(),
  },
  returns: v.number(),
  handler: async (ctx, args) => {
    const sets = await ctx.db.query("sets").take(args.limit);

    for (const set of sets) {
      await ctx.db.delete(set._id);
    }

    return sets.length;
  },
});

export const clearAllSets = action({
  args: {},
  returns: v.object({
    deletedCount: v.number(),
  }),
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const BATCH_SIZE = 100;
    let totalDeleted = 0;
    let deletedInBatch = BATCH_SIZE;

    while (deletedInBatch === BATCH_SIZE) {
      deletedInBatch = await ctx.runMutation(internal.admin.deleteSetsBatch, {
        limit: BATCH_SIZE,
      });
      totalDeleted += deletedInBatch;
    }

    return { deletedCount: totalDeleted };
  },
});

export const getCardDataVersion = query({
  args: {},
  returns: v.union(
    v.object({
      version: v.number(),
      updatedAt: v.number(),
      cardCount: v.number(),
    }),
    v.null()
  ),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const versionDoc = await ctx.db.query("cardDataVersion").first();
    if (!versionDoc) return null;
    return {
      version: versionDoc.version,
      updatedAt: versionDoc.updatedAt,
      cardCount: versionDoc.cardCount,
    };
  },
});
