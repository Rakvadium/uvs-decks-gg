/**
 * Resets this worktree's validation backend to the golden seed:
 *
 *   bun run validation:seed:reset [-- --app-port P] [--zip path] [--repoint-env-local]
 *
 * Takes golden.zip from the `validation-seed` branch commit recorded in manifest.json (or `--zip`),
 * checks its sha256 against the manifest, imports it with `vconvex import --replace-all`, then
 * checks that the backend's validationSeedMeta row matches the manifest. The backend must already
 * be running (`validation:backend -- start`).
 */
import fs from "node:fs";
import path from "node:path";
import { status } from "../backend";
import { REPO_ROOT, runConvex, runConvexCapture } from "../convex";
import { defaultValidationRoot, resolveAppPort } from "../ports";
import { GOLDEN_FILE, assertLocalTarget, git, gitBlob, gitOk, parseRunOutput, readManifest, seedWorkDir, sha256, type SeedMeta } from "./manifest";

const log = (message: string) => console.error(`[seed] ${message}`);

function loadGolden(zipFlag: string | undefined): { zip: Buffer; source: string } {
  const manifest = readManifest();
  if (!manifest.golden || !manifest.meta) throw new Error("manifest.json has no golden seed yet; run validation:seed:build first");
  if (zipFlag) return { zip: fs.readFileSync(zipFlag), source: zipFlag };
  const cached = path.join(seedWorkDir(), `golden-${manifest.golden.sha256.slice(0, 12)}.zip`);
  if (fs.existsSync(cached)) return { zip: fs.readFileSync(cached), source: cached };
  if (!manifest.golden.commit) throw new Error("manifest.json records no seed branch commit");
  const rev = `${manifest.golden.commit}:${manifest.golden.path}`;
  if (!gitOk(["cat-file", "-e", rev])) git(["fetch", "origin", `refs/heads/${manifest.golden.branch}`]);
  const zip = gitBlob(rev);
  fs.writeFileSync(cached, zip);
  return { zip, source: `${manifest.golden.branch}@${manifest.golden.commit.slice(0, 12)}:${GOLDEN_FILE}` };
}

export async function reset(appPort: number, opts: { zip?: string; repointEnvLocal?: boolean } = {}): Promise<SeedMeta> {
  const manifest = readManifest();
  assertLocalTarget(appPort, opts.repointEnvLocal ?? false, log);
  if ((await status(appPort)).version === null) {
    throw new Error(`The port ${appPort} backend is not running. Start it with validation:backend -- start --app-port ${appPort}.`);
  }

  const { zip, source } = loadGolden(opts.zip);
  const actual = sha256(zip);
  if (actual !== manifest.golden!.sha256) {
    throw new Error(`golden seed ${source} has sha256 ${actual}, manifest.json expects ${manifest.golden!.sha256}`);
  }
  const file = path.join(seedWorkDir(), `golden-${actual.slice(0, 12)}.zip`);
  if (!fs.existsSync(file)) fs.writeFileSync(file, zip);
  log(`importing ${source} (sha256 ${actual}) into the port ${appPort} backend`);

  const code = await runConvex(["--app-port", String(appPort), "import", "--replace-all", "-y", file], { quiet: true });
  if (code !== 0) throw new Error(`vconvex import exited ${code}`);

  const run = await runConvexCapture(["--app-port", String(appPort), "run", "validationSeed:getSeedMeta"], { capture: true, quiet: true });
  if (run.code !== 0) throw new Error(`reading validationSeedMeta failed (exit ${run.code})`);
  const meta = parseRunOutput<SeedMeta | null>(run.stdout);
  const expected = manifest.meta!;
  if (
    !meta ||
    meta.seedVersion !== expected.seedVersion ||
    meta.catalogVersion !== expected.catalogVersion ||
    meta.sha256 !== expected.sha256
  ) {
    throw new Error(`validationSeedMeta ${JSON.stringify(meta)} does not match manifest.json ${JSON.stringify(expected)}`);
  }
  log(`port ${appPort} backend reset to seed v${meta.seedVersion} (catalog v${meta.catalogVersion}, sha256 ${meta.sha256})`);
  return meta;
}

if (import.meta.main) {
  const args = process.argv.slice(2);
  const flag = (name: string) => {
    const i = args.indexOf(name);
    return i === -1 ? undefined : args[i + 1];
  };
  try {
    const appPort = resolveAppPort({
      flag: flag("--app-port") ?? flag("--port"),
      env: process.env,
      worktree: REPO_ROOT,
      root: defaultValidationRoot(),
    });
    console.log(JSON.stringify(await reset(appPort, { zip: flag("--zip"), repointEnvLocal: args.includes("--repoint-env-local") }), null, 2));
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  }
}
