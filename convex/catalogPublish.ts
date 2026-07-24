"use node";

import { createHash } from "crypto";
import { gzipSync } from "zlib";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { r2 } from "./r2";
import {
  CATALOG_STATIC_SCHEMA_VERSION,
  catalogObjectKeyForVersion,
  toPublicCatalogUrl,
} from "./publicCardUrls";
import type { Doc } from "./_generated/dataModel";

const PUBLISH_PAGE_SIZE = 500;

export const uploadCatalogBlob = internalAction({
  args: {
    version: v.number(),
    releaseAt: v.number(),
  },
  returns: v.object({
    catalogUrl: v.string(),
    catalogSha256: v.string(),
    catalogObjectKey: v.string(),
    catalogSchemaVersion: v.number(),
    cardCount: v.number(),
  }),
  handler: async (ctx, args) => {
    const gallery: Doc<"cards">[] = [];
    let cursor: string | null = null;
    let isDone = false;

    while (!isDone) {
      const page: {
        cards: Doc<"cards">[];
        cursor: string | null;
        isDone: boolean;
      } = await ctx.runQuery(internal.cards.listGalleryCatalogPageForPublish, {
        cursor,
        limit: PUBLISH_PAGE_SIZE,
        cutoff: args.releaseAt,
      });
      gallery.push(...page.cards);
      cursor = page.cursor;
      isDone = page.isDone;
    }

    const payload = JSON.stringify({
      schemaVersion: CATALOG_STATIC_SCHEMA_VERSION,
      version: args.version,
      cardCount: gallery.length,
      cards: gallery,
    });
    const compressed = gzipSync(Buffer.from(payload, "utf8"));
    const catalogSha256 = createHash("sha256").update(compressed).digest("hex");
    const catalogObjectKey = catalogObjectKeyForVersion(args.version);
    const catalogUrl = toPublicCatalogUrl(args.version);

    const putCommand = new PutObjectCommand({
      Bucket: r2.config.bucket,
      Key: catalogObjectKey,
      Body: compressed,
      ContentType: "application/gzip",
      CacheControl: "public, max-age=31536000, immutable",
    });
    await (r2.r2 as { send: (command: unknown) => Promise<unknown> }).send(putCommand);

    return {
      catalogUrl,
      catalogSha256,
      catalogObjectKey,
      catalogSchemaVersion: CATALOG_STATIC_SCHEMA_VERSION,
      cardCount: gallery.length,
    };
  },
});

export const deleteCatalogObject = internalAction({
  args: {
    objectKey: v.string(),
  },
  returns: v.null(),
  handler: async (_ctx, args) => {
    const { DeleteObjectCommand } = await import("@aws-sdk/client-s3");
    const deleteCommand = new DeleteObjectCommand({
      Bucket: r2.config.bucket,
      Key: args.objectKey,
    });
    await (r2.r2 as { send: (command: unknown) => Promise<unknown> }).send(deleteCommand);
    return null;
  },
});
