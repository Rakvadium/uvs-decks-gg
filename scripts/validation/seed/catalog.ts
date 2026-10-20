/**
 * The pinned static card catalog, stored next to golden.zip so validation backends never depend on
 * R2 keeping old catalog versions (production keeps only the latest 5).
 *
 * Contract for anything that serves the catalog to the app (the capture tool's `/catalog/` route):
 * - The seeded `cardDataVersion` row keeps production's `catalogUrl` and `catalogSha256`
 *   (manifest.json `catalog.url` / `catalog.sha256`), so the app requests exactly that URL and checks
 *   the bytes against that sha256.
 * - The bytes are `CATALOG_FILE` in the `validation-seed` commit that manifest.json records.
 *   `validation:seed:reset` copies them to `~/.uvs-validation/seed/catalog-<sha12>.json.gz`.
 * - `pinnedCatalogForUrl(url)` returns the verified bytes when `url` is the pinned URL, and null
 *   for any other URL. It reads only that cache and the seed branch, never R2.
 * - Until a server does that, the app's static fetch goes to R2. Once R2 has dropped the version,
 *   the app falls back to Convex sync, and `reset` warns about it.
 */
import fs from "node:fs";
import path from "node:path";
import { gunzipSync } from "node:zlib";
import { defaultValidationRoot } from "../ports";
import { git, gitBlob, gitOk, readManifest, seedWorkDir, sha256, type Manifest } from "./manifest";
import type { CatalogPin } from "./public-data";
import type { SnapshotDoc } from "./snapshot";

/** Name of the catalog file in the `validation-seed` branch tree. */
export const CATALOG_FILE = "catalog.json.gz";

export function catalogCachePath(pin: CatalogPin, root = defaultValidationRoot()): string {
  return path.join(seedWorkDir(root), `catalog-${pin.sha256.slice(0, 12)}.json.gz`);
}

export function rePinHint(pin: CatalogPin): string {
  return (
    `Re-pin: \`bun run validation:seed:build -- --app-port P --pin-catalog\` pins the catalog production serves now, ` +
    `rebuilds the seed and publishes golden.zip and ${CATALOG_FILE} together (catalog v${pin.version} is the current pin).`
  );
}

/** Gunzips a catalog and checks it is the pinned version. The caller checks the sha256. */
export function parseCatalog(gz: Buffer, pin: CatalogPin): SnapshotDoc[] {
  const json = JSON.parse(gunzipSync(gz).toString("utf8")) as { version: number; cardCount: number; cards: SnapshotDoc[] };
  if (json.version !== pin.version || json.cards.length !== pin.cardCount) {
    throw new Error(`catalog v${pin.version}: file says v${json.version} with ${json.cards.length} cards`);
  }
  return json.cards;
}

/**
 * The pinned catalog bytes from the local cache, or else from the seed branch commit in
 * manifest.json (cached afterwards). Throws, with the re-pin procedure, when neither has them.
 */
export function readPinnedCatalog(manifest: Manifest = readManifest(), opts: { root?: string } = {}): { gz: Buffer; source: string; cachePath: string } {
  const pin = manifest.catalog;
  const cachePath = catalogCachePath(pin, opts.root);
  if (fs.existsSync(cachePath)) {
    const gz = fs.readFileSync(cachePath);
    if (sha256(gz) === pin.sha256) return { gz, source: cachePath, cachePath };
    fs.rmSync(cachePath);
  }
  const problems: string[] = [`no verified copy at ${cachePath}`];
  const commit = manifest.golden?.commit;
  if (!commit) {
    problems.push("manifest.json records no validation-seed commit");
  } else {
    const rev = `${commit}:${manifest.golden!.catalogPath ?? CATALOG_FILE}`;
    if (!gitOk(["cat-file", "-e", rev])) git(["fetch", "origin", `refs/heads/${manifest.golden!.branch}`], { allowFail: true });
    if (!gitOk(["cat-file", "-e", rev])) {
      problems.push(`${manifest.golden!.branch}@${commit.slice(0, 12)} has no ${CATALOG_FILE}`);
    } else {
      const gz = gitBlob(rev);
      const actual = sha256(gz);
      if (actual === pin.sha256) {
        fs.writeFileSync(cachePath, gz);
        return { gz, source: `${manifest.golden!.branch}@${commit.slice(0, 12)}:${CATALOG_FILE}`, cachePath };
      }
      problems.push(`${rev} has sha256 ${actual}, the pin is ${pin.sha256}`);
    }
  }
  throw new Error(`pinned catalog v${pin.version} is not available: ${problems.join("; ")}. ${rePinHint(pin)}`);
}

/** The pinned catalog bytes when `url` is the pinned catalog URL, else null. */
export function pinnedCatalogForUrl(url: string, manifest: Manifest = readManifest(), opts: { root?: string } = {}): Buffer | null {
  if (url !== manifest.catalog.url) return null;
  return readPinnedCatalog(manifest, opts).gz;
}

/** Whether R2 still serves the pinned URL. `status` is null when the request itself failed. */
export async function checkCatalogUrl(pin: CatalogPin): Promise<{ ok: boolean; status: number | null }> {
  try {
    const resp = await fetch(pin.url, { method: "HEAD", signal: AbortSignal.timeout(15_000) });
    return { ok: resp.ok, status: resp.status };
  } catch {
    return { ok: false, status: null };
  }
}

/**
 * Catalog bytes for a build: the stored copy when it matches `pin`, else a download from R2
 * (sha256 checked, then cached). Fails with the re-pin procedure when R2 has dropped the version.
 */
export async function loadCatalogForBuild(manifest: Manifest, pin: CatalogPin): Promise<{ gz: Buffer; cards: SnapshotDoc[]; source: string }> {
  let storedProblem = "it is a new pin";
  if (pin.sha256 === manifest.catalog.sha256) {
    try {
      const stored = readPinnedCatalog({ ...manifest, catalog: pin });
      return { gz: stored.gz, cards: parseCatalog(stored.gz, pin), source: stored.source };
    } catch (err) {
      // Not stored yet (first build with this pin); download it below.
      storedProblem = err instanceof Error ? err.message : String(err);
    }
  }
  const resp = await fetch(pin.url, { signal: AbortSignal.timeout(60_000) });
  if (!resp.ok) {
    throw new Error(`catalog v${pin.version}: R2 answers HTTP ${resp.status} for ${pin.url}, and no stored copy was used (${storedProblem}). ${rePinHint(pin)}`);
  }
  const gz = Buffer.from(await resp.arrayBuffer());
  const actual = sha256(gz);
  if (actual !== pin.sha256) throw new Error(`catalog v${pin.version}: sha256 ${actual} does not match the pinned ${pin.sha256}`);
  const cards = parseCatalog(gz, pin);
  fs.writeFileSync(catalogCachePath(pin), gz);
  return { gz, cards, source: pin.url };
}
