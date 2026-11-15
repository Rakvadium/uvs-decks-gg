import ts from "typescript";
import { cornerTab } from "./corners";

type Step = { px: number; text: string; icon: string };

const LADDER: readonly Step[] = [
  { px: 28, text: "xs", icon: "icon-xs" },
  { px: 32, text: "sm", icon: "icon-sm" },
  { px: 40, text: "md", icon: "icon" },
  { px: 48, text: "lg", icon: "icon-lg" },
];

const DEFAULT_SIZE = "md";

const HEIGHT = /^h-(\d+(?:\.\d+)?)$/;
const WIDTH = /^w-(\d+(?:\.\d+)?)$/;
const SQUARE = /^size-(\d+(?:\.\d+)?)$/;
const RADIUS = /^rounded(?:-(?:none|xs|sm|md|lg|xl|2xl|3xl|full))?$/;
const CORNER_RADIUS = /^rounded-(?:[tblrse]|tl|tr|bl|br|ss|se|es|ee)(?:-|$)/;

export type ControlRewrite = { line: number; from: string; to: string };
export type ControlLeftover = { line: number; text: string; message: string };

export type ControlPass = "buttons" | "inputs";

const PASS_TAGS: Record<ControlPass, Record<string, { icons: boolean }>> = {
  buttons: { Button: { icons: true } },
  inputs: { Input: { icons: false }, SelectTrigger: { icons: false } },
};

const LEGACY_DEFAULT_SIZE = "default";

function snap(px: number): Step {
  const md = LADDER.find((step) => step.text === DEFAULT_SIZE)!.px;
  const rank = (step: Step) => [Math.abs(step.px - px), Math.abs(step.px - md)];
  return [...LADDER].sort((a, b) => {
    const [da, ma] = rank(a);
    const [db, mb] = rank(b);
    return da - db || ma - mb;
  })[0];
}

export function attribute(element: ts.JsxOpeningLikeElement, name: string): ts.JsxAttribute | undefined {
  return element.attributes.properties.find(
    (prop): prop is ts.JsxAttribute => ts.isJsxAttribute(prop) && prop.name.getText() === name
  );
}

// Only the first argument of cn() is unconditional, so later arguments are never rewritten.
export function classLiteral(attr: ts.JsxAttribute | undefined): ts.StringLiteral | ts.NoSubstitutionTemplateLiteral | undefined {
  const init = attr?.initializer;
  if (!init) return undefined;
  if (ts.isStringLiteral(init)) return init;
  if (!ts.isJsxExpression(init) || !init.expression) return undefined;
  const expr = init.expression;
  if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) return expr;
  if (ts.isCallExpression(expr) && ts.isIdentifier(expr.expression) && expr.expression.text === "cn") {
    const first = expr.arguments[0];
    if (first && (ts.isStringLiteral(first) || ts.isNoSubstitutionTemplateLiteral(first))) return first;
  }
  return undefined;
}

function sizeLiteral(attr: ts.JsxAttribute | undefined): string | undefined | null {
  if (!attr) return undefined;
  const init = attr.initializer;
  if (init && ts.isStringLiteral(init)) return init.text;
  if (init && ts.isJsxExpression(init) && init.expression && ts.isStringLiteral(init.expression)) return init.expression.text;
  return null;
}

type Edit = { start: number; end: number; text: string };

export function rewriteControlSizes(code: string, filename: string, pass: ControlPass): {
  output: string;
  rewrites: ControlRewrite[];
  left: ControlLeftover[];
} {
  const tags = PASS_TAGS[pass];
  const kind = filename.endsWith(".tsx") || filename.endsWith(".jsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const source = ts.createSourceFile(filename, code, ts.ScriptTarget.Latest, true, kind);
  const edits: Edit[] = [];
  const rewrites: ControlRewrite[] = [];
  const left: ControlLeftover[] = [];
  const lineOf = (node: ts.Node) => source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;

  const visit = (node: ts.Node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = node.tagName.getText(source);
      if (tags[tag]) rewriteElement(node, tag, tags[tag].icons);
    }
    ts.forEachChild(node, visit);
  };

  function rewriteElement(element: ts.JsxOpeningLikeElement, tag: string, icons: boolean) {
    const classAttr = attribute(element, "className");
    const literal = classLiteral(classAttr);
    const sizeAttr = attribute(element, "size");
    const rawSize = sizeLiteral(sizeAttr);
    const legacyDefault = rawSize === LEGACY_DEFAULT_SIZE;
    const size = legacyDefault ? undefined : rawSize;
    const line = lineOf(element);

    if (!literal) {
      const text = classAttr?.getText(source) ?? "";
      if (/(^|[\s"'`])(?:h|w|size)-\d|(^|[\s"'`])rounded\b/.test(text)) {
        left.push({ line, text, message: `className is not a literal; rewrite the ${tag} size by hand` });
      }
      return;
    }

    const allTokens = literal.text.split(/\s+/).filter(Boolean);
    const tab = icons ? cornerTab(allTokens) : null;
    const shapeAttr = attribute(element, "shape");
    if (tab && shapeAttr) {
      left.push({ line, text: literal.text, message: "corner tab on a Button that already sets shape; left as is" });
      return;
    }
    const tokens = tab ? allTokens.filter((t) => !tab.drop.includes(t)) : allTokens;
    if (tokens.some((t) => CORNER_RADIUS.test(t))) {
      left.push({ line, text: literal.text, message: "corner-only radius is a shape, not a size; left as is" });
      return;
    }

    const height = tokens.map((t) => t.match(HEIGHT)?.[1]).find(Boolean);
    const width = tokens.map((t) => t.match(WIDTH)?.[1]).find(Boolean);
    const square = tokens.map((t) => t.match(SQUARE)?.[1]).find(Boolean);
    const hasRadius = tokens.some((t) => RADIUS.test(t));
    if (!height && !square && !hasRadius && !legacyDefault && !tab) return;

    if (size === null) {
      left.push({ line, text: `${sizeAttr!.getText(source)} ${literal.text}`, message: `size is not a literal; rewrite the ${tag} size by hand` });
      return;
    }

    const isIcon = icons && (Boolean(square) || (size ?? "").startsWith("icon") || (height !== undefined && height === width));
    const overrideUnits = square ?? height;
    const step = overrideUnits ? snap(Number(overrideUnits) * 4) : undefined;
    const nextSize = step ? (isIcon ? step.icon : step.text) : (size ?? DEFAULT_SIZE);

    const drop = (t: string) => RADIUS.test(t) || SQUARE.test(t) || (step !== undefined && HEIGHT.test(t)) || (isIcon && WIDTH.test(t));
    const removed = [...(tab?.drop ?? []), ...tokens.filter(drop)];
    const keptText = tokens.filter((t) => !drop(t)).join(" ");

    const quote = code[literal.getStart(source)];
    const insideCn = ts.isCallExpression(literal.parent);
    edits.push(
      !insideCn && keptText === ""
        ? { start: classAttr!.getFullStart(), end: classAttr!.getEnd(), text: "" }
        : { start: literal.getStart(source), end: literal.getEnd(), text: `${quote}${keptText}${quote}` }
    );

    if (legacyDefault || nextSize !== (size ?? DEFAULT_SIZE)) {
      if (!sizeAttr) {
        edits.push(insertAttribute(element, `size="${nextSize}"`));
      } else if (nextSize === DEFAULT_SIZE) {
        edits.push({ start: sizeAttr.getFullStart(), end: sizeAttr.getEnd(), text: "" });
      } else {
        edits.push({ start: sizeAttr.getStart(source), end: sizeAttr.getEnd(), text: `size="${nextSize}"` });
      }
    }

    if (tab) edits.push(insertAttribute(element, `shape="${tab.shape}"`));

    const fromSize = rawSize ? `size="${rawSize}"` : "(default)";
    rewrites.push({ line, from: `${fromSize} ${removed.join(" ")}`, to: `size="${nextSize}"${tab ? ` shape="${tab.shape}"` : ""}` });
  }

  function insertAttribute(element: ts.JsxOpeningLikeElement, text: string): Edit {
    const first = element.attributes.properties[0];
    const tagLine = source.getLineAndCharacterOfPosition(element.tagName.getEnd()).line;
    if (first && source.getLineAndCharacterOfPosition(first.getStart(source)).line > tagLine) {
      const start = first.getStart(source);
      const indent = code.slice(code.lastIndexOf("\n", start) + 1, start);
      const newline = code.includes("\r\n") ? "\r\n" : "\n";
      return { start, end: start, text: `${text}${newline}${indent}` };
    }
    const anchor = element.tagName.getEnd();
    return { start: anchor, end: anchor, text: ` ${text}` };
  }

  visit(source);

  edits.sort((a, b) => b.start - a.start);
  let output = code;
  for (const edit of edits) output = output.slice(0, edit.start) + edit.text + output.slice(edit.end);
  rewrites.sort((a, b) => a.line - b.line);
  return { output, rewrites, left };
}
