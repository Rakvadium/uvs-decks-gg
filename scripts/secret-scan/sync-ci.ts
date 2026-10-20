/**
 * Copies manifest secrets from local env files into GitHub Actions secrets of the same names.
 * Values go to `gh secret set` on stdin only; nothing is printed except names.
 *
 *   bun run secret-scan:sync-ci [--env-file <file>]... [--repo owner/name] [--dry-run]
 *
 * Without --env-file, reads .env.local.live-backup and data/live-env-no-r2.txt. When files hold
 * different values for one name, every distinct value is stored, joined by VALUE_SEPARATOR, and
 * the scanner splits them again. ciOnly names (the canary) are set by hand; see the README.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { flagValues, loadManifest, parseArgs, parseEnvFile, splitValues, VALUE_SEPARATOR } from "./shared.ts";

const DEFAULT_ENV_FILES = [".env.local.live-backup", "data/live-env-no-r2.txt"];

const argv = process.argv.slice(2);
const args = parseArgs(argv);
const given = flagValues(argv, "env-file");
const envFiles = given.length > 0 ? given : DEFAULT_ENV_FILES;
const repoArgs = typeof args.repo === "string" ? ["--repo", args.repo] : [];

const unreadable = envFiles.filter((file) => !fs.existsSync(file));
if (unreadable.length > 0) {
  console.error(`Env file not found: ${unreadable.join(", ")} (pass --env-file with full paths from a worktree)`);
  process.exit(2);
}

const envs = envFiles.map((file) => parseEnvFile(fs.readFileSync(file, "utf8")));
const manifest = loadManifest();
const names = manifest.names.filter((name) => !manifest.ciOnly.includes(name));
const values = new Map(names.map((name) => [name, [...new Set(envs.flatMap((env) => splitValues(env[name])))]]));
const present = names.filter((name) => values.get(name)!.length > 0);
const absent = names.filter((name) => values.get(name)!.length === 0);

let failed = 0;
for (const name of present) {
  const distinct = values.get(name)!;
  const label = distinct.length > 1 ? `${name} (${distinct.length} distinct values)` : name;
  if (args["dry-run"]) {
    console.log(`would set ${label}`);
    continue;
  }
  const result = spawnSync("gh", ["secret", "set", name, ...repoArgs], {
    input: distinct.join(VALUE_SEPARATOR),
    stdio: ["pipe", "ignore", "inherit"],
  });
  if (result.status === 0) console.log(`set ${label}`);
  else {
    failed++;
    console.error(`failed ${name}`);
  }
}
if (absent.length > 0) console.log(`not in any env file, left unchanged: ${absent.join(", ")}`);
process.exit(failed > 0 ? 1 : 0);
