import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { envFiles } from "../pr-capture/publish.ts";
import { scanBuffers, type BufferedFile } from "../secret-scan/index.ts";
import { FILL, has, parseGh, textSource, toArgs, withSource, SUPPORTED, type Parsed } from "./forms.ts";

const USAGE = `Usage: bun run gh-post -- [--env-file <file>]... <gh args>

Secret-scans the text a gh command would post, with secret-scan --strict, and runs gh only when
the scan is clean. The main checkout's .env.local.live-backup and data/live-env-no-r2.txt are always
used when they exist, and both are required when no --env-file is passed.

Supported: ${SUPPORTED.map((name) => `gh ${name}`).join(", ")}.
Scanned: every argument (title, body, labels, -f fields...), --body-file / -F and api --input files,
"-" (stdin), api -F key=@file and key=@-, and for pr create --fill / --fill-first / --fill-verbose
every commit between --base and HEAD plus the branch name.
Refused: other gh commands, unknown flags, combined or attached short flags (-db, -bvalue),
--editor, --web, --template, --recover, --fill without --base or with --head, comments and creates
without a body (gh would prompt), edits with no edit flag, and more than one read from stdin.

gh gets the scanned bytes: files and stdin are copied to a temp folder and gh reads the copies.
Exit: gh's exit code once posted; 1 a secret was found; 2 refused, or the scan couldn't run.`;

type Options = {
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  stdin?: () => Buffer;
  out?: (line: string) => void;
  err?: (line: string) => void;
};

/** Splits off gh-post's own flags (`--env-file`), before the gh args. */
function splitArgs(argv: string[]): { envArgs: string[]; gh: string[] } | string {
  const args = argv[0] === "--" ? argv.slice(1) : argv;
  const envArgs: string[] = [];
  let i = 0;
  for (; i < args.length; i++) {
    const arg = args[i];
    if (arg === "--") {
      i++;
      break;
    }
    if (arg.startsWith("--env-file=")) {
      if (arg === "--env-file=") return "--env-file needs a value";
      envArgs.push("--env-file", arg.slice("--env-file=".length));
    } else if (arg === "--env-file") {
      const value = args[i + 1];
      if (value === undefined || value.startsWith("-")) return "--env-file needs a value";
      envArgs.push("--env-file", value);
      i++;
    } else break;
  }
  return { envArgs, gh: args.slice(i) };
}

function git(args: string[], cwd: string, input?: string): Buffer {
  return execFileSync("git", args, { cwd, input, stdio: ["pipe", "pipe", "pipe"], maxBuffer: 1024 * 1024 * 1024 });
}

/** The refs git could resolve `name` to (`refs/<name>`, a tag, a branch, a remote's HEAD). */
const refsFor = (refs: string[], name: string) =>
  refs.filter((ref) => [name, `tags/${name}`, `heads/${name}`, `remotes/${name}`, `remotes/${name}/HEAD`].some((r) => ref === `refs/${r}`));

/**
 * Every commit `gh pr create --fill*` could take its title and body from, as raw commit objects,
 * plus the branch name (gh's title when there are several commits). gh logs `<base remote>/<base>`
 * (or plain `<base>`) to the current branch, so the union over every ref either name could resolve
 * to is a superset.
 */
function fillTexts(base: string, cwd: string): BufferedFile[] | string {
  const refs = git(["for-each-ref", "--format=%(refname)"], cwd).toString("utf8").split("\n").filter(Boolean);
  const bases = [...refsFor(refs, base), ...refs.filter((ref) => ref.startsWith("refs/remotes/") && ref.endsWith(`/${base}`))];
  if (!bases.length) return `--fill: no branch or remote-tracking branch named ${base} (the --base); fetch it first`;
  let branch: string;
  try {
    branch = git(["symbolic-ref", "--short", "HEAD"], cwd).toString("utf8").trim();
  } catch {
    return "--fill needs a checked-out branch (HEAD is detached)";
  }
  const heads = ["HEAD", ...refsFor(refs, branch)];
  const shas = new Set<string>();
  for (const ref of new Set(bases)) {
    for (const sha of git(["rev-list", ...heads, "--not", ref], cwd).toString("utf8").split("\n")) if (sha) shas.add(sha);
  }
  const files: BufferedFile[] = [{ path: "branch", bytes: Buffer.from(branch) }];
  if (!shas.size) return files;
  const out = git(["cat-file", "--batch"], cwd, `${[...shas].join("\n")}\n`);
  for (let at = 0; at < out.length; ) {
    const newline = out.indexOf(0x0a, at);
    const [sha, type, size] = out.subarray(at, newline).toString("latin1").split(" ");
    if (type !== "commit") throw new Error(`git cat-file: ${sha} is ${type}, not a commit`);
    at = newline + 1;
    files.push({ path: `commit-${sha.slice(0, 12)}`, bytes: out.subarray(at, at + Number(size)) });
    at += Number(size) + 1;
  }
  if (files.length !== shas.size + 1) throw new Error("git cat-file returned the wrong number of commits");
  return files;
}

/** gh-post. Returns the exit code. */
export function ghPost(argv: string[], options: Options = {}): number {
  const cwd = options.cwd ?? process.cwd();
  const env = options.env ?? process.env;
  const out = options.out ?? ((line: string) => console.log(line));
  const err = options.err ?? ((line: string) => console.error(line));
  const readStdin = options.stdin ?? (() => fs.readFileSync(0));

  const help = argv[0] === "--" ? argv.slice(1) : argv;
  if (help.length === 1 && (help[0] === "--help" || help[0] === "-h")) {
    out(USAGE);
    return 0;
  }
  const split = splitArgs(argv);
  if (typeof split === "string") {
    err(`gh-post: ${split}\n\n${USAGE}`);
    return 2;
  }
  if (split.gh[0] === "gh") split.gh.shift();

  // Every argument is scanned, so refusal messages (which may quote an argument) print only after
  // a clean scan.
  const files: BufferedFile[] = [{ path: "args", bytes: Buffer.from(split.gh.join("\n")) }];
  const parsed = parseGh(split.gh);
  let refusal = typeof parsed === "string" ? parsed : undefined;
  const sources = new Map<number, Buffer>();
  if (typeof parsed !== "string") {
    let stdinReads = 0;
    parsed.flags.forEach((entry, index) => {
      const source = textSource(entry);
      if (source === undefined || refusal) return;
      if (source === "-") {
        if (++stdinReads > 1) refusal = "only one argument can read from stdin (-)";
        else {
          try {
            sources.set(index, readStdin());
          } catch {
            refusal = "couldn't read stdin";
          }
        }
      } else {
        try {
          sources.set(index, fs.readFileSync(path.resolve(cwd, source)));
        } catch {
          refusal = `can't read the --${entry.flag.long} file ${source}`;
        }
      }
      const bytes = sources.get(index);
      if (bytes) files.push({ path: `${source === "-" ? "stdin" : entry.flag.long}-${index}`, bytes });
    });
    const base = parsed.flags.find((entry) => entry.flag.long === "base")?.value;
    if (!refusal && FILL.some((name) => has(parsed, name)) && base !== undefined) {
      try {
        const commits = fillTexts(base, cwd);
        if (typeof commits === "string") refusal = commits;
        else files.push(...commits);
      } catch (error) {
        refusal = `git failed reading the commits for --fill: ${(error as Error).message.split("\n")[0]}`;
      }
    }
  }

  let scan: number;
  try {
    const envArgs = envFiles(split.envArgs, (args) => git(args, cwd).toString("utf8").trim());
    scan = scanBuffers(files, { envFiles: envArgs, strict: true }, { env, cwd, out, err });
  } catch (error) {
    err(`gh-post: ${(error as Error).message.split("\n")[0]}`);
    scan = 2;
  }
  if (scan !== 0) {
    err(`gh-post: not posted, secret-scan --strict exited ${scan}${scan === 2 ? " (the scan couldn't run completely)" : ""}.`);
    return scan === 1 ? 1 : 2;
  }
  if (refusal !== undefined || typeof parsed === "string") {
    err(`gh-post: refused, nothing posted: ${refusal}\nRun bun run gh-post -- --help for what is scanned.`);
    return 2;
  }
  return runGh(parsed, sources, env, err);
}

/** Runs gh with an argument list (no shell). Files and stdin go to gh as temp copies of the scanned bytes. */
function runGh(parsed: Parsed, sources: Map<number, Buffer>, env: NodeJS.ProcessEnv, err: (line: string) => void): number {
  const gh = Bun.which("gh", { PATH: env.PATH ?? env.Path ?? "" });
  if (!gh) {
    err("gh-post: gh not found on PATH, nothing posted");
    return 2;
  }
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "gh-post-"));
  try {
    const replaced = new Map<number, string>();
    for (const [index, bytes] of sources) {
      const file = path.join(temp, `text-${index}`);
      fs.writeFileSync(file, bytes, { mode: 0o600 });
      replaced.set(index, withSource(parsed.flags[index], file));
    }
    // stdin is closed and prompts are off, so gh can't ask for text gh-post never saw.
    const result = spawnSync(gh, toArgs(parsed, (index) => replaced.get(index)), {
      stdio: ["ignore", "inherit", "inherit"],
      env: { ...env, GH_PROMPT_DISABLED: "1" },
    });
    if (result.error) {
      err(`gh-post: couldn't run gh: ${result.error.message}`);
      return 2;
    }
    if (result.status !== 0) err(`gh-post: gh exited ${result.status ?? result.signal}`);
    return result.status ?? 2;
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
}

if (import.meta.main) {
  let code: number;
  try {
    code = ghPost(process.argv.slice(2));
  } catch (error) {
    console.error(`gh-post: ${(error as Error).message.split("\n")[0]}. Nothing posted.`);
    code = 2;
  }
  process.exit(code);
}
