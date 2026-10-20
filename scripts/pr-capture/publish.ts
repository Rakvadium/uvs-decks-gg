import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { MEDIA_BRANCH, OUTPUT_ROOT, git, list, parseArgs, rawUrl, repoSlug, requireIssue } from "./shared.ts";

const MEDIA_EXT = /\.(png|gif|webm|md|json)$/;
const MAX_ATTEMPTS = 6;

const args = parseArgs(process.argv.slice(2));
const issue = requireIssue(args);
const issueDir = path.join(OUTPUT_ROOT, issue);
if (!fs.existsSync(issueDir)) throw new Error(`Nothing to publish: ${issueDir} does not exist`);

const labels = list(
  args.labels,
  fs.readdirSync(issueDir, { withFileTypes: true }).filter((d) => d.isDirectory()).map((d) => d.name),
);
const files = labels.flatMap((label) =>
  fs
    .readdirSync(path.join(issueDir, label))
    .filter((f) => MEDIA_EXT.test(f))
    .map((f) => ({ abs: path.join(issueDir, label, f), rel: `${issue}/${label}/${f}` })),
);
if (!files.length) throw new Error(`No media under ${issueDir} for labels: ${labels.join(", ")}`);

// Blobs are written once; each attempt only rebuilds the tree on top of the latest remote tip.
const blobs = git(["hash-object", "-w", "--stdin-paths"], { input: files.map((f) => f.abs).join("\n") }).split(/\r?\n/);
// pr-media has no app, so every push would otherwise trigger a failing Vercel preview deployment.
const vercelJson = git(["hash-object", "-w", "--stdin"], { input: '{ "git": { "deploymentEnabled": false } }\n' });
const indexInfo =
  [`100644 ${vercelJson}\tvercel.json`, ...files.map((f, i) => `100644 ${blobs[i]}\t${f.rel}`)].join("\n") + "\n";

function remoteTip(): string | null {
  const line = git(["ls-remote", "origin", `refs/heads/${MEDIA_BRANCH}`]);
  if (!line) return null;
  const sha = line.split(/\s+/)[0];
  git(["fetch", "--no-write-fetch-head", "--quiet", "origin", sha]);
  return sha;
}

/** Builds a commit with a throwaway index file, so no checkout or working tree is touched. */
function buildCommit(parent: string | null): string | null {
  const indexFile = path.join(os.tmpdir(), `pr-capture-index-${process.pid}-${Date.now()}`);
  const env = { ...process.env, GIT_INDEX_FILE: indexFile };
  const run = (cmd: string[], input?: string) => git(cmd, { input, env });
  try {
    run(parent ? ["read-tree", parent] : ["read-tree", "--empty"]);
    for (const label of labels) run(["rm", "--cached", "-r", "-f", "-q", "--ignore-unmatch", "--", `${issue}/${label}`]);
    run(["update-index", "--add", "--index-info"], indexInfo);
    const tree = run(["write-tree"]);
    if (parent && tree === git(["rev-parse", `${parent}^{tree}`])) return null;
    const message = `media: #${issue} ${labels.join(", ")}`;
    return git(parent ? ["commit-tree", tree, "-p", parent, "-m", message] : ["commit-tree", tree, "-m", message]);
  } finally {
    fs.rmSync(indexFile, { force: true });
  }
}

for (let attempt = 1; ; attempt++) {
  const parent = remoteTip();
  const commit = buildCommit(parent);
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

const repo = repoSlug();
console.log(`Base URL: ${rawUrl(repo, `${issue}/`)}`);
for (const label of labels) {
  const summary = path.join(issueDir, label, "summary.md");
  if (fs.existsSync(summary)) console.log(`Paste into the PR body: ${summary}`);
}
