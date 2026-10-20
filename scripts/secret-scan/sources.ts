import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { Source } from "./shared.ts";

const SKIP_DIRS = new Set([".git", "node_modules"]);

function git(args: string[], cwd: string): string {
  return execFileSync("git", ["-c", "core.quotePath=false", ...args], {
    cwd,
    maxBuffer: 1024 * 1024 * 1024,
    stdio: ["ignore", "pipe", "inherit"],
  }).toString("latin1");
}

/** Byte-string path from git output → readable UTF-8 path. */
function displayPath(raw: string): string {
  const unquoted = raw.startsWith('"') && raw.endsWith('"') ? raw.slice(1, -1) : raw;
  return Buffer.from(unquoted.replace(/^b\//, ""), "latin1").toString("utf8");
}

/**
 * Added lines from a `--unified=0` diff, one source per file. Hunk line counts decide what is
 * content, so an added line that looks like a `+++` header is still scanned.
 */
export function parseDiff(diff: string, commit?: string): Source[] {
  const files = new Map<string, { added: string[]; lines: number[] }>();
  const lines = diff.split("\n");
  let file: string | null = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith("+++ ")) {
      const target = line.slice(4);
      file = target === "/dev/null" ? null : displayPath(target);
      continue;
    }
    const hunk = line.match(/^@@ -\d+(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/);
    if (!hunk) continue;
    let oldLeft = hunk[1] === undefined ? 1 : Number(hunk[1]);
    let newLeft = hunk[3] === undefined ? 1 : Number(hunk[3]);
    let lineNo = Number(hunk[2]);
    while ((oldLeft > 0 || newLeft > 0) && i + 1 < lines.length) {
      const body = lines[++i];
      if (body.startsWith("\\")) continue;
      if (body.startsWith("-")) oldLeft--;
      else if (body.startsWith(" ")) {
        oldLeft--;
        newLeft--;
        lineNo++;
      } else if (body.startsWith("+")) {
        if (file !== null) {
          let entry = files.get(file);
          if (!entry) {
            entry = { added: [], lines: [] };
            files.set(file, entry);
          }
          entry.added.push(body.slice(1));
          entry.lines.push(lineNo);
        }
        newLeft--;
        lineNo++;
      } else {
        i--;
        break;
      }
    }
  }
  return [...files].map(([location, { added, lines: numbers }]) => ({
    location,
    commit,
    text: added.join("\n"),
    lines: numbers,
  }));
}

/**
 * Added lines and the message of every commit in `range`, commit by commit: the repo merges with
 * merge commits, so a value added and later removed inside a PR still lands in history.
 * `--remerge-diff` shows what a merge commit's conflict resolution added.
 */
export function rangeSources(range: string, cwd = process.cwd()): Source[] {
  if (range.startsWith("-")) throw new Error(`Invalid --diff range: ${range}`);
  const out = git(
    ["log", "-p", "--no-color", "--no-ext-diff", "--unified=0", "--remerge-diff", "--format=%x00%H%n%B%x00", range, "--"],
    cwd,
  );
  const parts = out.split("\0");
  const sources: Source[] = [];
  for (let i = 1; i < parts.length; i += 2) {
    const newline = parts[i].indexOf("\n");
    const commit = newline === -1 ? parts[i] : parts[i].slice(0, newline);
    const message = newline === -1 ? "" : parts[i].slice(newline + 1);
    sources.push({ location: "commit-message", commit, text: message });
    sources.push(...parseDiff(parts[i + 1] ?? "", commit));
  }
  return sources;
}

export function stagedSources(cwd = process.cwd()): Source[] {
  return parseDiff(git(["diff", "--cached", "--no-color", "--no-ext-diff", "--unified=0"], cwd));
}

/** Every file under `dir` (text or binary), skipping `.git` and `node_modules`. */
export function* pathSources(dir: string, cwd = process.cwd()): Generator<Source> {
  const root = path.resolve(cwd, dir);
  if (!fs.statSync(root).isDirectory()) throw new Error(`--path is not a directory: ${dir}`);
  const pending = [root];
  while (pending.length > 0) {
    const current = pending.pop()!;
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      const full = path.join(current, entry.name);
      if (entry.isDirectory()) {
        if (!SKIP_DIRS.has(entry.name)) pending.push(full);
      } else if (entry.isFile()) {
        const location = path.relative(cwd, full).split(path.sep).join("/");
        yield { location, text: fs.readFileSync(full).toString("latin1") };
      }
    }
  }
}
