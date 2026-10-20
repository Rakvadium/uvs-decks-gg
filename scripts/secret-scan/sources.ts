import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import type { Target } from "./match.ts";

const SKIP_DIRS = new Set([".git", "node_modules"]);
const EMPTY_TREE = "4b825dc642cb6eb9a060e54bf8d69288fbee4904";
const SUBMODULE_MODE = "160000";

function git(args: string[], cwd: string, input?: string): Buffer {
  return execFileSync("git", args, {
    cwd,
    input,
    maxBuffer: 2 * 1024 * 1024 * 1024,
    stdio: ["pipe", "pipe", "inherit"],
  });
}

type Change = { path: string; oldSha: string; newSha: string };

/** `git diff-tree`/`diff-index -z` raw output → changes that leave a blob behind. */
export function parseRawDiff(out: Buffer): Change[] {
  const parts = out.toString("latin1").split("\0");
  const changes: Change[] = [];
  for (let i = 0; i + 1 < parts.length; i++) {
    if (!parts[i].startsWith(":")) continue;
    const [, newMode, oldSha, newSha] = parts[i].slice(1).split(" ");
    const file = Buffer.from(parts[++i], "latin1").toString("utf8");
    if (/^0+$/.test(newSha) || newMode === SUBMODULE_MODE) continue;
    changes.push({ path: file, oldSha, newSha });
  }
  return changes;
}

/** Full contents of many objects in one `git cat-file --batch` call. Missing objects are left out. */
function readObjects(shas: Iterable<string>, cwd: string): Map<string, Buffer> {
  const wanted = [...new Set(shas)].filter((sha) => !/^0+$/.test(sha));
  const objects = new Map<string, Buffer>();
  if (wanted.length === 0) return objects;
  const out = git(["cat-file", "--batch"], cwd, `${wanted.join("\n")}\n`);
  let at = 0;
  while (at < out.length) {
    const newline = out.indexOf(0x0a, at);
    const [sha, type, size] = out.subarray(at, newline).toString("latin1").split(" ");
    at = newline + 1;
    if (type === "missing" || size === undefined) continue;
    objects.set(sha, out.subarray(at, at + Number(size)));
    at += Number(size) + 1;
  }
  return objects;
}

/**
 * The full new blob of every file a commit changes, plus its message. Blobs are read raw, so
 * binary files and `.gitattributes` (`binary`, `-diff`) don't hide anything. A merge commit
 * contributes only paths that differ from every parent (its conflict resolutions).
 */
export function rangeTargets(range: string, cwd = process.cwd()): Target[] {
  if (range.startsWith("-") || !/\.\.|\^!/.test(range)) {
    throw new Error(`--diff needs a commit range like base..head (got ${range})`);
  }
  const commits = git(["rev-list", "--parents", range, "--"], cwd)
    .toString("latin1")
    .split("\n")
    .filter(Boolean)
    .map((line) => line.split(" "));

  const perCommit = commits.map(([commit, ...parents]) => {
    const diffs = parents.length === 0
      ? [parseRawDiff(git(["diff-tree", "-r", "-z", "--no-renames", "--no-commit-id", "--root", commit], cwd))]
      : parents.map((parent) => parseRawDiff(git(["diff-tree", "-r", "-z", "--no-renames", parent, commit], cwd)));
    const byPath = diffs.map((changes) => new Map(changes.map((c) => [c.path, c])));
    const changes = diffs[0]
      .filter((change) => byPath.every((map) => map.has(change.path)))
      .map((change) => ({ ...change, oldShas: byPath.map((map) => map.get(change.path)!.oldSha) }));
    return { commit, changes };
  });

  const objects = readObjects(
    perCommit.flatMap(({ commit, changes }) => [commit, ...changes.flatMap((c) => [c.newSha, ...c.oldShas])]),
    cwd,
  );
  const targets: Target[] = [];
  for (const { commit, changes } of perCommit) {
    const raw = objects.get(commit);
    if (!raw) throw new Error(`cannot read commit ${commit}`);
    const split = raw.indexOf("\n\n");
    targets.push({ location: "commit-message", commit, bytes: split === -1 ? Buffer.alloc(0) : raw.subarray(split + 2) });
    for (const change of changes) {
      targets.push({ location: change.path, commit, bytes: blob(objects, change.newSha), before: change.oldShas.map((sha) => blob(objects, sha)) });
    }
  }
  return targets;
}

function blob(objects: Map<string, Buffer>, sha: string): Buffer {
  if (/^0+$/.test(sha)) return Buffer.alloc(0);
  const bytes = objects.get(sha);
  if (!bytes) throw new Error(`cannot read blob ${sha}`);
  return bytes;
}

/** Every staged file's full index blob, compared with HEAD's. */
export function stagedTargets(cwd = process.cwd()): Target[] {
  let head = EMPTY_TREE;
  try {
    head = git(["rev-parse", "--verify", "-q", "HEAD"], cwd).toString().trim();
  } catch {
    // No commits yet: compare with the empty tree.
  }
  const changes = parseRawDiff(git(["diff-index", "--cached", "-r", "-z", "--no-renames", head], cwd));
  const objects = readObjects(changes.flatMap((c) => [c.newSha, c.oldSha]), cwd);
  return changes.map((change) => ({
    location: change.path,
    bytes: blob(objects, change.newSha),
    before: [blob(objects, change.oldSha)],
  }));
}

/** Every file under `dir` (text or binary), skipping `.git` and `node_modules`. */
export function* pathTargets(dir: string, cwd = process.cwd()): Generator<Target> {
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
        yield { location: path.relative(cwd, full).split(path.sep).join("/"), bytes: fs.readFileSync(full) };
      }
    }
  }
}
