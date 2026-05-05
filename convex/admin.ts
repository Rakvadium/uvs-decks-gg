import {
  query,
  mutation,
  action,
  internalMutation,
} from "./_generated/server";
import { internal } from "./_generated/api";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { Id, type Doc } from "./_generated/dataModel";
import {
  cardValidator,
  cardInputValidator,
  subFormatValidator,
  ingestionJobValidator,
  cardLegalityValidator,
  setLegalityValidator,
} from "./validators";
import { requireAdmin } from "./utils/validation";
import { runCatalogAggregateRefresh } from "./cardFacets";
import {
  syncSetCardCountByCode,
  syncSetCardCountsByCodes,
} from "./setCardCountSync";

const ADMIN_SET_LIST_MAX = 25_000;

function deriveCardSearchFields(card: {
  name: string;
  searchName?: string;
  keywords?: string;
  text?: string;
  setName?: string;
  type?: string;
  rarity?: string;
}) {
  const searchName = card.searchName ?? card.name;
  const searchText = [card.name, card.keywords ?? "", card.text ?? ""].join(" ");
  const searchAll = [
    searchName,
    searchText,
    card.setName ?? "",
    card.type ?? "",
    card.rarity ?? "",
  ].join(" ");
  return { searchName, searchText, searchAll };
}

export const listCardsBySetCode = query({
  args: {
    setCode: v.string(),
  },
  returns: v.array(cardValidator),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("cards")
      .withIndex("by_setCode_and_name", (q) => q.eq("setCode", args.setCode))
      .take(ADMIN_SET_LIST_MAX);
  },
});

export const getCardDeleteWarnings = query({
  args: {
    cardId: v.id("cards"),
  },
  returns: v.object({
    backLinked: v.array(
      v.object({
        _id: v.id("cards"),
        name: v.string(),
      })
    ),
    frontLinked: v.array(
      v.object({
        _id: v.id("cards"),
        name: v.string(),
      })
    ),
  }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const backLinked = await ctx.db
      .query("cards")
      .withIndex("by_backCardId", (q) => q.eq("backCardId", args.cardId))
      .collect();
    const frontLinked = await ctx.db
      .query("cards")
      .withIndex("by_frontCardId", (q) => q.eq("frontCardId", args.cardId))
      .collect();
    return {
      backLinked: backLinked.map((c) => ({ _id: c._id, name: c.name })),
      frontLinked: frontLinked.map((c) => ({ _id: c._id, name: c.name })),
    };
  },
});

export const releaseCards = mutation({
  args: {},
  returns: v.object({
    version: v.number(),
    cardCount: v.number(),
    previousVersion: v.union(v.number(), v.null()),
  }),
  handler: async (ctx) => {
    await requireAdmin(ctx);

    const { galleryCount: cardCount } = await runCatalogAggregateRefresh(ctx);

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

const UNRELEASED_LIST_MAX = 25_000;
const UNRELEASED_SCAN_PAGE = 500;

export const listUnreleasedCards = query({
  args: {
    setCode: v.optional(v.string()),
  },
  returns: v.object({
    cards: v.array(cardValidator),
    lastCatalogReleaseAt: v.union(v.number(), v.null()),
    publishedCatalogVersion: v.union(v.number(), v.null()),
    returnedCount: v.number(),
    truncated: v.boolean(),
    noPublishedCatalogYet: v.boolean(),
  }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const versionDoc = await ctx.db.query("cardDataVersion").first();
    if (!versionDoc) {
      return {
        cards: [],
        lastCatalogReleaseAt: null,
        publishedCatalogVersion: null,
        returnedCount: 0,
        truncated: false,
        noPublishedCatalogYet: true,
      };
    }

    const lastAt = versionDoc.updatedAt;
    const matches: Doc<"cards">[] = [];
    let cursor: string | null = null;
    let done = false;

    while (!done && matches.length < UNRELEASED_LIST_MAX) {
      const pageResult = await ctx.db
        .query("cards")
        .paginate({ numItems: UNRELEASED_SCAN_PAGE, cursor });
      for (const c of pageResult.page) {
        const t = c.contentRevisionAt ?? c._creationTime;
        if (t <= lastAt) continue;
        if (args.setCode !== undefined && c.setCode !== args.setCode) continue;
        matches.push(c);
        if (matches.length >= UNRELEASED_LIST_MAX) break;
      }
      done = pageResult.isDone;
      cursor = pageResult.continueCursor;
    }

    return {
      cards: matches,
      lastCatalogReleaseAt: lastAt,
      publishedCatalogVersion: versionDoc.version,
      returnedCount: matches.length,
      truncated: matches.length >= UNRELEASED_LIST_MAX,
      noPublishedCatalogYet: false,
    };
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

    const userId = await getAuthUserId(ctx);
    const now = Date.now();
    return await ctx.db.insert("sets", {
      ...args,
      cardCount: args.cardCount ?? 0,
      updatedAt: now,
      updatedBy: userId ?? undefined,
    });
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
      Object.entries(updates).filter(([, val]) => val !== undefined)
    );

    if (Object.keys(filteredUpdates).length > 0) {
      const userId = await getAuthUserId(ctx);
      const now = Date.now();
      await ctx.db.patch(setId, {
        ...filteredUpdates,
        updatedAt: now,
        updatedBy: userId ?? undefined,
      });
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
    const updated = await ctx.db.get(args.formatId);
    if (updated && !updated.isDefault) {
      const allFormats = await ctx.db.query("formats").collect();
      if (!allFormats.some((f) => f.isDefault)) {
        const replacement =
          allFormats.find((f) => f._id !== args.formatId) ?? allFormats[0];
        if (replacement) {
          await ctx.db.patch(replacement._id, { isDefault: true });
        }
      }
    }
    return null;
  },
});

export const getFormatDeleteBlockers = query({
  args: {
    formatId: v.id("formats"),
  },
  returns: v.union(
    v.null(),
    v.object({
      formatKey: v.string(),
      cardLegalityCount: v.number(),
      setLegalityCount: v.number(),
      deckCount: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const format = await ctx.db.get(args.formatId);
    if (!format) {
      return null;
    }
    const k = format.key;
    const [cardRows, setRows, deckRows] = await Promise.all([
      ctx.db
        .query("cardLegality")
        .withIndex("by_format", (q) => q.eq("formatKey", k))
        .collect(),
      ctx.db
        .query("setLegality")
        .withIndex("by_format", (q) => q.eq("formatKey", k))
        .collect(),
      ctx.db
        .query("decks")
        .withIndex("by_format", (q) => q.eq("format", k))
        .collect(),
    ]);
    return {
      formatKey: k,
      cardLegalityCount: cardRows.length,
      setLegalityCount: setRows.length,
      deckCount: deckRows.length,
    };
  },
});

export const deleteFormat = mutation({
  args: {
    formatId: v.id("formats"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const format = await ctx.db.get(args.formatId);
    if (!format) {
      throw new Error("Format not found");
    }
    const k = format.key;
    const [cardRows, setRows, deckRows] = await Promise.all([
      ctx.db
        .query("cardLegality")
        .withIndex("by_format", (q) => q.eq("formatKey", k))
        .collect(),
      ctx.db
        .query("setLegality")
        .withIndex("by_format", (q) => q.eq("formatKey", k))
        .collect(),
      ctx.db
        .query("decks")
        .withIndex("by_format", (q) => q.eq("format", k))
        .collect(),
    ]);
    if (cardRows.length > 0) {
      throw new Error(
        `Cannot delete format: ${cardRows.length} card legality override(s) still reference this format. Remove or reassign them first.`
      );
    }
    if (setRows.length > 0) {
      throw new Error(
        `Cannot delete format: ${setRows.length} set legality row(s) still reference this format. Remove or reassign them first.`
      );
    }
    if (deckRows.length > 0) {
      throw new Error(
        `Cannot delete format: ${deckRows.length} deck(s) use this format. Change or clear their format first.`
      );
    }
    if (format.isDefault) {
      const others = (await ctx.db.query("formats").collect()).filter(
        (f) => f._id !== args.formatId
      );
      if (others.length > 0) {
        const nextDefault = others[0];
        await ctx.db.patch(nextDefault._id, { isDefault: true });
      }
    }
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

    const { searchName, searchText, searchAll } = deriveCardSearchFields({
      name: args.card.name,
      searchName: args.card.searchName,
      keywords: args.card.keywords,
      text: args.card.text,
      setName: args.card.setName,
      type: args.card.type,
      rarity: args.card.rarity,
    });

    const now = Date.now();
    const id = await ctx.db.insert("cards", {
      ...args.card,
      searchName,
      searchText,
      searchAll,
      contentRevisionAt: now,
    });
    await syncSetCardCountByCode(ctx, args.card.setCode);
    return id;
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
    }),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);

    const before = await ctx.db.get(args.cardId);
    if (!before) {
      throw new Error("Card not found");
    }

    const filteredUpdates: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(args.updates)) {
      if (value !== undefined) {
        filteredUpdates[key] = value;
      }
    }

    if (filteredUpdates.name && filteredUpdates.searchName === undefined) {
      filteredUpdates.searchName = filteredUpdates.name;
    }

    const searchTriggers = [
      "name",
      "text",
      "keywords",
      "setName",
      "type",
      "rarity",
      "searchName",
    ] as const;
    const shouldRecomputeSearch = searchTriggers.some((k) => k in filteredUpdates);
    if (shouldRecomputeSearch) {
      const merged = { ...before, ...filteredUpdates } as typeof before;
      if (filteredUpdates.searchText === undefined) {
        filteredUpdates.searchText = deriveCardSearchFields({
          name: merged.name,
          searchName: merged.searchName ?? undefined,
          keywords: merged.keywords ?? undefined,
          text: merged.text ?? undefined,
          setName: merged.setName ?? undefined,
          type: merged.type ?? undefined,
          rarity: merged.rarity ?? undefined,
        }).searchText;
      }
      if (filteredUpdates.searchAll === undefined) {
        const forAll = {
          ...merged,
          ...filteredUpdates,
          searchText: (filteredUpdates.searchText as string) ?? merged.searchText,
          searchName: (filteredUpdates.searchName as string | undefined) ?? merged.searchName,
        };
        filteredUpdates.searchAll = deriveCardSearchFields({
          name: forAll.name,
          searchName: forAll.searchName ?? undefined,
          keywords: forAll.keywords ?? undefined,
          text: forAll.text ?? undefined,
          setName: forAll.setName ?? undefined,
          type: forAll.type ?? undefined,
          rarity: forAll.rarity ?? undefined,
        }).searchAll;
      }
    }

    if (Object.keys(filteredUpdates).length > 0) {
      filteredUpdates.contentRevisionAt = Date.now();
      await ctx.db.patch(args.cardId, filteredUpdates);
      const after = await ctx.db.get(args.cardId);
      const codes: string[] = [];
      if (before.setCode) {
        codes.push(before.setCode);
      }
      if (after?.setCode && after.setCode !== before.setCode) {
        codes.push(after.setCode);
      }
      await syncSetCardCountsByCodes(ctx, codes);
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
    const before = await ctx.db.get(args.cardId);
    await ctx.db.delete(args.cardId);
    await syncSetCardCountByCode(ctx, before?.setCode);
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
  isVariant?: boolean;
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
    const affected = new Set<string>();

    for (const card of args.cards as CardImportData[]) {
      try {
        if (!card.name) {
          throw new Error("Card must have a name");
        }

        const { searchName, searchText, searchAll } = deriveCardSearchFields({
          name: card.name,
          searchName: card.searchName,
          keywords: card.keywords,
          text: card.text,
          setName: card.setName,
          type: card.type,
          rarity: card.rarity,
        });

        const touch = Date.now();
        const row = {
          ...card,
          searchName,
          searchText,
          searchAll,
          contentRevisionAt: touch,
        };

        const existing =
          card.setCode && card.collectorNumber
            ? await ctx.db
                .query("cards")
                .withIndex("by_setCode_and_collectorNumber", (q) =>
                  q.eq("setCode", card.setCode!).eq("collectorNumber", card.collectorNumber!)
                )
                .first()
            : null;

        if (existing) {
          await ctx.db.patch(existing._id, row);
        } else {
          await ctx.db.insert("cards", row);
        }
        if (card.setCode) {
          affected.add(card.setCode);
        }
        inserted++;
      } catch (e) {
        failed++;
        errors.push(`Card "${card.name ?? "?"}": ${(e as Error).message}`);
      }
    }

    await syncSetCardCountsByCodes(ctx, affected);

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

export const previewBulkImportCards = mutation({
  args: {
    format: v.union(v.literal("json")),
    data: v.string(),
    defaultSetCode: v.optional(v.string()),
    defaultSetName: v.optional(v.string()),
  },
  returns: v.object({
    rowCount: v.number(),
    errors: v.array(
      v.object({
        row: v.number(),
        message: v.string(),
      })
    ),
  }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    let rows: CardImportData[];
    if (args.format === "json") {
      try {
        const parsed = JSON.parse(args.data) as unknown;
        if (!Array.isArray(parsed)) {
          throw new Error("JSON data must be an array of cards");
        }
        rows = parsed as CardImportData[];
      } catch (e) {
        throw new Error(`Invalid JSON: ${(e as Error).message}`);
      }
    } else {
      throw new Error("Only JSON format is currently supported");
    }

    const errors: Array<{ row: number; message: string }> = [];
    rows.forEach((raw, index) => {
      const row = index + 1;
      const setCode = raw.setCode ?? args.defaultSetCode;
      if (!setCode || String(setCode).trim() === "") {
        errors.push({ row, message: "Missing setCode" });
      }
      if (!raw.name || String(raw.name).trim() === "") {
        errors.push({ row, message: "Missing name" });
      }
    });

    return { rowCount: rows.length, errors };
  },
});

export const ensureAdminForAction = internalMutation({
  args: {
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user || user.role !== "Admin") {
      throw new Error("Admin role required");
    }
    return null;
  },
});

export const bulkImportCards = action({
  args: {
    format: v.union(v.literal("json")),
    data: v.string(),
    defaultSetCode: v.optional(v.string()),
    defaultSetName: v.optional(v.string()),
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

    cards = cards.map((c) => ({
      ...c,
      setCode: c.setCode ?? args.defaultSetCode,
      setName: c.setName ?? args.defaultSetName,
    }));

    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    await ctx.runMutation(internal.admin.ensureAdminForAction, { userId });

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
    await runCatalogAggregateRefresh(ctx);
    return null;
  },
});

export const getIngestionJob = query({
  args: {
    jobId: v.id("ingestionJobs"),
  },
  returns: v.union(ingestionJobValidator, v.null()),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return null;
    }
    const job = await ctx.db.get(args.jobId);
    if (!job || job.userId !== userId) {
      return null;
    }
    return job;
  },
});

export const listMyRecentIngestionJobs = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.array(ingestionJobValidator),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return [];
    }
    const cap = Math.min(24, Math.max(1, args.limit ?? 12));
    const jobs = await ctx.db
      .query("ingestionJobs")
      .withIndex("by_user", (q) => q.eq("userId", userId))
      .collect();
    jobs.sort((a, b) => b.startedAt - a.startedAt);
    return jobs.slice(0, cap);
  },
});

export const logAdminAudit = internalMutation({
  args: {
    userId: v.id("users"),
    action: v.string(),
    detail: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("adminAuditLog", {
      userId: args.userId,
      action: args.action,
      at: Date.now(),
      detail: args.detail,
    });
    return null;
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

    const affected = new Set<string>();
    for (const card of cards) {
      if (card.setCode) {
        affected.add(card.setCode);
      }
      await ctx.db.delete(card._id);
    }
    await syncSetCardCountsByCodes(ctx, affected);
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

    const affected = new Set<string>();
    for (const card of cards) {
      if (card.setCode) {
        affected.add(card.setCode);
      }
      await ctx.db.delete(card._id);
    }
    await syncSetCardCountsByCodes(ctx, affected);
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

    await ctx.runMutation(internal.cardFacets.rebuildCardFacetSnapshot, {});
    await ctx.runMutation(internal.sets.reconcileAllSetCardCounts, {});

    await ctx.runMutation(internal.admin.logAdminAudit, {
      userId,
      action: "clearAllCards",
      detail: JSON.stringify({ deletedCount: totalDeleted }),
    });

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
    const affected = new Set<string>();

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

        const touch = Date.now();
        await ctx.db.insert("cards", {
          ...card,
          searchName,
          searchText,
          searchAll,
          contentRevisionAt: touch,
        });
        if (card.setCode) {
          affected.add(card.setCode);
        }
        inserted++;
      } catch {
        failed++;
      }
    }

    await syncSetCardCountsByCodes(ctx, affected);
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

    await ctx.runMutation(internal.cardFacets.rebuildCardFacetSnapshot, {});

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

    await ctx.runMutation(internal.cardFacets.rebuildCardFacetSnapshot, {});

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
        updates.contentRevisionAt = Date.now();
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
    const affected = new Set<string>();

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

        const touch = Date.now();
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
          contentRevisionAt: touch,
        };

        const existing = card.setCode && card.collectorNumber
          ? await ctx.db
              .query("cards")
              .withIndex("by_setCode_and_collectorNumber", (q) =>
                q.eq("setCode", card.setCode!).eq("collectorNumber", card.collectorNumber!)
              )
              .first()
          : null;

        if (card.setCode) {
          affected.add(card.setCode);
        }
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

    await syncSetCardCountsByCodes(ctx, affected);
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

        const touch = Date.now();
        await ctx.db.patch(frontCard._id, {
          backCardId: backCard._id,
          contentRevisionAt: touch,
        });
        await ctx.db.patch(backCard._id, {
          frontCardId: frontCard._id,
          contentRevisionAt: touch,
        });
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

const cardLegalityStatusValue = v.union(
  v.literal("legal"),
  v.literal("banned"),
  v.literal("restricted")
);

const cardLegalityUpsertEntry = v.object({
  cardId: v.id("cards"),
  status: cardLegalityStatusValue,
  copyLimitOverride: v.optional(v.number()),
  effectiveDate: v.optional(v.number()),
});

const setLegalityUpsertEntry = v.object({
  setCode: v.string(),
  isLegal: v.boolean(),
  rotatesOutAt: v.optional(v.number()),
});

const BULK_CARD_LEGALITY_MAX = 500;
const SEARCH_CARDS_LEGALITY_MAX = 40;

export const listSetLegalityByFormat = query({
  args: { formatKey: v.string() },
  returns: v.array(setLegalityValidator),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("setLegality")
      .withIndex("by_format", (q) => q.eq("formatKey", args.formatKey))
      .collect();
  },
});

export const listCardLegalityByFormat = query({
  args: { formatKey: v.string() },
  returns: v.array(cardLegalityValidator),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    return await ctx.db
      .query("cardLegality")
      .withIndex("by_format", (q) => q.eq("formatKey", args.formatKey))
      .collect();
  },
});

export const listCardLegalityByFormatEnriched = query({
  args: { formatKey: v.string() },
  returns: v.array(
    v.object({
      _id: v.id("cardLegality"),
      _creationTime: v.number(),
      formatKey: v.string(),
      cardId: v.id("cards"),
      status: cardLegalityStatusValue,
      copyLimitOverride: v.optional(v.number()),
      effectiveDate: v.optional(v.number()),
      cardName: v.string(),
      cardSetCode: v.optional(v.string()),
    })
  ),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const rows = await ctx.db
      .query("cardLegality")
      .withIndex("by_format", (q) => q.eq("formatKey", args.formatKey))
      .collect();
    const out: {
      _id: Id<"cardLegality">;
      _creationTime: number;
      formatKey: string;
      cardId: Id<"cards">;
      status: "legal" | "banned" | "restricted";
      copyLimitOverride?: number;
      effectiveDate?: number;
      cardName: string;
      cardSetCode?: string;
    }[] = [];
    for (const r of rows) {
      const card = await ctx.db.get(r.cardId);
      if (!card) continue;
      out.push({
        _id: r._id,
        _creationTime: r._creationTime,
        formatKey: r.formatKey,
        cardId: r.cardId,
        status: r.status,
        copyLimitOverride: r.copyLimitOverride,
        effectiveDate: r.effectiveDate,
        cardName: card.name,
        cardSetCode: card.setCode,
      });
    }
    return out;
  },
});

export const searchCardsForLegalityAdmin = query({
  args: {
    query: v.string(),
    searchTier: v.optional(
      v.union(v.literal("name"), v.literal("keywords"), v.literal("all"))
    ),
    limit: v.optional(v.number()),
  },
  returns: v.array(cardValidator),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const tier = args.searchTier ?? "name";
    const lim = Math.min(
      args.limit ?? SEARCH_CARDS_LEGALITY_MAX,
      SEARCH_CARDS_LEGALITY_MAX
    );
    const tierConfig = {
      name: "search_tier1_name" as const,
      keywords: "search_tier2_keywords" as const,
      all: "search_tier3_all" as const,
    };
    const fieldConfig = {
      name: "searchName" as const,
      keywords: "searchText" as const,
      all: "searchAll" as const,
    };
    const indexName = tierConfig[tier];
    const fieldName = fieldConfig[tier];
    const q = args.query.trim();
    if (!q) return [];

    if (tier === "name") {
      return await ctx.db
        .query("cards")
        .withSearchIndex(indexName, (sq) => sq.search(fieldName, q))
        .take(lim);
    }

    return await ctx.db
      .query("cards")
      .withSearchIndex(indexName, (sq) => sq.search(fieldName, q))
      .take(lim);
  },
});

export const exportFormatLegalityBundle = query({
  args: { formatKey: v.string() },
  returns: v.object({
    formatKey: v.string(),
    cardLegality: v.array(
      v.object({
        cardId: v.id("cards"),
        status: cardLegalityStatusValue,
        copyLimitOverride: v.optional(v.number()),
        effectiveDate: v.optional(v.number()),
      })
    ),
    setLegality: v.array(
      v.object({
        setCode: v.string(),
        isLegal: v.boolean(),
        rotatesOutAt: v.optional(v.number()),
      })
    ),
  }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const [cardRows, setRows] = await Promise.all([
      ctx.db
        .query("cardLegality")
        .withIndex("by_format", (q) => q.eq("formatKey", args.formatKey))
        .collect(),
      ctx.db
        .query("setLegality")
        .withIndex("by_format", (q) => q.eq("formatKey", args.formatKey))
        .collect(),
    ]);
    return {
      formatKey: args.formatKey,
      cardLegality: cardRows.map((r) => ({
        cardId: r.cardId,
        status: r.status,
        copyLimitOverride: r.copyLimitOverride,
        effectiveDate: r.effectiveDate,
      })),
      setLegality: setRows.map((r) => ({
        setCode: r.setCode,
        isLegal: r.isLegal,
        rotatesOutAt: r.rotatesOutAt,
      })),
    };
  },
});

export const upsertSetLegality = mutation({
  args: {
    formatKey: v.string(),
    setCode: v.string(),
    isLegal: v.boolean(),
    rotatesOutAt: v.optional(v.number()),
  },
  returns: v.id("setLegality"),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db
      .query("setLegality")
      .withIndex("by_format_set", (q) =>
        q.eq("formatKey", args.formatKey).eq("setCode", args.setCode)
      )
      .unique();
    if (existing) {
      await ctx.db.patch(existing._id, {
        isLegal: args.isLegal,
        rotatesOutAt: args.rotatesOutAt,
      });
      return existing._id;
    }
    return await ctx.db.insert("setLegality", {
      formatKey: args.formatKey,
      setCode: args.setCode,
      isLegal: args.isLegal,
      rotatesOutAt: args.rotatesOutAt,
    });
  },
});

export const upsertCardLegality = mutation({
  args: {
    formatKey: v.string(),
    cardId: v.id("cards"),
    status: cardLegalityStatusValue,
    copyLimitOverride: v.optional(v.number()),
    effectiveDate: v.optional(v.number()),
  },
  returns: v.union(v.id("cardLegality"), v.null()),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db
      .query("cardLegality")
      .withIndex("by_format_card", (q) =>
        q.eq("formatKey", args.formatKey).eq("cardId", args.cardId)
      )
      .unique();

    if (args.status === "legal") {
      if (existing) {
        await ctx.db.delete(existing._id);
      }
      return null;
    }

    if (existing) {
      await ctx.db.patch(existing._id, {
        status: args.status,
        copyLimitOverride: args.copyLimitOverride,
        effectiveDate: args.effectiveDate,
      });
      return existing._id;
    }

    return await ctx.db.insert("cardLegality", {
      formatKey: args.formatKey,
      cardId: args.cardId,
      status: args.status,
      copyLimitOverride: args.copyLimitOverride,
      effectiveDate: args.effectiveDate,
    });
  },
});

export const bulkUpsertCardLegality = mutation({
  args: {
    formatKey: v.string(),
    entries: v.array(cardLegalityUpsertEntry),
  },
  returns: v.object({
    applied: v.number(),
    skipped: v.number(),
  }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (args.entries.length > BULK_CARD_LEGALITY_MAX) {
      throw new Error(
        `At most ${BULK_CARD_LEGALITY_MAX} entries per bulk upsert`
      );
    }
    let applied = 0;
    let skipped = 0;
    for (const entry of args.entries) {
      try {
        const existing = await ctx.db
          .query("cardLegality")
          .withIndex("by_format_card", (q) =>
            q.eq("formatKey", args.formatKey).eq("cardId", entry.cardId)
          )
          .unique();

        if (entry.status === "legal") {
          if (existing) {
            await ctx.db.delete(existing._id);
          }
          applied++;
          continue;
        }

        if (existing) {
          await ctx.db.patch(existing._id, {
            status: entry.status,
            copyLimitOverride: entry.copyLimitOverride,
            effectiveDate: entry.effectiveDate,
          });
        } else {
          await ctx.db.insert("cardLegality", {
            formatKey: args.formatKey,
            cardId: entry.cardId,
            status: entry.status,
            copyLimitOverride: entry.copyLimitOverride,
            effectiveDate: entry.effectiveDate,
          });
        }
        applied++;
      } catch {
        skipped++;
      }
    }
    return { applied, skipped };
  },
});

export const importFormatLegalityBundle = mutation({
  args: {
    formatKey: v.string(),
    cardLegality: v.optional(v.array(cardLegalityUpsertEntry)),
    setLegality: v.optional(v.array(setLegalityUpsertEntry)),
    replaceCardLegality: v.boolean(),
    replaceSetLegality: v.boolean(),
  },
  returns: v.object({
    cardRowsWritten: v.number(),
    setRowsWritten: v.number(),
  }),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const cardIn = args.cardLegality ?? [];
    const setIn = args.setLegality ?? [];
    if (cardIn.length > BULK_CARD_LEGALITY_MAX) {
      throw new Error(
        `cardLegality: at most ${BULK_CARD_LEGALITY_MAX} rows per import`
      );
    }

    let cardRowsWritten = 0;
    let setRowsWritten = 0;

    if (args.replaceCardLegality) {
      const existing = await ctx.db
        .query("cardLegality")
        .withIndex("by_format", (q) => q.eq("formatKey", args.formatKey))
        .collect();
      for (const row of existing) {
        await ctx.db.delete(row._id);
      }
      for (const entry of cardIn) {
        if (entry.status === "legal") continue;
        await ctx.db.insert("cardLegality", {
          formatKey: args.formatKey,
          cardId: entry.cardId,
          status: entry.status,
          copyLimitOverride: entry.copyLimitOverride,
          effectiveDate: entry.effectiveDate,
        });
        cardRowsWritten++;
      }
    } else {
      for (const entry of cardIn) {
        try {
          const existing = await ctx.db
            .query("cardLegality")
            .withIndex("by_format_card", (q) =>
              q.eq("formatKey", args.formatKey).eq("cardId", entry.cardId)
            )
            .unique();

          if (entry.status === "legal") {
            if (existing) {
              await ctx.db.delete(existing._id);
            }
            cardRowsWritten++;
            continue;
          }

          if (existing) {
            await ctx.db.patch(existing._id, {
              status: entry.status,
              copyLimitOverride: entry.copyLimitOverride,
              effectiveDate: entry.effectiveDate,
            });
          } else {
            await ctx.db.insert("cardLegality", {
              formatKey: args.formatKey,
              cardId: entry.cardId,
              status: entry.status,
              copyLimitOverride: entry.copyLimitOverride,
              effectiveDate: entry.effectiveDate,
            });
          }
          cardRowsWritten++;
        } catch {
          continue;
        }
      }
    }

    if (args.replaceSetLegality) {
      const existing = await ctx.db
        .query("setLegality")
        .withIndex("by_format", (q) => q.eq("formatKey", args.formatKey))
        .collect();
      for (const row of existing) {
        await ctx.db.delete(row._id);
      }
      for (const entry of setIn) {
        await ctx.db.insert("setLegality", {
          formatKey: args.formatKey,
          setCode: entry.setCode,
          isLegal: entry.isLegal,
          rotatesOutAt: entry.rotatesOutAt,
        });
        setRowsWritten++;
      }
    } else {
      for (const entry of setIn) {
        const existing = await ctx.db
          .query("setLegality")
          .withIndex("by_format_set", (q) =>
            q.eq("formatKey", args.formatKey).eq("setCode", entry.setCode)
          )
          .unique();
        if (existing) {
          await ctx.db.patch(existing._id, {
            isLegal: entry.isLegal,
            rotatesOutAt: entry.rotatesOutAt,
          });
        } else {
          await ctx.db.insert("setLegality", {
            formatKey: args.formatKey,
            setCode: entry.setCode,
            isLegal: entry.isLegal,
            rotatesOutAt: entry.rotatesOutAt,
          });
        }
        setRowsWritten++;
      }
    }

    return { cardRowsWritten, setRowsWritten };
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
