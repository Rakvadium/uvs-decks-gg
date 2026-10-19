import fs from "node:fs";
import path from "node:path";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";
import { OUTPUT_ROOT, parseArgs, rawUrl, repoSlug, requireIssue, requireLabel } from "./shared.ts";

const args = parseArgs(process.argv.slice(2));
const issue = requireIssue(args);
const base = requireLabel(args.base ?? "before", "--base");
const head = requireLabel(args.head ?? "after", "--head");
const threshold = Number(args.threshold ?? 0.1);

const issueDir = path.join(OUTPUT_ROOT, issue);
const compareLabel = `compare-${base}-vs-${head}`;
const outDir = path.join(issueDir, compareLabel);
const GAP = 16;

function files(label: string, ext: string) {
  const dir = path.join(issueDir, label);
  if (!fs.existsSync(dir)) throw new Error(`Missing ${dir}; run capture with --label ${label} first`);
  return fs.readdirSync(dir).filter((f) => f.endsWith(ext)).sort();
}

/** Copies `src` onto a canvas of the given size so pairs of different heights still compare. */
function padTo(src: PNG, width: number, height: number): PNG {
  if (src.width === width && src.height === height) return src;
  const out = new PNG({ width, height });
  out.data.fill(0x80);
  PNG.bitblt(src, out, 0, 0, src.width, src.height, 0, 0);
  return out;
}

function sideBySide(a: PNG, b: PNG): PNG {
  const out = new PNG({ width: a.width * 2 + GAP, height: a.height });
  out.data.fill(0xff);
  PNG.bitblt(a, out, 0, 0, a.width, a.height, 0, 0);
  PNG.bitblt(b, out, 0, 0, b.width, b.height, a.width + GAP, 0);
  return out;
}

const repo = repoSlug();
const img = (rel: string, alt: string) => `<img src="${rawUrl(repo, rel)}" alt="${alt}" width="220">`;

fs.rmSync(outDir, { recursive: true, force: true });
fs.mkdirSync(outDir, { recursive: true });

const baseShots = files(base, ".png");
const headShots = new Set(files(head, ".png"));
const rows: string[] = [];
const results: { name: string; diffPercent: number }[] = [];

for (const file of baseShots.filter((f) => headShots.has(f))) {
  const name = file.replace(/\.png$/, "");
  const a0 = PNG.sync.read(fs.readFileSync(path.join(issueDir, base, file)));
  const b0 = PNG.sync.read(fs.readFileSync(path.join(issueDir, head, file)));
  const width = Math.max(a0.width, b0.width);
  const height = Math.max(a0.height, b0.height);
  const a = padTo(a0, width, height);
  const b = padTo(b0, width, height);
  const diff = new PNG({ width, height });
  const changed = pixelmatch(a.data, b.data, diff.data, width, height, { threshold });
  const diffPercent = Number(((changed / (width * height)) * 100).toFixed(3));
  fs.writeFileSync(path.join(outDir, `${name}__side.png`), PNG.sync.write(sideBySide(a, b)));
  fs.writeFileSync(path.join(outDir, `${name}__diff.png`), PNG.sync.write(diff));
  results.push({ name, diffPercent });
  rows.push(
    `| \`${name}\` | ${img(`${issue}/${base}/${file}`, base)} | ${img(`${issue}/${head}/${file}`, head)} | ` +
      `${img(`${issue}/${compareLabel}/${name}__side.png`, "side by side")} | ` +
      `${img(`${issue}/${compareLabel}/${name}__diff.png`, "diff")} | ${diffPercent}% |`,
  );
  console.log(`  ${name}: ${diffPercent}%`);
}

const missing = [
  ...baseShots.filter((f) => !headShots.has(f)).map((f) => `- \`${f}\` only in ${base}`),
  ...[...headShots].filter((f) => !baseShots.includes(f)).map((f) => `- \`${f}\` only in ${head}`),
];
const gifs = [base, head].flatMap((label) =>
  files(label, ".gif").map((f) => `**${label}: \`${f}\`**\n\n![${f}](${rawUrl(repo, `${issue}/${label}/${f}`)})`),
);

const summary = [
  `## Visual compare: \`${base}\` vs \`${head}\` (#${issue})`,
  "",
  `pixelmatch threshold ${threshold}. Diff % = changed pixels / total pixels.`,
  "",
  `| Shot | ${base} | ${head} | Side by side | Diff | Diff % |`,
  "| --- | --- | --- | --- | --- | --- |",
  ...rows,
  ...(missing.length ? ["", "Unpaired shots:", ...missing] : []),
  ...(gifs.length ? ["", "### Recordings", "", ...gifs] : []),
  "",
].join("\n");

fs.writeFileSync(path.join(outDir, "summary.md"), summary);
fs.writeFileSync(path.join(outDir, "compare.json"), JSON.stringify({ base, head, threshold, results }, null, 2));
console.log(`Wrote ${results.length} pairs and ${path.join(outDir, "summary.md")}`);
