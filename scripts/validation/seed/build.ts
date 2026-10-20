/**
 * Builds the golden validation seed (maintainer-run, occasionally):
 *
 *   bun run validation:seed:build -- --app-port P [--no-publish] [--pin-catalog] [--strict]
 *                                    [--keep-backend] [--repoint-env-local]
 *
 * 1. Loads the catalog version pinned in manifest.json (sha256 checked) and keeps the cards'
 *    production `_id`s. It comes from the seed branch when stored there, else from the public R2
 *    bucket (see catalog.ts). `--pin-catalog` first re-pins the manifest to the version production
 *    currently serves.
 * 2. Reads sets, formats, legality, facets and the catalog's back faces through public production
 *    queries (no credentials). See UNREADABLE_TABLES in public-data.ts for what can't be read that
 *    way. When those reads differ from the hashes manifest.json recorded, it logs which ones
 *    changed. `--strict` fails instead, before any backend work.
 * 3. Starts the port P validation backend through the guarded wrapper (it must not already be
 *    running), imports those tables with --replace-all, and runs internal.validationSeed.seedFixtures.
 * 4. Exports it, normalizes the export into a byte-deterministic golden zip, checks it for
 *    non-reserved emails, publishes it with the pinned catalog to the orphan `validation-seed`
 *    branch (root vercel.json disables Vercel deployments), and updates manifest.json.
 *
 * Work files go to ~/.uvs-validation/seed/ (per-port build files under build-P/). Prints the golden
 * sha256; two builds of the same pins print the same value.
 */
import fs from "node:fs";
import path from "node:path";
import { RESERVED_EMAIL_DOMAIN } from "../../../convex/validationSeed";
import { start, status, stop } from "../backend";
import { REPO_ROOT, runConvex, runConvexCapture } from "../convex";
import { defaultValidationRoot, resolveAppPort } from "../ports";
import { CATALOG_FILE, catalogCachePath, loadCatalogForBuild } from "./catalog";
import {
  GOLDEN_FILE,
  SEED_BRANCH,
  assertLocalTarget,
  VERCEL_JSON,
  git,
  parseRunOutput,
  readManifest,
  seedWorkDir,
  sha256,
  writeManifest,
  type Manifest,
  type SeedMeta,
} from "./manifest";
import {
  UNREADABLE_TABLES,
  buildBaseSnapshot,
  describePublicReadsDrift,
  fetchPublicReads,
  publicQuery,
  type CatalogPin,
} from "./public-data";
import { buildSnapshotZip, findNonReservedEmails, normalizeExport, readExport } from "./snapshot";

const log = (message: string) => console.error(`[seed] ${message}`);

async function pinCatalog(manifest: Manifest): Promise<CatalogPin> {
  const current = await publicQuery<{ version: number; updatedAt: number; cardCount: number; catalogUrl?: string; catalogSha256?: string }>(
    manifest.publicConvexUrl,
    "cards:getCardDataVersion",
  );
  if (!current.catalogUrl || !current.catalogSha256) throw new Error("production has no static catalog to pin");
  return {
    version: current.version,
    url: current.catalogUrl,
    sha256: current.catalogSha256,
    updatedAt: current.updatedAt,
    cardCount: current.cardCount,
  };
}

async function cli(appPort: number, args: string[]): Promise<void> {
  const code = await runConvex(["--app-port", String(appPort), ...args], { quiet: true });
  if (code !== 0) throw new Error(`vconvex ${args[0]} exited ${code}`);
}

/** Commits golden.zip, the pinned catalog, seed.json and vercel.json as the next commit of the orphan seed branch. */
function publish(golden: Buffer, goldenPath: string, catalogPath: string, seedJson: string): string {
  const remote = git(["ls-remote", "origin", `refs/heads/${SEED_BRANCH}`], { allowFail: true }).split(/\s+/)[0] || null;
  if (remote) git(["fetch", "origin", `refs/heads/${SEED_BRANCH}`]);
  const blob = (args: string[], input?: string) => git(["hash-object", "-w", "--no-filters", ...args], { input });
  const tree = git(["mktree"], {
    input: [
      `100644 blob ${blob([catalogPath])}\t${CATALOG_FILE}`,
      `100644 blob ${blob([goldenPath])}\t${GOLDEN_FILE}`,
      `100644 blob ${blob(["--stdin"], seedJson)}\tseed.json`,
      `100644 blob ${blob(["--stdin"], VERCEL_JSON)}\tvercel.json`,
      "",
    ].join("\n"),
  });
  if (remote && git(["rev-parse", `${remote}^{tree}`]) === tree) {
    log(`${SEED_BRANCH} already holds this seed (${remote})`);
    return remote;
  }
  const message = `Validation seed ${sha256(golden).slice(0, 12)}`;
  const commit = git(["commit-tree", tree, ...(remote ? ["-p", remote] : []), "-m", message]);
  git(["push", "origin", `${commit}:refs/heads/${SEED_BRANCH}`]);
  log(`published ${GOLDEN_FILE} and ${CATALOG_FILE} to ${SEED_BRANCH} at ${commit}`);
  return commit;
}

async function main(argv: string[]) {
  const args = argv[0] === "--" ? argv.slice(1) : argv;
  const flag = (name: string) => {
    const i = args.indexOf(name);
    return i === -1 ? undefined : args[i + 1];
  };
  const appPort = resolveAppPort({ flag: flag("--app-port"), env: process.env, worktree: REPO_ROOT, root: defaultValidationRoot() });
  const manifest = readManifest();
  const seedDir = seedWorkDir();
  const work = path.join(seedDir, `build-${appPort}`);
  fs.mkdirSync(work, { recursive: true });

  const repoint = args.includes("--repoint-env-local");
  assertLocalTarget(appPort, repoint, log);

  const pin = args.includes("--pin-catalog") ? await pinCatalog(manifest) : manifest.catalog;
  if (pin !== manifest.catalog) log(`pinned catalog v${pin.version}`);

  // 1-2. Public reads -> base snapshot.
  const { cards, source: catalogSource } = await loadCatalogForBuild(manifest, pin);
  log(`catalog v${pin.version}: ${cards.length} cards from ${catalogSource} (sha256 verified)`);
  const reads = await fetchPublicReads(manifest.publicConvexUrl, cards);
  const idNamespace = `uvs-validation-seed-v${manifest.seedVersion}`;
  const base = buildBaseSnapshot({ pin, cards, reads, idNamespace });
  log(
    `public reads: ${reads.sets.length} sets, ${reads.formats.length} formats, ${base.rows.get("cardLegality")!.length} card legality rows ` +
      `(${base.droppedLegalityRows} for cards outside the seed dropped), ${reads.setLegality.length} set legality rows, ` +
      `${reads.backFaces.length} back faces`,
  );
  if (reads.missingBackFaceIds.length > 0) {
    log(`WARNING: production returned no row for ${reads.missingBackFaceIds.length} backCardId(s): ${reads.missingBackFaceIds.join(", ")}`);
  }
  if (base.droppedFields.length > 0) log(`dropped fields not in this schema or pointing at production users: ${base.droppedFields.join(", ")}`);
  for (const [table, why] of Object.entries(UNREADABLE_TABLES)) log(`left empty: ${table} (${why})`);

  const drift = describePublicReadsDrift(
    { sha256: manifest.publicReadsSha256, parts: manifest.publicReads },
    { sha256: base.publicReadsSha256, parts: base.publicReads },
  );
  if (drift.length > 0) {
    for (const line of drift) log(`WARNING: public reads changed since the manifest: ${line}`);
    if (args.includes("--strict")) throw new Error(`--strict: production's public reads differ from manifest.json (${drift.length} change(s))`);
  } else if (manifest.publicReadsSha256 !== null) {
    log(`public reads match the manifest (${base.publicReadsSha256.slice(0, 12)})`);
  }

  const baseZip = buildSnapshotZip(base.tableNumbers, base.rows);
  const basePath = path.join(work, "base.zip");
  fs.writeFileSync(basePath, baseZip);
  log(`base snapshot ${basePath} sha256 ${sha256(baseZip)}`);

  // 3. Fresh backend, import, fixtures.
  if ((await status(appPort)).version !== null) {
    throw new Error(`The port ${appPort} backend is already running. Stop it first (validation:backend -- stop --app-port ${appPort}).`);
  }
  const rawPath = path.join(work, "export.zip");
  let meta: SeedMeta;
  try {
    await start(appPort);
    await cli(appPort, ["import", "--replace-all", "-y", basePath]);
    const run = await runConvexCapture(
      ["--app-port", String(appPort), "run", "validationSeed:seedFixtures", JSON.stringify({ seed: manifest.seed, epoch: manifest.epoch })],
      { capture: true, quiet: true },
    );
    if (run.code !== 0) throw new Error(`seedFixtures failed (exit ${run.code})`);
    meta = parseRunOutput<SeedMeta>(run.stdout);
    log(`seedFixtures: sha256 ${meta.sha256}`);
    fs.rmSync(rawPath, { force: true });
    await cli(appPort, ["export", "--path", rawPath]);
  } finally {
    if (!args.includes("--keep-backend")) await stop(appPort);
  }

  // 4. Normalize, check, publish.
  const { zip: golden, fixtureCounts } = normalizeExport(readExport(fs.readFileSync(rawPath)), {
    base: base.rows,
    tableNumbers: base.tableNumbers,
    epoch: manifest.epoch,
    idNamespace,
  });
  const goldenSha = sha256(golden);
  const goldenPath = path.join(seedDir, `golden-${goldenSha.slice(0, 12)}.zip`);
  fs.writeFileSync(goldenPath, golden);
  log(`fixture rows: ${Object.entries(fixtureCounts).map(([t, n]) => `${t}=${n}`).join(", ")}`);
  const leaked = findNonReservedEmails(golden, RESERVED_EMAIL_DOMAIN);
  if (leaked.length > 0) throw new Error(`golden seed contains ${leaked.length} email(s) outside @${RESERVED_EMAIL_DOMAIN}`);
  log(`no email-like strings outside @${RESERVED_EMAIL_DOMAIN}`);

  let commit: string | null = null;
  if (args.includes("--no-publish")) {
    log("--no-publish: left the seed branch and manifest.json unchanged");
  } else {
    const catalog = { ...pin, file: CATALOG_FILE };
    const seedJson = `${JSON.stringify({ meta, golden: { sha256: goldenSha, bytes: golden.length }, catalog }, null, 2)}\n`;
    commit = publish(golden, goldenPath, catalogCachePath(pin), seedJson);
    writeManifest({
      ...manifest,
      catalog: pin,
      publicReadsSha256: base.publicReadsSha256,
      publicReads: base.publicReads,
      meta,
      golden: { branch: SEED_BRANCH, path: GOLDEN_FILE, catalogPath: CATALOG_FILE, sha256: goldenSha, bytes: golden.length, commit },
    });
  }
  console.log(
    JSON.stringify(
      { goldenSha256: goldenSha, bytes: golden.length, goldenPath, meta, publicReadsSha256: base.publicReadsSha256, publicReads: base.publicReads, commit },
      null,
      2,
    ),
  );
}

if (import.meta.main) {
  try {
    await main(process.argv.slice(2));
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  }
}
