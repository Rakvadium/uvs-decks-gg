import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { scanBuffers, type BufferedFile } from "../secret-scan/index.ts";
import { flagValues } from "../secret-scan/shared.ts";
import { MEDIA_BRANCH, git as realGit, list, parseArgs, rawUrl, repoSlug, requireIssue, requireLabel } from "./shared.ts";

const MEDIA_EXT = /\.(png|gif|webm|md|json)$/;
const MAX_ATTEMPTS = 6;
const FLAGS = ["issue", "labels", "env-file"];
/** The main checkout's env files. Always scanned with when present; required when no `--env-file` is passed. */
export const DEFAULT_ENV_FILES = [".env.local.live-backup", "data/live-env-no-r2.txt"];
// pr-media has no app, so every push would otherwise trigger a failing Vercel preview deployment.
const VERCEL_JSON = '{ "git": { "deploymentEnabled": false } }\n';
/** Scan-only entries (paths, commit message, inflated PNG text) are reported under this prefix; never published. */
const SCAN_ONLY = "_scan-only";
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

export type Git = (args: string[], options?: { input?: string | Buffer; env?: NodeJS.ProcessEnv }) => string;
export type Entry = { rel: string; bytes: Buffer };

/**
 * The env files to scan with: every `--env-file`, plus each of the main checkout's two files that
 * exists (found via `--git-common-dir`). With no `--env-file`, both of those are required, so a
 * missing one fails the scan (exit 2).
 */
export function envFiles(argv: string[], git: Git = realGit): string[] {
  const given = flagValues(argv, "env-file").map((file) => path.resolve(file));
  const common = git(["rev-parse", "--path-format=absolute", "--git-common-dir"]);
  if (path.basename(common) !== ".git") throw new Error("Can't find the main checkout from --git-common-dir");
  const defaults = DEFAULT_ENV_FILES.map((file) => path.join(path.dirname(common), file));
  if (!given.length) return defaults;
  return [...new Set([...defaults.filter((file) => fs.existsSync(file)), ...given])];
}

/** Every zlib stream in `data`, back to back, inflated. Throws on anything left that isn't one. */
function inflateAll(data: Buffer): Buffer[] {
  const out: Buffer[] = [];
  for (let rest = data; rest.length > 0; ) {
    const { buffer, engine } = zlib.inflateSync(rest, { info: true }) as unknown as {
      buffer: Buffer;
      engine: { bytesWritten: number };
    };
    if (!(engine.bytesWritten > 0 && engine.bytesWritten <= rest.length)) throw new Error("zlib stream didn't advance");
    out.push(buffer);
    rest = rest.subarray(engine.bytesWritten);
  }
  return out;
}

/** The inflated compressed chunks of a PNG starting at `start`, parsed to the end of `bytes`. */
function pngText(bytes: Buffer, start: number): Buffer[] {
  const out: Buffer[] = [];
  for (let at = start + PNG_SIGNATURE.length; at < bytes.length; ) {
    if (at + 12 > bytes.length) throw new Error("truncated PNG chunk");
    const length = bytes.readUInt32BE(at);
    const type = bytes.toString("latin1", at + 4, at + 8);
    if (at + 12 + length > bytes.length) throw new Error(`truncated PNG ${type} chunk`);
    const data = bytes.subarray(at + 8, at + 8 + length);
    at += 12 + length;
    const keywordEnd = data.indexOf(0);
    if (type === "zTXt" || type === "iCCP") {
      // keyword (or profile name), NUL, compression method, then zlib data.
      if (keywordEnd === -1) throw new Error(`malformed ${type} chunk`);
      out.push(...inflateAll(data.subarray(keywordEnd + 2)));
    } else if (type === "iTXt") {
      if (keywordEnd === -1) throw new Error("malformed iTXt chunk");
      if (data[keywordEnd + 1] !== 1) continue; // Uncompressed: the raw scan already reads it.
      const language = data.indexOf(0, keywordEnd + 3);
      const translated = language === -1 ? -1 : data.indexOf(0, language + 1);
      if (translated === -1) throw new Error("malformed iTXt chunk");
      out.push(...inflateAll(data.subarray(translated + 1)));
    }
  }
  return out;
}

/**
 * The inflated contents of every compressed PNG text or profile chunk (`zTXt`, `iCCP`, and `iTXt`
 * with compression on) in any PNG inside `bytes`, whatever the file is named: each PNG signature
 * found is parsed from there to the end. Every zlib stream in a chunk is inflated. The scanner reads
 * raw bytes, so a value in one of these would otherwise be invisible. Throws on anything malformed,
 * so publish fails closed.
 */
export function inflatedPngText(bytes: Buffer): Buffer[] {
  const out: Buffer[] = [];
  for (let at = bytes.indexOf(PNG_SIGNATURE); at !== -1; at = bytes.indexOf(PNG_SIGNATURE, at + 1)) {
    out.push(...pngText(bytes, at));
  }
  return out;
}

/**
 * The scanner's input: every entry to publish at its tree path, plus scan-only entries for the tree
 * paths and commit message and for any inflated PNG text. Throws if a PNG can't be parsed.
 */
export function scanSet(entries: Entry[], message: string): BufferedFile[] {
  const files: BufferedFile[] = [];
  for (const { rel, bytes } of entries) {
    files.push({ path: rel, bytes });
    let texts: Buffer[];
    try {
      if (rel.endsWith(".png") && !bytes.subarray(0, PNG_SIGNATURE.length).equals(PNG_SIGNATURE)) throw new Error("a .png that isn't a PNG");
      texts = inflatedPngText(bytes);
    } catch (error) {
      throw new Error(`can't read the PNG text chunks of a file to publish (${(error as Error).message})`);
    }
    texts.forEach((text, i) => files.push({ path: `${SCAN_ONLY}/${rel}.text-${i + 1}.txt`, bytes: text }));
  }
  files.push({
    path: `${SCAN_ONLY}/paths-and-commit-message.txt`,
    bytes: Buffer.from([...entries.map((e) => e.rel), message].join("\n") + "\n"),
  });
  return files;
}

// Errors before the scan never print a label or file name: either could hold the value it would catch.
function collectEntries(issue: string, issueDir: string, labels: string[]): Entry[] {
  const entries: Entry[] = [{ rel: "vercel.json", bytes: Buffer.from(VERCEL_JSON) }];
  let irregular = 0;
  try {
    for (const label of labels) {
      for (const dirent of fs.readdirSync(path.join(issueDir, label), { withFileTypes: true })) {
        if (!MEDIA_EXT.test(dirent.name)) continue;
        // A symlink or folder could point the publish at bytes this tool didn't produce.
        if (!dirent.isFile()) irregular++;
        else entries.push({ rel: `${issue}/${label}/${dirent.name}`, bytes: fs.readFileSync(path.join(issueDir, label, dirent.name)) });
      }
    }
  } catch (error) {
    throw new Error(`Can't read the capture files under .pr-captures/${issue}/ (${(error as NodeJS.ErrnoException).code ?? "error"})`);
  }
  if (irregular) {
    throw new Error(`${irregular} entr${irregular === 1 ? "y" : "ies"} with a media extension under .pr-captures/${issue}/ ${irregular === 1 ? "isn't a regular file" : "aren't regular files"} (a folder or symlink); remove it. Names not printed.`);
  }
  return entries;
}

function refuseBareFlags(argv: string[]) {
  for (const flag of ["--issue", "--labels", "--env-file"]) {
    const bare = argv.some((arg, i) => arg === flag && (argv[i + 1] === undefined || argv[i + 1].startsWith("--")));
    if (bare || argv.includes(`${flag}=`)) throw new Error(`${flag} needs a value`);
  }
}

/** Builds a commit with a throwaway index file, so no checkout or working tree is touched. */
function buildCommit(git: Git, parent: string | null, issue: string, labels: string[], indexInfo: string, message: string): string | null {
  const indexFile = path.join(os.tmpdir(), `pr-capture-index-${process.pid}-${Date.now()}`);
  const env = { ...process.env, GIT_INDEX_FILE: indexFile };
  const run = (cmd: string[], input?: string) => git(cmd, { input, env });
  try {
    run(parent ? ["read-tree", parent] : ["read-tree", "--empty"]);
    for (const label of labels) run(["rm", "--cached", "-r", "-f", "-q", "--ignore-unmatch", "--", `${issue}/${label}`]);
    run(["update-index", "--add", "--index-info"], indexInfo);
    const tree = run(["write-tree"]);
    if (parent && tree === git(["rev-parse", `${parent}^{tree}`])) return null;
    return git(parent ? ["commit-tree", tree, "-p", parent, "-m", message] : ["commit-tree", tree, "-m", message]);
  } finally {
    fs.rmSync(indexFile, { force: true });
  }
}

/**
 * `capture:publish`. Returns the exit code. `cwd` holds `.pr-captures/`; `git` runs every git
 * command (tests pass a stand-in).
 */
export async function publish(argv: string[], options: { cwd?: string; git?: Git } = {}): Promise<number> {
  const git = options.git ?? realGit;
  const outputRoot = path.join(options.cwd ?? process.cwd(), ".pr-captures");
  refuseBareFlags(argv);
  const args = parseArgs(argv);
  const unknown = Object.keys(args).find((key) => !FLAGS.includes(key));
  if (unknown) throw new Error(`Unknown option: --${unknown}`);
  const issue = requireIssue(args);
  const issueDir = path.join(outputRoot, issue);
  if (!fs.existsSync(issueDir)) throw new Error(`Nothing to publish: ${issueDir} does not exist`);
  const envFileList = envFiles(argv, git);

  const labels = [...new Set(list(
    args.labels,
    fs.readdirSync(issueDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name),
  ))].map((label) => requireLabel(label, "--labels"));
  // On a case-insensitive disk `Foo` and `foo` are one folder; publishing it twice helps no one.
  if (new Set(labels.map((label) => label.toLowerCase())).size !== labels.length) throw new Error("--labels has labels that differ only by case");
  const missing = labels.filter((label) => !fs.statSync(path.join(issueDir, label), { throwIfNoEntry: false })?.isDirectory()).length;
  if (missing) throw new Error(`${missing} of the --labels ${missing === 1 ? "isn't a folder" : "aren't folders"} under .pr-captures/${issue}/. Names not printed.`);
  const entries = collectEntries(issue, issueDir, labels);
  const files = entries.slice(1);
  if (!files.length) throw new Error(`No media under .pr-captures/${issue}/ for the ${labels.length} label(s)`);
  const message = `media: #${issue} ${labels.join(", ")}`;

  // The scan reads the exact bytes that become blobs below, in memory (no folder walk can skip a
  // label), and runs before any git write.
  let scan: number;
  try {
    scan = scanBuffers(scanSet(entries, message), { envFiles: envFileList, strict: true });
  } catch (error) {
    console.error(`publish: ${(error as Error).message}`);
    scan = 2;
  }
  if (scan !== 0) {
    console.error(
      `publish: aborted, secret-scan --strict exited ${scan}${scan === 2 ? " (the scan couldn't run completely)" : ""}. ` +
        `Nothing was written to git or pushed to ${MEDIA_BRANCH}.`,
    );
    return 1;
  }

  const indexInfo = entries.map(({ rel, bytes }) => `100644 ${git(["hash-object", "-w", "--stdin"], { input: bytes })}\t${rel}`).join("\n") + "\n";
  for (let attempt = 1; ; attempt++) {
    const line = git(["ls-remote", "origin", `refs/heads/${MEDIA_BRANCH}`]);
    const parent = line ? line.split(/\s+/)[0] : null;
    if (parent) git(["fetch", "--no-write-fetch-head", "--quiet", "origin", parent]);
    const commit = buildCommit(git, parent, issue, labels, indexInfo, message);
    if (!commit) {
      console.log(`${MEDIA_BRANCH} already has this media; nothing to push.`);
      break;
    }
    try {
      git(["push", "--quiet", "origin", `${commit}:refs/heads/${MEDIA_BRANCH}`]);
      console.log(`Pushed ${files.length} files to ${MEDIA_BRANCH} (${commit.slice(0, 8)}${parent ? "" : ", new orphan branch"}).`);
      break;
    } catch (error) {
      const stderr = String((error as { stderr?: string }).stderr ?? error);
      const raced = /rejected|non-fast-forward|fetch first|stale info|cannot lock ref/i.test(stderr);
      if (!raced || attempt >= MAX_ATTEMPTS) throw new Error(`git push failed: ${stderr}`);
      const wait = 500 * attempt + Math.floor(Math.random() * 1000);
      console.log(`Push rejected (another agent published first); retrying in ${wait}ms…`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }

  console.log(`Base URL: ${rawUrl(repoSlug(git(["remote", "get-url", "origin"])), `${issue}/`)}`);
  for (const label of labels) {
    const summary = path.join(issueDir, label, "summary.md");
    if (fs.existsSync(summary)) console.log(`Paste into the PR body: ${summary}`);
  }
  return 0;
}

if (import.meta.main) {
  let code: number;
  try {
    code = await publish(process.argv.slice(2));
  } catch (error) {
    console.error(`publish: ${(error as Error).message}`);
    code = 1;
  }
  process.exit(code);
}
