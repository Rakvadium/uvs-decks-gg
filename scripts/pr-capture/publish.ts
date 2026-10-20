import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import zlib from "node:zlib";
import { run as secretScan } from "../secret-scan/index.ts";
import { flagValues } from "../secret-scan/shared.ts";
import { MEDIA_BRANCH, OUTPUT_ROOT, git, list, parseArgs, rawUrl, repoSlug, requireIssue, requireLabel } from "./shared.ts";

const MEDIA_EXT = /\.(png|gif|webm|md|json)$/;
const MAX_ATTEMPTS = 6;
const FLAGS = ["issue", "labels", "env-file"];
/** The main checkout's env files, used when no `--env-file` is passed. */
export const DEFAULT_ENV_FILES = [".env.local.live-backup", "data/live-env-no-r2.txt"];
// pr-media has no app, so every push would otherwise trigger a failing Vercel preview deployment.
const VERCEL_JSON = '{ "git": { "deploymentEnabled": false } }\n';
/** Scan-only files (paths, commit message, inflated PNG text) live here in the scan dir, never in the tree. */
const SCAN_ONLY_DIR = "_scan-only";

export type Entry = { rel: string; bytes: Buffer };

/** The env files to scan with: every `--env-file`, else the main checkout's two (via `--git-common-dir`). */
export function envFiles(argv: string[]): string[] {
  const given = flagValues(argv, "env-file");
  if (given.some((file) => !file)) throw new Error("--env-file needs a path");
  if (given.length) return given.map((file) => path.resolve(file));
  const common = git(["rev-parse", "--path-format=absolute", "--git-common-dir"]);
  if (path.basename(common) !== ".git") {
    throw new Error(`Can't find the main checkout from ${common}; pass --env-file for each env file`);
  }
  const main = path.dirname(common);
  return DEFAULT_ENV_FILES.map((file) => path.join(main, file));
}

/**
 * The text of every compressed PNG text chunk (`zTXt`, and `iTXt` with its compression flag set),
 * inflated. The scanner reads raw bytes, so a value in one of these would otherwise be invisible.
 * Throws on a malformed chunk or one that won't inflate, so publish fails closed.
 */
export function inflatedPngText(bytes: Buffer): Buffer[] {
  const SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (!bytes.subarray(0, 8).equals(SIGNATURE)) throw new Error("not a PNG");
  const out: Buffer[] = [];
  for (let at = 8; at < bytes.length; ) {
    if (at + 12 > bytes.length) throw new Error("truncated PNG chunk");
    const length = bytes.readUInt32BE(at);
    const type = bytes.toString("latin1", at + 4, at + 8);
    const data = bytes.subarray(at + 8, at + 8 + length);
    if (data.length !== length || at + 12 + length > bytes.length) throw new Error(`truncated PNG ${type} chunk`);
    at += 12 + length;
    const keywordEnd = data.indexOf(0);
    if (type === "zTXt") {
      if (keywordEnd === -1) throw new Error("malformed zTXt chunk");
      out.push(zlib.inflateSync(data.subarray(keywordEnd + 2)));
    } else if (type === "iTXt") {
      if (keywordEnd === -1) throw new Error("malformed iTXt chunk");
      if (data[keywordEnd + 1] !== 1) continue; // Uncompressed: the raw scan already reads it.
      const language = data.indexOf(0, keywordEnd + 3);
      const translated = language === -1 ? -1 : data.indexOf(0, language + 1);
      if (translated === -1) throw new Error("malformed iTXt chunk");
      out.push(zlib.inflateSync(data.subarray(translated + 1)));
    }
  }
  return out;
}

/**
 * Writes exactly `entries` (plus the tree paths and commit message, and any inflated PNG text, as
 * scan-only files) to a fresh temp dir and runs `secret-scan --strict --path` on it in-process.
 * Returns the scanner's exit code: 0 clean, 1 hits, 2 the scan couldn't run completely.
 */
export function scanEntries(entries: Entry[], message: string, envFileList: string[]): number {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pr-capture-publish-scan-"));
  try {
    const write = (rel: string, bytes: Buffer | string) => {
      const file = path.join(dir, ...rel.split("/"));
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, bytes, { flag: "wx" });
    };
    for (const { rel, bytes } of entries) {
      write(rel, bytes);
      if (!rel.endsWith(".png")) continue;
      let texts: Buffer[];
      try {
        texts = inflatedPngText(bytes);
      } catch (error) {
        console.error(`publish: can't read the text chunks of ${rel}: ${(error as Error).message}`);
        return 2;
      }
      texts.forEach((text, i) => write(`${SCAN_ONLY_DIR}/${rel}.text-${i + 1}.txt`, text));
    }
    write(`${SCAN_ONLY_DIR}/paths-and-commit-message.txt`, [...entries.map((e) => e.rel), message].join("\n") + "\n");
    return secretScan(["--strict", "--path", ".", ...envFileList.flatMap((file) => ["--env-file", file])], { cwd: dir });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

function collectEntries(issue: string, issueDir: string, labels: string[]): Entry[] {
  const entries: Entry[] = [{ rel: "vercel.json", bytes: Buffer.from(VERCEL_JSON) }];
  for (const label of labels) {
    for (const dirent of fs.readdirSync(path.join(issueDir, label), { withFileTypes: true })) {
      if (!MEDIA_EXT.test(dirent.name)) continue;
      const rel = `${issue}/${label}/${dirent.name}`;
      // A symlink or folder could point the publish at bytes that weren't produced by this tool.
      if (!dirent.isFile()) throw new Error(`Not a regular file: ${rel}`);
      entries.push({ rel, bytes: fs.readFileSync(path.join(issueDir, label, dirent.name)) });
    }
  }
  return entries;
}

function remoteTip(): string | null {
  const line = git(["ls-remote", "origin", `refs/heads/${MEDIA_BRANCH}`]);
  if (!line) return null;
  const sha = line.split(/\s+/)[0];
  git(["fetch", "--no-write-fetch-head", "--quiet", "origin", sha]);
  return sha;
}

/** Builds a commit with a throwaway index file, so no checkout or working tree is touched. */
function buildCommit(parent: string | null, issue: string, labels: string[], indexInfo: string, message: string): string | null {
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

async function main(argv: string[]): Promise<number> {
  const args = parseArgs(argv);
  const unknown = Object.keys(args).find((key) => !FLAGS.includes(key));
  if (unknown) throw new Error(`Unknown option: --${unknown}`);
  const issue = requireIssue(args);
  const issueDir = path.join(OUTPUT_ROOT, issue);
  if (!fs.existsSync(issueDir)) throw new Error(`Nothing to publish: ${issueDir} does not exist`);
  const envFileList = envFiles(argv);

  const labels = [...new Set(list(
    args.labels,
    fs.readdirSync(issueDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name),
  ))].map((label) => requireLabel(label, "--labels"));
  const entries = collectEntries(issue, issueDir, labels);
  const files = entries.slice(1);
  if (!files.length) throw new Error(`No media under ${issueDir} for labels: ${labels.join(", ")}`);
  const message = `media: #${issue} ${labels.join(", ")}`;

  // The scan sees the exact bytes that become blobs below, and runs before any git write.
  const scan = scanEntries(entries, message, envFileList);
  if (scan !== 0) {
    console.error(
      `publish: aborted, secret-scan --strict exited ${scan}${scan === 2 ? " (the scan couldn't run completely)" : ""}. ` +
        `Nothing was written to git or pushed to ${MEDIA_BRANCH}.`,
    );
    return 1;
  }

  const indexInfo = entries.map(({ rel, bytes }) => `100644 ${git(["hash-object", "-w", "--stdin"], { input: bytes })}\t${rel}`).join("\n") + "\n";
  for (let attempt = 1; ; attempt++) {
    const parent = remoteTip();
    const commit = buildCommit(parent, issue, labels, indexInfo, message);
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

  console.log(`Base URL: ${rawUrl(repoSlug(), `${issue}/`)}`);
  for (const label of labels) {
    const summary = path.join(issueDir, label, "summary.md");
    if (fs.existsSync(summary)) console.log(`Paste into the PR body: ${summary}`);
  }
  return 0;
}

if (import.meta.main) process.exit(await main(process.argv.slice(2)));
