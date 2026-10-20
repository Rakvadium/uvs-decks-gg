import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import design, { designRules } from "./tools/eslint-design/index.mjs";

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
    // Design-system drift (docs/UI_UX_DESIGN.md). Warn-only until the sweeps land.
    // `bun run lint:design [paths]` prints just these; `bun run design:codemod` applies the mechanical fixes.
    files: ["src/**/*.{js,jsx,mjs,ts,tsx,mts}"],
    plugins: { design },
    rules: designRules("warn"),
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
  ]),
]);

export default eslintConfig;
