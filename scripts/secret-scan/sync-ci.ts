/**
 * Copies manifest secrets from a local env file into GitHub Actions secrets of the same names.
 * Values go to `gh secret set` on stdin only; nothing is printed except names.
 *
 *   bun run secret-scan:sync-ci [--env-file .env.local.live-backup] [--repo owner/name] [--dry-run]
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import { loadManifest, parseArgs, parseEnvFile } from "./shared.ts";

const args = parseArgs(process.argv.slice(2));
const envFile = typeof args["env-file"] === "string" ? args["env-file"] : ".env.local.live-backup";
const repoArgs = typeof args.repo === "string" ? ["--repo", args.repo] : [];

if (!fs.existsSync(envFile)) {
  console.error(`Env file not found: ${envFile}`);
  process.exit(2);
}
const values = parseEnvFile(fs.readFileSync(envFile, "utf8"));
const names = loadManifest();
const present = names.filter((name) => values[name]);
const absent = names.filter((name) => !values[name]);

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
if (absent.length > 0) console.log(`not in ${envFile}, left unchanged: ${absent.join(", ")}`);
process.exit(failed > 0 ? 1 : 0);
