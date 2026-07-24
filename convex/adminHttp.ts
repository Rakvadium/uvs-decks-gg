import { httpAction } from "./_generated/server";
import { internal } from "./_generated/api";
import {
  assertAdminApiKeyFromRequest,
  jsonError,
  jsonOk,
} from "./lib/adminApiAuth";

async function readJson(req: Request): Promise<unknown> {
  try {
    return await req.json();
  } catch {
    throw new Error("Invalid JSON body");
  }
}

function asRecord(value: unknown): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error("Expected JSON object body");
  }
  return value as Record<string, unknown>;
}

export const upsertSet = httpAction(async (ctx, req) => {
  try {
    assertAdminApiKeyFromRequest(req);
    const body = asRecord(await readJson(req));
    const code = body.code;
    const name = body.name;
    if (typeof code !== "string" || typeof name !== "string") {
      return jsonError(400, "code and name are required strings");
    }
    const id = await ctx.runMutation(internal.admin.upsertSet, {
      code,
      name,
      setNumber: typeof body.setNumber === "number" ? body.setNumber : undefined,
      legality: typeof body.legality === "string" ? body.legality : undefined,
      isRotating: typeof body.isRotating === "boolean" ? body.isRotating : undefined,
      isFuture: typeof body.isFuture === "boolean" ? body.isFuture : undefined,
      spotlightIP: typeof body.spotlightIP === "string" ? body.spotlightIP : undefined,
    });
    return jsonOk({ id });
  } catch (e) {
    return jsonError(401, e instanceof Error ? e.message : "Unauthorized");
  }
});

function pickUpsertCard(raw: unknown): Record<string, unknown> | null {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return null;
  }
  const card = raw as Record<string, unknown>;
  if (typeof card.name !== "string") {
    return null;
  }
  const out: Record<string, unknown> = { name: card.name };
  const optionalKeys = [
    "oracleId",
    "imageUrl",
    "isFrontFace",
    "isVariant",
    "setCode",
    "setName",
    "setNumber",
    "collectorNumber",
    "rarity",
    "type",
    "difficulty",
    "control",
    "speed",
    "damage",
    "blockModifier",
    "handSize",
    "health",
    "stamina",
    "attackZone",
    "blockZone",
    "text",
    "abilities",
    "keywords",
    "symbols",
    "searchName",
    "searchText",
    "searchAll",
    "copyLimit",
    "legality",
    "revealedAt",
    "isRevealHidden",
    "number",
  ] as const;
  for (const key of optionalKeys) {
    const value = card[key];
    if (value !== undefined && value !== null) {
      out[key] = value;
    }
  }
  return out;
}

export const upsertCardsBatch = httpAction(async (ctx, req) => {
  try {
    assertAdminApiKeyFromRequest(req);
    const body = asRecord(await readJson(req));
    if (!Array.isArray(body.cards)) {
      return jsonError(400, "cards must be an array");
    }
    const cards = body.cards
      .map(pickUpsertCard)
      .filter((card): card is Record<string, unknown> => card !== null);
    const result = await ctx.runMutation(internal.admin.upsertCardsBatch, {
      cards: cards as never,
    });
    return jsonOk(result);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unauthorized";
    const status = message.includes("Invalid admin API key") || message.includes("ADMIN_API_KEY")
      ? 401
      : 400;
    return jsonError(status, message);
  }
});

export const linkCardFaces = httpAction(async (ctx, req) => {
  try {
    assertAdminApiKeyFromRequest(req);
    const body = asRecord(await readJson(req));
    if (!Array.isArray(body.links)) {
      return jsonError(400, "links must be an array");
    }
    const result = await ctx.runMutation(internal.admin.linkCardFaces, {
      links: body.links as never,
    });
    return jsonOk(result);
  } catch (e) {
    return jsonError(401, e instanceof Error ? e.message : "Unauthorized");
  }
});

export const draftUploadUrl = httpAction(async (ctx, req) => {
  try {
    assertAdminApiKeyFromRequest(req);
    const uploadUrl = await ctx.storage.generateUploadUrl();
    return jsonOk({ uploadUrl });
  } catch (e) {
    return jsonError(401, e instanceof Error ? e.message : "Unauthorized");
  }
});

export const createDrafts = httpAction(async (ctx, req) => {
  try {
    assertAdminApiKeyFromRequest(req);
    const body = asRecord(await readJson(req));
    if (typeof body.setCode !== "string" || typeof body.setName !== "string") {
      return jsonError(400, "setCode and setName are required strings");
    }
    if (!Array.isArray(body.drafts)) {
      return jsonError(400, "drafts must be an array");
    }
    const ids = await ctx.runMutation(
      internal.cardDrafts.createDraftsFromStorageIdsInternal,
      {
        setCode: body.setCode,
        setName: body.setName,
        drafts: body.drafts as never,
      },
    );
    return jsonOk({ ids });
  } catch (e) {
    return jsonError(401, e instanceof Error ? e.message : "Unauthorized");
  }
});

export const rebuildCatalogAggregates = httpAction(async (ctx, req) => {
  try {
    assertAdminApiKeyFromRequest(req);
    await ctx.runMutation(internal.cardFacets.rebuildCardFacetSnapshot, {});
    await ctx.runMutation(internal.sets.reconcileAllSetCardCounts, {});
    return jsonOk({ ok: true });
  } catch (e) {
    return jsonError(401, e instanceof Error ? e.message : "Unauthorized");
  }
});
