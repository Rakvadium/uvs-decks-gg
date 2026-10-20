/**
 * Prepares this agent worktree in one command:
 *
 *   bun run agent:setup --port <P|auto> [--port-range A-B] [--reseed] [--no-install] [--repoint-env-local] [--allow-main]
 *
 * 1. Refuses the main checkout unless --allow-main (git runs without any GIT_* variable).
 * 2. Refuses, leaving every file untouched, when any env file Next.js can load (whatever NODE_ENV
 *    is), or the shell, could point anywhere but a local backend: guard.ts rules, production secret
 *    names, a name allowlist, links, and Next.js's own resolution per mode. NODE_ENV must be unset
 *    or `development`.
 * 3. Claims P in the port registry (keyed by worktree, under its lock) and TCP-probes P and its
 *    Convex ports.
 * 4. Installs: bun install --frozen-lockfile and Playwright chromium, unless --no-install.
 * 5. Writes .env.local from a loopback-only template when there is none, then starts the backend
 *    with `validation:backend start`.
 * 6. Resets the seed with `validation:seed:reset` when its meta is missing or differs, or with --reseed.
 * 7. Smoke test: `vconvex --check` must pass, plus a public read that must return the seed's catalog.
 * 8. Prints a JSON summary on stdout (no secret values); progress goes to stderr.
 *
 * guard.ts needs `convex` from node_modules, and `bun run` has already loaded any `.env*` file in
 * its cwd into this process (Bun 1.3 can't be told not to). So:
 * - Installed worktree: step 2 runs first, then the install, with every name an env file assigns
 *   removed from its env (and the allowlist means `bun install`'s own load of them is harmless).
 * - Fresh worktree: any `.env*` entry is refused before anything runs (builtins only, no
 *   parsing). Without one, Bun loaded nothing, so the install gets the shell's own env. Then a new
 *   process runs everything from step 2 on.
 */
import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  assertLinkedWorktree,
  assertNoEnvFilesBeforeInstall,
  assertShellNodeEnv,
  hasInstalledCli,
  installDependencies,
  parseSetupArgs,
} from "./preflight";

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..");

async function main(argv: string[]): Promise<void> {
  const args = parseSetupArgs(argv);
  assertLinkedWorktree(REPO_ROOT, args.allowMain);
  if (!hasInstalledCli(REPO_ROOT)) {
    if (!args.install) throw new Error("node_modules/convex is missing, so the guard can't run. Rerun without --no-install.");
    assertNoEnvFilesBeforeInstall([REPO_ROOT, process.cwd()]);
    assertShellNodeEnv(process.env);
    console.error("[agent:setup] fresh worktree with no env files: installing first, because the env-file guard needs the installed Convex CLI");
    installDependencies(REPO_ROOT, process.env);
    // Bun keeps the module lookups it made before node_modules existed, so the rest runs in a new
    // process, which starts with the env-file guard.
    const rest = spawnSync(process.execPath, [fileURLToPath(import.meta.url), ...argv, "--no-install"], { cwd: REPO_ROOT, stdio: "inherit" });
    process.exitCode = rest.status ?? 1;
    return;
  }
  // Bun loaded env files from the cwd it was started in; only the worktree root's are checked below.
  if (path.resolve(process.cwd()).toLowerCase() !== REPO_ROOT.toLowerCase()) assertNoEnvFilesBeforeInstall([process.cwd()]);
  const setup = await import("./setup");
  setup.assertEnvFilesLocal(REPO_ROOT);
  if (args.install) installDependencies(REPO_ROOT, setup.installEnv(REPO_ROOT));
  console.log(JSON.stringify(await setup.runSetup(args, REPO_ROOT), null, 2));
}

if (import.meta.main) {
  try {
    await main(process.argv.slice(2));
  } catch (err) {
    console.error(`[agent:setup] FAILED\n${err instanceof Error ? err.message : String(err)}`);
    process.exitCode = 1;
  }
}
