import { randomBytes } from "node:crypto";
import { exportJWK, exportPKCS8, generateKeyPair } from "jose";

export type AuthKeys = { JWT_PRIVATE_KEY: string; JWKS: string };

/** Fresh RS256 pair in the Convex Auth manual-setup format (PEM newlines folded to spaces). */
export async function generateAuthKeys(): Promise<AuthKeys> {
  const keys = await generateKeyPair("RS256", { extractable: true });
  const privateKey = await exportPKCS8(keys.privateKey);
  const publicKey = await exportJWK(keys.publicKey);
  return {
    JWT_PRIVATE_KEY: privateKey.trimEnd().replace(/\n/g, " "),
    JWKS: JSON.stringify({ keys: [{ use: "sig", ...publicKey }] }),
  };
}

export function generateAdminApiKey(): string {
  return randomBytes(32).toString("base64url");
}
