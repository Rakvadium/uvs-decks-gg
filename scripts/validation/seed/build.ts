/**
 * Builds the golden validation seed (maintainer-run, occasionally):
 *
 *   bun run validation:seed:build -- --app-port P [--no-publish] [--pin-catalog] [--keep-backend]
 *                                    [--repoint-env-local]
 *
 * 1. Downloads the catalog version pinned in manifest.json from the public R2 bucket (sha256
 *    checked) and keeps the cards' production `_id`s. `--pin-catalog` first re-pins the manifest
 *    to the version production currently serves.
 * 2. Reads sets, formats, legality and facets through public production queries (no credentials).
 *    See UNREADABLE_TABLES in public-data.ts for what can't be read that way.
 * 3. Starts the port P validation backend through the guarded wrapper (it must not already be
 *    running), imports those tables with --replace-all, and runs internal.validationSeed.seedFixtures.
 * 4. Exports it, normalizes the export into a byte-deterministic golden zip, checks it for
 *    non-reserved emails, publishes it to the orphan `validation-seed` branch (root vercel.json
 *    disables Vercel deployments), and updates manifest.json.
 *
 * Work files go to ~/.uvs-validation/seed/. Prints the golden sha256; two builds of the same pins
 * print the same value.
 */
import fs from "node:fs";
import path from "node:path";
import { RESERVED_EMAIL_DOMAIN } from "../../../convex/validationSeed";
import { start, status, stop } from "../backend";
import { REPO_ROOT, runConvex, runConvexCapture } from "../convex";
import { defaultValidationRoot, resolveAppPort } from "../ports";
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
import { UNREADABLE_TABLES, buildBaseSnapshot, fetchCatalog, fetchPublicReads, publicQuery, type CatalogPin } from "./public-data";
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

/** Commits golden.zip, seed.json and vercel.json as the next commit of the orphan seed branch. */
function publish(golden: Buffer, goldenPath: string, seedJson: string): string {
  const remote = git(["ls-remote", "origin", `refs/heads/${SEED_BRANCH}`], { allowFail: true }).split(/\s+/)[0] || null;
  if (remote) git(["fetch", "origin", `refs/heads/${SEED_BRANCH}`]);
  const blob = (args: string[], input?: string) => git(["hash-object", "-w", "--no-filters", ...args], { input });
  const goldenBlob = blob([goldenPath]);
  const tree = git(["mktree"], {
    input: [
      `100644 blob ${goldenBlob}\t${GOLDEN_FILE}`,
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
  log(`published ${GOLDEN_FILE} to ${SEED_BRANCH} at ${commit}`);
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
  const work = seedWorkDir();

  const repoint = args.includes("--repoint-env-local");
  assertLocalTarget(appPort, repoint, log);

  if (args.includes("--pin-catalog")) {
    manifest.catalog = await pinCatalog(manifest);
    log(`pinned catalog v${manifest.catalog.version}`);
  }

  // 1-2. Public reads -> base snapshot.
  const { cards } = await fetchCatalog(manifest.catalog);
  log(`catalog v${manifest.catalog.version}: ${cards.length} cards (sha256 verified)`);
  const reads = await fetchPublicReads(manifest.publicConvexUrl);
  const idNamespace = `uvs-validation-seed-v${manifest.seedVersion}`;
  const base = buildBaseSnapshot({ pin: manifest.catalog, cards, reads, idNamespace });
  log(
    `public reads: ${reads.sets.length} sets, ${reads.formats.length} formats, ${base.rows.get("cardLegality")!.length} card legality rows ` +
      `(${base.droppedLegalityRows} for cards outside the catalog dropped), ${reads.setLegality.length} set legality rows`,
  );
  if (base.droppedFields.length > 0) log(`dropped fields not in this schema or pointing at production users: ${base.droppedFields.join(", ")}`);
  for (const [table, why] of Object.entries(UNREADABLE_TABLES)) log(`left empty: ${table} (${why})`);
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
  const goldenPath = path.join(work, `golden-${goldenSha.slice(0, 12)}.zip`);
  fs.writeFileSync(goldenPath, golden);
  log(`fixture rows: ${Object.entries(fixtureCounts).map(([t, n]) => `${t}=${n}`).join(", ")}`);
  const leaked = findNonReservedEmails(golden, RESERVED_EMAIL_DOMAIN);
  if (leaked.length > 0) throw new Error(`golden seed contains ${leaked.length} email(s) outside @${RESERVED_EMAIL_DOMAIN}`);
  log(`no email-like strings outside @${RESERVED_EMAIL_DOMAIN}`);

  let commit: string | null = null;
  if (args.includes("--no-publish")) {
    log("--no-publish: left the seed branch and manifest.json unchanged");
  } else {
    const seedJson = `${JSON.stringify({ meta, golden: { sha256: goldenSha, bytes: golden.length }, catalog: manifest.catalog }, null, 2)}\n`;
    commit = publish(golden, goldenPath, seedJson);
    writeManifest({
      ...manifest,
      publicReadsSha256: base.publicReadsSha256,
      meta,
      golden: { branch: SEED_BRANCH, path: GOLDEN_FILE, sha256: goldenSha, bytes: golden.length, commit },
    });
  }
  console.log(JSON.stringify({ goldenSha256: goldenSha, bytes: golden.length, goldenPath, meta, publicReadsSha256: base.publicReadsSha256, commit }, null, 2));
}

if (import.meta.main) {
  try {
    await main(process.argv.slice(2));
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  }
}
