import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import design, { designRules } from "./tools/eslint-design/index.mjs";

const GEOMETRY_RULES = ["design/primitive-geometry", "design/button-focus", "design/radius-ladder"];

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  {
    rules: {
      "react-hooks/set-state-in-effect": "warn",
      "react-hooks/refs": "warn",
      "react-hooks/preserve-manual-memoization": "warn",
      "react-hooks/purity": "warn",
    },
  },
  {
    // Design-system drift (docs/UI_UX_DESIGN.md § Design lint). A rule is an error once its user-facing count is zero.
    // `bun run lint:design [paths]` prints just these; `bun run design:codemod` applies the mechanical fixes.
    files: ["src/**/*.{js,jsx,mjs,ts,tsx,mts}"],
    plugins: { design },
    rules: {
      ...designRules("warn"),
      "design/no-literal-color": "error",
      "design/no-transition-all": "error",
      "design/no-hsl-border": "error",
      ...Object.fromEntries(GEOMETRY_RULES.map((rule) => [rule, "error"])),
    },
  },
  {
    // Admin pages are outside the UI parity program, so their geometry findings stay warnings.
    files: ["src/**/admin/**", "src/**/admin-*/**", "src/**/admin-*.*"],
    rules: Object.fromEntries(GEOMETRY_RULES.map((rule) => [rule, "warn"])),
  },
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
    "shadcn-reference/**",
    "data/**",
    "convex/_generated/**",
    "scripts/**",
    ".claude/**",
  ]),
]);

export default eslintConfig;
