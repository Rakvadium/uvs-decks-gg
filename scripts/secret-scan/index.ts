import fs from "node:fs";
import path from "node:path";
import {
  flagValues,
  formatHit,
  loadManifest,
  loadSecrets,
  parseArgs,
  parseEnvFile,
  scanSource,
  type Hit,
  type Source,
} from "./shared.ts";
import { pathSources, rangeSources, stagedSources } from "./sources.ts";

const USAGE = `Usage: bun run secret-scan [--diff <base>..<head>] [--staged] [--path <dir>] [--env-file <file>]...

Scans for the values of the env vars in scripts/secret-scan/secrets.json.
Prints VAR_NAME file:line for each hit, never the value. Exit 1 on any hit.`;

export type RunOptions = {
  env?: Record<string, string | undefined>;
  cwd?: string;
  manifest?: string;
  out?: (line: string) => void;
  err?: (line: string) => void;
};

/** Returns the exit code: 0 clean, 1 hits, 2 usage error. */
export function run(argv: string[], options: RunOptions = {}): number {
  const env = options.env ?? process.env;
  const cwd = options.cwd ?? process.cwd();
  const out = options.out ?? ((line: string) => console.log(line));
  const err = options.err ?? ((line: string) => console.error(line));
  const ci = env.GITHUB_ACTIONS === "true";

  let args: Record<string, string | true>;
  try {
    args = parseArgs(argv);
  } catch (error) {
    err(`${(error as Error).message}\n\n${USAGE}`);
    return 2;
  }
  if (args.help) {
    out(USAGE);
    return 0;
  }
  const problem = usageProblem(args);
  if (problem) {
    err(`${problem}\n\n${USAGE}`);
    return 2;
  }

  const envs: Record<string, string | undefined>[] = [env];
  for (const file of flagValues(argv, "env-file")) {
    try {
      envs.push(parseEnvFile(fs.readFileSync(path.resolve(cwd, file), "utf8")));
    } catch {
      err(`Cannot read --env-file ${file}`);
      return 2;
    }
  }

  const { secrets, missing, short } = loadSecrets(loadManifest(options.manifest), envs);
  const warn = (message: string) => err(ci ? `::warning title=secret-scan::${message}` : `secret-scan: warning: ${message}`);
  if (missing.length > 0) warn(`no value, not checked: ${missing.join(", ")}`);
  if (short.length > 0) warn(`value shorter than 8 chars, not checked: ${short.join(", ")}`);
  if (secrets.length === 0) {
    warn("no secret values available; nothing scanned.");
    return 0;
  }

  const hits: Hit[] = [];
  let scanned = 0;
  const scan = (sources: Iterable<Source>) => {
    for (const source of sources) {
      scanned++;
      hits.push(...scanSource(source, secrets));
    }
  };
  try {
    if (typeof args.diff === "string") scan(rangeSources(args.diff, cwd));
    if (args.staged) scan(stagedSources(cwd));
    if (typeof args.path === "string") scan(pathSources(args.path, cwd));
  } catch (error) {
    err(`secret-scan: ${(error as Error).message.split("\n")[0]}`);
    return 2;
  }

  for (const hit of hits) {
    out(formatHit(hit));
    if (ci && hit.location !== "commit-message") {
      out(`::error file=${hit.location},line=${hit.line},title=secret-scan::${hit.name} value found`);
    }
  }
  if (hits.length > 0) {
    err(`secret-scan: ${hits.length} hit(s). Remove the value, and rotate the secret if it was pushed.`);
    return 1;
  }
  out(`secret-scan: clean (${secrets.length} values checked across ${scanned} sources)`);
  return 0;
}

function usageProblem(args: Record<string, string | true>): string | undefined {
  const unknown = Object.keys(args).find((key) => !["diff", "staged", "path", "env-file"].includes(key));
  if (unknown) return `Unknown option: --${unknown}`;
  const bare = ["diff", "path", "env-file"].find((key) => args[key] === true);
  if (bare) return `--${bare} needs a value`;
  if (!(args.diff || args.staged || args.path)) return "Pick at least one of --diff, --staged, --path.";
}

if (import.meta.main) process.exit(run(process.argv.slice(2)));
