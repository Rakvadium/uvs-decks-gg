import { query, mutation, action, internalMutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { paginationOptsValidator } from "convex/server";
import { v } from "convex/values";
import { cardValidator } from "./validators";
import { api } from "./_generated/api";

const PUBLIC_R2_BASE_URL = "https://pub-53d81abf7a7f442a90c9383c1e7bdc60.r2.dev";

function toPublicCardImageUrl(imageUrl?: string) {
  if (!imageUrl) {
    return undefined;
  }

  if (imageUrl.startsWith("http")) {
    return imageUrl;
  }

  return `${PUBLIC_R2_BASE_URL}/cards/${imageUrl}`;
}

function matchesCharacterSearch(name: string, searchName: string | undefined, search: string | undefined) {
  if (!search) {
    return true;
  }

  const normalizedSearch = search.toLowerCase();
  return name.toLowerCase().includes(normalizedSearch) || searchName?.includes(normalizedSearch) === true;
}

function matchesCharacterSymbol(symbols: string | undefined, symbol: string | undefined) {
  if (!symbol) {
    return true;
  }

  if (!symbols) {
    return false;
  }

  return symbols
    .split(/[,|]/)
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
    .includes(symbol.toLowerCase());
}

export const list = query({
  args: {
    search: v.optional(v.string()),
    rarity: v.optional(v.array(v.string())),
    type: v.optional(v.array(v.string())),
    set: v.optional(v.array(v.string())),
    sortField: v.optional(v.string()),
    sortDirection: v.optional(v.union(v.literal("asc"), v.literal("desc"))),
    limit: v.optional(v.number()),
  },
  returns: v.array(cardValidator),
  handler: async (ctx, args) => {
    if (args.search && args.search.trim().length > 0) {
      let cards = await ctx.db
        .query("cards")
        .withSearchIndex("search_tier1_name", (q) =>
          q.search("searchName", args.search!)
        )
        .take(args.limit ?? 100);

      if (args.rarity && args.rarity.length > 0) {
        cards = cards.filter(
          (card) => card.rarity && args.rarity!.includes(card.rarity)
        );
      }
      if (args.type && args.type.length > 0) {
        cards = cards.filter(
          (card) => card.type && args.type!.includes(card.type)
        );
      }
      if (args.set && args.set.length > 0) {
        cards = cards.filter(
          (card) => card.setCode && args.set!.includes(card.setCode)
        );
      }

      return cards.filter((card) => card.isFrontFace !== false && card.isVariant !== true);
    }

    let cards = await ctx.db
      .query("cards")
      .collect();

    if (args.rarity && args.rarity.length > 0) {
      cards = cards.filter(
        (card) => card.rarity && args.rarity!.includes(card.rarity)
      );
    }

    if (args.type && args.type.length > 0) {
      cards = cards.filter(
        (card) => card.type && args.type!.includes(card.type)
      );
    }

    if (args.set && args.set.length > 0) {
      cards = cards.filter(
        (card) => card.setCode && args.set!.includes(card.setCode)
      );
    }

    cards = cards.filter((card) => card.isFrontFace !== false && card.isVariant !== true);

    if (args.sortField) {
      const direction = args.sortDirection === "desc" ? -1 : 1;
      cards.sort((a, b) => {
        const aVal = (a as Record<string, unknown>)[args.sortField!];
        const bVal = (b as Record<string, unknown>)[args.sortField!];
        if (aVal === bVal) return 0;
        if (aVal === undefined || aVal === null) return 1;
        if (bVal === undefined || bVal === null) return -1;
        return aVal < bVal ? -1 * direction : 1 * direction;
      });
    }

    if (args.limit) {
      cards = cards.slice(0, args.limit);
    }

    return cards;
  },
});

export const listReleased = query({
  args: {},
  returns: v.array(cardValidator),
  handler: async (ctx) => {
    const cards = await ctx.db
      .query("cards")
      .collect();

    return cards.filter((card) => card.isFrontFace !== false);
  },
});

export const listReleasedPaginated = query({
  args: {
    cursor: v.union(v.string(), v.null()),
    limit: v.optional(v.number()),
  },
  returns: v.object({
    cards: v.array(cardValidator),
    cursor: v.string(),
    isDone: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 500;
    const result = await ctx.db
      .query("cards")
      .paginate({ numItems: limit, cursor: args.cursor ?? null });

    const cardsWithUrls = result.page.map((card) => {
      if (card.imageUrl && !card.imageUrl.startsWith("http")) {
        const publicUrl = `${PUBLIC_R2_BASE_URL}/cards/${card.imageUrl}`;
        return { ...card, imageUrl: publicUrl };
      }
      return card;
    });

    return {
      cards: cardsWithUrls,
      cursor: result.continueCursor,
      isDone: result.isDone,
    };
  },
});

export const searchCards = query({
  args: {
    query: v.string(),
    searchTier: v.union(v.literal("name"), v.literal("keywords"), v.literal("all")),
    type: v.optional(v.string()),
    rarity: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(cardValidator),
  handler: async (ctx, args) => {
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

    const indexName = tierConfig[args.searchTier];
    const fieldName = fieldConfig[args.searchTier];

    if (args.searchTier === "name") {
      return await ctx.db
        .query("cards")
        .withSearchIndex(indexName, (q) => {
          return q.search(fieldName, args.query);
        })
        .take(args.limit ?? 50);
    }

    return await ctx.db
      .query("cards")
      .withSearchIndex(indexName, (q) => {
        let search = q.search(fieldName, args.query);
        if (args.type) search = search.eq("type", args.type);
        if (args.rarity) search = search.eq("rarity", args.rarity);
        return search;
      })
      .take(args.limit ?? 50);
  },
});

export const getBackCard = query({
  args: { cardId: v.id("cards") },
  returns: v.union(cardValidator, v.null()),
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.cardId);
    if (!card?.backCardId) return null;
    return await ctx.db.get(card.backCardId);
  },
});

export const getFrontCard = query({
  args: { cardId: v.id("cards") },
  returns: v.union(cardValidator, v.null()),
  handler: async (ctx, args) => {
    const card = await ctx.db.get(args.cardId);
    if (!card?.frontCardId) return null;
    return await ctx.db.get(card.frontCardId);
  },
});

export const listPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
    rarity: v.optional(v.array(v.string())),
    setCode: v.optional(v.array(v.string())),
    setName: v.optional(v.array(v.string())),
    type: v.optional(v.array(v.string())),
  },
  returns: v.object({
    page: v.array(cardValidator),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    const numItems = Math.min(args.paginationOpts.numItems, 50);
    const paginationOpts = { ...args.paginationOpts, numItems };

    const sortCards = (cards: typeof result.page) => {
      return cards.sort((a, b) => {
        const setNumA = a.setNumber ?? 0;
        const setNumB = b.setNumber ?? 0;
        if (setNumA !== setNumB) {
          return setNumB - setNumA;
        }
        const numA = parseInt(a.collectorNumber ?? "0", 10);
        const numB = parseInt(b.collectorNumber ?? "0", 10);
        return numA - numB;
      });
    };

    if (args.search && args.search.trim().length > 0) {
      const allResults = await ctx.db
        .query("cards")
        .withSearchIndex("search_tier1_name", (q) =>
          q.search("searchName", args.search!)
        )
        .take(500);

      let filtered = allResults.filter((card) => card.isFrontFace !== false && card.isVariant !== true);
      if (args.rarity && args.rarity.length > 0) {
        filtered = filtered.filter(
          (card) => card.rarity && args.rarity!.includes(card.rarity)
        );
      }
      if (args.type && args.type.length > 0) {
        filtered = filtered.filter(
          (card) => card.type && args.type!.includes(card.type)
        );
      }
      if (args.setCode && args.setCode.length > 0) {
        filtered = filtered.filter(
          (card) => card.setCode && args.setCode!.includes(card.setCode)
        );
      }
      if (args.setName && args.setName.length > 0) {
        filtered = filtered.filter(
          (card) => card.setName && args.setName!.includes(card.setName)
        );
      }

      sortCards(filtered);

      const startIndex = paginationOpts.cursor
        ? parseInt(paginationOpts.cursor, 10)
        : 0;
      const page = filtered.slice(startIndex, startIndex + numItems);
      const nextIndex = startIndex + page.length;
      const isDone = nextIndex >= filtered.length;

      return {
        page,
        isDone,
        continueCursor: nextIndex.toString(),
      };
    }

    if (args.setName && args.setName.length > 0) {
      const allCardsArrays = await Promise.all(
        args.setName.map((setName) =>
          ctx.db
            .query("cards")
            .withIndex("by_setName", (q) =>
              q.eq("setName", setName)
            )
            .collect()
        )
      );

      let filtered = allCardsArrays.flat().filter((card) => card.isFrontFace !== false && card.isVariant !== true);

      if (args.rarity && args.rarity.length > 0) {
        filtered = filtered.filter(
          (card) => card.rarity && args.rarity!.includes(card.rarity)
        );
      }
      if (args.type && args.type.length > 0) {
        filtered = filtered.filter(
          (card) => card.type && args.type!.includes(card.type)
        );
      }

      sortCards(filtered);

      const startIndex = paginationOpts.cursor
        ? parseInt(paginationOpts.cursor, 10)
        : 0;
      const page = filtered.slice(startIndex, startIndex + numItems);
      const nextIndex = startIndex + page.length;
      const isDone = nextIndex >= filtered.length;

      return {
        page,
        isDone,
        continueCursor: nextIndex.toString(),
      };
    }

    const result = await ctx.db
      .query("cards")
      .paginate(paginationOpts);

    let page = result.page.filter((card) => card.isFrontFace !== false && card.isVariant !== true);
    if (args.rarity && args.rarity.length > 0) {
      page = page.filter(
        (card) => card.rarity && args.rarity!.includes(card.rarity)
      );
    }
    if (args.type && args.type.length > 0) {
      page = page.filter(
        (card) => card.type && args.type!.includes(card.type)
      );
    }

    return {
      page,
      isDone: result.isDone,
      continueCursor: result.continueCursor,
    };
  },
});

export const getCardVariants = query({
  args: {
    oracleId: v.string(),
  },
  returns: v.array(cardValidator),
  handler: async (ctx, args) => {
    const cards = await ctx.db
      .query("cards")
      .withIndex("by_oracleId", (q) =>
        q.eq("oracleId", args.oracleId)
      )
      .collect();
    return cards.filter((card) => card.isFrontFace !== false);
  },
});

export const getById = query({
  args: {
    cardId: v.id("cards"),
  },
  returns: v.union(cardValidator, v.null()),
  handler: async (ctx, args) => {
    return await ctx.db.get(args.cardId);
  },
});

export const getRarities = query({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const cards = await ctx.db
      .query("cards")
      .collect();

    const rarities = new Set<string>();
    for (const card of cards) {
      if (card.rarity && card.isFrontFace !== false) {
        rarities.add(card.rarity);
      }
    }
    return Array.from(rarities).sort();
  },
});

export const getTypes = query({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const cards = await ctx.db
      .query("cards")
      .collect();

    const types = new Set<string>();
    for (const card of cards) {
      if (card.type && card.isFrontFace !== false) {
        types.add(card.type);
      }
    }
    return Array.from(types).sort();
  },
});

export const getSets = query({
  args: {},
  returns: v.array(v.string()),
  handler: async (ctx) => {
    const cards = await ctx.db
      .query("cards")
      .collect();

    const sets = new Set<string>();
    for (const card of cards) {
      if (card.setCode && card.isFrontFace !== false) {
        sets.add(card.setCode);
      }
    }
    return Array.from(sets).sort();
  },
});

export const listBySet = query({
  args: {
    setCode: v.string(),
    search: v.optional(v.string()),
    limit: v.optional(v.number()),
  },
  returns: v.array(cardValidator),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 200;

    if (args.search && args.search.trim().length > 0) {
      const searchResults = await ctx.db
        .query("cards")
        .withSearchIndex("search_tier1_name", (q) =>
          q.search("searchName", args.search!)
        )
        .take(500);

      return searchResults
        .filter((card) => card.setCode === args.setCode && card.isFrontFace !== false && card.isVariant !== true)
        .slice(0, limit);
    }

    const cards = await ctx.db
      .query("cards")
      .withIndex("by_setCode_and_collectorNumber", (q) =>
        q.eq("setCode", args.setCode)
      )
      .take(limit);

    return cards.filter((card) => card.isFrontFace !== false && card.isVariant !== true);
  },
});

export const getByIds = query({
  args: {
    cardIds: v.array(v.id("cards")),
  },
  returns: v.array(cardValidator),
  handler: async (ctx, args) => {
    const cards = await Promise.all(
      args.cardIds.map((id) => ctx.db.get(id))
    );
    return cards.filter((card): card is NonNullable<typeof card> => card !== null);
  },
});

export const listCharacters = query({
  args: {
    search: v.optional(v.string()),
    characterType: v.optional(v.string()),
  },
  returns: v.array(cardValidator),
  handler: async (ctx, args) => {
    const cardType = args.characterType ?? "Character";

    if (args.search && args.search.trim().length > 0) {
      const cards = await ctx.db
        .query("cards")
        .withSearchIndex("search_tier1_name", (q) =>
          q.search("searchName", args.search!)
        )
        .take(100);

      return cards.filter((card) => card.type === cardType && card.isFrontFace !== false && card.isVariant !== true);
    }

    const allCards = await ctx.db
      .query("cards")
      .collect();

    return allCards.filter((card) => card.type === cardType && card.isFrontFace !== false);
  },
});

export const listCharactersPaginated = query({
  args: {
    paginationOpts: paginationOptsValidator,
    search: v.optional(v.string()),
    symbol: v.optional(v.string()),
  },
  returns: v.object({
    page: v.array(cardValidator),
    isDone: v.boolean(),
    continueCursor: v.string(),
  }),
  handler: async (ctx, args) => {
    const numItems = Math.min(Math.max(args.paginationOpts.numItems, 1), 20);
    const search = args.search?.trim() || undefined;
    const symbol = args.symbol?.trim().toLowerCase() || undefined;
    const page: Array<{
      _id: Id<"cards">;
      _creationTime: number;
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
    }> = [];

    let cursor = args.paginationOpts.cursor;
    let isDone = false;
    let continueCursor = args.paginationOpts.cursor ?? "";

    while (page.length < numItems && !isDone) {
      const result = await ctx.db
        .query("cards")
        .withIndex("by_type_and_name", (q) => q.eq("type", "Character"))
        .paginate({
          numItems: Math.max(numItems * 4, 80),
          cursor,
        });

      cursor = result.continueCursor;
      continueCursor = result.continueCursor;
      isDone = result.isDone;

      for (const card of result.page) {
        if (card.isFrontFace === false || card.isVariant === true) {
          continue;
        }

        if (!matchesCharacterSearch(card.name, card.searchName, search)) {
          continue;
        }

        if (!matchesCharacterSymbol(card.symbols, symbol)) {
          continue;
        }

        page.push({
          ...card,
          imageUrl: toPublicCardImageUrl(card.imageUrl) ?? card.imageUrl,
        });

        if (page.length >= numItems) {
          break;
        }
      }
    }

    return {
      page,
      isDone,
      continueCursor,
    };
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
    const versionDoc = await ctx.db.query("cardDataVersion").first();
    if (!versionDoc) return null;
    return {
      version: versionDoc.version,
      updatedAt: versionDoc.updatedAt,
      cardCount: versionDoc.cardCount,
    };
  },
});

export const listAllCardsChunked = query({
  args: {
    cursor: v.union(v.string(), v.null()),
    chunkSize: v.optional(v.number()),
  },
  returns: v.object({
    cards: v.array(cardValidator),
    nextCursor: v.union(v.string(), v.null()),
    isDone: v.boolean(),
    totalEstimate: v.number(),
  }),
  handler: async (ctx, args) => {
    const chunkSize = args.chunkSize ?? 500;
    
    const result = await ctx.db
      .query("cards")
      .paginate({ numItems: chunkSize, cursor: args.cursor ?? null });
    
    const filteredCards = result.page.filter(
      (card) => card.isFrontFace !== false && card.isVariant !== true
    );
    
    const versionDoc = await ctx.db.query("cardDataVersion").first();
    const totalEstimate = versionDoc?.cardCount ?? 0;
    
    return {
      cards: filteredCards,
      nextCursor: result.isDone ? null : result.continueCursor,
      isDone: result.isDone,
      totalEstimate,
    };
  },
});

export const getInitialCards = query({
  args: {
    limit: v.optional(v.number()),
  },
  returns: v.object({
    cards: v.array(cardValidator),
    hasMore: v.boolean(),
    version: v.union(v.number(), v.null()),
    totalEstimate: v.number(),
  }),
  handler: async (ctx, args) => {
    const limit = args.limit ?? 100;
    
    const result = await ctx.db
      .query("cards")
      .paginate({ numItems: limit, cursor: null });
    
    const filteredCards = result.page.filter(
      (card) => card.isFrontFace !== false && card.isVariant !== true
    );
    
    const versionDoc = await ctx.db.query("cardDataVersion").first();
    
    return {
      cards: filteredCards,
      hasMore: !result.isDone,
      version: versionDoc?.version ?? null,
      totalEstimate: versionDoc?.cardCount ?? 0,
    };
  },
});

export const updateCardDataVersion = internalMutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const cards = await ctx.db.query("cards").collect();
    const cardCount = cards.filter(
      (card) => card.isFrontFace !== false && card.isVariant !== true
    ).length;
    
    const existingVersion = await ctx.db.query("cardDataVersion").first();
    const now = Date.now();
    
    if (existingVersion) {
      const newVersion = existingVersion.version + 1;
      await ctx.db.patch(existingVersion._id, {
        version: newVersion,
        updatedAt: now,
        cardCount,
      });
      return newVersion;
    } else {
      await ctx.db.insert("cardDataVersion", {
        version: 1,
        updatedAt: now,
        cardCount,
      });
      return 1;
    }
  },
});

export const initializeCardDataVersion = mutation({
  args: {},
  returns: v.number(),
  handler: async (ctx) => {
    const cards = await ctx.db.query("cards").collect();
    const cardCount = cards.filter(
      (card) => card.isFrontFace !== false && card.isVariant !== true
    ).length;
    
    const existingVersion = await ctx.db.query("cardDataVersion").first();
    const now = Date.now();
    
    if (existingVersion) {
      return existingVersion.version;
    } else {
      await ctx.db.insert("cardDataVersion", {
        version: 1,
        updatedAt: now,
        cardCount,
      });
      return 1;
    }
  },
});

function removeLeadingZerosFromImageUrl(imageUrl: string): string {
  const parts = imageUrl.split("/");
  if (parts.length !== 2) {
    return imageUrl;
  }

  const [setName, filename] = parts;
  const numericPrefix = filename.substring(0, 3);

  if (!/^\d+$/.test(numericPrefix)) {
    return imageUrl;
  }

  const numberWithoutZeros = parseInt(numericPrefix, 10).toString();
  const restOfFilename = filename.substring(3);

  return `${setName}/${numberWithoutZeros}${restOfFilename}`;
}

export const updateImageUrlsRemoveLeadingZeros = mutation({
  args: {
    paginationOpts: paginationOptsValidator,
  },
  returns: v.object({
    updated: v.number(),
    skipped: v.number(),
    continueCursor: v.string(),
    isDone: v.boolean(),
  }),
  handler: async (ctx, args) => {
    const numItems = Math.min(args.paginationOpts.numItems, 100);
    const paginationOpts = { ...args.paginationOpts, numItems };

    const result = await ctx.db
      .query("cards")
      .paginate(paginationOpts);

    let updated = 0;
    let skipped = 0;

    for (const card of result.page) {
      if (!card.imageUrl) {
        skipped++;
        continue;
      }

      const newImageUrl = removeLeadingZerosFromImageUrl(card.imageUrl);

      if (newImageUrl !== card.imageUrl) {
        await ctx.db.patch(card._id, {
          imageUrl: newImageUrl,
        });
        updated++;
      } else {
        skipped++;
      }
    }

    return {
      updated,
      skipped,
      continueCursor: result.continueCursor,
      isDone: result.isDone,
    };
  },
});

export const updateImageUrlsRemoveLeadingZerosBulk = action({
  args: {},
  returns: v.object({
    totalUpdated: v.number(),
    totalSkipped: v.number(),
    batchesProcessed: v.number(),
  }),
  handler: async (ctx) => {
    let totalUpdated = 0;
    let totalSkipped = 0;
    let batchesProcessed = 0;
    let cursor: string | null = null;
    let isDone = false;

    while (!isDone) {
      const result: {
        updated: number;
        skipped: number;
        continueCursor: string;
        isDone: boolean;
      } = await ctx.runMutation(api.cards.updateImageUrlsRemoveLeadingZeros, {
        paginationOpts: {
          numItems: 100,
          cursor,
        },
      });

      totalUpdated += result.updated;
      totalSkipped += result.skipped;
      batchesProcessed++;
      cursor = result.continueCursor;
      isDone = result.isDone;
    }

    return {
      totalUpdated,
      totalSkipped,
      batchesProcessed,
    };
  },
});
