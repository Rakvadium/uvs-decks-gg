import { describe, expect, test } from "bun:test";
import {
  DEFAULT_SEED,
  RESERVED_EMAIL_DOMAIN,
  SEED_EPOCH,
  SEED_VERSION,
  buildFixturePlan,
  canonicalJson,
  createRng,
  type PlanInput,
  type SeedCard,
  type SeedSet,
} from "../convex/validationSeed";
import { decodeConvexId, deterministicConvexId, encodeConvexId, isConvexId } from "../scripts/validation/seed/convexId";
import { createHash } from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { gzipSync } from "node:zlib";
import { catalogCachePath, parseCatalog, pinnedCatalogForUrl, readPinnedCatalog } from "../scripts/validation/seed/catalog";
import { readManifest, type Manifest } from "../scripts/validation/seed/manifest";
import {
  backFaceIds,
  buildBaseSnapshot,
  describePublicReadsDrift,
  hashPublicReads,
  projectRow,
  type PublicReads,
} from "../scripts/validation/seed/public-data";
import {
  assignTableNumbers,
  buildSnapshotZip,
  findNonReservedEmails,
  normalizeExport,
  readExport,
  type SnapshotDoc,
  type TableRows,
} from "../scripts/validation/seed/snapshot";
import { readZip, writeZip } from "../scripts/validation/seed/zip";
import type { Id } from "../convex/_generated/dataModel";

/** A real production card ID from public catalog v29 (cards are table 10008 there). */
const PROD_CARD_ID = "k175gzp3my8j00ehy9hfz3qsxn7zvf5r";

describe("convex ID codec", () => {
  test("decodes production IDs and re-encodes them byte for byte", () => {
    const { tableNumber, internalId } = decodeConvexId(PROD_CARD_ID);
    expect(tableNumber).toBe(10008);
    expect(encodeConvexId(tableNumber, internalId)).toBe(PROD_CARD_ID);
  });

  test("rejects a corrupted ID", () => {
    const corrupted = `${PROD_CARD_ID.slice(0, -1)}${PROD_CARD_ID.endsWith("r") ? "s" : "r"}`;
    expect(() => decodeConvexId(corrupted)).toThrow();
    expect(isConvexId(corrupted)).toBe(false);
  });

  test("deterministic IDs are stable, valid and table-scoped", () => {
    const a = deterministicConvexId(10046, "ns", "users:0");
    expect(deterministicConvexId(10046, "ns", "users:0")).toBe(a);
    expect(deterministicConvexId(10046, "ns", "users:1")).not.toBe(a);
    expect(decodeConvexId(a).tableNumber).toBe(10046);
    expect(a).toHaveLength(32);
  });
});

describe("zip", () => {
  test("round-trips and writes identical bytes for identical input", () => {
    const entries: [string, Buffer][] = [
      ["_tables/documents.jsonl", Buffer.from('{"id":10001,"name":"users"}\n')],
      ["users/documents.jsonl", Buffer.from("")],
    ];
    const zip = writeZip(entries);
    expect(writeZip(entries).equals(zip)).toBe(true);
    expect([...readZip(zip)].map(([k, v]) => [k, v.toString()])).toEqual(entries.map(([k, v]) => [k, v.toString()]));
  });
});

function syntheticInput(seed = DEFAULT_SEED): PlanInput {
  const symbols = ["fire", "water", "air"];
  const sets: SeedSet[] = [0, 1, 2].map((n) => ({ code: `set-${n}`, name: `Set ${n}`, legality: "retro|standard", setNumber: n + 1, isFuture: false }));
  const cards: SeedCard[] = [];
  let n = 0;
  for (const set of sets) {
    for (let i = 0; i < 60; i++) {
      const type = i < 8 ? "Character" : ["Attack", "Foundation", "Action", "Asset"][i % 4];
      cards.push({
        _id: deterministicConvexId(10008, "test", `card:${n}`) as Id<"cards">,
        name: `${type} ${set.code} ${i}`,
        type,
        symbols: i % 7 === 0 ? "infinity" : `${symbols[i % 3]}|${symbols[(i + 1) % 3]}`,
        setCode: set.code,
        copyLimit: 4,
        oracleId: `oracle-${n}`,
      });
      n++;
    }
  }
  return {
    seed,
    epoch: SEED_EPOCH,
    catalogVersion: 29,
    sets,
    formats: [{ key: "standard", sideboardRule: "exact:10", minDeckSize: 60, defaultCopyLimit: 4 }],
    cards,
    banned: new Set([`standard:${cards[8]._id}`]),
  };
}

describe("fixture plan", () => {
  test("is deterministic for a seed and changes with the seed", () => {
    const a = canonicalJson(buildFixturePlan(syntheticInput()));
    expect(canonicalJson(buildFixturePlan(syntheticInput()))).toBe(a);
    expect(canonicalJson(buildFixturePlan(syntheticInput("another-seed")))).not.toBe(a);
  });

  test("the RNG is reproducible", () => {
    const a = createRng("x");
    const b = createRng("x");
    expect(Array.from({ length: 5 }, a.next)).toEqual(Array.from({ length: 5 }, b.next));
  });

  test("uses only reserved emails and no auth accounts", () => {
    const plan = buildFixturePlan(syntheticInput());
    expect(plan.users.length).toBeGreaterThanOrEqual(3);
    for (const user of plan.users) expect(user.email.endsWith(`@${RESERVED_EMAIL_DOMAIN}`)).toBe(true);
    expect(JSON.stringify(plan)).not.toContain("authAccounts");
  });

  test("builds format-sized decks within copy limits, without banned cards", () => {
    const input = syntheticInput();
    const plan = buildFixturePlan(input);
    const visibilities = new Set(plan.decks.map((d) => d.visibility));
    expect(visibilities.has("public")).toBe(true);
    expect(visibilities.has("private")).toBe(true);
    expect(visibilities.has("team")).toBe(true);
    for (const deck of plan.decks) {
      expect(deck.main.reduce((sum, [, qty]) => sum + qty, 0)).toBe(60);
      expect(deck.side.reduce((sum, [, qty]) => sum + qty, 0)).toBe(10);
      for (const [id, qty] of [...deck.main, ...deck.side]) {
        expect(qty).toBeLessThanOrEqual(4);
        expect(input.banned.has(`standard:${id}`)).toBe(false);
      }
      expect(new Set([...deck.main, ...deck.side].map(([id]) => id)).size).toBe(deck.main.length + deck.side.length);
    }
  });

  test("has enough ranked contributors for community tiers", () => {
    const plan = buildFixturePlan(syntheticInput());
    const ranked = plan.tierLists.filter((t) => t.rankingScope === "global" && t.isPublic);
    expect(new Set(ranked.map((t) => t.owner)).size).toBeGreaterThanOrEqual(5);
    expect(new Set(plan.tierLists.map((t) => t.updatedAt)).size).toBe(plan.tierLists.length);
  });

  test("manifest pins match the seed defaults", () => {
    const manifest = readManifest();
    expect(manifest.seedVersion).toBe(SEED_VERSION);
    expect(manifest.seed).toBe(DEFAULT_SEED);
    expect(manifest.epoch).toBe(SEED_EPOCH);
  });
});

describe("snapshot normalization", () => {
  const tableNumbers = assignTableNumbers(["cards", "teams", "users"], new Map([["cards", 10008]]));
  const card: SnapshotDoc = { _id: PROD_CARD_ID, _creationTime: 1769223416749.7644, name: "Bleeding Internally" };
  const base: TableRows = new Map([["cards", [card]]]);
  const randomId = (table: string, tag: string) => deterministicConvexId(tableNumbers.get(table)!, `random-${tag}`, table);

  /** What a backend export looks like after seedFixtures: fixtures with random IDs and times. */
  function fakeExport(tag: string, t0: number): Buffer {
    const userId = randomId("users", tag);
    const teamId = randomId("teams", tag);
    return buildSnapshotZip(
      tableNumbers,
      new Map([
        ["cards", [card]],
        ["users", [{ _id: userId, _creationTime: t0, email: `a@${RESERVED_EMAIL_DOMAIN}`, adminSearchText: `${userId} a` }]],
        ["teams", [{ _id: teamId, _creationTime: t0 + 0.5, captainUserId: userId, scores: { [userId]: 1 } }]],
      ]),
      new Map([["_components/r2/metadata/documents.jsonl", Buffer.from("")]]),
    );
  }

  const opts = { base, tableNumbers, epoch: SEED_EPOCH, idNamespace: "test" };

  test("two builds with different random IDs give identical bytes", () => {
    const a = normalizeExport(readExport(fakeExport("one", 1792000000000.25)), opts);
    const b = normalizeExport(readExport(fakeExport("two", 1795000000000.75)), opts);
    expect(a.zip.equals(b.zip)).toBe(true);
    expect(a.fixtureCounts).toEqual({ users: 1, teams: 1 });
  });

  test("rewrites every reference, including inside strings and record keys", () => {
    const { zip } = normalizeExport(readExport(fakeExport("one", 1792000000000.25)), opts);
    const out = readExport(zip);
    const user = out.rows.get("users")![0];
    const team = out.rows.get("teams")![0];
    expect(user._id).toBe(deterministicConvexId(tableNumbers.get("users")!, "test", "users:0"));
    expect(user._creationTime).toBe(SEED_EPOCH + 1);
    expect(user.adminSearchText).toBe(`${user._id} a`);
    expect(team.captainUserId).toBe(user._id);
    expect(team.scores).toEqual({ [user._id]: 1 });
    expect(out.rows.get("cards")).toEqual([card]);
  });

  test("refuses an export that changed a base row", () => {
    const changed = buildSnapshotZip(tableNumbers, new Map([["cards", [{ ...card, name: "Changed" }]]]));
    expect(() => normalizeExport(readExport(changed), opts)).toThrow(/modified/);
  });

  test("refuses ambiguous insertion order", () => {
    const tie = buildSnapshotZip(
      tableNumbers,
      new Map([
        ["cards", [card]],
        ["users", [{ _id: randomId("users", "x"), _creationTime: 5 }]],
        ["teams", [{ _id: randomId("teams", "x"), _creationTime: 5 }]],
      ]),
    );
    expect(() => normalizeExport(readExport(tie), opts)).toThrow(/_creationTime/);
  });

  test("finds emails outside the reserved domain", () => {
    const zip = writeZip([["users/documents.jsonl", Buffer.from(`{"email":"a@${RESERVED_EMAIL_DOMAIN}"}\n{"email":"someone@example.com"}\n`)]]);
    expect(findNonReservedEmails(zip, RESERVED_EMAIL_DOMAIN)).toEqual(["someone@example.com"]);
  });

  test("assigns fixed numbers first and fills the rest in name order", () => {
    const numbers = assignTableNumbers(["b", "a", "c"], new Map([["c", 10001]]));
    expect([...numbers]).toEqual([
      ["a", 10002],
      ["b", 10003],
      ["c", 10001],
    ]);
  });
});

describe("back faces", () => {
  const id = (n: number) => deterministicConvexId(10008, "test", `card:${n}`);
  const front: SnapshotDoc = { _id: id(1), _creationTime: 1, name: "Front", setCode: "s", backCardId: id(2) };
  const back: SnapshotDoc = { _id: id(2), _creationTime: 2, name: "Back", setCode: "s", isFrontFace: false, frontCardId: id(1), game: "uvs" };
  const pin = { version: 1, url: "https://example.invalid/catalog/v1.json.gz", sha256: "0".repeat(64), updatedAt: 5, cardCount: 1 };
  const reads = (backFaces: SnapshotDoc[]): PublicReads => ({
    sets: [],
    formats: [],
    cardLegality: [{ _id: deterministicConvexId(10020, "test", "legality:0"), _creationTime: 3, formatKey: "standard", cardId: id(2), status: "banned" }],
    setLegality: [],
    backFaces,
    missingBackFaceIds: [],
    facets: { rarities: [], types: [], setCodes: [] },
  });

  test("backFaceIds lists only backs outside the catalog", () => {
    expect(backFaceIds([front, { _id: id(3), _creationTime: 3, backCardId: id(1) }])).toEqual([id(2)]);
  });

  test("the base snapshot holds the back faces and their legality rows", () => {
    const base = buildBaseSnapshot({ pin, cards: [front], reads: reads([back]), idNamespace: "test" });
    expect(base.rows.get("cards")!.map((c) => c._id)).toEqual([id(1), id(2)]);
    expect(base.rows.get("cards")![1].game).toBeUndefined();
    expect(base.rows.get("cardLegality")).toHaveLength(1);
    const without = buildBaseSnapshot({ pin, cards: [front], reads: reads([]), idNamespace: "test" });
    expect(without.droppedLegalityRows).toBe(1);
    const drift = describePublicReadsDrift(
      { sha256: without.publicReadsSha256, parts: without.publicReads },
      { sha256: base.publicReadsSha256, parts: base.publicReads },
    );
    expect(drift).toEqual([
      expect.stringMatching(/^backFaces /),
      expect.stringMatching(/^cardLegality /),
    ]);
  });

  test("refuses a back face that is also a catalog card", () => {
    expect(() => buildBaseSnapshot({ pin, cards: [front], reads: reads([front]), idNamespace: "test" })).toThrow(/also a catalog card/);
  });
});

describe("public reads drift", () => {
  const current = hashPublicReads({ sets: [1], formats: [2] });

  test("is empty when nothing changed or nothing was recorded", () => {
    expect(describePublicReadsDrift({ sha256: current.sha256, parts: current.parts }, current)).toEqual([]);
    expect(describePublicReadsDrift({ sha256: null }, current)).toEqual([]);
  });

  test("names each changed read", () => {
    const before = hashPublicReads({ sets: [1], formats: [3] });
    const [line, ...rest] = describePublicReadsDrift({ sha256: before.sha256, parts: before.parts }, current);
    expect(rest).toEqual([]);
    expect(line).toBe(`formats ${before.parts.formats.slice(0, 12)} -> ${current.parts.formats.slice(0, 12)}`);
  });

  test("checks the per-read hashes even when the combined hash matches", () => {
    const edited = { sha256: current.sha256, parts: { ...current.parts, sets: "0".repeat(64) } };
    expect(describePublicReadsDrift(edited, current)).toEqual([`sets 000000000000 -> ${current.parts.sets.slice(0, 12)}`]);
  });

  test("reports a combined change when the manifest has no per-read hashes", () => {
    expect(describePublicReadsDrift({ sha256: "f".repeat(64) }, current)[0]).toMatch(/no per-read hashes/);
  });
});

describe("pinned catalog", () => {
  const cards = [{ _id: PROD_CARD_ID, _creationTime: 1, name: "Bleeding Internally" }];
  const gz = gzipSync(Buffer.from(JSON.stringify({ schemaVersion: 1, version: 7, cardCount: 1, cards })));
  const manifest = (): Manifest => ({
    ...readManifest(),
    catalog: { version: 7, url: "https://example.invalid/catalog/v7.json.gz", sha256: createHash("sha256").update(gz).digest("hex"), updatedAt: 1, cardCount: 1 },
    golden: null,
  });

  test("serves the verified cached bytes for the pinned URL only", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "seed-catalog-"));
    const m = manifest();
    fs.writeFileSync(catalogCachePath(m.catalog, root), gz);
    expect(pinnedCatalogForUrl(m.catalog.url, m, { root })!.equals(gz)).toBe(true);
    expect(pinnedCatalogForUrl("https://example.invalid/catalog/v6.json.gz", m, { root })).toBeNull();
    expect(parseCatalog(gz, m.catalog)).toEqual(cards);
    expect(() => parseCatalog(gz, { ...m.catalog, version: 8 })).toThrow(/file says v7/);
  });

  test("fails loudly with the re-pin procedure when no verified copy exists", () => {
    const root = fs.mkdtempSync(path.join(os.tmpdir(), "seed-catalog-"));
    const m = manifest();
    const cache = catalogCachePath(m.catalog, root);
    fs.writeFileSync(cache, Buffer.from("tampered"));
    expect(() => readPinnedCatalog(m, { root })).toThrow(/--pin-catalog/);
    expect(fs.existsSync(cache)).toBe(false);
  });
});

describe("public row projection", () => {
  test("drops fields this schema lacks and production user references", () => {
    const dropped = new Set<string>();
    const row = projectRow("sets", { _id: "x", _creationTime: 1, code: "s", name: "S", game: "uvs", updatedBy: "u" }, dropped);
    expect(row).toEqual({ _id: "x", _creationTime: 1, code: "s", name: "S" });
    expect([...dropped].sort()).toEqual(["sets.game", "sets.updatedBy"]);
  });
});
