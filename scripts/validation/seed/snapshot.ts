/**
 * Pure snapshot transforms for the validation seed:
 *
 * - `assignTableNumbers`: fixed Convex table numbers (production numbers for tables whose rows keep
 *   production IDs, then the rest in name order), so IDs are stable across builds.
 * - `buildSnapshotZip`: a Convex snapshot ZIP (`_tables` + `<table>/documents.jsonl`) with sorted
 *   keys and rows, written by the deterministic zip writer.
 * - `normalizeExport`: turns a `convex export` of the build backend into the golden seed. Rows the
 *   base import supplied must come back unchanged. Rows `seedFixtures` created get IDs derived from
 *   (table, insertion rank) and `_creationTime = epoch + global insertion rank`, and every reference
 *   to their old random IDs is rewritten, so two builds give byte-identical zips.
 */
import { canonicalJson } from "../../../convex/validationSeed";
import { decodeConvexId, deterministicConvexId } from "./convexId";
import { readZip, writeZip, type ZipEntries } from "./zip";

export type SnapshotDoc = { _id: string; _creationTime: number; [field: string]: unknown };
export type TableRows = Map<string, SnapshotDoc[]>;

export const FIRST_TABLE_NUMBER = 10001;

export function parseJsonl(text: string): SnapshotDoc[] {
  return text
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => JSON.parse(line) as SnapshotDoc);
}

export function toJsonl(rows: unknown[]): string {
  return rows.map((row) => `${canonicalJson(row)}\n`).join("");
}

function compareRows(a: SnapshotDoc, b: SnapshotDoc): number {
  return a._creationTime - b._creationTime || (a._id < b._id ? -1 : a._id > b._id ? 1 : 0);
}

/**
 * `fixed` pins tables to the production numbers decoded from their IDs. Every other table gets the
 * next free number from FIRST_TABLE_NUMBER in name order.
 */
export function assignTableNumbers(tableNames: string[], fixed: Map<string, number>): Map<string, number> {
  const used = new Set(fixed.values());
  if (used.size !== fixed.size) throw new Error("assignTableNumbers: two fixed tables share a number");
  const out = new Map<string, number>();
  let next = FIRST_TABLE_NUMBER;
  for (const name of [...tableNames].sort()) {
    const pinned = fixed.get(name);
    if (pinned !== undefined) {
      out.set(name, pinned);
      continue;
    }
    while (used.has(next)) next++;
    out.set(name, next);
    used.add(next);
  }
  for (const name of fixed.keys()) if (!out.has(name)) throw new Error(`assignTableNumbers: ${name} is not a schema table`);
  return out;
}

/** The table number every row of `rows` encodes; throws if they disagree. */
export function tableNumberOfRows(table: string, rows: SnapshotDoc[]): number | null {
  let n: number | null = null;
  for (const row of rows) {
    const t = decodeConvexId(row._id).tableNumber;
    if (n !== null && t !== n) throw new Error(`${table}: rows come from different tables (${n}, ${t})`);
    n = t;
  }
  return n;
}

export function buildSnapshotZip(
  tableNumbers: Map<string, number>,
  rows: TableRows,
  extra: ZipEntries = new Map(),
): Buffer {
  const names = [...tableNumbers.keys()].sort();
  const entries: [string, Buffer][] = [
    ["_tables/documents.jsonl", Buffer.from(toJsonl(names.map((name) => ({ id: tableNumbers.get(name), name }))))],
  ];
  for (const name of names) {
    const tableRows = [...(rows.get(name) ?? [])].sort(compareRows);
    for (const row of tableRows) {
      if (decodeConvexId(row._id).tableNumber !== tableNumbers.get(name)) {
        throw new Error(`${name}: row ${row._id} does not belong to table number ${tableNumbers.get(name)}`);
      }
    }
    entries.push([`${name}/documents.jsonl`, Buffer.from(toJsonl(tableRows))]);
  }
  for (const name of [...extra.keys()].sort()) entries.push([name, extra.get(name)!]);
  return writeZip(entries);
}

export type ExportTables = { tableNumbers: Map<string, number>; rows: TableRows; components: ZipEntries };

/** Reads a `convex export` zip: top-level tables, plus `_components/**` kept as raw entries. */
export function readExport(zip: Buffer): ExportTables {
  const entries = readZip(zip);
  const tablesFile = entries.get("_tables/documents.jsonl");
  if (!tablesFile) throw new Error("export has no _tables/documents.jsonl");
  const tableNumbers = new Map<string, number>();
  for (const row of parseJsonl(tablesFile.toString("utf8")) as unknown as { name: string; id: number }[]) {
    tableNumbers.set(row.name, row.id);
  }
  const rows: TableRows = new Map();
  const components: ZipEntries = new Map();
  for (const [name, data] of entries) {
    if (name.startsWith("_components/")) {
      if (name.endsWith("/documents.jsonl")) components.set(name, data);
      continue;
    }
    const m = /^([^/]+)\/documents\.jsonl$/.exec(name);
    if (m && m[1] !== "_tables") rows.set(m[1], parseJsonl(data.toString("utf8")));
  }
  return { tableNumbers, rows, components };
}

function rewriteIds(value: unknown, pattern: RegExp, map: Map<string, string>): unknown {
  const swap = (s: string) => s.replace(pattern, (id) => map.get(id)!);
  if (typeof value === "string") return swap(value);
  if (Array.isArray(value)) return value.map((v) => rewriteIds(v, pattern, map));
  if (value !== null && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([k, v]) => [swap(k), rewriteIds(v, pattern, map)]),
    );
  }
  return value;
}

export type NormalizeOptions = {
  /** Rows the base import supplied, by table. They must come back unchanged. */
  base: TableRows;
  /** Expected table numbers (the ones the base import declared). */
  tableNumbers: Map<string, number>;
  epoch: number;
  /** Namespaces the minted fixture IDs, so a new seed version never reuses old IDs. */
  idNamespace: string;
};

export type NormalizeResult = { zip: Buffer; fixtureCounts: Record<string, number> };

export function normalizeExport(exported: ExportTables, opts: NormalizeOptions): NormalizeResult {
  for (const [name, n] of opts.tableNumbers) {
    if (exported.tableNumbers.get(name) !== n) {
      throw new Error(`export: table ${name} has number ${exported.tableNumbers.get(name)}, expected ${n}`);
    }
  }
  for (const name of exported.tableNumbers.keys()) {
    if (!opts.tableNumbers.has(name)) throw new Error(`export: unexpected table ${name}`);
  }
  for (const [name, data] of exported.components) {
    if (name.endsWith("/_tables/documents.jsonl")) continue;
    if (data.toString("utf8").trim().length > 0) throw new Error(`export: component table ${name} is not empty`);
  }

  const baseById = new Map<string, string>();
  for (const rows of opts.base.values()) for (const row of rows) baseById.set(row._id, canonicalJson(row));

  const fixtures: { table: string; row: SnapshotDoc }[] = [];
  const out: TableRows = new Map();
  for (const [table, rows] of exported.rows) {
    if (!opts.tableNumbers.has(table)) throw new Error(`export: rows for unknown table ${table}`);
    const kept: SnapshotDoc[] = [];
    for (const row of rows) {
      const expected = baseById.get(row._id);
      if (expected === undefined) {
        fixtures.push({ table, row });
      } else {
        if (canonicalJson(row) !== expected) throw new Error(`export: base row ${table}/${row._id} was modified`);
        kept.push(row);
        baseById.delete(row._id);
      }
    }
    out.set(table, kept);
  }
  if (baseById.size > 0) throw new Error(`export: ${baseById.size} base rows are missing`);

  fixtures.sort((a, b) => compareRows(a.row, b.row));
  for (let i = 1; i < fixtures.length; i++) {
    if (fixtures[i].row._creationTime === fixtures[i - 1].row._creationTime) {
      throw new Error("export: two fixture rows share a _creationTime, so insertion order is ambiguous");
    }
  }

  const map = new Map<string, string>();
  const rank = new Map<string, number>();
  const fixtureCounts: Record<string, number> = {};
  for (const { table, row } of fixtures) {
    const n = rank.get(table) ?? 0;
    rank.set(table, n + 1);
    fixtureCounts[table] = n + 1;
    map.set(row._id, deterministicConvexId(opts.tableNumbers.get(table)!, opts.idNamespace, `${table}:${n}`));
  }
  const pattern = map.size > 0 ? new RegExp([...map.keys()].join("|"), "g") : /$^/g;
  fixtures.forEach(({ table, row }, index) => {
    const rewritten = rewriteIds(row, pattern, map) as SnapshotDoc;
    rewritten._creationTime = opts.epoch + index + 1;
    out.get(table)!.push(rewritten);
  });

  const zip = buildSnapshotZip(opts.tableNumbers, out, exported.components);
  const text = zip.toString("latin1");
  for (const old of map.keys()) {
    if (text.includes(old)) throw new Error(`normalize: old fixture ID ${old} is still referenced`);
  }
  return { zip, fixtureCounts };
}

const EMAIL = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;

/** Every email-like string in the zip's documents that is not on the reserved domain. */
export function findNonReservedEmails(zip: Buffer, reservedDomain: string): string[] {
  const found = new Set<string>();
  for (const [name, data] of readZip(zip)) {
    if (!name.endsWith(".jsonl")) continue;
    for (const m of data.toString("utf8").matchAll(EMAIL)) {
      if (!m[0].toLowerCase().endsWith(`@${reservedDomain}`)) found.add(m[0]);
    }
  }
  return [...found].sort();
}
