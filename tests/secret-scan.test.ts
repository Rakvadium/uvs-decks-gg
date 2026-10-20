import { describe, expect, test } from "bun:test";
import { execFileSync, spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { run } from "../scripts/secret-scan/index";
import {
  encodedForms,
  flagValues,
  loadManifest,
  loadSecrets,
  parseEnvFile,
  scanSource,
  type Source,
  valueFragments,
} from "../scripts/secret-scan/shared";
import { parseDiff, rangeSources } from "../scripts/secret-scan/sources";

const FAKE = "fake-Secret_value/42+xyz=";
const secrets = loadSecrets(["FAKE_TOKEN"], { FAKE_TOKEN: FAKE }).secrets;
const latin1 = (text: string): Source => ({ location: "f.txt", text: Buffer.from(text, "utf8").toString("latin1") });
const names = (text: string) => scanSource(latin1(text), secrets).map((hit) => `${hit.name}:${hit.line}`);

function tempDir(): string {
  return fs.mkdtempSync(path.join(os.tmpdir(), "secret-scan-"));
}

function capture(argv: string[], env: Record<string, string>, cwd: string) {
  const lines: string[] = [];
  const code = run(argv, { env, cwd, out: (l) => lines.push(l), err: (l) => lines.push(l) });
  return { code, output: lines.join("\n") };
}

describe("secret-scan matching", () => {
  test("raw value, with the right line", () => {
    expect(names(`a\nb\nconst key = "${FAKE}";\n`)).toEqual(["FAKE_TOKEN:3"]);
  });

  test("URL-encoded value, upper and lower case escapes", () => {
    const encoded = encodeURIComponent(FAKE);
    expect(encoded).not.toBe(FAKE);
    expect(names(`?token=${encoded}`)).toEqual(["FAKE_TOKEN:1"]);
    expect(names(`?token=${encoded.replace(/%[0-9A-F]{2}/g, (m) => m.toLowerCase())}`)).toEqual(["FAKE_TOKEN:1"]);
  });

  test("base64 and base64url, standalone or embedded at any alignment", () => {
    for (const prefix of ["", "u:", "us:", "user:"]) {
      const b64 = Buffer.from(`${prefix}${FAKE}`).toString("base64");
      expect(names(`Authorization: Basic ${b64}`)).toEqual(["FAKE_TOKEN:1"]);
      expect(names(Buffer.from(`${prefix}${FAKE}`).toString("base64url"))).toEqual(["FAKE_TOKEN:1"]);
    }
  });

  test("JSON-escaped multi-line value", () => {
    const pem = "-----BEGIN KEY-----\nabcdefgh12345678\n-----END KEY-----";
    const pemSecrets = loadSecrets(["JWT_PRIVATE_KEY"], { JWT_PRIVATE_KEY: pem }).secrets;
    expect(scanSource(latin1(JSON.stringify({ key: pem })), pemSecrets)).toHaveLength(1);
    expect(scanSource(latin1(`x\n${pem}\n`), pemSecrets).map((h) => h.line)).toEqual([2]);
  });

  test("non-ASCII values match in binary-decoded text", () => {
    const value = "pässwörd-ünïcode";
    const s = loadSecrets(["V"], { V: value }).secrets;
    expect(scanSource(latin1(`x=${value}`), s)).toHaveLength(1);
  });

  test("PEM key stored space-joined: each body line of 32+ chars matches on its own", () => {
    const body = Array.from({ length: 4 }, (_, i) => Buffer.alloc(48, i + 1).toString("base64"));
    const tail = "c2hvcnQtdGFpbC1saW5l";
    // Built from parts so gitleaks' private-key rule doesn't flag this fake key.
    const armor = (edge: string) => `-----${edge} ${["PRIVATE", "KEY"].join(" ")}-----`;
    const pem = `${armor("BEGIN")} ${body.join(" ")} ${tail} ${armor("END")}`;
    expect(valueFragments(pem)).toEqual(body);
    const pemSecrets = loadSecrets(["JWT_PRIVATE_KEY"], { JWT_PRIVATE_KEY: pem }).secrets;
    const partial = `const key = \`${armor("BEGIN")}\n${body[1]}\n${body[2]}\n\`;`;
    expect(scanSource(latin1(partial), pemSecrets).map((h) => h.line)).toEqual([2, 3]);
    expect(scanSource(latin1(`x ${tail} BEGIN PRIVATE KEY`), pemSecrets)).toEqual([]);
    expect(valueFragments("single-token-value-that-is-quite-long-indeed")).toEqual([]);
  });

  test("checks every distinct value of a name across env sources", () => {
    const loaded = loadSecrets(["KEY", "ONLY_B"], [{ KEY: "first-value-1" }, { KEY: "second-value-2", ONLY_B: "only-in-b-123" }]);
    expect(loaded.missing).toEqual([]);
    const key = loaded.secrets.filter((s) => s.name === "KEY");
    expect(scanSource(latin1("a first-value-1\nb second-value-2"), key).map((h) => h.line)).toEqual([1, 2]);
  });

  test("skips values shorter than 8 chars and reports missing ones", () => {
    const loaded = loadSecrets(["SHORT", "OK", "UNSET", "EMPTY"], { SHORT: "1234567", OK: "12345678", EMPTY: "" });
    expect(loaded.secrets.map((s) => s.name)).toEqual(["OK"]);
    expect(loaded.short).toEqual(["SHORT"]);
    expect(loaded.missing).toEqual(["UNSET", "EMPTY"]);
  });
});

describe("secret-scan env file and manifest", () => {
  test("parses names with digits, quotes, export, and inline comments", () => {
    const env = parseEnvFile(
      [
        "# comment",
        "R2_ACCESS_KEY_ID=abc123",
        "export R2_SECRET_ACCESS_KEY = 'single # kept'",
        'JWT_PRIVATE_KEY="line1\\nline2"',
        'MULTI="a',
        'b"',
        "CONVEX_DEPLOYMENT=dev:x # team: y",
      ].join("\r\n"),
    );
    expect(env).toEqual({
      R2_ACCESS_KEY_ID: "abc123",
      R2_SECRET_ACCESS_KEY: "single # kept",
      JWT_PRIVATE_KEY: "line1\nline2",
      MULTI: "a\nb",
      CONVEX_DEPLOYMENT: "dev:x",
    });
  });

  test("repeatable flags", () => {
    expect(flagValues(["--env-file", "a", "--diff", "x..y", "--env-file=b"], "env-file")).toEqual(["a", "b"]);
  });

  test("manifest has the issue's names, no username or public bucket", () => {
    const manifest = loadManifest();
    for (const name of ["AGENT_AUTH_SECRET", "AGENT_AUTH_PASSWORD", "R2_ACCESS_KEY_ID", "R2_SECRET_ACCESS_KEY", "JWKS"]) {
      expect(manifest).toContain(name);
    }
    expect(manifest).not.toContain("AGENT_AUTH_USERNAME");
    expect(manifest).not.toContain("R2_BUCKET");
  });

  test("CI job passes every manifest secret", () => {
    const ci = fs.readFileSync(path.join(import.meta.dir, "../.github/workflows/ci.yml"), "utf8");
    for (const name of loadManifest()) expect(ci).toContain(`${name}: \${{ secrets.${name} }}`);
  });
});

describe("secret-scan diff parsing", () => {
  test("only added lines, with new-file line numbers, including header look-alikes", () => {
    const diff = [
      "diff --git a/a.ts b/a.ts",
      "--- a/a.ts",
      "+++ b/a.ts",
      "@@ -3,2 +3,3 @@ fn",
      "-old",
      "-old2",
      "+new3",
      "++++ b/fake",
      "+new5",
      "@@ -10 +11 @@",
      "-x",
      "+new11",
      "\\ No newline at end of file",
      "diff --git a/gone.ts b/gone.ts",
      "--- a/gone.ts",
      "+++ /dev/null",
      "@@ -1 +0,0 @@",
      "-bye",
    ].join("\n");
    expect(parseDiff(diff, "abc")).toEqual([
      { location: "a.ts", commit: "abc", text: "new3\n+++ b/fake\nnew5\nnew11", lines: [3, 4, 5, 11] },
    ]);
  });
});

describe("secret-scan CLI", () => {
  test("--path: names and lines only, exit 1, value never printed", () => {
    const dir = tempDir();
    fs.mkdirSync(path.join(dir, "out", "nested"), { recursive: true });
    fs.writeFileSync(path.join(dir, "out", "nested", "trace.json"), `{\n"t": "${encodeURIComponent(FAKE)}"\n}`);
    fs.writeFileSync(path.join(dir, "out", "clean.txt"), "nothing here");
    const { code, output } = capture(["--path", "out"], { SECRET_SCAN_CANARY: FAKE }, dir);
    expect(code).toBe(1);
    expect(output).toContain("SECRET_SCAN_CANARY out/nested/trace.json:2");
    for (const form of encodedForms(FAKE)) expect(output).not.toContain(form);
  });

  test("clean scan with missing values exits 0 and warns with names", () => {
    const dir = tempDir();
    fs.writeFileSync(path.join(dir, "a.txt"), "nothing");
    const { code, output } = capture(["--path", "."], { SECRET_SCAN_CANARY: FAKE }, dir);
    expect(code).toBe(0);
    expect(output).toContain("no value, not checked:");
    expect(output).toContain("OPENAI_API_KEY");
    expect(output).toContain("clean");
  });

  test("no values at all exits 0 with a warning", () => {
    const { code, output } = capture(["--path", "."], {}, tempDir());
    expect(code).toBe(0);
    expect(output).toContain("nothing scanned");
  });

  test("usage errors exit 2", () => {
    expect(capture([], {}, tempDir()).code).toBe(2);
    expect(capture(["--diff"], {}, tempDir()).code).toBe(2);
    expect(capture(["--bogus", "x"], {}, tempDir()).code).toBe(2);
  });

  test("--diff scans every commit's added lines and messages; repeated --env-file values all load", () => {
    const dir = tempDir();
    const git = (...args: string[]) => execFileSync("git", args, { cwd: dir, stdio: "pipe" }).toString().trim();
    git("init", "-q", "-b", "main");
    git("config", "user.email", "t@example.com");
    git("config", "user.name", "t");
    fs.writeFileSync(path.join(dir, "a.txt"), "base\n");
    git("add", ".");
    git("commit", "-qm", "base");
    const base = git("rev-parse", "HEAD");
    fs.writeFileSync(path.join(dir, "a.txt"), `base\nleak=${FAKE}\n`);
    git("commit", "-qam", `add\n\nmessage mentions ${Buffer.from(FAKE).toString("base64")}`);
    fs.writeFileSync(path.join(dir, "a.txt"), "base\n");
    git("commit", "-qam", "remove it again");
    fs.writeFileSync(path.join(dir, ".env.test"), "OPENAI_API_KEY=unrelated-value\n");
    fs.writeFileSync(path.join(dir, ".env.second"), `SECRET_SCAN_CANARY=${FAKE}\n`);

    expect(rangeSources(`${base}..HEAD`, dir).filter((s) => s.location === "commit-message")).toHaveLength(2);
    const { code, output } = capture(["--diff", `${base}..HEAD`, "--env-file", ".env.test", "--env-file", ".env.second"], {}, dir);
    expect(code).toBe(1);
    expect(output).toMatch(/SECRET_SCAN_CANARY a\.txt:2 @[0-9a-f]{7}/);
    expect(output).toMatch(/SECRET_SCAN_CANARY commit-message:3 @[0-9a-f]{7}/);
    expect(output).not.toContain(FAKE);
  });

  test("--diff uses the branch's own commits: removals on the base branch are not hits", () => {
    const dir = tempDir();
    const git = (...args: string[]) => execFileSync("git", args, { cwd: dir, stdio: "pipe" }).toString().trim();
    git("init", "-q", "-b", "dev");
    git("config", "user.email", "t@example.com");
    git("config", "user.name", "t");
    fs.writeFileSync(path.join(dir, "creds.md"), `old=${FAKE}\n`);
    git("add", ".");
    git("commit", "-qm", "base with an old leak");
    git("checkout", "-qb", "feature");
    fs.writeFileSync(path.join(dir, "feature.txt"), "clean work\n");
    git("add", ".");
    git("commit", "-qm", "feature work");
    git("checkout", "-q", "dev");
    fs.writeFileSync(path.join(dir, "creds.md"), "old=<placeholder>\n");
    git("commit", "-qam", "dev removes the leak");

    // A two-dot `git diff dev..feature` would show the removal reversed as an added line.
    expect(git("diff", "dev..feature")).toContain(`+old=${FAKE}`);
    const { code, output } = capture(["--diff", "dev..feature"], { SECRET_SCAN_CANARY: FAKE }, dir);
    expect(output).not.toContain("creds.md");
    expect(code).toBe(0);
  });

  test("real process: stdout and stderr never contain the value", () => {
    const dir = tempDir();
    fs.writeFileSync(path.join(dir, "leak.txt"), FAKE);
    const result = spawnSync(process.execPath, [path.join(import.meta.dir, "../scripts/secret-scan/index.ts"), "--path", dir], {
      env: { ...process.env, SECRET_SCAN_CANARY: FAKE, GITHUB_ACTIONS: "true" },
    });
    const output = `${result.stdout}${result.stderr}`;
    expect(result.status).toBe(1);
    expect(output).toContain("SECRET_SCAN_CANARY");
    expect(output).toContain("::error file=");
    expect(output).not.toContain(FAKE);
  });
});
