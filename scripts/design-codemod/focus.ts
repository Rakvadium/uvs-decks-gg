import ts from "typescript";
import { attribute, classLiteral } from "./control-sizes";

export type FocusRewrite = { line: number; from: string; to: string };
export type FocusLeftover = { line: number; text: string; message: string };

/** Button's own keyboard focus ring (`buttonVariants` base in src/components/ui/button.tsx). */
export const BUTTON_FOCUS_RING =
  "outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background";

type Edit = { start: number; end: number; text: string };

/**
 * Appends Button's focus ring to the class string of each raw <button> that `design/button-focus`
 * reported. `flagged` holds the start offset of each reported `className` attribute.
 */
export function rewriteButtonFocus(code: string, filename: string, flagged: ReadonlySet<number>): {
  output: string;
  rewrites: FocusRewrite[];
  left: FocusLeftover[];
} {
  const kind = filename.endsWith(".tsx") || filename.endsWith(".jsx") ? ts.ScriptKind.TSX : ts.ScriptKind.TS;
  const source = ts.createSourceFile(filename, code, ts.ScriptTarget.Latest, true, kind);
  const edits: Edit[] = [];
  const rewrites: FocusRewrite[] = [];
  const left: FocusLeftover[] = [];

  const visit = (node: ts.Node) => {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) rewrite(node);
    ts.forEachChild(node, visit);
  };

  function rewrite(element: ts.JsxOpeningLikeElement) {
    const classAttr = attribute(element, "className");
    if (!classAttr || !flagged.has(classAttr.getStart(source))) return;
    const text = classAttr.getText(source);
    const line = source.getLineAndCharacterOfPosition(element.getStart(source)).line + 1;
    const literal = classLiteral(classAttr);
    if (!literal) {
      left.push({ line, text, message: "className is not a literal; add the focus ring by hand" });
      return;
    }
    const quote = code[literal.getStart(source)];
    const kept = literal.text.trim();
    edits.push({
      start: literal.getStart(source),
      end: literal.getEnd(),
      text: `${quote}${kept ? `${kept} ` : ""}${BUTTON_FOCUS_RING}${quote}`,
    });
    rewrites.push({ line, from: "<button> without focus-visible", to: BUTTON_FOCUS_RING });
  }

  visit(source);
  edits.sort((a, b) => b.start - a.start);
  let output = code;
  for (const edit of edits) output = output.slice(0, edit.start) + edit.text + output.slice(edit.end);
  return { output, rewrites, left };
}
