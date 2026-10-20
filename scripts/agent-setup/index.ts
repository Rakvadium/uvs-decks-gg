/**
 * Prepares this agent worktree in one command:
 *
 *   bun run agent:setup --port <P|auto> [--port-range A-B] [--reseed] [--no-install] [--repoint-env-local] [--allow-main]
 *
 * 1. Refuses the main checkout unless --allow-main.
 * 2. Refuses, leaving the file untouched, when .env.local/.env could point anywhere but a local
 *    backend (guard.ts rules plus production secret names).
 * 3. Claims P in the port registry (keyed by worktree, under its lock) and TCP-probes P and its
 *    Convex ports.
 * 4. Installs: bun install --frozen-lockfile and Playwright chromium, unless --no-install.
 * 5. Writes .env.local from a loopback-only template when there is none, then starts the backend
 *    with `validation:backend start`.
 * 6. Resets the seed with `validation:seed:reset` when its meta is missing or differs, or with --reseed.
 * 7. Smoke test: `vconvex --check` must pass, plus a public read that must return the seed's catalog.
 * 8. Prints a JSON summary on stdout (no secret values); progress goes to stderr.
 *
 * guard.ts needs `convex` from node_modules. When it is installed, step 2 runs before the install.
 * In a fresh worktree the install runs first, then a new process runs everything from step 2 on,
 * so nothing reads env files for Convex or calls Convex before the guard has run.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { assertLinkedWorktree, hasInstalledCli, installDependencies, parseSetupArgs } from "./preflight";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

async function main(argv: string[]): Promise<void> {
  const args = parseSetupArgs(argv);
  assertLinkedWorktree(REPO_ROOT, args.allowMain);
  if (!hasInstalledCli(REPO_ROOT)) {
    if (!args.install) throw new Error("node_modules/convex is missing, so the guard can't run. Rerun without --no-install.");
    console.error("[agent:setup] fresh worktree: installing first, because the env-file guard needs the installed Convex CLI");
    installDependencies(REPO_ROOT);
    // Bun keeps the module lookups it made before node_modules existed, so the rest runs in a new
    // process, which starts with the env-file guard.
    const rest = spawnSync(process.execPath, [fileURLToPath(import.meta.url), ...argv, "--no-install"], { cwd: REPO_ROOT, stdio: "inherit" });
    process.exitCode = rest.status ?? 1;
    return;
  }
  (await import("./setup")).assertEnvFilesLocal(REPO_ROOT);
  if (args.install) installDependencies(REPO_ROOT);
  const { runSetup } = await import("./setup");
  console.log(JSON.stringify(await runSetup(args, REPO_ROOT), null, 2));
}

if (import.meta.main) {
  try {
    await main(process.argv.slice(2));
  } catch (err) {
    console.error(`[agent:setup] FAILED\n${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
  }
}
