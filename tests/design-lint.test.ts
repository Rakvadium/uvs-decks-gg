import { describe, expect, test } from "bun:test";
import { Linter } from "eslint";
import design, { designRules } from "../tools/eslint-design/index.mjs";
import parser from "../tools/eslint-design/parser.mjs";
import { classifyUtility, parseToken } from "../tools/eslint-design/classify.mjs";

const config: Linter.Config[] = [
  {
    files: ["**/*.{ts,tsx}"],
    languageOptions: { parser, parserOptions: { ecmaFeatures: { jsx: true } } },
    plugins: { design },
    rules: designRules("warn"),
  },
];

type Hit = { rule: string; text: string; fix?: string };

function lint(code: string): Hit[] {
  const linter = new Linter({ configType: "flat" });
  const lines = code.split("\n");
  const at = (line: number, column: number) =>
    lines.slice(0, line - 1).reduce((n, l) => n + l.length + 1, 0) + column - 1;
  return linter.verify(code, config, "fixture.tsx").map((m) => {
    if (!m.ruleId) throw new Error(`unexpected message: ${m.message}`);
    const suggestion = m.suggestions?.[0]?.fix;
    return {
      rule: m.ruleId,
      text: code.slice(at(m.line, m.column), at(m.endLine ?? m.line, m.endColumn ?? m.column)),
      ...(suggestion ? { fix: suggestion.text } : {}),
    };
  });
}

describe("design rules: valid (no warnings)", () => {
  const valid: [string, string][] = [
    ["named ladder utilities", `<div className="bg-primary-wash hover:bg-primary-selected border-surface bg-card-soft ring-primary-strong z-modal" />`],
    ["no-named-form exceptions", `<div className="from-primary/10 border-y-border/50 text-muted-foreground/70 ring-ring/50 bg-border text-primary/80 border-t-primary/40" />`],
    ["allowed typography", `<span className="tracking-tight normal-case tracking-normal text-[10px] text-xs" />`],
    ["allowed motion", `<div className="transition-colors transition-opacity transition-none transition-[color,box-shadow] duration-150" />`],
    ["allowed radius", `<div className="rounded-md rounded-lg rounded-full rounded-none rounded-[2px] rounded-[inherit] rounded-t-xl" />`],
    ["z without a named layer", `<div className="z-10 z-20 z-0 z-[1] z-[140] -z-10" />`],
    ["solid tokens", `<div className="bg-card bg-background bg-muted bg-popover bg-primary border-border" />`],
    ["non-class strings", `const label = "rounded uppercase transition-all bg-red-500"; toast("z-50 rounded-sm");`],
    ["non-class JSX attributes", `<input placeholder="transition rounded" aria-label="uppercase" title="bg-red-500" />`],
    ["unknown call inside className", `<div className={formatLabel("uppercase rounded")} />`],
    ["clsx object values are conditions", `const x = cn({ "rounded-md": "rounded" });`],
    ["cva defaultVariants and variant keys", `cva("rounded-md", { variants: { shape: { rounded: "rounded-lg" } }, defaultVariants: { shape: "rounded" } });`],
    ["template token glued to an expression", "<div className={`bg-primary/${opacity} rounded-${size}`} />"],
    ["comments", `// className="rounded uppercase"\n<div className="rounded-md" />`],
  ];
  for (const [name, code] of valid) {
    test(name, () => expect(lint(code)).toEqual([]));
  }
});

describe("design rules: invalid", () => {
  test("className string: every category", () => {
    expect(
      lint(`<div className="bg-red-500 bg-primary/10 border-border/50 rounded transition-all uppercase z-50 text-[9px]" />`),
    ).toEqual([
      { rule: "design/no-palette-hue", text: "bg-red-500" },
      { rule: "design/ladder-opacity", text: "bg-primary/10", fix: "bg-primary-wash" },
      { rule: "design/ladder-opacity", text: "border-border/50", fix: "border-surface" },
      { rule: "design/radius-ladder", text: "rounded", fix: "rounded-md" },
      { rule: "design/no-transition-all", text: "transition-all" },
      { rule: "design/chrome-typography", text: "uppercase" },
      { rule: "design/named-z-index", text: "z-50", fix: "z-modal" },
      { rule: "design/chrome-typography", text: "text-[9px]" },
    ]);
  });

  test("palette hues across color properties", () => {
    const hits = lint(`<div className="text-emerald-400 border-amber-500/40 ring-rose-500 from-sky-500/20 via-slate-900 to-blue-600/30 fill-red-500" />`);
    expect(hits.map((h) => h.text)).toEqual([
      "text-emerald-400",
      "border-amber-500/40",
      "ring-rose-500",
      "from-sky-500/20",
      "via-slate-900",
      "to-blue-600/30",
      "fill-red-500",
    ]);
    expect(hits.every((h) => h.rule === "design/no-palette-hue" && !h.fix)).toBe(true);
  });

  test("cn(): conditionals, logical, arrays, object keys, templates", () => {
    const code = [
      "cn(",
      '  "rounded-sm",',
      '  active ? "bg-primary/20" : "bg-muted/50",',
      '  open && "z-[60]",',
      '  label || "tracking-wide",',
      '  ["border-primary/40", { "font-mono": mono, uppercase: caps }],',
      "  `bg-card/80 ${x} z-[200]`,",
      ")",
    ].join("\n");
    expect(lint(code)).toEqual([
      { rule: "design/radius-ladder", text: "rounded-sm", fix: "rounded-md" },
      { rule: "design/ladder-opacity", text: "bg-primary/20", fix: "bg-primary-selected" },
      { rule: "design/ladder-opacity", text: "bg-muted/50", fix: "bg-muted-soft" },
      { rule: "design/named-z-index", text: "z-[60]", fix: "z-dialog-float" },
      { rule: "design/chrome-typography", text: "tracking-wide" },
      { rule: "design/ladder-opacity", text: "border-primary/40", fix: "border-primary-soft" },
      { rule: "design/chrome-typography", text: "font-mono" },
      { rule: "design/chrome-typography", text: "uppercase" },
      { rule: "design/ladder-opacity", text: "bg-card/80", fix: "bg-card-elevated" },
      { rule: "design/named-z-index", text: "z-[200]", fix: "z-popover" },
    ]);
  });

  test("clsx() and twMerge() are sinks too", () => {
    expect(lint(`clsx("rounded", twMerge("transition"))`).map((h) => h.text)).toEqual(["rounded", "transition"]);
  });

  test("cva(): base, variants and compoundVariants", () => {
    const code = `cva("rounded transition-all", {
      variants: {
        tone: { primary: "bg-primary/10", danger: ["border-destructive/60", "text-red-500"] },
        size: { sm: "rounded-sm" },
      },
      compoundVariants: [{ tone: "primary", size: "sm", class: "z-40" }],
      defaultVariants: { tone: "primary" },
    })`;
    expect(lint(code)).toEqual([
      { rule: "design/radius-ladder", text: "rounded", fix: "rounded-md" },
      { rule: "design/no-transition-all", text: "transition-all" },
      { rule: "design/ladder-opacity", text: "bg-primary/10", fix: "bg-primary-wash" },
      { rule: "design/ladder-opacity", text: "border-destructive/60", fix: "border-destructive-strong" },
      { rule: "design/no-palette-hue", text: "text-red-500" },
      { rule: "design/radius-ladder", text: "rounded-sm", fix: "rounded-md" },
      { rule: "design/named-z-index", text: "z-40", fix: "z-shell" },
    ]);
  });

  test("JSX expression containers, *ClassName and classNames maps", () => {
    const code = `<>
      <div className={open ? "z-30" : undefined} />
      <Dialog overlayClassName="bg-background/80" />
      <Toaster classNames={{ toast: "rounded", title: "uppercase" }} />
    </>`;
    expect(lint(code)).toEqual([
      { rule: "design/named-z-index", text: "z-30", fix: "z-sticky" },
      { rule: "design/ladder-opacity", text: "bg-background/80", fix: "bg-background-elevated" },
      { rule: "design/radius-ladder", text: "rounded", fix: "rounded-md" },
      { rule: "design/chrome-typography", text: "uppercase" },
    ]);
  });

  test("class-named variables, properties, default params and functions", () => {
    const code = `
      const toneClasses = { ok: "bg-success/10", bad: { dot: "bg-red-500" } };
      const COLOR_CLASSES = { info: "border-info/40" };
      const item = { label: "Rounded", iconClassName: "rounded-sm" };
      function Panel({ zIndexClassName = "z-[100]" }) { return zIndexClassName; }
      function getToneClass(t: string) { if (t) return "bg-warning/20"; return "rounded"; }
      const rowClass = (on: boolean) => (on ? "bg-primary/90" : "");
    `;
    expect(lint(code)).toEqual([
      { rule: "design/ladder-opacity", text: "bg-success/10", fix: "bg-success-wash" },
      { rule: "design/no-palette-hue", text: "bg-red-500" },
      { rule: "design/ladder-opacity", text: "border-info/40", fix: "border-info-soft" },
      { rule: "design/radius-ladder", text: "rounded-sm", fix: "rounded-md" },
      { rule: "design/named-z-index", text: "z-[100]", fix: "z-chrome" },
      { rule: "design/ladder-opacity", text: "bg-warning/20", fix: "bg-warning-selected" },
      { rule: "design/radius-ladder", text: "rounded", fix: "rounded-md" },
      { rule: "design/ladder-opacity", text: "bg-primary/90", fix: "bg-primary-dim" },
    ]);
  });

  test("variants and important markers are preserved in the fix", () => {
    expect(
      lint(`<div className="hover:bg-primary/10 md:focus-visible:!border-border/30 [&:hover]:z-50 dark:bg-muted/80!" />`),
    ).toEqual([
      { rule: "design/ladder-opacity", text: "hover:bg-primary/10", fix: "hover:bg-primary-wash" },
      { rule: "design/ladder-opacity", text: "md:focus-visible:!border-border/30", fix: "md:focus-visible:!border-hairline" },
      { rule: "design/named-z-index", text: "[&:hover]:z-50", fix: "[&:hover]:z-modal" },
      { rule: "design/ladder-opacity", text: "dark:bg-muted/80!", fix: "dark:bg-muted-overlay!" },
    ]);
  });

  test("off-ladder opacities: doc-listed snaps are fixable, the rest need judgment", () => {
    expect(lint(`<div className="bg-primary/15 border-primary/25 ring-accent/50 bg-primary/60 border-primary/80 bg-primary/[0.06]" />`)).toEqual([
      { rule: "design/ladder-opacity", text: "bg-primary/15", fix: "bg-primary-selected" },
      { rule: "design/ladder-opacity", text: "border-primary/25", fix: "border-primary-soft" },
      { rule: "design/ladder-opacity", text: "ring-accent/50", fix: "ring-accent-strong" },
      { rule: "design/ladder-opacity", text: "bg-primary/60" },
      { rule: "design/ladder-opacity", text: "border-primary/80" },
      { rule: "design/ladder-opacity", text: "bg-primary/[0.06]" },
    ]);
  });

  test("collision guard: a hover that would collapse onto its base is not auto-fixed", () => {
    expect(lint(`<div className="bg-primary/15 hover:bg-primary/25 border-primary/20 hover:border-primary/40" />`)).toEqual([
      { rule: "design/ladder-opacity", text: "bg-primary/15" },
      { rule: "design/ladder-opacity", text: "hover:bg-primary/25" },
      { rule: "design/ladder-opacity", text: "border-primary/20" },
      // exact alias: identical CSS, still fixable
      { rule: "design/ladder-opacity", text: "hover:border-primary/40", fix: "hover:border-primary-soft" },
    ]);
    // the guard also sees already-named tokens and spans every string in one cn()
    expect(lint(`cn("bg-primary-selected", "hover:bg-primary/25")`)).toEqual([
      { rule: "design/ladder-opacity", text: "hover:bg-primary/25" },
    ]);
  });

  test("strings with escape sequences are reported but not fixed", () => {
    expect(lint(`<div className={"rounded\\u0020z-50"} />`)).toEqual([
      { rule: "design/radius-ladder", text: `"rounded\\u0020z-50"` },
      { rule: "design/named-z-index", text: `"rounded\\u0020z-50"` },
    ]);
  });

  test("radius: side forms and one-off px values", () => {
    expect(lint(`<div className="rounded-t rounded-bl-sm rounded-[6px] rounded-t-[8px] rounded-[0.5rem]" />`)).toEqual([
      { rule: "design/radius-ladder", text: "rounded-t", fix: "rounded-t-md" },
      { rule: "design/radius-ladder", text: "rounded-bl-sm", fix: "rounded-bl-md" },
      { rule: "design/radius-ladder", text: "rounded-[6px]" },
      { rule: "design/radius-ladder", text: "rounded-t-[8px]" },
      { rule: "design/radius-ladder", text: "rounded-[0.5rem]" },
    ]);
  });

  test("typography: tracking variants, font families, tiny text", () => {
    expect(
      lint(`<p className="tracking-wider tracking-[0.2em] tracking-tighter font-display text-[7px] text-[8.5px] text-[0.5rem]" />`).map((h) => h.text),
    ).toEqual(["tracking-wider", "tracking-[0.2em]", "tracking-tighter", "font-display", "text-[7px]", "text-[8.5px]", "text-[0.5rem]"]);
  });

  test("hsl(var(--border)) anywhere in a string", () => {
    const hits = lint(`<div style={{ borderColor: "hsl(var(--border) / 0.5)" }} className="shadow-[0_0_0_1px_hsl(var(--border))]" />`);
    expect(hits.map((h) => h.rule)).toEqual(["design/no-hsl-border", "design/no-hsl-border"]);
  });

  test("a string reached from two sinks is reported once", () => {
    expect(lint(`const buttonClasses = { className: "rounded" };`)).toEqual([
      { rule: "design/radius-ladder", text: "rounded", fix: "rounded-md" },
    ]);
  });
});

describe("classifier", () => {
  test("parseToken splits variants outside brackets", () => {
    expect(parseToken("md:[&:hover]:!bg-primary/10")).toEqual({ variants: "md:[&:hover]:", lead: "!", utility: "bg-primary/10", trail: "" });
    expect(parseToken("data-[state=open]:z-50!")).toEqual({ variants: "data-[state=open]:", lead: "", utility: "z-50", trail: "!" });
  });

  test("mapping table from docs/UI_UX_DESIGN.md § Named utilities", () => {
    const table: [string, string][] = [];
    for (const tone of ["primary", "secondary", "accent", "success", "warning", "info", "destructive"]) {
      table.push(
        [`bg-${tone}/10`, `bg-${tone}-wash`],
        [`bg-${tone}/20`, `bg-${tone}-selected`],
        [`bg-${tone}/90`, `bg-${tone}-dim`],
        [`border-${tone}/40`, `border-${tone}-soft`],
        [`border-${tone}/60`, `border-${tone}-strong`],
        [`ring-${tone}/40`, `ring-${tone}-soft`],
        [`ring-${tone}/60`, `ring-${tone}-strong`],
      );
    }
    table.push(
      ["border-border/30", "border-hairline"],
      ["border-border/40", "border-divider"],
      ["border-border/50", "border-surface"],
      ["border-border/80", "border-placeholder"],
    );
    for (const base of ["card", "background", "popover"]) {
      table.push(
        [`bg-${base}/30`, `bg-${base}-tint`],
        [`bg-${base}/50`, `bg-${base}-soft`],
        [`bg-${base}/80`, `bg-${base}-elevated`],
        [`bg-${base}/95`, `bg-${base}-overlay`],
      );
    }
    table.push(
      ["bg-muted/20", "bg-muted-tint"],
      ["bg-muted/50", "bg-muted-soft"],
      ["bg-muted/60", "bg-muted-elevated"],
      ["bg-muted/80", "bg-muted-overlay"],
      ["z-30", "z-sticky"],
      ["z-40", "z-shell"],
      ["z-50", "z-modal"],
      ["z-[60]", "z-dialog-float"],
      ["z-[100]", "z-chrome"],
      ["z-[200]", "z-popover"],
      ["z-[300]", "z-select"],
      ["z-[400]", "z-nested-overlay"],
      ["z-[410]", "z-nested-dialog"],
      ["z-[500]", "z-dock"],
      ["z-[600]", "z-drag"],
    );
    for (const [from, to] of table) expect([from, classifyUtility(from)?.replacement]).toEqual([from, to]);
  });

  test("doc snapping list (§ Snapping legacy values)", () => {
    const snaps: [string, string][] = [
      ["bg-primary/5", "bg-primary-wash"],
      ["bg-primary/8", "bg-primary-wash"],
      ["bg-primary/15", "bg-primary-selected"],
      ["bg-primary/25", "bg-primary-selected"],
      ["bg-primary/30", "bg-primary-selected"],
      ["bg-primary/50", "bg-primary-selected"],
      ["bg-primary/70", "bg-primary-dim"],
      ["bg-primary/80", "bg-primary-dim"],
      ["border-primary/20", "border-primary-soft"],
      ["border-primary/25", "border-primary-soft"],
      ["border-primary/30", "border-primary-soft"],
      ["border-primary/35", "border-primary-soft"],
      ["border-primary/50", "border-primary-strong"],
      ["ring-primary/35", "ring-primary-soft"],
      ["ring-primary/50", "ring-primary-strong"],
      // structural / surface ladders: nearest step, ties up, inside the ladder range
      ["border-border/35", "border-divider"],
      ["border-border/45", "border-surface"],
      ["bg-card/40", "bg-card-soft"],
      ["bg-card/90", "bg-card-overlay"],
      ["bg-muted/40", "bg-muted-soft"],
      ["bg-muted/70", "bg-muted-overlay"],
    ];
    for (const [from, to] of snaps) expect([from, classifyUtility(from)?.replacement]).toEqual([from, to]);
  });

  test("judgment cases carry no replacement", () => {
    for (const cls of [
      "bg-primary/40", // not in the doc's fill list
      "bg-primary/0",
      "border-primary/70",
      "border-border/60", // snapping down would lower contrast
      "border-border/70", // would land on the dashed placeholder step
      "border-border/20", // below the ladder range
      "bg-card/10",
      "bg-muted/90",
      "bg-primary/[0.1]",
      "transition",
      "uppercase",
      "rounded-[6px]",
    ]) {
      const finding = classifyUtility(cls);
      expect([cls, Boolean(finding), finding?.replacement]).toEqual([cls, true, undefined]);
    }
  });
});
