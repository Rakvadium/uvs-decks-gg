import ts from "typescript";

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

export type ButtonRewrite = { line: number; from: string; to: string };
export type ButtonLeftover = { line: number; text: string; message: string };

function snap(px: number): Step {
  const md = LADDER.find((step) => step.text === DEFAULT_SIZE)!.px;
  const rank = (step: Step) => [Math.abs(step.px - px), Math.abs(step.px - md)];
  return [...LADDER].sort((a, b) => {
    const [da, ma] = rank(a);
    const [db, mb] = rank(b);
    return da - db || ma - mb;
  })[0];
}

function attribute(element: ts.JsxOpeningLikeElement, name: string): ts.JsxAttribute | undefined {
  return element.attributes.properties.find(
    (prop): prop is ts.JsxAttribute => ts.isJsxAttribute(prop) && prop.name.getText() === name
  );
}

// Only the first argument of cn() is unconditional, so later arguments are never rewritten.
function classLiteral(attr: ts.JsxAttribute | undefined): ts.StringLiteral | ts.NoSubstitutionTemplateLiteral | undefined {
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

export function rewriteButtonSizes(code: string, filename: string): {
  output: string;
  rewrites: ButtonRewrite[];
  left: ButtonLeftover[];
} {
  const kind = filename.endsWith(".tsx") || filename.endsWith(".jsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const source = ts.createSourceFile(filename, code, ts.ScriptTarget.Latest, true, kind);
  const edits: Edit[] = [];
  const rewrites: ButtonRewrite[] = [];
  const left: ButtonLeftover[] = [];
  const lineOf = (node: ts.Node) => source.getLineAndCharacterOfPosition(node.getStart(source)).line + 1;

  const visit = (node: ts.Node) => {
    if ((ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) && node.tagName.getText(source) === "Button") {
      rewriteElement(node);
    }
    ts.forEachChild(node, visit);
  };

  function rewriteElement(element: ts.JsxOpeningLikeElement) {
    const classAttr = attribute(element, "className");
    const literal = classLiteral(classAttr);
    const sizeAttr = attribute(element, "size");
    const size = sizeLiteral(sizeAttr);
    const line = lineOf(element);

    if (!literal) {
      const text = classAttr?.getText(source) ?? "";
      if (/(^|[\s"'`])(?:h|w|size)-\d|(^|[\s"'`])rounded\b/.test(text)) {
        left.push({ line, text, message: "className is not a literal; rewrite the Button size by hand" });
      }
      return;
    }

    const tokens = literal.text.split(/\s+/).filter(Boolean);
    if (tokens.some((t) => CORNER_RADIUS.test(t))) {
      left.push({ line, text: literal.text, message: "corner-only radius is a shape, not a size; left as is" });
      return;
    }

    const height = tokens.map((t) => t.match(HEIGHT)?.[1]).find(Boolean);
    const width = tokens.map((t) => t.match(WIDTH)?.[1]).find(Boolean);
    const square = tokens.map((t) => t.match(SQUARE)?.[1]).find(Boolean);
    const hasRadius = tokens.some((t) => RADIUS.test(t));
    if (!height && !square && !hasRadius) return;

    if (size === null) {
      left.push({ line, text: `${sizeAttr!.getText(source)} ${literal.text}`, message: "size is not a literal; rewrite the Button size by hand" });
      return;
    }

    const isIcon = Boolean(square) || (size ?? "").startsWith("icon") || (height !== undefined && height === width);
    const overrideUnits = square ?? height;
    const step = overrideUnits ? snap(Number(overrideUnits) * 4) : undefined;
    const nextSize = step ? (isIcon ? step.icon : step.text) : (size ?? DEFAULT_SIZE);

    const drop = (t: string) => RADIUS.test(t) || SQUARE.test(t) || (step !== undefined && HEIGHT.test(t)) || (isIcon && WIDTH.test(t));
    const removed = tokens.filter(drop);
    const keptText = tokens.filter((t) => !drop(t)).join(" ");

    const quote = code[literal.getStart(source)];
    const insideCn = ts.isCallExpression(literal.parent);
    edits.push(
      !insideCn && keptText === ""
        ? { start: classAttr!.getFullStart(), end: classAttr!.getEnd(), text: "" }
        : { start: literal.getStart(source), end: literal.getEnd(), text: `${quote}${keptText}${quote}` }
    );

    if (nextSize !== (size ?? DEFAULT_SIZE)) {
      if (!sizeAttr) {
        const anchor = element.tagName.getEnd();
        edits.push({ start: anchor, end: anchor, text: ` size="${nextSize}"` });
      } else if (nextSize === DEFAULT_SIZE) {
        edits.push({ start: sizeAttr.getFullStart(), end: sizeAttr.getEnd(), text: "" });
      } else {
        edits.push({ start: sizeAttr.getStart(source), end: sizeAttr.getEnd(), text: `size="${nextSize}"` });
      }
    }

    const fromSize = size ? `size="${size}"` : "(default)";
    rewrites.push({ line, from: `${fromSize} ${removed.join(" ")}`, to: `size="${nextSize}"` });
  }

  visit(source);

  edits.sort((a, b) => b.start - a.start);
  let output = code;
  for (const edit of edits) output = output.slice(0, edit.start) + edit.text + output.slice(edit.end);
  rewrites.sort((a, b) => a.line - b.line);
  return { output, rewrites, left };
}
