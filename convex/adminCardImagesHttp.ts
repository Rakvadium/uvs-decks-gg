import { httpAction } from "./_generated/server";
import { r2 } from "./r2";
import { assertAdminApiKeyFromRequest, jsonError, jsonOk } from "./lib/adminApiAuth";
import { assertAllowedR2ObjectKey } from "./lib/r2Keys";

/** Card renders are ~100–300 KB webp; anything much larger is almost certainly a mistake. */
export const MAX_CARD_IMAGE_BYTES = 2 * 1024 * 1024;

/** One lowercase key segment: no dots/slashes, so it can never escape `cards/<set>/`. */
const KEY_SEGMENT = /^[a-z0-9][a-z0-9_-]{0,63}$/;

/**
 * Validates `setCode` / `fileName` query params into `<set>/<file>.webp` (the `imageUrl` format
 * `toPublicCardImageUrl` expects). Unlike the authenticated `cardImages.uploadCardImage` action,
 * this rejects anything it would have to rewrite, so scripts get the key they asked for.
 */
export function cardImageRelativeKey(setCode: string | null, fileName: string | null): string {
  const set = (setCode ?? "").trim().toLowerCase();
  const file = (fileName ?? "").trim().toLowerCase().replace(/\.webp$/, "");
  if (!KEY_SEGMENT.test(set)) {
    throw new Error("setCode must be 1-64 chars of a-z, 0-9, '-' or '_'");
  }
  if (!KEY_SEGMENT.test(file)) {
    throw new Error("fileName must be 1-64 chars of a-z, 0-9, '-' or '_' (optional .webp suffix)");
  }
  return `${set}/${file}.webp`;
}

/** RIFF....WEBP container header. */
function isWebp(bytes: Uint8Array): boolean {
  return (
    bytes.length >= 12 &&
    bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
    bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50
  );
}

/**
 * `POST /admin/upload-card-image?setCode=<set>&fileName=<collector>`
 * Body: raw webp bytes. Auth: ADMIN_API_KEY (Bearer or x-admin-api-key), same as convex/adminHttp.ts.
 * Stores `cards/<set>/<file>.webp` in R2 and returns `{ key: "<set>/<file>.webp" }` for `imageUrl`.
 */
export const uploadCardImage = httpAction(async (ctx, req) => {
  try {
    assertAdminApiKeyFromRequest(req);
  } catch (e) {
    return jsonError(401, e instanceof Error ? e.message : "Unauthorized");
  }

  let relativeKey: string;
  let bytes: Uint8Array;
  try {
    const url = new URL(req.url);
    relativeKey = cardImageRelativeKey(
      url.searchParams.get("setCode"),
      url.searchParams.get("fileName"),
    );
    const declaredLength = Number(req.headers.get("content-length") ?? "0");
    if (declaredLength > MAX_CARD_IMAGE_BYTES) {
      return jsonError(413, `Image exceeds ${MAX_CARD_IMAGE_BYTES} bytes`);
    }
    bytes = new Uint8Array(await req.arrayBuffer());
    if (bytes.length === 0) {
      throw new Error("Request body must be the image bytes");
    }
    if (bytes.length > MAX_CARD_IMAGE_BYTES) {
      return jsonError(413, `Image exceeds ${MAX_CARD_IMAGE_BYTES} bytes`);
    }
    if (!isWebp(bytes)) {
      throw new Error("Image must be webp");
    }
  } catch (e) {
    return jsonError(400, e instanceof Error ? e.message : "Bad request");
  }

  try {
    const objectKey = `cards/${relativeKey}`;
    assertAllowedR2ObjectKey(objectKey);
    await r2.store(ctx, bytes, { key: objectKey, type: "image/webp" });
    return jsonOk({ key: relativeKey, bytes: bytes.length });
  } catch (e) {
    return jsonError(500, e instanceof Error ? e.message : "Upload failed");
  }
});
