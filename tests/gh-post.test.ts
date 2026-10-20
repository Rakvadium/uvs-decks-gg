import { afterAll, describe, expect, test } from "bun:test";
import { execFileSync, spawnSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { loadManifest } from "../scripts/secret-scan/shared";

const SCRIPT = path.join(import.meta.dir, "../scripts/gh-post/index.ts");
const MANIFEST = loadManifest();
const REQUIRED = MANIFEST.names.filter((name) => !MANIFEST.optional.includes(name) && !MANIFEST.ciOnly.includes(name));
/** Fake values only, random per run, so nothing here can match a real secret. */
const fakeValue = (name: string) => `fake${name.replace(/_/g, "").toLowerCase()}${crypto.randomBytes(12).toString("hex")}`;
const FAKE_ENV = Object.fromEntries(REQUIRED.map((name) => [name, fakeValue(name)]));
const PLANTED = FAKE_ENV.AGENT_AUTH_PASSWORD;
const envText = (names: string[]) => names.map((name) => `${name}=${FAKE_ENV[name]}`).join("\n") + "\n";

const root = fs.mkdtempSync(path.join(os.tmpdir(), "gh-post-"));
const work = path.join(root, "work");
const fakeBin = path.join(root, "bin");
const ghLog = path.join(root, "gh-log.jsonl");
const envFile = path.join(root, "fake.env");
fs.writeFileSync(envFile, envText(REQUIRED));
const textFile = (name: string, content: string | Buffer) => {
  const file = path.join(root, name);
  fs.writeFileSync(file, content);
  return file;
};

// A fake gh first on PATH: it records its args, the files it was pointed at, and GH_PROMPT_DISABLED.
fs.mkdirSync(fakeBin);
const fakeGh = path.join(fakeBin, "fake-gh.ts");
fs.writeFileSync(
  fakeGh,
  `import fs from "node:fs";
const args = process.argv.slice(2);
const files = {};
for (const arg of args) {
  const match = arg.match(/^--(?:body-file|input)=(.*)$/s) ?? arg.match(/^--field=[^=]*=@(.*)$/s);
  if (match) files[arg] = fs.readFileSync(match[1], "utf8");
}
fs.appendFileSync(process.env.FAKE_GH_LOG, JSON.stringify({ args, files, prompt: process.env.GH_PROMPT_DISABLED }) + "\\n");
process.exit(Number(process.env.FAKE_GH_EXIT || 0));
`,
);
if (process.platform === "win32") {
  fs.writeFileSync(path.join(fakeBin, "gh.cmd"), `@"${process.execPath}" "${fakeGh}" %*\r\n`);
} else {
  fs.writeFileSync(path.join(fakeBin, "gh"), `#!/bin/sh\nexec "${process.execPath}" "${fakeGh}" "$@"\n`, { mode: 0o755 });
}

const globalConfig = path.join(root, "gitconfig");
fs.writeFileSync(globalConfig, "");
const env: NodeJS.ProcessEnv = { ...process.env };
const strip = new Set(MANIFEST.names);
for (const key of Object.keys(env)) {
  if (strip.has(key) || key.toUpperCase().startsWith("GIT_") || key.toUpperCase() === "PATH") delete env[key];
}
Object.assign(env, {
  PATH: `${fakeBin}${path.delimiter}${process.env.PATH ?? process.env.Path ?? ""}`,
  FAKE_GH_LOG: ghLog,
  GIT_CONFIG_GLOBAL: globalConfig,
  GIT_CONFIG_NOSYSTEM: "1",
  GIT_AUTHOR_NAME: "test",
  GIT_AUTHOR_EMAIL: "test@example.com",
  GIT_COMMITTER_NAME: "test",
  GIT_COMMITTER_EMAIL: "test@example.com",
});
const git = (cwd: string, ...args: string[]) => execFileSync("git", args, { cwd, env, stdio: "pipe" }).toString().trim();

// origin/dev, then a clean branch and a branch whose commit message holds a fake value.
fs.mkdirSync(work);
git(work, "init", "-q", "-b", "main");
git(work, "commit", "-q", "--allow-empty", "-m", "init");
git(work, "update-ref", "refs/remotes/origin/dev", "HEAD");
git(work, "checkout", "-q", "-b", "feature");
git(work, "commit", "-q", "--allow-empty", "-m", "Clean change", "-m", "A clean body.");
git(work, "checkout", "-q", "-b", "leak", "refs/remotes/origin/dev");
git(work, "commit", "-q", "--allow-empty", "-m", "Leaky change", "-m", `token ${PLANTED}`);
git(work, "commit", "-q", "--allow-empty", "-m", "Later clean change");
git(work, "checkout", "-q", "feature");

type Call = { args: string[]; files: Record<string, string>; prompt?: string };

function post(args: string[], options: { input?: string | Buffer; ghExit?: number; cwd?: string; withEnv?: boolean } = {}) {
  fs.rmSync(ghLog, { force: true });
  const argv = options.withEnv === false ? args : ["--env-file", envFile, ...args];
  const result = spawnSync(process.execPath, [SCRIPT, ...argv], {
    cwd: options.cwd ?? work,
    env: { ...env, FAKE_GH_EXIT: String(options.ghExit ?? 0) },
    input: options.input ?? "",
    encoding: "utf8",
  });
  const calls: Call[] = fs.existsSync(ghLog)
    ? fs.readFileSync(ghLog, "utf8").split("\n").filter(Boolean).map((line) => JSON.parse(line))
    : [];
  const out = `${result.stdout}\n${result.stderr}`;
  // No path, hit or refusal may ever print a value.
  expect(out).not.toContain(PLANTED);
  return { status: result.status, out, calls };
}

afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

const API = "repos/{owner}/{repo}/issues/1/comments";

describe("gh-post blocks a fake value in the text", () => {
  const leakFile = textFile("leak.md", `# Body\n\nsee ${PLANTED}\n`);
  const leakUtf16 = textFile("leak-utf16.md", Buffer.from(`﻿see ${PLANTED}\n`, "utf16le"));
  const cases: [string, string[], string?][] = [
    ["--title", ["issue", "create", "--title", PLANTED, "--body", "ok"]],
    ["-t", ["issue", "create", "-t", `x ${PLANTED}`, "-b", "ok"]],
    ["pr create --title=", ["pr", "create", "--base", "dev", `--title=${PLANTED}`, "--body", "ok"]],
    ["--body", ["pr", "comment", "1", "--body", PLANTED]],
    ["-b", ["issue", "comment", "1", "-b", PLANTED]],
    ["--body-file", ["issue", "comment", "1", "--body-file", leakFile]],
    ["--body-file=", ["pr", "create", "--base", "dev", "-t", "T", `--body-file=${leakFile}`]],
    ["-F (UTF-16 file)", ["issue", "create", "-t", "T", "-F", leakUtf16]],
    ["--body-file - (stdin)", ["issue", "comment", "1", "--body-file", "-"], `see ${PLANTED}\n`],
    ["-F - (stdin)", ["pr", "edit", "1", "-F", "-"], `see ${PLANTED}\n`],
    ["pr edit --title", ["pr", "edit", "1", "--title", PLANTED]],
    ["issue edit --body", ["issue", "edit", "1", "2", "--body", PLANTED]],
    ["--add-label", ["pr", "edit", "1", "--add-label", PLANTED]],
    ["--edit-last", ["issue", "comment", "1", "--edit-last", "--body", PLANTED]],
    ["api -f", ["api", API, "-f", `body=${PLANTED}`]],
    ["api --raw-field=", ["api", API, `--raw-field=body=${PLANTED}`]],
    ["api -F key=@file", ["api", API, "-F", `body=@${leakFile}`]],
    ["api -F key=@-", ["api", API, "-F", "body=@-"], PLANTED],
    ["api --input file", ["api", API, "--input", leakFile]],
    ["api --input -", ["api", API, "--input", "-"], JSON.stringify({ body: PLANTED })],
    ["a refused command", ["pr", "merge", "1", "--body", PLANTED]],
    ["an unknown flag", ["pr", "comment", "1", `--bogus=${PLANTED}`]],
  ];
  for (const [name, args, input] of cases) {
    test(name, () => {
      const result = post(args, { input });
      expect(result.status).toBe(1);
      expect(result.out).toContain("AGENT_AUTH_PASSWORD");
      expect(result.out).toContain("gh-post: not posted");
      expect(result.calls).toEqual([]);
    });
  }

  test("--fill, --fill-first and --fill-verbose scan the branch's commit messages", () => {
    git(work, "checkout", "-q", "leak");
    try {
      for (const fill of ["--fill", "-f", "--fill-first", "--fill-verbose"]) {
        const result = post(["pr", "create", "--base", "dev", fill]);
        expect(result.status).toBe(1);
        expect(result.out).toMatch(/AGENT_AUTH_PASSWORD commit-[0-9a-f]{12}:/);
        expect(result.calls).toEqual([]);
      }
    } finally {
      git(work, "checkout", "-q", "feature");
    }
  });

  test("--fill scans every commit gh could pick: a stale local base branch counts too", () => {
    // origin/dev includes the leaky commit, but a local `dev` (gh's fallback base) doesn't.
    git(work, "branch", "-q", "dev", "main");
    git(work, "update-ref", "refs/remotes/origin/dev", "leak");
    git(work, "checkout", "-q", "-b", "on-top", "leak");
    try {
      const result = post(["pr", "create", "--base", "dev", "--fill"]);
      expect(result.status).toBe(1);
      expect(result.calls).toEqual([]);
    } finally {
      git(work, "checkout", "-q", "feature");
      git(work, "branch", "-q", "-D", "on-top", "dev");
      git(work, "update-ref", "refs/remotes/origin/dev", "main");
    }
  });

  test("--fill scans the branch name (gh's title for several commits)", () => {
    git(work, "checkout", "-q", "-b", PLANTED);
    try {
      const result = post(["pr", "create", "--base", "dev", "--fill"]);
      expect(result.status).toBe(1);
      expect(result.out).toContain("AGENT_AUTH_PASSWORD branch:1");
      expect(result.calls).toEqual([]);
    } finally {
      git(work, "checkout", "-q", "feature");
      git(work, "branch", "-q", "-D", PLANTED);
    }
  });
});

describe("gh-post passes a clean post through to gh", () => {
  test("--body: gh gets an argument list, prompts off, gh's exit code", () => {
    const result = post(["issue", "comment", "7", "--body", "hello world"]);
    expect(result.status).toBe(0);
    expect(result.out).toContain("secret-scan: clean");
    expect(result.calls).toEqual([{ args: ["issue", "comment", "--body=hello world", "7"], files: {}, prompt: "1" }]);
    expect(post(["issue", "comment", "7", "-b", "hi"], { ghExit: 3 }).status).toBe(3);
  });

  test("a leading gh and -- are accepted", () => {
    const result = post(["--", "gh", "pr", "comment", "7", "-b", "hi"]);
    expect(result.status).toBe(0);
    expect(result.calls[0].args).toEqual(["pr", "comment", "--body=hi", "7"]);
  });

  test("--body-file: gh reads a temp copy of the scanned bytes, not the original file", () => {
    const body = "## Summary\n\nFixes #1\n";
    const file = textFile("clean.md", body);
    const result = post(["pr", "create", "--base", "dev", "--title", "T", "--body-file", file, "--draft", "-l", "x"]);
    expect(result.status).toBe(0);
    const [call] = result.calls;
    const bodyArg = call.args.find((arg) => arg.startsWith("--body-file="))!;
    expect(bodyArg).not.toContain(file);
    expect(call.files[bodyArg]).toBe(body);
    expect(call.args).toEqual(["pr", "create", "--base=dev", "--title=T", bodyArg, "--draft", "--label=x"]);
  });

  test("--body-file - reads stdin once, and gh gets it as a file", () => {
    const result = post(["issue", "create", "-t", "T", "-F", "-"], { input: "from stdin\n" });
    expect(result.status).toBe(0);
    const [call] = result.calls;
    expect(Object.values(call.files)).toEqual(["from stdin\n"]);
    expect(call.args).not.toContain("--body-file=-");
  });

  test("forms without text: --add-label, --edit-last, --delete-last", () => {
    expect(post(["pr", "edit", "3", "--add-label", "size/S"]).calls[0].args).toEqual(["pr", "edit", "--add-label=size/S", "3"]);
    expect(post(["issue", "comment", "3", "--edit-last", "--create-if-none", "-b", "hi"]).status).toBe(0);
    expect(post(["pr", "comment", "3", "--delete-last", "--yes"]).status).toBe(0);
  });

  test("gh api with -f, -F key=@file and --input", () => {
    const file = textFile("field.txt", "field text");
    const result = post(["api", API, "-X", "POST", "-f", "body=hi", "-F", `note=@${file}`, "-F", "n=1"]);
    expect(result.status).toBe(0);
    const [call] = result.calls;
    const field = call.args.find((arg) => arg.startsWith("--field=note=@"))!;
    expect(field).not.toContain(file);
    expect(call.files[field]).toBe("field text");
    expect(call.args).toEqual(["api", "--method=POST", "--raw-field=body=hi", field, "--field=n=1", API]);
    const input = post(["api", API, "--input", "-"], { input: '{"body":"hi"}' });
    expect(input.status).toBe(0);
    expect(Object.values(input.calls[0].files)).toEqual(['{"body":"hi"}']);
  });

  test("--fill on a clean branch scans its commits and passes --fill", () => {
    const result = post(["pr", "create", "--base", "dev", "--fill"]);
    expect(result.status).toBe(0);
    expect(result.out).toContain("across 3 files and commits");
    expect(result.calls[0].args).toEqual(["pr", "create", "--base=dev", "--fill"]);
  });
});

describe("gh-post refuses forms it can't scan", () => {
  const missing = path.join(root, "no-such-file.md");
  const cases: [string, string[], string?][] = [
    ["another gh command", ["pr", "merge", "1"]],
    ["another gh command", ["release", "create", "v1", "--notes", "x"]],
    ["a command alias", ["pr", "new", "-t", "T", "-b", "B"]],
    ["no command", []],
    ["--editor", ["pr", "create", "--base", "dev", "-t", "T", "-e"]],
    ["--web", ["issue", "comment", "1", "--web"]],
    ["--template", ["pr", "create", "--base", "dev", "-t", "T", "-T", "bug.md"]],
    ["--template=", ["issue", "create", "-t", "T", "--template=Bug"]],
    ["--recover", ["pr", "create", "--recover", "state.json"]],
    ["--fill without --base", ["pr", "create", "--fill"]],
    ["--fill with --head", ["pr", "create", "--fill-first", "--base", "dev", "--head", "other"]],
    ["--fill with an unknown base", ["pr", "create", "--fill", "--base", "nope"]],
    ["pr create without a body", ["pr", "create", "--base", "dev", "-t", "T"]],
    ["issue create without a title", ["issue", "create", "-b", "B"]],
    ["a comment without a body", ["issue", "comment", "1"]],
    ["--edit-last without a body", ["pr", "comment", "1", "--edit-last"]],
    ["an edit with no edit flag", ["pr", "edit", "1"]],
    ["an edit with only --repo", ["issue", "edit", "1", "-R", "o/r"]],
    ["an attached short value", ["issue", "comment", "1", "-bhello"]],
    ["a short flag with =", ["issue", "comment", "1", "-b=hello"]],
    ["combined short flags", ["pr", "create", "--base", "dev", "-t", "T", "-b", "B", "-dw"]],
    ["a value on a bool flag", ["pr", "create", "--base", "dev", "-t", "T", "-b", "B", "--draft=true"]],
    ["an unknown long flag", ["issue", "comment", "1", "-b", "x", "--bogus"]],
    ["an unknown short flag", ["issue", "comment", "1", "-b", "x", "-z"]],
    ["a flag missing its value", ["issue", "comment", "1", "--body"]],
    ["two reads from stdin", ["api", API, "-F", "a=@-", "--input", "-"], "x"],
    ["an unreadable --body-file", ["issue", "comment", "1", "--body-file", missing]],
    ["api without an endpoint", ["api", "-f", "body=x"]],
  ];
  for (const [name, args, input] of cases) {
    test(name, () => {
      const result = post(args, { input });
      expect(result.status).toBe(2);
      expect(result.out).toContain("gh-post: refused, nothing posted");
      expect(result.calls).toEqual([]);
    });
  }
});

describe("gh-post env files", () => {
  test("no env files: exit 2, nothing posted", () => {
    const result = post(["issue", "comment", "1", "-b", "hi"], { withEnv: false });
    expect(result.status).toBe(2);
    expect(result.out).toContain("secret-scan: cannot read --env-file");
    expect(result.calls).toEqual([]);
  });

  test("a missing required value, an empty file, or a bare --env-file: exit 2", () => {
    const partial = textFile("partial.env", envText(REQUIRED.filter((name) => name !== "JWKS")));
    const empty = textFile("empty.env", "");
    for (const argv of [["--env-file", partial], ["--env-file", empty], ["--env-file"], ["--env-file="], ["--env-file", "--", "x"]]) {
      const result = post([...argv, "issue", "comment", "1", "-b", "hi"], { withEnv: false });
      expect(result.status).toBe(2);
      expect(result.calls).toEqual([]);
    }
  });

  test("without --env-file it uses the main checkout's two env files, also from a worktree", () => {
    fs.mkdirSync(path.join(work, "data"), { recursive: true });
    fs.writeFileSync(path.join(work, ".env.local.live-backup"), envText(REQUIRED.slice(0, 3)));
    fs.writeFileSync(path.join(work, "data", "live-env-no-r2.txt"), envText(REQUIRED.slice(3)));
    const worktree = path.join(root, "worktree");
    git(work, "worktree", "add", "-q", "--detach", worktree);
    try {
      for (const cwd of [work, worktree]) {
        const leak = post(["issue", "comment", "1", "-b", PLANTED], { withEnv: false, cwd });
        expect(leak.status).toBe(1);
        expect(leak.calls).toEqual([]);
        expect(post(["issue", "comment", "1", "-b", "hi"], { withEnv: false, cwd }).status).toBe(0);
      }
      // An --env-file adds to them; dummy values can't mask the real ones.
      const dummy = textFile("dummy.env", REQUIRED.map((name) => `${name}=dummy-value-${name}`).join("\n"));
      const masked = post(["--env-file", dummy, "issue", "comment", "1", "-b", PLANTED], { withEnv: false });
      expect(masked.status).toBe(1);
    } finally {
      git(work, "worktree", "remove", "--force", worktree);
      fs.rmSync(path.join(work, ".env.local.live-backup"));
      fs.rmSync(path.join(work, "data"), { recursive: true });
    }
  });
});
