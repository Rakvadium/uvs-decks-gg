/**
 * Copies manifest secrets from local env files into GitHub Actions secrets of the same names.
 * Values go to `gh secret set` on stdin only; nothing is printed except names.
 *
 *   bun run secret-scan:sync-ci [--env-file <file>]... [--repo owner/name] [--dry-run]
 *
 * Without --env-file, reads .env.local.live-backup and data/live-env-no-r2.txt.
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { flagValues, loadManifest, parseArgs, parseEnvFile } from "./shared.ts";

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

/** Later files win; a name whose value differs between files is reported by name. */
const values: Record<string, string> = {};
const conflicts = new Set<string>();
for (const file of envFiles) {
  for (const [name, value] of Object.entries(parseEnvFile(fs.readFileSync(file, "utf8")))) {
    if (!value) continue;
    if (values[name] !== undefined && values[name] !== value) conflicts.add(name);
    values[name] = value;
  }
}

const names = loadManifest();
const present = names.filter((name) => values[name]);
const absent = names.filter((name) => !values[name]);
const clashing = present.filter((name) => conflicts.has(name));
if (clashing.length > 0) {
  console.warn(`warning: value differs between env files, using the last file's: ${clashing.join(", ")}`);
}

let failed = 0;
for (const name of present) {
  if (args["dry-run"]) {
    console.log(`would set ${name}`);
    continue;
  }
  const result = spawnSync("gh", ["secret", "set", name, ...repoArgs], {
    input: values[name],
    stdio: ["pipe", "ignore", "inherit"],
  });
  if (result.status === 0) console.log(`set ${name}`);
  else {
    failed++;
    console.error(`failed ${name}`);
  }
}
if (absent.length > 0) console.log(`not in any env file, left unchanged: ${absent.join(", ")}`);
process.exit(failed > 0 ? 1 : 0);
