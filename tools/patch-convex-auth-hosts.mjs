import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";

const targetPath = path.join(
  process.cwd(),
  "node_modules",
  "@convex-dev",
  "auth",
  "dist",
  "server",
  "utils.js"
);

if (!existsSync(targetPath)) {
  process.exit(0);
}

const file = readFileSync(targetPath, "utf8");

if (file.includes("hostWithoutPort === \"localhost\"")) {
  process.exit(0);
}

const replacement = `export function isLocalHost(host) {
    const normalizedHost = (host ?? "").toLowerCase();
    const hostWithoutPort = normalizedHost.startsWith("[")
        ? normalizedHost.slice(1, normalizedHost.indexOf("]"))
        : normalizedHost.split(":")[0];
    return hostWithoutPort === "localhost" ||
        hostWithoutPort === "127.0.0.1" ||
        hostWithoutPort === "::1" ||
        hostWithoutPort.endsWith(".local") ||
        /^10\\./.test(hostWithoutPort) ||
        /^192\\.168\\./.test(hostWithoutPort) ||
        /^172\\.(1[6-9]|2\\d|3[0-1])\\./.test(hostWithoutPort);
}
`;

const patched = file.replace(
  /export function isLocalHost\(host\) \{[\s\S]*?\n\}/,
  replacement.trimEnd()
);

if (patched === file) {
  throw new Error("Failed to patch @convex-dev/auth isLocalHost implementation.");
}

writeFileSync(targetPath, patched, "utf8");
