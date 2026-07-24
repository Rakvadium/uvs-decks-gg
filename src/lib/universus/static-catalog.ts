import type { CachedCard } from "./card-store";

const R2_FETCH_TIMEOUT_MS = 10_000;
const MAX_DECOMPRESSED_BYTES = 32 * 1024 * 1024;
export const STATIC_CATALOG_SCHEMA_VERSION = 1;

export type StaticCatalogPayload = {
  schemaVersion: number;
  version: number;
  cardCount: number;
  cards: CachedCard[];
};

function hexFromBuffer(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let hex = "";
  for (let i = 0; i < bytes.length; i += 1) {
    hex += bytes[i]!.toString(16).padStart(2, "0");
  }
  return hex;
}

async function sha256Hex(data: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", data);
  return hexFromBuffer(digest);
}

async function decompressGzip(data: ArrayBuffer): Promise<string> {
  if (typeof DecompressionStream === "undefined") {
    throw new Error("DecompressionStream is not available");
  }
  const stream = new Blob([data]).stream().pipeThrough(new DecompressionStream("gzip"));
  const decompressed = await new Response(stream).arrayBuffer();
  if (decompressed.byteLength > MAX_DECOMPRESSED_BYTES) {
    throw new Error("Static catalog exceeds maximum decompressed size");
  }
  return new TextDecoder("utf-8").decode(decompressed);
}

function isCachedCard(value: unknown): value is CachedCard {
  if (!value || typeof value !== "object") return false;
  const row = value as Record<string, unknown>;
  return typeof row._id === "string" && typeof row.name === "string";
}

function parseStaticCatalog(jsonText: string): CachedCard[] {
  const parsed: unknown = JSON.parse(jsonText);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("Static catalog JSON root must be an object");
  }
  const root = parsed as Record<string, unknown>;
  if (!Array.isArray(root.cards)) {
    throw new Error("Static catalog missing cards array");
  }
  if (
    typeof root.schemaVersion === "number" &&
    root.schemaVersion > STATIC_CATALOG_SCHEMA_VERSION
  ) {
    throw new Error("Static catalog schema is newer than this client");
  }
  const cards: CachedCard[] = [];
  for (const row of root.cards) {
    if (!isCachedCard(row)) {
      throw new Error("Static catalog contains an invalid card row");
    }
    cards.push(row);
  }
  return cards;
}

export async function fetchStaticCatalog(args: {
  catalogUrl: string;
  catalogSha256: string;
}): Promise<CachedCard[]> {
  const controller = new AbortController();
  const timeout = window.setTimeout(() => controller.abort(), R2_FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(args.catalogUrl, {
      signal: controller.signal,
      headers: { Accept: "application/json, application/gzip" },
    });
    if (!response.ok) {
      throw new Error(`Static catalog HTTP ${response.status}`);
    }
    const compressed = await response.arrayBuffer();
    const digest = await sha256Hex(compressed);
    if (digest !== args.catalogSha256.toLowerCase()) {
      throw new Error("Static catalog digest mismatch");
    }

    const jsonText = await decompressGzip(compressed);
    return parseStaticCatalog(jsonText);
  } finally {
    window.clearTimeout(timeout);
  }
}
