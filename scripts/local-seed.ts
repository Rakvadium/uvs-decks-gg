/**
 * After a local data refresh: make sure a known test account exists on the local Convex backend.
 * `--admin` also grants it the Admin role. Credentials live in .env.local (LOCAL_TEST_EMAIL,
 * LOCAL_TEST_USERNAME, LOCAL_TEST_PASSWORD) and are generated on first run.
 * Refuses to run unless .env.local targets a local deployment. See docs/local-convex.md.
 */
import { spawnSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { ConvexHttpClient } from "convex/browser";
import { anyApi } from "convex/server";
import { isLocalConvexEnv, readEnvValue, withEnvValue } from "./lib/local-env";

const ENV_PATH = ".env.local";

type Credentials = { email: string; username: string; password: string };

function ensureCredentials(envText: string): { envText: string; creds: Credentials; created: boolean } {
  const suffix = randomBytes(3).toString("hex");
  const defaults: Credentials = {
    email: `local-tester-${suffix}@example.com`,
    username: `localtester${suffix}`,
    password: `${randomBytes(12).toString("base64url")}9a`,
  };
  const keys = {
    email: "LOCAL_TEST_EMAIL",
    username: "LOCAL_TEST_USERNAME",
    password: "LOCAL_TEST_PASSWORD",
  } as const;
  let created = false;
  const creds = {} as Credentials;
  for (const field of Object.keys(keys) as (keyof Credentials)[]) {
    const existing = readEnvValue(envText, keys[field]);
    if (existing) {
      creds[field] = existing;
    } else {
      creds[field] = defaults[field];
      envText = withEnvValue(envText, keys[field], defaults[field]);
      created = true;
    }
  }
  return { envText, creds, created };
}

function errorText(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}

function convexCli(args: string[]): string {
  const result = spawnSync(process.execPath, ["x", "convex", ...args], { encoding: "utf8" });
  if (result.status !== 0) {
    throw new Error(`convex ${args[0]} failed:\n${result.stderr || result.stdout}`);
  }
  return result.stdout;
}

// `convex data` rejects larger limits.
const TABLE_ROW_LIMIT = 10000;

function readTable(table: string): Record<string, unknown>[] {
  const rows = convexCli(["data", table, "--limit", String(TABLE_ROW_LIMIT), "--format", "jsonLines"])
    .split(/\r?\n/)
    .filter((line) => line.startsWith("{"))
    .map((line) => JSON.parse(line) as Record<string, unknown>);
  if (rows.length >= TABLE_ROW_LIMIT) {
    throw new Error(`${table} has ${TABLE_ROW_LIMIT}+ rows; local-seed can't scan it with convex data.`);
  }
  return rows;
}

async function ensureAccount(client: ConvexHttpClient, creds: Credentials): Promise<"created" | "existed"> {
  try {
    await client.action(anyApi.auth.signIn, {
      provider: "password",
      params: { email: creds.email, password: creds.password, flow: "signIn" },
    });
    return "existed";
  } catch (error) {
    if (/InvalidSecret/.test(errorText(error))) {
      throw new Error(
        `${creds.email} exists but rejected LOCAL_TEST_PASSWORD. ` +
          "Delete the LOCAL_TEST_* lines from .env.local to generate a new account."
      );
    }
    if (!/InvalidAccountId/.test(errorText(error))) throw error;
  }
  await client.action(anyApi.auth.signIn, {
    provider: "password",
    params: { email: creds.email, password: creds.password, username: creds.username, flow: "signUp" },
  });
  return "created";
}

function grantAdmin(email: string): void {
  const account = readTable("authAccounts").find(
    (row) => row.provider === "password" && row.providerAccountId === email
  );
  if (!account) throw new Error(`No password account for ${email}`);
  const users = readTable("users");
  const target = users.find((row) => row._id === account.userId);
  if (target?.role === "Admin") {
    console.log("Already Admin.");
    return;
  }
  const actor = users.find((row) => row.role === "Admin" && row._id !== account.userId);
  if (!actor) throw new Error("No existing Admin in the local data to grant the role from.");
  // Local backends accept a fabricated identity; Convex Auth reads the user id from `subject`.
  const identity = JSON.stringify({
    subject: `${actor._id}|local-seed`,
    issuer: "local-seed",
    tokenIdentifier: `local-seed|${actor._id}`,
  });
  convexCli([
    "run",
    "--identity",
    identity,
    "adminUsers:setUserRole",
    JSON.stringify({ targetUserId: account.userId, role: "Admin" }),
  ]);
  console.log("Granted Admin.");
}

async function main(): Promise<void> {
  if (!existsSync(ENV_PATH)) throw new Error("No .env.local here. Run from the repo root.");
  const original = readFileSync(ENV_PATH, "utf8");
  if (!isLocalConvexEnv(original)) {
    throw new Error(
      "Refusing to seed: .env.local must have CONVEX_DEPLOYMENT=local:… and a loopback " +
        "NEXT_PUBLIC_CONVEX_URL (docs/local-convex.md)."
    );
  }
  if (process.env.CONVEX_DEPLOYMENT && !process.env.CONVEX_DEPLOYMENT.startsWith("local:")) {
    throw new Error("Refusing to seed: CONVEX_DEPLOYMENT is overridden in this shell. Open a fresh shell.");
  }

  const { envText, creds, created } = ensureCredentials(original);
  if (created) {
    writeFileSync(ENV_PATH, envText);
    console.log("Added LOCAL_TEST_EMAIL / LOCAL_TEST_USERNAME / LOCAL_TEST_PASSWORD to .env.local.");
  }

  const client = new ConvexHttpClient(readEnvValue(original, "NEXT_PUBLIC_CONVEX_URL")!);
  const outcome = await ensureAccount(client, creds);
  console.log(outcome === "created" ? `Created ${creds.email}.` : `${creds.email} already exists; password OK.`);

  if (process.argv.includes("--admin")) grantAdmin(creds.email);

  console.log("Sign in at http://tcgdecks.localhost:8090/sign-in with the LOCAL_TEST_* values in .env.local.");
}

main().catch((error) => {
  console.error(errorText(error));
  process.exit(1);
});
