/**
 * Public, unauthenticated production reads for the validation seed: public Convex queries over
 * HTTP (the same calls any site visitor's browser makes). No credentials, no writes. The pinned
 * static catalog is loaded by catalog.ts.
 *
 * Rows are projected onto this branch's schema (production may carry extra fields, e.g. `game`)
 * and stripped of references to production users.
 */
import { createHash } from "node:crypto";
import schema from "../../../convex/schema";
import { canonicalJson } from "../../../convex/validationSeed";
import { deterministicConvexId } from "./convexId";
import { assignTableNumbers, tableNumberOfRows, type SnapshotDoc, type TableRows } from "./snapshot";

export type CatalogPin = { version: number; url: string; sha256: string; updatedAt: number; cardCount: number };

type SchemaTables = Record<string, { validator: { kind: string; fields: Record<string, unknown> } }>;
const SCHEMA_TABLES = (schema as unknown as { tables: SchemaTables }).tables;

export function schemaTableNames(): string[] {
  return Object.keys(SCHEMA_TABLES).sort();
}

/** Fields that would point at production users; validation backends never reference them. */
const DROPPED_FIELDS: Record<string, string[]> = { sets: ["updatedBy"] };

/** Keeps only fields this branch's schema declares (plus system fields). Returns what it dropped. */
export function projectRow(table: string, row: SnapshotDoc, dropped: Set<string>): SnapshotDoc {
  const fields = SCHEMA_TABLES[table]?.validator.fields;
  if (!fields) throw new Error(`projectRow: ${table} is not a schema table`);
  const out: SnapshotDoc = { _id: row._id, _creationTime: row._creationTime };
  for (const [key, value] of Object.entries(row)) {
    if (key === "_id" || key === "_creationTime") continue;
    if (!(key in fields) || DROPPED_FIELDS[table]?.includes(key)) {
      dropped.add(`${table}.${key}`);
      continue;
    }
    out[key] = value;
  }
  return out;
}

async function fetchOk(url: string, init?: RequestInit): Promise<Response> {
  const resp = await fetch(url, { ...init, signal: AbortSignal.timeout(60_000) });
  if (!resp.ok) throw new Error(`${init?.method ?? "GET"} ${url} failed: HTTP ${resp.status}`);
  return resp;
}

export async function publicQuery<T>(convexUrl: string, path: string, args: Record<string, unknown> = {}): Promise<T> {
  const resp = await fetchOk(`${convexUrl}/api/query`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ path, args, format: "json" }),
  });
  const body = (await resp.json()) as { status: string; value?: T; errorMessage?: string };
  if (body.status !== "success") throw new Error(`public query ${path} failed: ${body.errorMessage ?? body.status}`);
  return body.value as T;
}

export type PublicReads = {
  sets: SnapshotDoc[];
  formats: SnapshotDoc[];
  cardLegality: SnapshotDoc[];
  setLegality: SnapshotDoc[];
  /** Back faces of the catalog's dual-faced cards (the catalog holds front faces only). */
  backFaces: SnapshotDoc[];
  /** `backCardId`s production did not return (e.g. unreleased); the seed has no row for them. */
  missingBackFaceIds: string[];
  facets: { rarities: string[]; types: string[]; setCodes: string[] };
};

/** `backCardId`s of `cards` that point outside `cards`, sorted. */
export function backFaceIds(cards: SnapshotDoc[]): string[] {
  const have = new Set(cards.map((c) => c._id));
  const ids = new Set<string>();
  for (const card of cards) {
    if (typeof card.backCardId === "string" && !have.has(card.backCardId)) ids.add(card.backCardId);
  }
  return [...ids].sort();
}

const BATCH_IDS = 200;

/**
 * Back faces through `cards:batchGetCardsByIds`, the public query the gallery uses for them. It
 * rewrites `imageUrl` the same way the catalog does, so back and front rows have the same shape.
 */
export async function fetchBackFaces(convexUrl: string, catalogCards: SnapshotDoc[]): Promise<{ rows: SnapshotDoc[]; missing: string[] }> {
  const ids = backFaceIds(catalogCards);
  const rows: SnapshotDoc[] = [];
  for (let i = 0; i < ids.length; i += BATCH_IDS) {
    rows.push(...(await publicQuery<SnapshotDoc[]>(convexUrl, "cards:batchGetCardsByIds", { ids: ids.slice(i, i + BATCH_IDS) })));
  }
  const got = new Set(rows.map((r) => r._id));
  return { rows, missing: ids.filter((id) => !got.has(id)) };
}

/**
 * Tables the seed can't read publicly, and why. They are left empty.
 * - formatErrata: no public query reads it (only the admin format delete touches it), and no page
 *   on this branch renders it.
 */
export const UNREADABLE_TABLES: Record<string, string> = {
  formatErrata: "no public query exposes it; nothing on this branch reads it",
};

export async function fetchPublicReads(convexUrl: string, catalogCards: SnapshotDoc[]): Promise<PublicReads> {
  const sets = await publicQuery<SnapshotDoc[]>(convexUrl, "sets:list");
  const formats = await publicQuery<SnapshotDoc[]>(convexUrl, "formats:list");
  const cardLegality: SnapshotDoc[] = [];
  const setLegality: SnapshotDoc[] = [];
  for (const format of formats) {
    const formatKey = format.key as string;
    cardLegality.push(...(await publicQuery<SnapshotDoc[]>(convexUrl, "formats:getCardLegalityByFormat", { formatKey })));
    setLegality.push(...(await publicQuery<SnapshotDoc[]>(convexUrl, "formats:getSetLegalityByFormat", { formatKey })));
  }
  const facets = {
    rarities: await publicQuery<string[]>(convexUrl, "cards:getRarities"),
    types: await publicQuery<string[]>(convexUrl, "cards:getTypes"),
    setCodes: await publicQuery<string[]>(convexUrl, "cards:getSets"),
  };
  const backFaces = await fetchBackFaces(convexUrl, catalogCards);
  return { sets, formats, cardLegality, setLegality, backFaces: backFaces.rows, missingBackFaceIds: backFaces.missing, facets };
}

export type BaseSnapshot = {
  tableNumbers: Map<string, number>;
  rows: TableRows;
  droppedFields: string[];
  droppedLegalityRows: number;
  publicReadsSha256: string;
  /** sha256 per public read, so a rebuild can say which one changed. */
  publicReads: Record<string, string>;
};

/** sha256 per public read, and one over all of them. Rows are hashed as projected into the seed. */
export function hashPublicReads(parts: Record<string, unknown>): { sha256: string; parts: Record<string, string> } {
  const hashes = Object.fromEntries(
    Object.keys(parts)
      .sort()
      .map((name) => [name, createHash("sha256").update(canonicalJson(parts[name])).digest("hex")]),
  );
  return { sha256: createHash("sha256").update(canonicalJson(hashes)).digest("hex"), parts: hashes };
}

/**
 * How a rebuild's public reads differ from the ones the manifest recorded, one line per change.
 * Empty when they match or the manifest has no previous hash.
 */
export function describePublicReadsDrift(
  previous: { sha256: string | null; parts?: Record<string, string> | null },
  current: { sha256: string; parts: Record<string, string> },
): string[] {
  const before = previous.parts;
  if (!before) {
    if (previous.sha256 === null || previous.sha256 === current.sha256) return [];
    return [`publicReadsSha256 ${previous.sha256.slice(0, 12)} -> ${current.sha256.slice(0, 12)} (the manifest has no per-read hashes)`];
  }
  const short = (hash: string | undefined) => hash?.slice(0, 12) ?? "(none)";
  return [...new Set([...Object.keys(before), ...Object.keys(current.parts)])]
    .sort()
    .filter((name) => before[name] !== current.parts[name])
    .map((name) => `${name} ${short(before[name])} -> ${short(current.parts[name])}`);
}

/** Tables whose rows keep their production `_id`s (and so their production table numbers). */
const PRODUCTION_ID_TABLES = ["cards", "sets", "formats", "cardLegality", "setLegality"] as const;

export function buildBaseSnapshot(opts: { pin: CatalogPin; cards: SnapshotDoc[]; reads: PublicReads; idNamespace: string }): BaseSnapshot {
  const dropped = new Set<string>();
  const backFaces = opts.reads.backFaces.map((row) => projectRow("cards", row, dropped));
  const cards = [...opts.cards.map((row) => projectRow("cards", row, dropped)), ...backFaces];
  const cardIds = new Set(cards.map((c) => c._id));
  if (cardIds.size !== cards.length) throw new Error("buildBaseSnapshot: a back face is also a catalog card");
  const legalityAll = opts.reads.cardLegality.map((row) => projectRow("cardLegality", row, dropped));
  const cardLegality = legalityAll.filter((row) => cardIds.has(row.cardId as string));
  const rows: TableRows = new Map([
    ["cards", cards],
    ["sets", opts.reads.sets.map((row) => projectRow("sets", row, dropped))],
    ["formats", opts.reads.formats.map((row) => projectRow("formats", row, dropped))],
    ["cardLegality", cardLegality],
    ["setLegality", opts.reads.setLegality.map((row) => projectRow("setLegality", row, dropped))],
  ]);
  const publicReads = hashPublicReads({
    ...Object.fromEntries([...rows].filter(([t]) => t !== "cards")),
    backFaces,
    facets: opts.reads.facets,
  });

  const fixed = new Map<string, number>();
  for (const table of PRODUCTION_ID_TABLES) {
    const n = tableNumberOfRows(table, rows.get(table)!);
    if (n !== null) fixed.set(table, n);
  }
  const tableNumbers = assignTableNumbers(schemaTableNames(), fixed);

  const objectKey = new URL(opts.pin.url).pathname.replace(/^\//, "");
  rows.set("cardDataVersion", [
    {
      _id: deterministicConvexId(tableNumbers.get("cardDataVersion")!, opts.idNamespace, "cardDataVersion:0"),
      _creationTime: opts.pin.updatedAt,
      version: opts.pin.version,
      updatedAt: opts.pin.updatedAt,
      cardCount: opts.pin.cardCount,
      catalogUrl: opts.pin.url,
      catalogSha256: opts.pin.sha256,
      catalogSchemaVersion: 1,
      catalogObjectKey: objectKey,
    },
  ]);
  rows.set("cardFacetSnapshot", [
    {
      _id: deterministicConvexId(tableNumbers.get("cardFacetSnapshot")!, opts.idNamespace, "cardFacetSnapshot:0"),
      _creationTime: opts.pin.updatedAt,
      key: "default",
      rarities: opts.reads.facets.rarities,
      types: opts.reads.facets.types,
      setCodes: opts.reads.facets.setCodes,
      updatedAt: opts.pin.updatedAt,
    },
  ]);
  return {
    tableNumbers,
    rows,
    droppedFields: [...dropped].sort(),
    droppedLegalityRows: legalityAll.length - cardLegality.length,
    publicReadsSha256: publicReads.sha256,
    publicReads: publicReads.parts,
  };
}
