import { afterAll, describe, expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { run, transformSource } from "../scripts/design-codemod/index";

const FIXTURE = `import { cn } from "@/lib/utils";
import { cva } from "class-variance-authority";

const badge = cva("inline-flex rounded border-border/50", {
  variants: {
    tone: {
      primary: "bg-primary/10 text-primary border-primary/40 hover:border-primary/60",
      danger: ["bg-destructive/15", "border-destructive/30"],
    },
  },
  compoundVariants: [{ tone: "primary", class: "z-[60]" }],
  defaultVariants: { tone: "primary" },
});

const toneClasses = { soft: "bg-card/50 dark:bg-card/80", hard: "bg-muted/20" };

export function Panel({ open, className }: { open: boolean; className?: string }) {
  return (
    <div
      className={cn(
        "rounded-sm border border-border/30 bg-background/95 z-50",
        open ? "md:hover:bg-primary/20" : "z-[200]",
        \`ring-primary/60 \${className}\`,
        "bg-red-500 transition-all uppercase bg-primary/60",
        "bg-primary/15 hover:bg-primary/25",
      )}
      title="rounded z-50 bg-primary/10"
    />
  );
}
`;

describe("transformSource", () => {
  const result = transformSource(FIXTURE, "panel.tsx");

  test("rewrites the mechanical cases", () => {
    expect(result.fatal).toBeUndefined();
    expect(result.rewrites.map((r) => `${r.from} -> ${r.to}`)).toEqual([
      "rounded -> rounded-md",
      "border-border/50 -> border-surface",
      "bg-primary/10 -> bg-primary-wash",
      "border-primary/40 -> border-primary-soft",
      "hover:border-primary/60 -> hover:border-primary-strong",
      "bg-destructive/15 -> bg-destructive-selected",
      "border-destructive/30 -> border-destructive-soft",
      "z-[60] -> z-dialog-float",
      "bg-card/50 -> bg-card-soft",
      "dark:bg-card/80 -> dark:bg-card-elevated",
      "bg-muted/20 -> bg-muted-tint",
      "rounded-sm -> rounded-md",
      "border-border/30 -> border-hairline",
      "bg-background/95 -> bg-background-overlay",
      "z-50 -> z-modal",
      "md:hover:bg-primary/20 -> md:hover:bg-primary-selected",
      "z-[200] -> z-popover",
      "ring-primary/60 -> ring-primary-strong",
    ]);
    expect(result.output).toContain('cva("inline-flex rounded-md border-surface"');
    expect(result.output).toContain("`ring-primary-strong ${className}`");
    expect(result.output).toContain('defaultVariants: { tone: "primary" }');
  });

  test("leaves non-class strings alone", () => {
    expect(result.output).toContain('title="rounded z-50 bg-primary/10"');
  });

  test("reports what needs human judgment", () => {
    expect(result.left.map((l) => `${l.rule} ${l.text}`)).toEqual([
      "design/no-palette-hue bg-red-500",
      "design/no-transition-all transition-all",
      "design/chrome-typography uppercase",
      "design/ladder-opacity bg-primary/60",
      "design/ladder-opacity bg-primary/15",
      "design/ladder-opacity hover:bg-primary/25",
    ]);
    expect(result.output).toContain('"bg-red-500 transition-all uppercase bg-primary/60"');
    expect(result.output).toContain('"bg-primary/15 hover:bg-primary/25"');
  });

  test("is idempotent: a second pass changes nothing", () => {
    const second = transformSource(result.output, "panel.tsx");
    expect(second.rewrites).toEqual([]);
    expect(second.output).toBe(result.output);
    expect(second.left.map((l) => l.text)).toEqual(result.left.map((l) => l.text));
  });

  test("keeps a byte-order mark and rewrites the right offsets", () => {
    const withBom = transformSource(`﻿<div className="rounded z-50" />`, "bom.tsx");
    expect(withBom.output).toBe(`﻿<div className="rounded-md z-modal" />`);
  });

  test("CRLF line endings are preserved", () => {
    const crlf = transformSource(`<div
  className="rounded"
/>
`, "crlf.tsx");
    expect(crlf.output).toBe(`<div
  className="rounded-md"
/>
`);
  });

  test("clsx identifier keys are rewritten to valid quoted keys", () => {
    const once = transformSource(`const a = clsx({ rounded: on }, { rounded });\n`, "keys.ts");
    expect(once.fatal).toBeUndefined();
    expect(once.output).toBe(`const a = clsx({ "rounded-md": on }, { "rounded-md": rounded });\n`);
    const twice = transformSource(once.output, "keys.ts");
    expect(twice.fatal).toBeUndefined();
    expect(twice.rewrites).toEqual([]);
    expect(twice.output).toBe(once.output);
  });

  test("the drag-over state survives (active-deck-sidebar/section/content.tsx)", () => {
    const code = `cn("bg-card/50", canDrop && "border-primary/40 bg-primary/5", isOver && "bg-primary/10");\n`;
    expect(transformSource(code, "section.tsx").output).toBe(
      `cn("bg-card-soft", canDrop && "border-primary-soft bg-primary/5", isOver && "bg-primary-wash");\n`,
    );
  });

  test("a file that does not parse is reported, not rewritten", () => {
    const broken = transformSource(`<div className="rounded" `, "broken.tsx");
    expect(broken.fatal).toBeDefined();
    expect(broken.output).toBe(`<div className="rounded" `);
  });
});

describe("design:codemod CLI", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "design-codemod-"));
  afterAll(() => fs.rmSync(root, { recursive: true, force: true }));

  const inside = path.join(root, "target", "nested", "panel.tsx");
  const insideTs = path.join(root, "target", "tones.ts");
  const outside = path.join(root, "other", "panel.tsx");
  const nonSource = path.join(root, "target", "notes.md");
  fs.mkdirSync(path.dirname(inside), { recursive: true });
  fs.mkdirSync(path.dirname(outside), { recursive: true });

  const reset = () => {
    fs.writeFileSync(inside, FIXTURE);
    fs.writeFileSync(insideTs, `export const toneClasses = { a: "z-40 bg-success/10" };\n`);
    fs.writeFileSync(outside, FIXTURE);
    fs.writeFileSync(nonSource, `className="rounded"\n`);
  };

  const exec = (argv: string[]) => {
    const out: string[] = [];
    const err: string[] = [];
    const code = run(argv, { cwd: root, out: (l) => out.push(l), err: (l) => err.push(l) });
    return { code, out: out.join("\n"), err: err.join("\n") };
  };

  test("--dry reports but writes nothing", () => {
    reset();
    const { code, out } = exec(["--dry", "target"]);
    expect(code).toBe(0);
    expect(out).toContain("[dry] would rewrite 20 class(es) in 2 of 2 file(s).");
    expect(out).toContain("Left for human judgment: 6");
    expect(out).toContain("target/nested/panel.tsx:");
    expect(fs.readFileSync(inside, "utf8")).toBe(FIXTURE);
  });

  test("rewrites only files under the given path, and a second run is a no-op", () => {
    reset();
    expect(exec(["target"]).code).toBe(0);
    const once = fs.readFileSync(inside, "utf8");
    expect(once).toBe(transformSource(FIXTURE, "panel.tsx").output);
    expect(fs.readFileSync(insideTs, "utf8")).toBe(`export const toneClasses = { a: "z-shell bg-success-wash" };\n`);
    expect(fs.readFileSync(outside, "utf8")).toBe(FIXTURE);
    expect(fs.readFileSync(nonSource, "utf8")).toBe(`className="rounded"\n`);

    const again = exec(["target"]);
    expect(again.out).toContain("Rewrote 0 class(es) in 0 of 2 file(s).");
    expect(fs.readFileSync(inside, "utf8")).toBe(once);
  });

  test("a single file path is accepted", () => {
    reset();
    expect(exec([path.join("target", "tones.ts")]).code).toBe(0);
    expect(fs.readFileSync(insideTs, "utf8")).toContain("z-shell");
    expect(fs.readFileSync(inside, "utf8")).toBe(FIXTURE);
  });

  test("bad usage exits 2", () => {
    expect(exec([]).code).toBe(2);
    expect(exec(["missing-dir"]).code).toBe(2);
    expect(exec(["--nope", "target"]).code).toBe(2);
  });

  test("a parse error exits 1 and leaves the file untouched", () => {
    reset();
    const broken = path.join(root, "target", "broken.tsx");
    fs.writeFileSync(broken, `<div className="rounded" `);
    const { code, err } = exec(["target"]);
    fs.rmSync(broken);
    expect(code).toBe(1);
    expect(err).toContain("target/broken.tsx: parse error");
  });
});
