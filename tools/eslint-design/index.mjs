/**
 * Local flat-config ESLint plugin: design-system drift (docs/UI_UX_DESIGN.md).
 *
 * Every rule shares one analysis per file (cached on the Program node). Mechanical rewrites
 * are offered as suggestions, never `--fix` fixes, so `eslint --fix` leaves call sites alone;
 * `bun run design:codemod` is the only thing that applies them.
 */
import { classifyGroup, hasHslBorder, HSL_BORDER_MESSAGE, RULES } from "./classify.mjs";
import { findClassText, tokensOf } from "./extract.mjs";

const cache = new WeakMap();

/** All design findings for the file: `[{ rule, message, start, end, fix? }]`. */
export function analyze(sourceCode) {
  const program = sourceCode.ast;
  const cached = cache.get(program);
  if (cached) return cached;

  const text = sourceCode.text;
  const { groups, strings } = findClassText(program, sourceCode.visitorKeys);
  const findings = [];

  for (const group of groups) {
    const tokens = group.flatMap((node) => tokensOf(node, text));
    for (const { token, finding, replacementToken } of classifyGroup(tokens)) {
      findings.push({
        rule: finding.rule,
        message: finding.message,
        start: token.start,
        end: token.end,
        fix: replacementToken && token.fixable ? { range: [token.start, token.end], text: replacementToken } : undefined,
      });
    }
  }

  for (const node of strings) {
    const raw = text.slice(node.range[0], node.range[1]);
    if (hasHslBorder(raw)) {
      findings.push({ rule: RULES.hslBorder, message: HSL_BORDER_MESSAGE, start: node.range[0], end: node.range[1] });
    }
  }

  cache.set(program, findings);
  return findings;
}

const DESCRIPTIONS = {
  [RULES.palette]: "Disallow raw Tailwind palette hues; use semantic tokens.",
  [RULES.ladder]: "Use named ladder utilities instead of tone / border / surface opacity classes.",
  [RULES.radius]: "Disallow bare `rounded`, `rounded-sm` and one-off `rounded-[Npx]`.",
  [RULES.transition]: "Disallow `transition-all` and bare `transition`.",
  [RULES.typography]: "Disallow call-site casing, tracking, font family and sub-10px text.",
  [RULES.zIndex]: "Use named z-index utilities where one exists.",
  [RULES.hslBorder]: "Disallow `hsl(var(--border…))`; theme borders are oklch.",
};

/** @returns {import("eslint").Rule.RuleModule} */
function makeRule(id) {
  return {
    meta: {
      type: "suggestion",
      hasSuggestions: true,
      docs: { description: DESCRIPTIONS[id], url: "https://github.com/Rakvadium/uvs-decks-gg/blob/dev/docs/UI_UX_DESIGN.md" },
      schema: [],
    },
    create(context) {
      const sourceCode = context.sourceCode;
      return {
        "Program:exit"() {
          for (const f of analyze(sourceCode)) {
            if (f.rule !== id) continue;
            const fix = f.fix;
            context.report({
              loc: { start: sourceCode.getLocFromIndex(f.start), end: sourceCode.getLocFromIndex(f.end) },
              message: f.message,
              suggest: fix
                ? [{ desc: `Replace with \`${fix.text}\`.`, fix: (fixer) => fixer.replaceTextRange(fix.range, fix.text) }]
                : [],
            });
          }
        },
      };
    },
  };
}

const rules = Object.fromEntries(Object.values(RULES).map((id) => [id, makeRule(id)]));

/**
 * `{ "design/<rule>": severity }` for every rule.
 * @param {"off" | "warn" | "error"} [severity]
 * @returns {import("eslint").Linter.RulesRecord}
 */
export function designRules(severity = "warn") {
  return Object.fromEntries(Object.keys(rules).map((id) => [`design/${id}`, severity]));
}

/** @type {import("eslint").ESLint.Plugin} */
const plugin = {
  meta: { name: "design", version: "0.1.0" },
  rules,
};

export default plugin;
