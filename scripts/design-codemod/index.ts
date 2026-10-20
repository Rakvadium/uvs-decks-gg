import fs from "node:fs";
import path from "node:path";
import { Linter } from "eslint";
import design, { designRules } from "../../tools/eslint-design/index.mjs";
import parser from "../../tools/eslint-design/parser.mjs";

const USAGE = `Usage: bun run design:codemod [--dry] <path>...

Applies the mechanical design-system rewrites (docs/UI_UX_DESIGN.md § Named utilities) to
class strings in files under the given paths, and lists what is left for human judgment:
  - tone / border / surface opacities -> named ladder utilities (exact aliases and doc-listed snaps)
  - rounded, rounded-sm (and side forms) -> rounded-md
  - raw z-30 ... z-[600] -> named z utilities
Only files under <path> are read or written. --dry writes nothing.
Exit 0 done, 1 a file could not be parsed, 2 bad usage.`;

const EXTENSIONS = new Set([".ts", ".tsx", ".js", ".jsx", ".mjs", ".mts"]);
const SKIP_DIRS = new Set(["node_modules", ".next", ".git", "out", "build"]);

export type Rewrite = { line: number; from: string; to: string };
export type Leftover = { line: number; rule: string; text: string; message: string };
export type TransformResult = { output: string; rewrites: Rewrite[]; left: Leftover[]; fatal?: string };

const config: Linter.Config[] = [
  {
    files: ["**/*.{ts,tsx,js,jsx,mjs,mts}"],
    languageOptions: { parser, parserOptions: { ecmaFeatures: { jsx: true } } },
    linterOptions: { reportUnusedDisableDirectives: "off" },
    plugins: { design },
    rules: designRules("warn"),
  },
];

function lineStarts(code: string): number[] {
  const starts = [0];
  for (let i = 0; i < code.length; i++) if (code[i] === "\n") starts.push(i + 1);
  return starts;
}

/** Rewrites one file's source. Pure: same input, same output; output is a fixed point. */
export function transformSource(source: string, filename: string): TransformResult {
  // ESLint drops a BOM and reports offsets without it; put it back after rewriting.
  const bom = source.startsWith("﻿") ? "﻿" : "";
  const code = bom ? source.slice(1) : source;
  const linter = new Linter({ configType: "flat" });
  const messages = linter.verify(code, config, path.basename(filename));
  const fatal = messages.find((m) => m.fatal || (m.ruleId === null && m.line === 0));
  if (fatal) return { output: source, rewrites: [], left: [], fatal: `${fatal.line}:${fatal.column} ${fatal.message}` };

  const starts = lineStarts(code);
  const offset = (line: number, column: number) => starts[line - 1] + column - 1;

  const fixes: { range: [number, number]; text: string; line: number }[] = [];
  const left: Leftover[] = [];
  for (const m of messages) {
    if (!m.ruleId?.startsWith("design/")) continue;
    const fix = m.suggestions?.[0]?.fix;
    if (fix) {
      fixes.push({ range: fix.range, text: fix.text, line: m.line });
    } else {
      const start = offset(m.line, m.column);
      const end = m.endLine && m.endColumn ? offset(m.endLine, m.endColumn) : start;
      left.push({ line: m.line, rule: m.ruleId, text: code.slice(start, end), message: m.message });
    }
  }

  fixes.sort((a, b) => b.range[0] - a.range[0]);
  let output = code;
  let floor = Infinity;
  const rewrites: Rewrite[] = [];
  for (const fix of fixes) {
    if (fix.range[1] > floor) continue; // overlapping; cannot happen for token-sized fixes
    rewrites.push({ line: fix.line, from: output.slice(fix.range[0], fix.range[1]), to: fix.text });
    output = output.slice(0, fix.range[0]) + fix.text + output.slice(fix.range[1]);
    floor = fix.range[0];
  }
  rewrites.reverse();
  return { output: bom + output, rewrites, left };
}

/** Source files under `target` (a file or a directory). */
export function collectFiles(target: string): string[] {
  const stat = fs.statSync(target);
  if (stat.isFile()) return EXTENSIONS.has(path.extname(target)) ? [target] : [];
  const files: string[] = [];
  for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name) || entry.name.startsWith(".")) continue;
      files.push(...collectFiles(path.join(target, entry.name)));
    } else if (entry.isFile() && EXTENSIONS.has(path.extname(entry.name))) {
      files.push(path.join(target, entry.name));
    }
  }
  return files;
}

export type RunOptions = { cwd?: string; out?: (line: string) => void; err?: (line: string) => void };

/** Returns the exit code. */
export function run(argv: string[], options: RunOptions = {}): number {
  const cwd = options.cwd ?? process.cwd();
  const out = options.out ?? ((line: string) => console.log(line));
  const err = options.err ?? ((line: string) => console.error(line));

  let dry = false;
  const targets: string[] = [];
  for (const arg of argv) {
    if (arg === "--dry") dry = true;
    else if (arg === "--help" || arg === "-h") {
      out(USAGE);
      return 0;
    } else if (arg.startsWith("-")) {
      err(`Unknown flag ${arg}\n\n${USAGE}`);
      return 2;
    } else targets.push(arg);
  }
  if (targets.length === 0) {
    err(`At least one path is required.\n\n${USAGE}`);
    return 2;
  }

  const files = new Set<string>();
  for (const target of targets) {
    const abs = path.resolve(cwd, target);
    if (!fs.existsSync(abs)) {
      err(`No such path: ${target}`);
      return 2;
    }
    for (const file of collectFiles(abs)) files.add(file);
  }

  const rel = (file: string) => path.relative(cwd, file).split(path.sep).join("/");
  const mappings = new Map<string, number>();
  const leftByRule = new Map<string, number>();
  let rewriteCount = 0;
  let leftCount = 0;
  let changedFiles = 0;
  let failed = 0;
  const leftLines: string[] = [];

  for (const file of [...files].sort()) {
    const code = fs.readFileSync(file, "utf8");
    const result = transformSource(code, file);
    if (result.fatal) {
      err(`${rel(file)}: parse error ${result.fatal}; skipped`);
      failed++;
      continue;
    }
    if (result.rewrites.length) {
      changedFiles++;
      rewriteCount += result.rewrites.length;
      for (const r of result.rewrites) mappings.set(`${r.from} -> ${r.to}`, (mappings.get(`${r.from} -> ${r.to}`) ?? 0) + 1);
      if (!dry) fs.writeFileSync(file, result.output);
    }
    for (const l of result.left) {
      leftCount++;
      leftByRule.set(l.rule, (leftByRule.get(l.rule) ?? 0) + 1);
      leftLines.push(`  ${rel(file)}:${l.line}  ${l.rule}  ${l.text}`);
    }
  }

  out(`${dry ? "[dry] would rewrite" : "Rewrote"} ${rewriteCount} class(es) in ${changedFiles} of ${files.size} file(s).`);
  if (mappings.size) {
    out("\nRewrites:");
    for (const [mapping, count] of [...mappings].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))) {
      out(`  ${String(count).padStart(4)}  ${mapping}`);
    }
  }
  out(`\nLeft for human judgment: ${leftCount}`);
  for (const [rule, count] of [...leftByRule].sort((a, b) => b[1] - a[1])) out(`  ${String(count).padStart(4)}  ${rule}`);
  if (leftLines.length) {
    out("");
    for (const line of leftLines) out(line);
  }
  return failed ? 1 : 0;
}

if (import.meta.main) {
  process.exit(run(process.argv.slice(2)));
}
