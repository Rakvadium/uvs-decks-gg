import fs from "node:fs";
import path from "node:path";
import { buildMatcher, formatHit, scanTarget, type Hit, type Target } from "./match.ts";
import { flagValues, loadManifest, loadSecrets, parseArgs, parseEnvFile } from "./shared.ts";
import { COMMIT_LOCATION, pathTargets, rangeTargets, stagedTargets } from "./sources.ts";

const USAGE = `Usage: bun run secret-scan [--diff <base>..<head>]... [--staged] [--path <dir>]
                           [--env-file <file>]... [--strict] [--ci]

Scans for the values of the env vars in scripts/secret-scan/secrets.json.
Prints VAR_NAME file:line for each hit, never the value.
--strict fails when a required value is missing. --ci also requires ciOnly names, and
implies --strict.
Exit 0 clean, 1 hits, 2 the scan could not run completely (bad usage, no values loaded,
or --strict with a required value missing).`;

const FLAGS = ["diff", "staged", "path", "env-file", "strict", "ci", "help"];
const VALUE_FLAGS = ["diff", "path", "env-file"];

export type RunOptions = {
  env?: Record<string, string | undefined>;
  cwd?: string;
  manifest?: string;
  out?: (line: string) => void;
  err?: (line: string) => void;
};

/** Returns the exit code: 0 clean, 1 hits, 2 incomplete scan. */
export function run(argv: string[], options: RunOptions = {}): number {
  const env = options.env ?? process.env;
  const cwd = options.cwd ?? process.cwd();
  const out = options.out ?? ((line: string) => console.log(line));
  const err = options.err ?? ((line: string) => console.error(line));
  const actions = env.GITHUB_ACTIONS === "true";
  const warn = (message: string) => err(actions ? `::warning title=secret-scan::${message}` : `secret-scan: warning: ${message}`);
  const fail = (message: string) => {
    err(`secret-scan: ${message}`);
    if (actions) err(`::error title=secret-scan::${message}`);
  };

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
      fail(`cannot read --env-file ${file}`);
      return 2;
    }
  }

  // --ci implies --strict: CI must never pass on missing values.
  const strict = Boolean(args.strict || args.ci);
  const manifest = loadManifest(options.manifest);
  const loaded = loadSecrets(manifest.names, envs);
  const ignored = new Set(args.ci ? [] : manifest.ciOnly);
  const secrets = loaded.secrets.filter((s) => !ignored.has(s.name));
  const short = loaded.short.filter((name) => !ignored.has(name));
  const unavailable = [...loaded.missing, ...short].filter((name) => !ignored.has(name));
  const required = unavailable.filter((name) => !manifest.optional.includes(name));
  if (short.length > 0) warn(`value shorter than 8 chars, not checked: ${short.join(", ")}`);
  if (secrets.length === 0) {
    fail("no secret values loaded, nothing to scan. Pass --env-file, or set the values in the environment.");
    return 2;
  }
  if (strict && required.length > 0) fail(`missing required value(s): ${required.join(", ")}`);
  const notChecked = strict ? unavailable.filter((n) => !required.includes(n)) : unavailable;
  if (notChecked.length > 0) warn(`no value, not checked: ${notChecked.join(", ")}`);

  const matcher = buildMatcher(secrets);
  const hits: Hit[] = [];
  let scanned = 0;
  const scan = (targets: Iterable<Target>) => {
    for (const target of targets) {
      scanned++;
      hits.push(...scanTarget(target, matcher));
    }
  };
  try {
    for (const range of flagValues(argv, "diff")) scan(rangeTargets(range, cwd));
    if (args.staged) scan(stagedTargets(cwd));
    if (typeof args.path === "string") scan(pathTargets(args.path, cwd));
  } catch (error) {
    fail((error as Error).message.split("\n")[0]);
    return 2;
  }

  for (const hit of hits) {
    out(formatHit(hit));
    if (actions && hit.location !== COMMIT_LOCATION) {
      out(`::error file=${hit.location},line=${hit.line},title=secret-scan::${hit.name} value found`);
    }
  }
  if (hits.length > 0) {
    err(`secret-scan: ${hits.length} hit(s). Remove the value, and rotate the secret if it was pushed.`);
    return 1;
  }
  if (strict && required.length > 0) return 2;
  out(`secret-scan: clean (${secrets.length} values checked across ${scanned} files and commits)`);
  return 0;
}

function usageProblem(args: Record<string, string | true>): string | undefined {
  const unknown = Object.keys(args).find((key) => !FLAGS.includes(key));
  if (unknown) return `Unknown option: --${unknown}`;
  const bare = VALUE_FLAGS.find((key) => args[key] === true);
  if (bare) return `--${bare} needs a value`;
  const valued = ["staged", "strict", "ci"].find((key) => typeof args[key] === "string");
  if (valued) return `--${valued} takes no value`;
  if (!(args.diff || args.staged || args.path)) return "Pick at least one of --diff, --staged, --path.";
}

if (import.meta.main) process.exit(run(process.argv.slice(2)));
