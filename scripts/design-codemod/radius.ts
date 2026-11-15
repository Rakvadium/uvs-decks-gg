import ts from "typescript";
import { GEOMETRY_PRIMITIVES } from "../../tools/eslint-design/classify.mjs";
import { cornerTab } from "./corners";

export type RadiusRewrite = { line: number; from: string; to: string };

type Edit = { start: number; end: number; text: string };

function classNameOwner(node: ts.Node): ts.JsxOpeningLikeElement | undefined {
  for (let n: ts.Node | undefined = node.parent; n; n = n.parent) {
    if (ts.isJsxAttribute(n)) {
      if (n.name.getText() !== "className") return undefined;
      const owner = n.parent.parent;
      return ts.isJsxOpeningElement(owner) || ts.isJsxSelfClosingElement(owner) ? owner : undefined;
    }
    if (ts.isJsxElement(n) || ts.isJsxSelfClosingElement(n) || ts.isFunctionLike(n)) return undefined;
  }
  return undefined;
}

/**
 * Turns a hand-built corner tab (`rounded-tl-lg rounded-br-lg rounded-tr-none rounded-bl-none`) in a
 * class string into `rounded-tab-tl` or `rounded-tab-tr`. Strings in the className of a primitive
 * that owns its radius are left to the --buttons pass, which sets `shape` instead.
 */
export function rewriteCornerTabs(code: string, filename: string): { output: string; rewrites: RadiusRewrite[] } {
  const kind = filename.endsWith(".tsx") || filename.endsWith(".jsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const source = ts.createSourceFile(filename, code, ts.ScriptTarget.Latest, true, kind);
  const edits: Edit[] = [];
  const rewrites: RadiusRewrite[] = [];

  const visit = (node: ts.Node) => {
    if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) rewrite(node);
    ts.forEachChild(node, visit);
  };

  function rewrite(literal: ts.StringLiteral | ts.NoSubstitutionTemplateLiteral) {
    const tokens = literal.text.split(/\s+/).filter(Boolean);
    const tab = cornerTab(tokens);
    if (!tab) return;
    const owner = classNameOwner(literal);
    if (owner && Object.hasOwn(GEOMETRY_PRIMITIVES, owner.tagName.getText(source))) return;
    const first = tokens.findIndex((t) => tab.drop.includes(t));
    const kept = tokens.flatMap((t, i) => (i === first ? [`rounded-${tab.shape}`] : tab.drop.includes(t) ? [] : [t]));
    const quote = code[literal.getStart(source)];
    edits.push({ start: literal.getStart(source), end: literal.getEnd(), text: `${quote}${kept.join(" ")}${quote}` });
    const line = source.getLineAndCharacterOfPosition(literal.getStart(source)).line + 1;
    rewrites.push({ line, from: tab.drop.join(" "), to: `rounded-${tab.shape}` });
  }

  visit(source);
  edits.sort((a, b) => b.start - a.start);
  let output = code;
  for (const edit of edits) output = output.slice(0, edit.start) + edit.text + output.slice(edit.end);
  return { output, rewrites };
}
