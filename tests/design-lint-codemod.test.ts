import { afterAll, describe, expect, test } from "bun:test";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { run, transformSource } from "../scripts/design-codemod/index";
import { BUTTON_FOCUS_RING } from "../scripts/design-codemod/focus";
import { buttonVariants } from "../src/components/ui/button";

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

describe("Button size overrides", () => {
  const rewrite = (jsx: string) => transformSource(`const a = (
  ${jsx}
);
`, "buttons.tsx");

  test('size="icon-sm" className="h-7 w-7" becomes size="icon-xs"', () => {
    const result = rewrite(`<Button size="icon-sm" className="h-7 w-7" aria-label="Edit" />`);
    expect(result.output).toBe(`const a = (
  <Button size="icon-xs" aria-label="Edit" />
);
`);
    expect(result.rewrites.map((r) => `${r.from} -> ${r.to}`)).toEqual(['size="icon-sm" h-7 w-7 -> size="icon-xs"']);
  });

  test("heights snap to 28/32/40/48 with ties going to md, and radius overrides go", () => {
    const cases: [string, string][] = [
      [`<Button size="sm" className="h-7 text-xs">a</Button>`, `<Button size="xs" className="text-xs">a</Button>`],
      [`<Button size="icon" className="h-8 w-8" />`, `<Button size="icon-sm" />`],
      [`<Button size="sm" className={cn("h-9 gap-1.5", open && "ring-2")}>a</Button>`, `<Button className={cn("gap-1.5", open && "ring-2")}>a</Button>`],
      [`<Button className="h-11 px-6">a</Button>`, `<Button className="px-6">a</Button>`],
      [`<Button size="sm" className="h-12">a</Button>`, `<Button size="lg">a</Button>`],
      [`<Button size="icon" className="size-9 rounded-md" />`, `<Button size="icon" />`],
      [`<Button variant="ghost" size="icon" className="rounded-sm" />`, `<Button variant="ghost" size="icon" />`],
    ];
    for (const [from, to] of cases) expect(rewrite(from).output).toBe(`const a = (
  ${to}
);
`);
  });

  test("a corner-tab radius pair becomes shape tab-tl or tab-tr", () => {
    const cases: [string, string][] = [
      [
        `<Button size="icon" className="h-7 w-7 rounded-bl-none rounded-br-md rounded-tl-md rounded-tr-none border" />`,
        `<Button shape="tab-tl" size="icon-xs" className="border" />`,
      ],
      [`<Button variant="outline" size="icon" className="h-9 w-9 rounded-none rounded-bl-xl rounded-tr-xl" />`, `<Button shape="tab-tr" variant="outline" size="icon" />`],
    ];
    for (const [from, to] of cases) expect(rewrite(from).output).toBe(`const a = (
  ${to}
);
`);
  });

  test("corner radii, computed sizes and computed classes are reported, not rewritten", () => {
    const corner = rewrite(`<Button size="icon" className="rounded-none rounded-tl-lg" />`);
    const computedSize = rewrite(`<Button size={size} className="h-7" />`);
    const computedClass = rewrite("<Button className={`h-7 ${extra}`} />");
    for (const result of [corner, computedSize, computedClass]) {
      expect(result.rewrites.filter((r) => r.to.startsWith("size="))).toEqual([]);
    }
    expect(computedSize.left.map((l) => l.rule)).toEqual(["button/size-override"]);
    expect(computedClass.left.map((l) => l.rule)).toEqual(["button/size-override"]);
    expect(corner.left.map((l) => l.rule)).toEqual(["button/size-override", "design/radius-ladder"]);
    expect(corner.output).toContain('size="icon"');
  });

  test("a second pass changes nothing", () => {
    const once = rewrite(`<Button size="icon-sm" className="h-7 w-7 shrink-0" />`);
    const twice = transformSource(once.output, "buttons.tsx");
    expect(twice.rewrites).toEqual([]);
    expect(twice.output).toBe(once.output);
  });
});

describe("surface pass", () => {
  const surfaces = (code: string) => transformSource(code, "surfaces.tsx", { only: "surfaces" });

  test("Badge text-[10px] and h-5 snap to size sm, h-8 to size lg", () => {
    const result = surfaces(`const a = <>
  <Badge variant="outline" className="h-5 px-1.5 text-[10px] font-normal">x</Badge>
  <Badge className="text-[10px]">y</Badge>
  <Badge variant="outline" className="h-8 shrink-0 px-2.5">z</Badge>
  <Badge size="sm" className="text-[10px]">kept</Badge>
</>;
`);
    expect(result.output).toBe(`const a = <>
  <Badge size="sm" variant="outline" className="font-normal">x</Badge>
  <Badge size="sm">y</Badge>
  <Badge size="lg" variant="outline" className="shrink-0">z</Badge>
  <Badge size="sm" className="text-[10px]">kept</Badge>
</>;
`);
  });

  test("muted pulse divs become Skeleton, with the import added once", () => {
    const result = surfaces(`import { cn } from "@/lib/utils";
const a = <div>
  <div className="h-6 w-40 animate-pulse rounded-md bg-muted" />
  <span className="size-8 animate-pulse rounded-full bg-muted-overlay" />
  <div className="size-2 animate-pulse rounded-full bg-success" />
</div>;
`);
    expect(result.output).toBe(`import { cn } from "@/lib/utils";
import { Skeleton } from "@/components/ui/skeleton";
const a = <div>
  <Skeleton className="h-6 w-40" />
  <Skeleton className="size-8 rounded-full" />
  <div className="size-2 animate-pulse rounded-full bg-success" />
</div>;
`);
    expect(result.left.map((l) => l.text)).toEqual(["size-2 animate-pulse rounded-full bg-success"]);
    expect(surfaces(result.output).rewrites).toEqual([]);
  });
});

describe("Input and SelectTrigger size pass", () => {
  const rewrite = (jsx: string) => transformSource(`const a = (
  ${jsx}
);
`, "inputs.tsx", { only: "inputs" });

  test("snaps height overrides onto the size prop and keeps widths", () => {
    const cases: [string, string][] = [
      [`<Input className="h-8 w-56 text-sm" />`, `<Input size="sm" className="w-56 text-sm" />`],
      [`<Input className="h-10" />`, `<Input />`],
      [`<Input className="h-7 min-w-0" />`, `<Input size="xs" className="min-w-0" />`],
      [`<Input className="h-12 pl-10" />`, `<Input size="lg" className="pl-10" />`],
      [`<SelectTrigger size="sm" className="h-8 w-full text-[10px]" />`, `<SelectTrigger size="sm" className="w-full text-[10px]" />`],
      [`<SelectTrigger id="f" className="h-10 w-full" size="default" />`, `<SelectTrigger id="f" className="w-full" />`],
      [`<SelectTrigger className="h-6 rounded-sm" />`, `<SelectTrigger size="xs" />`],
    ];
    for (const [from, to] of cases) expect(rewrite(from).output).toBe(`const a = (
  ${to}
);
`);
  });

  test("a multi-line element gets the size on its own line", () => {
    const from = `const a = (
  <Input
    value={v}
    className="h-8 text-sm"
  />
);
`;
    expect(transformSource(from, "inputs.tsx", { only: "inputs" }).output).toBe(
      `const a = (
  <Input
    size="sm"
    value={v}
    className="text-sm"
  />
);
`
    );
  });

  test("leaves Button alone and reports computed classes", () => {
    expect(rewrite(`<Button className="h-7" />`).rewrites).toEqual([]);
    expect(rewrite("<Input className={`h-8 ${extra}`} />").left.map((l) => l.rule)).toEqual(["input/size-override"]);
  });

  test("a second pass changes nothing", () => {
    const once = rewrite(`<SelectTrigger size="default" className="h-8 w-28" />`);
    const twice = transformSource(once.output, "inputs.tsx", { only: "inputs" });
    expect(twice.rewrites).toEqual([]);
    expect(twice.output).toBe(once.output);
  });
});

describe("radius pass", () => {
  const rewrite = (code: string) => transformSource(code, "radius.tsx", { only: "radius" });

  test("corner-tab pairs become rounded-tab-tl or rounded-tab-tr and off-ladder radii snap to rounded-md", () => {
    const result = rewrite(`const a = cn("absolute top-0", "rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none", "border");
const b = <div className="rounded-none rounded-tr-xl rounded-bl-xl bg-card rounded-sm z-50 bg-primary/10" />;
`);
    expect(result.output).toBe(`const a = cn("absolute top-0", "rounded-tab-tl", "border");
const b = <div className="rounded-tab-tr bg-card rounded-md z-50 bg-primary/10" />;
`);
    expect(result.left).toEqual([]);
  });

  test("leaves Button corners to the --buttons pass and lists radii that need judgment", () => {
    const code = `const a = <><Button className="rounded-tl-lg rounded-br-lg" /><div className="rounded-2xl rounded-tl-xl" /></>;
`;
    const result = rewrite(code);
    expect(result.output).toBe(code);
    expect(result.left.map((l) => l.text)).toEqual(["rounded-tl-lg", "rounded-br-lg", "rounded-2xl", "rounded-tl-xl"]);
  });

  test("a second pass changes nothing", () => {
    const once = rewrite(`const a = <div className="rounded-tr-lg rounded-bl-lg rounded" />;
`);
    expect(rewrite(once.output).rewrites).toEqual([]);
  });
});

describe("focus pass", () => {
  const rewrite = (code: string) => transformSource(code, "focus.tsx", { only: "focus" });

  test("the ring it adds is Button's own focus ring", () => {
    const base = buttonVariants({ variant: null, size: null, shape: null }).split(" ");
    for (const token of BUTTON_FOCUS_RING.split(" ")) expect(base).toContain(token);
  });

  test("adds Button's ring to raw buttons the lint reports, in a literal or the first cn() argument", () => {
    const result = rewrite(`const a = <>
  <button type="button" className="p-2" />
  <button className={cn("flex", on && "bg-card")} />
  <button className="focus-visible:ring-2" />
  <button className={cn("p-2", className)} />
  <div className="p-2" />
</>;
`);
    expect(result.output).toBe(`const a = <>
  <button type="button" className="p-2 ${BUTTON_FOCUS_RING}" />
  <button className={cn("flex ${BUTTON_FOCUS_RING}", on && "bg-card")} />
  <button className="focus-visible:ring-2" />
  <button className={cn("p-2", className)} />
  <div className="p-2" />
</>;
`);
    expect(rewrite(result.output).rewrites).toEqual([]);
  });

  test("a flagged button whose classes are not a leading literal is listed", () => {
    const result = rewrite(`const base = "p-2";
const a = <button className={cn(base, "flex")} />;
`);
    expect(result.rewrites).toEqual([]);
    expect(result.left.map((l) => l.rule)).toEqual(["design/button-focus"]);
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

  test("--buttons rewrites only Button overrides", () => {
    reset();
    const buttons = path.join(root, "target", "buttons.tsx");
    fs.writeFileSync(buttons, `const a = <Button size="icon-sm" className="h-7 w-7 bg-primary/10" />;
`);
    const { code, out } = exec(["--buttons", "target"]);
    const written = fs.readFileSync(buttons, "utf8");
    fs.rmSync(buttons);
    expect(code).toBe(0);
    expect(out).toContain("Rewrote 1 class(es) in 1 of 3 file(s).");
    expect(written).toBe(`const a = <Button size="icon-xs" className="bg-primary/10" />;
`);
    expect(fs.readFileSync(inside, "utf8")).toBe(FIXTURE);
  });

  test("bad usage exits 2", () => {
    expect(exec(["--buttons", "--inputs", "target"]).code).toBe(2);
    expect(exec(["--inputs", "--surfaces", "target"]).code).toBe(2);
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
