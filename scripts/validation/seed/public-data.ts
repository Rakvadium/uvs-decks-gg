/**
 * Public, unauthenticated production reads for the validation seed: the pinned static catalog on
 * the public R2 bucket, and public Convex queries over HTTP (the same calls any site visitor's
 * browser makes). No credentials, no writes.
 *
 * Rows are projected onto this branch's schema (production may carry extra fields, e.g. `game`)
 * and stripped of references to production users.
 */
import { createHash } from "node:crypto";
import { gunzipSync } from "node:zlib";
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

export async function fetchCatalog(pin: CatalogPin): Promise<{ gz: Buffer; cards: SnapshotDoc[] }> {
  const gz = Buffer.from(await (await fetchOk(pin.url)).arrayBuffer());
  const sha = createHash("sha256").update(gz).digest("hex");
  if (sha !== pin.sha256) throw new Error(`catalog v${pin.version}: sha256 ${sha} does not match the pinned ${pin.sha256}`);
  const json = JSON.parse(gunzipSync(gz).toString("utf8")) as { version: number; cardCount: number; cards: SnapshotDoc[] };
  if (json.version !== pin.version || json.cards.length !== pin.cardCount) {
    throw new Error(`catalog v${pin.version}: file says v${json.version} with ${json.cards.length} cards`);
  }
  return { gz, cards: json.cards };
}

export type PublicReads = {
  sets: SnapshotDoc[];
  formats: SnapshotDoc[];
  cardLegality: SnapshotDoc[];
  setLegality: SnapshotDoc[];
  facets: { rarities: string[]; types: string[]; setCodes: string[] };
};

/**
 * Tables the seed can't read publicly, and why. They are left empty.
 * - formatErrata: no public query reads it (only the admin format delete touches it), and no page
 *   on this branch renders it.
 */
export const UNREADABLE_TABLES: Record<string, string> = {
  formatErrata: "no public query exposes it; nothing on this branch reads it",
};

export async function fetchPublicReads(convexUrl: string): Promise<PublicReads> {
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
  return { sets, formats, cardLegality, setLegality, facets };
}

export type BaseSnapshot = {
  tableNumbers: Map<string, number>;
  rows: TableRows;
  droppedFields: string[];
  droppedLegalityRows: number;
  publicReadsSha256: string;
};

/** Tables whose rows keep their production `_id`s (and so their production table numbers). */
const PRODUCTION_ID_TABLES = ["cards", "sets", "formats", "cardLegality", "setLegality"] as const;

export function buildBaseSnapshot(opts: { pin: CatalogPin; cards: SnapshotDoc[]; reads: PublicReads; idNamespace: string }): BaseSnapshot {
  const dropped = new Set<string>();
  const cards = opts.cards.map((row) => projectRow("cards", row, dropped));
  const cardIds = new Set(cards.map((c) => c._id));
  const legalityAll = opts.reads.cardLegality.map((row) => projectRow("cardLegality", row, dropped));
  const cardLegality = legalityAll.filter((row) => cardIds.has(row.cardId as string));
  const rows: TableRows = new Map([
    ["cards", cards],
    ["sets", opts.reads.sets.map((row) => projectRow("sets", row, dropped))],
    ["formats", opts.reads.formats.map((row) => projectRow("formats", row, dropped))],
    ["cardLegality", cardLegality],
    ["setLegality", opts.reads.setLegality.map((row) => projectRow("setLegality", row, dropped))],
  ]);
  const publicReadsSha256 = createHash("sha256")
    .update(canonicalJson(Object.fromEntries([...rows].filter(([t]) => t !== "cards")) as unknown))
    .update(canonicalJson(opts.reads.facets))
    .digest("hex");

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
    publicReadsSha256,
  };
}
