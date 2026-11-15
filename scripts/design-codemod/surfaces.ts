import ts from "typescript";

export type SurfaceRewrite = { line: number; from: string; to: string };
export type SurfaceLeftover = { line: number; text: string; message: string };

type BadgeSize = "sm" | "lg";

const BADGE_SM = /^(?:text-\[10px\]|h-[45]|px-1(?:\.5)?|py-0|py-px|py-0\.5|leading-none)$/;
const BADGE_LG = /^(?:h-8|px-3|px-2\.5|text-xs)$/;
const PULSE_TONE = /^bg-muted(?:\/\d+|-(?:tint|soft|elevated|overlay))?$/;
const PULSE_DROP = (t: string) => t === "animate-pulse" || t === "rounded-md" || PULSE_TONE.test(t);

const SKELETON_IMPORT = `import { Skeleton } from "@/components/ui/skeleton";`;
const SPINNER_IMPORT = `import { Spinner } from "@/components/ui/spinner";`;

const SPINNER_SIZE: Record<string, "sm" | "md" | "lg"> = { "3": "sm", "3.5": "sm", "4": "sm", "5": "md", "6": "md", "8": "lg" };
const SPINNER_DIMENSION = /^(?:h|w|size)-(\d+(?:\.5)?)$/;
const SPINNER_DROP = (t: string) => t === "animate-spin" || SPINNER_DIMENSION.test(t) || /^m[rl]-[\d.]+$/.test(t) || t === "shrink-0";

function attribute(element: ts.JsxOpeningLikeElement, name: string): ts.JsxAttribute | undefined {
  return element.attributes.properties.find(
    (prop): prop is ts.JsxAttribute => ts.isJsxAttribute(prop) && prop.name.getText() === name
  );
}

function literalClass(attr: ts.JsxAttribute | undefined): ts.StringLiteral | undefined {
  const init = attr?.initializer;
  if (!init) return undefined;
  if (ts.isStringLiteral(init)) return init;
  if (ts.isJsxExpression(init) && init.expression && ts.isStringLiteral(init.expression)) return init.expression;
  return undefined;
}

type Edit = { start: number; end: number; text: string };

export function rewriteSurfaces(code: string, filename: string): {
  output: string;
  rewrites: SurfaceRewrite[];
  left: SurfaceLeftover[];
} {
  const kind = filename.endsWith(".tsx") || filename.endsWith(".jsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const source = ts.createSourceFile(filename, code, ts.ScriptTarget.Latest, true, kind);
  const edits: Edit[] = [];
  const rewrites: SurfaceRewrite[] = [];
  const left: SurfaceLeftover[] = [];
  let needsSkeleton = false;
  let needsSpinner = false;
  const lineOf = (node: ts.Node) => source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;

  function replaceClass(literal: ts.StringLiteral, attr: ts.JsxAttribute, kept: string[]) {
    if (kept.length === 0) edits.push({ start: attr.getFullStart(), end: attr.getEnd(), text: "" });
    else {
      const quote = code[literal.getStart(source)];
      edits.push({ start: literal.getStart(source), end: literal.getEnd(), text: `${quote}${kept.join(" ")}${quote}` });
    }
  }

  function badge(element: ts.JsxOpeningLikeElement) {
    const classAttr = attribute(element, "className");
    const literal = literalClass(classAttr);
    if (!literal || attribute(element, "size")) return;
    const tokens = literal.text.split(/\s+/).filter(Boolean);
    const size: BadgeSize | undefined = tokens.includes("h-8")
      ? "lg"
      : tokens.some((t) => t === "text-[10px]" || t === "h-5" || t === "h-4")
        ? "sm"
        : undefined;
    if (!size) return;
    const drop = size === "sm" ? BADGE_SM : BADGE_LG;
    const removed = tokens.filter((t) => drop.test(t));
    replaceClass(literal, classAttr!, tokens.filter((t) => !drop.test(t)));
    const anchor = element.tagName.getEnd();
    edits.push({ start: anchor, end: anchor, text: ` size="${size}"` });
    rewrites.push({ line: lineOf(element), from: `<Badge> ${removed.join(" ")}`, to: `size="${size}"` });
  }

  function pulse(element: ts.JsxSelfClosingElement) {
    const classAttr = attribute(element, "className");
    const literal = literalClass(classAttr);
    if (!literal) return;
    const tokens = literal.text.split(/\s+/).filter(Boolean);
    if (!tokens.includes("animate-pulse")) return;
    if (!tokens.some((t) => PULSE_TONE.test(t))) {
      left.push({ line: lineOf(element), text: literal.text, message: "animate-pulse on a non-muted fill; not a skeleton, left as is" });
      return;
    }
    const removed = tokens.filter(PULSE_DROP);
    replaceClass(literal, classAttr!, tokens.filter((t) => !PULSE_DROP(t)));
    edits.push({ start: element.tagName.getStart(source), end: element.tagName.getEnd(), text: "Skeleton" });
    needsSkeleton = true;
    rewrites.push({ line: lineOf(element), from: `<${element.tagName.getText(source)}> ${removed.join(" ")}`, to: "<Skeleton>" });
  }

  function spinner(element: ts.JsxSelfClosingElement) {
    const classAttr = attribute(element, "className");
    const literal = literalClass(classAttr);
    if (!literal) return;
    const tokens = literal.text.split(/\s+/).filter(Boolean);
    if (!tokens.includes("animate-spin")) return;
    const dimension = tokens.map((t) => t.match(SPINNER_DIMENSION)?.[1]).find(Boolean);
    const size = dimension ? SPINNER_SIZE[dimension] : "sm";
    if (!size) {
      left.push({ line: lineOf(element), text: literal.text, message: "spinner size is off the sm/md/lg ladder; left as is" });
      return;
    }
    const removed = tokens.filter(SPINNER_DROP);
    replaceClass(literal, classAttr!, tokens.filter((t) => !SPINNER_DROP(t)));
    edits.push({ start: element.tagName.getStart(source), end: element.tagName.getEnd(), text: size === "sm" ? "Spinner" : `Spinner size="${size}"` });
    needsSpinner = true;
    rewrites.push({ line: lineOf(element), from: `<Loader2> ${removed.join(" ")}`, to: size === "sm" ? "<Spinner>" : `<Spinner size="${size}">` });
  }

  const visit = (node: ts.Node) => {
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && node.tagName.getText(source) === "Badge") badge(node);
    if (ts.isJsxSelfClosingElement(node) && ["div", "span"].includes(node.tagName.getText(source))) pulse(node);
    if (ts.isJsxSelfClosingElement(node) && node.tagName.getText(source) === "Loader2") spinner(node);
    ts.forEachChild(node, visit);
  };
  visit(source);

  if (needsSkeleton && !/import\s*\{[^}]*\bSkeleton\b[^}]*\}\s*from\s*"@\/components\/ui\/skeleton"/.test(code)) {
    const imports = source.statements.filter(ts.isImportDeclaration);
    const anchor = imports.length ? imports[imports.length - 1].getEnd() : 0;
    edits.push({ start: anchor, end: anchor, text: imports.length ? `\n${SKELETON_IMPORT}` : `${SKELETON_IMPORT}\n` });
  }

  if (needsSpinner && !/import\s*\{[^}]*\bSpinner\b[^}]*\}\s*from\s*"@\/components\/ui\/spinner"/.test(code)) {
    const imports = source.statements.filter(ts.isImportDeclaration);
    const anchor = imports.length ? imports[imports.length - 1].getEnd() : 0;
    edits.push({ start: anchor, end: anchor, text: imports.length ? `\n${SPINNER_IMPORT}` : `${SPINNER_IMPORT}\n` });
  }

  edits.sort((a, b) => b.start - a.start);
  let output = code;
  for (const edit of edits) output = output.slice(0, edit.start) + edit.text + output.slice(edit.end);
  if (needsSpinner) output = dropUnusedLoader2(output);
  rewrites.sort((a, b) => a.line - b.line);
  return { output, rewrites, left };
}

function dropUnusedLoader2(code: string): string {
  const lucide = /import\s*\{([^}]*)\}\s*from\s*"lucide-react";?\n?/;
  if (/\bLoader2\b/.test(code.replace(lucide, ""))) return code;
  return code.replace(lucide, (_whole, names: string) => {
    const kept = names.split(",").map((n) => n.trim()).filter((n) => n && n !== "Loader2");
    return kept.length ? `import { ${kept.join(", ")} } from "lucide-react";\n` : "";
  });
}
