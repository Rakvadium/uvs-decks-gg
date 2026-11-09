/**
 * The typescript-eslint parser `bun run lint` already uses, taken from eslint-config-next so the
 * codemod parses exactly like lint does without a separate dependency.
 */
import nextTs from "eslint-config-next/typescript";

const parser = nextTs.find((config) => config.languageOptions?.parser)?.languageOptions.parser;
if (!parser) throw new Error("eslint-config-next/typescript no longer exposes a parser; update tools/eslint-design/parser.mjs");

export default parser;
