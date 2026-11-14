export const MAIN_DEV_PORT = 8090;
export const WORKTREE_PORT_RANGE = { first: 8091, last: 8099 } as const;

function stripInlineComment(value: string): string {
  const hash = value.search(/\s#/);
  return (hash === -1 ? value : value.slice(0, hash)).trim();
}

export function readEnvValue(envText: string, key: string): string | null {
  for (const line of envText.split(/\r?\n/)) {
    const match = /^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=(.*)$/.exec(line);
    if (match && match[1] === key) {
      return stripInlineComment(match[2]).replace(/^["']|["']$/g, "");
    }
  }
  return null;
}

export type DeploymentKind = "local" | "cloud" | "anonymous" | "missing";

export function deploymentKind(envText: string): DeploymentKind {
  const deployment = readEnvValue(envText, "CONVEX_DEPLOYMENT");
  if (!deployment) return "missing";
  if (deployment.startsWith("local:")) return "local";
  if (deployment.startsWith("anonymous:")) return "anonymous";
  return "cloud";
}

export function withEnvValue(envText: string, key: string, value: string): string {
  const lines = envText.split(/\r?\n/);
  const pattern = new RegExp(`^\\s*${key}\\s*=`);
  const index = lines.findIndex((line) => pattern.test(line));
  if (index !== -1) {
    lines[index] = `${key}=${value}`;
    return lines.join("\n");
  }
  const body = envText.replace(/\s*$/, "");
  return `${body}\n${key}=${value}\n`;
}

export function withPort(envText: string, port: number): string {
  return withEnvValue(envText, "PORT", String(port));
}

/** True when the env targets a `local:` deployment served from this machine. */
export function isLocalConvexEnv(envText: string): boolean {
  const url = readEnvValue(envText, "NEXT_PUBLIC_CONVEX_URL") ?? "";
  return deploymentKind(envText) === "local" && /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/?$/.test(url);
}

export function pickPort(taken: ReadonlySet<number>): number | null {
  for (let port = WORKTREE_PORT_RANGE.first; port <= WORKTREE_PORT_RANGE.last; port++) {
    if (!taken.has(port)) return port;
  }
  return null;
}
