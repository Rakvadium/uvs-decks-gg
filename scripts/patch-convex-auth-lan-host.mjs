import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const MARKER = "192 && second === 168";

const REPLACEMENT = `export function isLocalHost(host) {
    const raw = (host ?? "").trim().toLowerCase();
    if (!raw) {
        return false;
    }
    let hostname = raw;
    if (hostname.startsWith("[")) {
        const end = hostname.indexOf("]");
        if (end !== -1) {
            hostname = hostname.slice(1, end);
        }
    }
    else {
        const colon = hostname.lastIndexOf(":");
        if (colon !== -1 && /^\\d+$/.test(hostname.slice(colon + 1))) {
            hostname = hostname.slice(0, colon);
        }
    }
    if (hostname === "localhost" || hostname === "127.0.0.1" || hostname === "::1") {
        return true;
    }
    const match = /^(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})\\.(\\d{1,3})$/.exec(hostname);
    if (!match) {
        return false;
    }
    const first = Number(match[1]);
    const second = Number(match[2]);
    const third = Number(match[3]);
    const fourth = Number(match[4]);
    if ([first, second, third, fourth].some((octet) => Number.isNaN(octet) || octet > 255)) {
        return false;
    }
    if (first === 10 || first === 127) {
        return true;
    }
    if (first === 192 && second === 168) {
        return true;
    }
    if (first === 172 && second >= 16 && second <= 31) {
        return true;
    }
    if (first === 169 && second === 254) {
        return true;
    }
    return false;
}
`;

const target = join(process.cwd(), "node_modules", "@convex-dev", "auth", "dist", "server", "utils.js");

if (!existsSync(target)) {
  process.exit(0);
}

const source = readFileSync(target, "utf8");
if (source.includes(MARKER)) {
  process.exit(0);
}

const next = source.replace(/export function isLocalHost\(host\) \{[\s\S]*?\n\}/, REPLACEMENT.trimEnd());
if (next === source) {
  throw new Error("Could not patch @convex-dev/auth isLocalHost");
}

writeFileSync(target, `${next}\n`);
