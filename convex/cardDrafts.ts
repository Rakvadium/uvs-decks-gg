import { internal } from "./_generated/api";
import {
  internalMutation,
  internalQuery,
  mutation,
  query,
} from "./_generated/server";
import { v, type Infer } from "convex/values";
import type { Id } from "./_generated/dataModel";
import {
  cardDraftEditableValidator,
  cardDraftReviewRowValidator,
  cardDraftStatusValidator,
  cardDraftValidator,
  cardInputValidator,
} from "./validators";
import { requireAdmin } from "./utils/validation";
import { createCardWithDerivedFields } from "./lib/cardCreate";

type CardDraftEditable = Infer<typeof cardDraftEditableValidator>;

const DRAFT_UPLOAD_BATCH_MAX = 100;

const RARITY_LABELS: Record<string, string> = {
  C: "Common",
  UC: "Uncommon",
  R: "Rare",
  SR: "Super Rare",
  UR: "Ultra Rare",
  CR: "Character Rare",
  CH: "Champion",
  P: "Promo",
};

const draftUploadInputValidator = v.object({
  storageId: v.id("_storage"),
  fileName: v.string(),
  collectorNumber: v.optional(v.string()),
  sortIndex: v.optional(v.number()),
});

function cleanString(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}

function validateAdminApiKey(apiKey: string): void {
  const validKey = process.env.ADMIN_API_KEY;
  if (!validKey) {
    throw new Error("ADMIN_API_KEY environment variable not set");
  }
  if (apiKey !== validKey) {
    throw new Error("Invalid admin API key");
  }
}

function cleanDraft(draft: CardDraftEditable): CardDraftEditable {
  const cleaned: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(draft) as Array<
    [keyof CardDraftEditable, CardDraftEditable[keyof CardDraftEditable]]
  >) {
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (trimmed.length > 0 || key === "symbols") {
        cleaned[key] = trimmed;
      }
      continue;
    }
    if (value !== undefined) {
      cleaned[key] = value;
    }
  }
  return cleaned as CardDraftEditable;
}

function mergeOcrDraft(
  existing: CardDraftEditable,
  parsed: CardDraftEditable
): CardDraftEditable {
  const existingSymbols = cleanString(existing.symbols);
  const parsedSymbols = cleanString(parsed.symbols);
  return {
    ...existing,
    ...cleanDraft(parsed),
    symbols: existingSymbols ?? parsedSymbols ?? "",
  };
}

function splitCompactName(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Z]+)([A-Z][a-z])/g, "$1 $2")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function draftFieldsFromFileName(fileName: string): CardDraftEditable {
  const base = fileName.replace(/\.[^.]+$/, "");
  const parts = base.split("-").filter(Boolean);
  const fields: CardDraftEditable = {};
  if (parts.length >= 2) {
    fields.setCode = parts[0];
    fields.collectorNumber = parts[1];
  }
  const rarityIndex = parts.findIndex((part, index) => index >= 2 && RARITY_LABELS[part.toUpperCase()]);
  if (rarityIndex >= 0) {
    const rarityCode = parts[rarityIndex].toUpperCase();
    fields.rarity = RARITY_LABELS[rarityCode] ?? rarityCode;
    fields.isVariant = parts.some((part) => part.toUpperCase() === "ALT");
    const nameParts = parts.slice(rarityIndex + 1).filter((part) => part.toUpperCase() !== "ALT");
    if (nameParts.length > 0) {
      fields.name = splitCompactName(nameParts.join(" "));
    }
  } else if (parts.length > 2) {
    fields.name = splitCompactName(parts.slice(2).join(" "));
  }
  return fields;
}

function draftToCardInput(
  draft: CardDraftEditable,
  fallback: {
    setCode: string;
    setName: string;
    collectorNumber?: string;
    imageUrl: string;
    setNumber?: number;
    legality?: string;
  }
): Infer<typeof cardInputValidator> {
  const name = cleanString(draft.name);
  if (!name) {
    throw new Error("Card name is required before approval");
  }

  return {
    oracleId: cleanString(draft.oracleId) ?? crypto.randomUUID(),
    name,
    imageUrl: fallback.imageUrl,
    backCardId: draft.backCardId,
    frontCardId: draft.frontCardId,
    isFrontFace: draft.isFrontFace ?? true,
    isVariant: draft.isVariant ?? false,
    setCode: fallback.setCode,
    setName: fallback.setName,
    setNumber: draft.setNumber ?? fallback.setNumber,
    collectorNumber: cleanString(draft.collectorNumber) ?? fallback.collectorNumber,
    rarity: cleanString(draft.rarity),
    type: cleanString(draft.type),
    difficulty: draft.difficulty,
    control: draft.control,
    speed: draft.speed,
    damage: draft.damage,
    blockModifier: draft.blockModifier,
    handSize: draft.handSize,
    health: draft.health,
    stamina: draft.stamina,
    attackZone: cleanString(draft.attackZone),
    blockZone: cleanString(draft.blockZone),
    text: cleanString(draft.text),
    keywords: cleanString(draft.keywords),
    symbols: cleanString(draft.symbols),
    searchName: cleanString(draft.searchName),
    searchText: cleanString(draft.searchText),
    searchAll: cleanString(draft.searchAll),
    copyLimit: draft.copyLimit ?? 4,
    legality: fallback.legality,
    isRevealHidden: draft.isRevealHidden ?? true,
    revealedAt: draft.isRevealHidden === false ? Date.now() : undefined,
  };
}

export const generateDraftUploadUrl = mutation({
  args: {},
  returns: v.object({ uploadUrl: v.string() }),
  handler: async (ctx) => {
    await requireAdmin(ctx);
    return { uploadUrl: await ctx.storage.generateUploadUrl() };
  },
});

export const generateDraftUploadUrlWithApiKey = mutation({
  args: {
    adminApiKey: v.string(),
  },
  returns: v.object({ uploadUrl: v.string() }),
  handler: async (ctx, args) => {
    validateAdminApiKey(args.adminApiKey);
    return { uploadUrl: await ctx.storage.generateUploadUrl() };
  },
});

export const createDraftsFromStorageIds = mutation({
  args: {
    setCode: v.string(),
    setName: v.string(),
    drafts: v.array(draftUploadInputValidator),
  },
  returns: v.array(v.id("cardDrafts")),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    if (args.drafts.length > DRAFT_UPLOAD_BATCH_MAX) {
      throw new Error(`Upload at most ${DRAFT_UPLOAD_BATCH_MAX} draft images at once`);
    }
    const now = Date.now();
    const set = await ctx.db
      .query("sets")
      .withIndex("by_code", (q) => q.eq("code", args.setCode))
      .unique();
    const ids: Id<"cardDrafts">[] = [];
    for (let i = 0; i < args.drafts.length; i++) {
      const draft = args.drafts[i];
      const meta = await ctx.db.system.get("_storage", draft.storageId);
      if (!meta) {
        throw new Error(`Upload not found for ${draft.fileName}`);
      }
      const collectorNumber = cleanString(draft.collectorNumber) ?? inferCollectorNumber(draft.fileName);
      const fileDraft = draftFieldsFromFileName(draft.fileName);
      const draftId = await ctx.db.insert("cardDrafts", {
        setCode: args.setCode,
        setName: args.setName,
        collectorNumber,
        sortIndex: draft.sortIndex ?? now + i,
        fileName: draft.fileName,
        status: "pending",
        imageStorageId: draft.storageId,
        draft: cleanDraft({
          ...fileDraft,
          oracleId: crypto.randomUUID(),
          setCode: args.setCode,
          setName: args.setName,
          setNumber: set?.setNumber,
          collectorNumber,
          copyLimit: 4,
          isFrontFace: true,
          isVariant: false,
          isRevealHidden: true,
          symbols: "",
        }),
        parseWarnings: [],
        createdAt: now,
        updatedAt: now,
      });
      ids.push(draftId);
    }
    return ids;
  },
});

export const createDraftsFromStorageIdsWithApiKey = mutation({
  args: {
    adminApiKey: v.string(),
    setCode: v.string(),
    setName: v.string(),
    drafts: v.array(draftUploadInputValidator),
  },
  returns: v.array(v.id("cardDrafts")),
  handler: async (ctx, args) => {
    validateAdminApiKey(args.adminApiKey);
    if (args.drafts.length > DRAFT_UPLOAD_BATCH_MAX) {
      throw new Error(`Upload at most ${DRAFT_UPLOAD_BATCH_MAX} draft images at once`);
    }
    const now = Date.now();
    const set = await ctx.db
      .query("sets")
      .withIndex("by_code", (q) => q.eq("code", args.setCode))
      .unique();
    const ids: Id<"cardDrafts">[] = [];
    for (let i = 0; i < args.drafts.length; i++) {
      const draft = args.drafts[i];
      const meta = await ctx.db.system.get("_storage", draft.storageId);
      if (!meta) {
        throw new Error(`Upload not found for ${draft.fileName}`);
      }
      const collectorNumber = cleanString(draft.collectorNumber) ?? inferCollectorNumber(draft.fileName);
      const fileDraft = draftFieldsFromFileName(draft.fileName);
      const draftId = await ctx.db.insert("cardDrafts", {
        setCode: args.setCode,
        setName: args.setName,
        collectorNumber,
        sortIndex: draft.sortIndex ?? now + i,
        fileName: draft.fileName,
        status: "pending",
        imageStorageId: draft.storageId,
        draft: cleanDraft({
          ...fileDraft,
          oracleId: crypto.randomUUID(),
          setCode: args.setCode,
          setName: args.setName,
          setNumber: set?.setNumber,
          collectorNumber,
          copyLimit: 4,
          isFrontFace: true,
          isVariant: false,
          isRevealHidden: true,
          symbols: "",
        }),
        parseWarnings: [],
        createdAt: now,
        updatedAt: now,
      });
      ids.push(draftId);
    }
    return ids;
  },
});

export const listDraftsBySet = query({
  args: {
    setCode: v.string(),
    status: v.optional(cardDraftStatusValidator),
  },
  returns: v.array(cardDraftReviewRowValidator),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const status = args.status ?? "pending";
    const rows = await ctx.db
      .query("cardDrafts")
      .withIndex("by_setCode_and_status_and_sortIndex", (q) =>
        q.eq("setCode", args.setCode).eq("status", status)
      )
      .take(500);
    const result: Infer<typeof cardDraftReviewRowValidator>[] = [];
    for (const row of rows) {
      result.push({
        ...row,
        imageUrl: (await ctx.storage.getUrl(row.imageStorageId)) ?? null,
      });
    }
    return result;
  },
});

export const updateDraft = mutation({
  args: {
    draftId: v.id("cardDrafts"),
    draft: cardDraftEditableValidator,
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.get(args.draftId);
    if (!existing) {
      throw new Error("Draft not found");
    }
    if (existing.status !== "pending") {
      throw new Error("Only pending drafts can be edited");
    }
    await ctx.db.patch(args.draftId, {
      draft: cleanDraft({
        ...existing.draft,
        ...args.draft,
      }),
      collectorNumber: cleanString(args.draft.collectorNumber) ?? existing.collectorNumber,
      updatedAt: Date.now(),
      approvalError: undefined,
    });
    return null;
  },
});

export const scheduleDraftOcr = mutation({
  args: {
    draftId: v.id("cardDrafts"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.get(args.draftId);
    if (!existing) {
      throw new Error("Draft not found");
    }
    if (existing.status !== "pending") {
      throw new Error("Only pending drafts can be reprocessed");
    }
    await ctx.scheduler.runAfter(0, internal.cardDraftActions.runDraftOcr, {
      draftId: args.draftId,
    });
    return null;
  },
});

export const applyDraftOcrFromAdmin = mutation({
  args: {
    draftId: v.id("cardDrafts"),
    ocrRawText: v.string(),
    draft: cardDraftEditableValidator,
    parseWarnings: v.array(v.string()),
    detectedType: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.get(args.draftId);
    if (!existing || existing.status !== "pending") {
      throw new Error("Draft not found");
    }
    await ctx.db.patch(args.draftId, {
      ocrRawText: args.ocrRawText,
      draft: mergeOcrDraft(existing.draft, args.draft),
      parseWarnings: args.parseWarnings,
      detectedType: args.detectedType,
      updatedAt: Date.now(),
      approvalError: undefined,
    });
    return null;
  },
});

export const skipDraft = mutation({
  args: {
    draftId: v.id("cardDrafts"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const userId = await requireAdmin(ctx);
    const existing = await ctx.db.get(args.draftId);
    if (!existing) {
      throw new Error("Draft not found");
    }
    if (existing.status === "approved") {
      throw new Error("Approved drafts cannot be skipped");
    }
    await ctx.db.patch(args.draftId, {
      status: "skipped",
      reviewedBy: userId,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const deleteDraft = mutation({
  args: {
    draftId: v.id("cardDrafts"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await requireAdmin(ctx);
    const existing = await ctx.db.get(args.draftId);
    if (!existing) {
      return null;
    }
    if (existing.status === "approved") {
      throw new Error("Approved drafts cannot be deleted");
    }
    await ctx.storage.delete(existing.imageStorageId);
    await ctx.db.delete(args.draftId);
    return null;
  },
});

export const getDraftForOcr = internalQuery({
  args: {
    draftId: v.id("cardDrafts"),
  },
  returns: v.union(cardDraftValidator, v.null()),
  handler: async (ctx, args) => {
    const draft = await ctx.db.get(args.draftId);
    if (!draft || draft.status !== "pending") {
      return null;
    }
    return draft;
  },
});

export const applyDraftOcr = internalMutation({
  args: {
    draftId: v.id("cardDrafts"),
    ocrRawText: v.string(),
    draft: cardDraftEditableValidator,
    parseWarnings: v.array(v.string()),
    detectedType: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.draftId);
    if (!existing || existing.status !== "pending") {
      return null;
    }
    await ctx.db.patch(args.draftId, {
      ocrRawText: args.ocrRawText,
      draft: mergeOcrDraft(existing.draft, args.draft),
      parseWarnings: args.parseWarnings,
      detectedType: args.detectedType,
      updatedAt: Date.now(),
    });
    return null;
  },
});

export const getDraftForApproval = internalQuery({
  args: {
    draftId: v.id("cardDrafts"),
  },
  returns: v.union(cardDraftValidator, v.null()),
  handler: async (ctx, args) => {
    const draft = await ctx.db.get(args.draftId);
    if (!draft || draft.status !== "pending") {
      return null;
    }
    return draft;
  },
});

export const finalizeApproveDraft = internalMutation({
  args: {
    draftId: v.id("cardDrafts"),
    imageUrl: v.string(),
    reviewerUserId: v.id("users"),
  },
  returns: v.id("cards"),
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.draftId);
    if (!existing) {
      throw new Error("Draft not found");
    }
    if (existing.status !== "pending") {
      throw new Error("Only pending drafts can be approved");
    }
    const set = await ctx.db
      .query("sets")
      .withIndex("by_code", (q) => q.eq("code", existing.setCode))
      .unique();
    const card = draftToCardInput(existing.draft, {
      setCode: existing.setCode,
      setName: existing.setName,
      collectorNumber: existing.collectorNumber,
      imageUrl: args.imageUrl,
      setNumber: existing.draft.setNumber ?? set?.setNumber,
      legality: set?.legality,
    });
    const cardId = await createCardWithDerivedFields(ctx, card);
    await ctx.db.patch(args.draftId, {
      status: "approved",
      approvedCardId: cardId,
      reviewedBy: args.reviewerUserId,
      updatedAt: Date.now(),
      approvalError: undefined,
    });
    return cardId;
  },
});

export const markApprovalError = internalMutation({
  args: {
    draftId: v.id("cardDrafts"),
    message: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.draftId);
    if (!existing || existing.status !== "pending") {
      return null;
    }
    await ctx.db.patch(args.draftId, {
      approvalError: args.message,
      updatedAt: Date.now(),
    });
    return null;
  },
});

function inferCollectorNumber(fileName: string): string | undefined {
  const base = fileName.replace(/\.[^.]+$/, "");
  const match =
    base.match(/[A-Z]{2,}\d{2,}[-_ ]?(\d{1,4}[A-Z]?)/i) ??
    base.match(/\b(\d{1,4}[A-Z]?)\b/i);
  return cleanString(match?.[1] ?? base);
}
