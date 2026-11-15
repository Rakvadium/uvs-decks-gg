import path from "node:path";
import { ESLint } from "eslint";

const USAGE = `Usage: bun run lint:design [--summary] [--depth N] [path]...

Runs only the design/* rules from eslint.config.mjs (default path: src) and prints each
finding, then counts per directory (first N path segments, default 3) and per rule. The
USER-FACING row leaves out admin code and src/components/design-catalog.
--summary prints the counts only. Exit 0 whatever the findings (eslint enforces severity),
1 a file could not be parsed, 2 bad usage.`;

const COLUMNS: [string, string][] = [
  ["design/ladder-opacity", "ladder"],
  ["design/no-palette-hue", "palette"],
  ["design/radius-ladder", "radius"],
  ["design/no-transition-all", "transition"],
  ["design/chrome-typography", "type"],
  ["design/named-z-index", "z"],
  ["design/no-hsl-border", "hsl"],
  ["design/no-literal-color", "color"],
  ["design/primitive-geometry", "geometry"],
  ["design/button-focus", "focus"],
];

const NOT_USER_FACING = /(?:^|\/)admin(?:\/|-)|^src\/components\/design-catalog\//;

export type RunOptions = { cwd?: string; out?: (line: string) => void; err?: (line: string) => void };

export async function run(argv: string[], options: RunOptions = {}): Promise<number> {
  const cwd = options.cwd ?? process.cwd();
  const out = options.out ?? ((line: string) => console.log(line));
  const err = options.err ?? ((line: string) => console.error(line));

  let summary = false;
  let depth = 3;
  const targets: string[] = [];
  for (let i = 0; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === "--summary") summary = true;
    else if (arg === "--depth") {
      depth = Number(argv[++i]);
      if (!Number.isInteger(depth) || depth < 1) {
        err(`--depth needs a positive integer\n\n${USAGE}`);
        return 2;
      }
    } else if (arg === "--help" || arg === "-h") {
      out(USAGE);
      return 0;
    } else if (arg.startsWith("-")) {
      err(`Unknown flag ${arg}\n\n${USAGE}`);
      return 2;
    } else targets.push(arg);
  }
  if (targets.length === 0) targets.push("src");

  const eslint = new ESLint({ cwd, ruleFilter: ({ ruleId }) => ruleId.startsWith("design/") });
  const results = await eslint.lintFiles(targets);

  const byDir = new Map<string, Map<string, number>>();
  const byRule = new Map<string, number>();
  const userFacing = new Map<string, number>();
  let total = 0;
  let fatal = 0;

  for (const result of [...results].sort((a, b) => a.filePath.localeCompare(b.filePath))) {
    const rel = path.relative(cwd, result.filePath).split(path.sep).join("/");
    for (const m of result.messages) {
      if (m.fatal) {
        err(`${rel}:${m.line}:${m.column}  parse error  ${m.message}`);
        fatal++;
        continue;
      }
      if (!m.ruleId?.startsWith("design/")) continue;
      total++;
      byRule.set(m.ruleId, (byRule.get(m.ruleId) ?? 0) + 1);
      if (!NOT_USER_FACING.test(rel)) userFacing.set(m.ruleId, (userFacing.get(m.ruleId) ?? 0) + 1);
      const segments = rel.split("/").slice(0, -1);
      const dir = segments.slice(0, depth).join("/") || ".";
      const counts = byDir.get(dir) ?? new Map<string, number>();
      counts.set(m.ruleId, (counts.get(m.ruleId) ?? 0) + 1);
      byDir.set(dir, counts);
      if (!summary) out(`${rel}:${m.line}:${m.column}  ${m.ruleId}  ${m.message}`);
    }
  }

  const sum = (counts: Map<string, number>) => [...counts.values()].reduce((a, b) => a + b, 0);
  const header = ["directory", "total", ...COLUMNS.map(([, label]) => label)];
  const rows = [...byDir]
    .sort((a, b) => sum(b[1]) - sum(a[1]) || a[0].localeCompare(b[0]))
    .map(([dir, counts]) => [dir, String(sum(counts)), ...COLUMNS.map(([id]) => String(counts.get(id) ?? 0))]);
  rows.push(["TOTAL", String(total), ...COLUMNS.map(([id]) => String(byRule.get(id) ?? 0))]);
  rows.push(["USER-FACING", String(sum(userFacing)), ...COLUMNS.map(([id]) => String(userFacing.get(id) ?? 0))]);

  if (!summary) out("");
  out(`Design findings: ${total} in ${results.length} file(s) linted (depth ${depth})`);
  out(`| ${header.join(" | ")} |`);
  out(`|${header.map((_, i) => (i === 0 ? "---" : "--:")).join("|")}|`);
  for (const row of rows) out(`| ${row.join(" | ")} |`);
  return fatal ? 1 : 0;
}

if (import.meta.main) {
  run(process.argv.slice(2)).then(
    (code) => process.exit(code),
    (error) => {
      console.error((error as Error).message);
      process.exit(2);
    },
  );
}
