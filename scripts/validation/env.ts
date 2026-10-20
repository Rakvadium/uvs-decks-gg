/**
 * Sets a validation backend's Convex env vars: `bun scripts/validation/env.ts --app-port P`.
 * Every value is generated here; nothing is copied from production. Secrets are kept in
 * <backend dir>/backend-env.json (outside the repo) so restarts reuse them, and they are sent to
 * the CLI over stdin, never argv or logs.
 */
import fs from "node:fs";
import path from "node:path";
import { runConvex } from "./convex";
import { generateAdminApiKey, generateAuthKeys } from "./keys";
import { backendDir, defaultValidationRoot, parseAppPort } from "./ports";

export type BackendSecrets = { JWT_PRIVATE_KEY: string; JWKS: string; ADMIN_API_KEY: string };

export const R2_PLACEHOLDERS = {
  R2_BUCKET: "uvs-validation-placeholder",
  R2_ENDPOINT: "http://127.0.0.1:9",
  R2_ACCESS_KEY_ID: "validation-placeholder",
  R2_SECRET_ACCESS_KEY: "validation-placeholder",
};

export function buildBackendEnv(appPort: number, secrets: BackendSecrets): Record<string, string> {
  return {
    ...secrets,
    UVS_VALIDATION_BACKEND: "1",
    SITE_URL: `http://localhost:${parseAppPort(appPort)}`,
    MODERATION_IMAGE_PROVIDER: "stub",
    TEXT_MODERATION_PROVIDER: "stub",
    ...R2_PLACEHOLDERS,
  };
}

export function secretsPath(appPort: number, root = defaultValidationRoot()): string {
  return path.join(backendDir(appPort, root), "backend-env.json");
}

export async function loadOrCreateSecrets(appPort: number, root = defaultValidationRoot()): Promise<BackendSecrets> {
  const file = secretsPath(appPort, root);
  if (fs.existsSync(file)) return JSON.parse(fs.readFileSync(file, "utf8")) as BackendSecrets;
  const secrets: BackendSecrets = { ...(await generateAuthKeys()), ADMIN_API_KEY: generateAdminApiKey() };
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, JSON.stringify(secrets, null, 2), { mode: 0o600 });
  return secrets;
}

export async function applyBackendEnv(appPort: number): Promise<void> {
  const env = buildBackendEnv(appPort, await loadOrCreateSecrets(appPort));
  for (const [name, value] of Object.entries(env)) {
    const code = await runConvex(["--app-port", String(appPort), "env", "set", name], {
      input: value,
      quiet: true,
    });
    if (code !== 0) throw new Error(`Setting ${name} on the port ${appPort} backend failed (exit ${code})`);
  }
  console.error(`[validation] set ${Object.keys(env).length} env vars on the port ${appPort} backend: ${Object.keys(env).join(", ")}`);
}

if (import.meta.main) {
  const i = process.argv.indexOf("--app-port");
  try {
    await applyBackendEnv(parseAppPort(i === -1 ? process.env.UVS_APP_PORT : process.argv[i + 1]));
  } catch (err) {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  }
}
