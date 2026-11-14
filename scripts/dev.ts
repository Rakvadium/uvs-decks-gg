/** `bun run dev`: Next dev server on PORT from .env.local (set per worktree), else 8090. */
import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { MAIN_DEV_PORT, readEnvValue } from "./lib/local-env";

const envPort = existsSync(".env.local") ? readEnvValue(readFileSync(".env.local", "utf8"), "PORT") : null;
const port = envPort || String(MAIN_DEV_PORT);

const child = spawn("next", ["dev", "-p", port, ...process.argv.slice(2)], {
  stdio: "inherit",
  shell: true,
});
child.on("exit", (code) => process.exit(code ?? 1));
