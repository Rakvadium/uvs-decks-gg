import { afterEach, beforeEach, describe, expect, test } from "bun:test";
import type { Id } from "../convex/_generated/dataModel";
import {
  AGENT_LOGIN_CODE_TTL_MS,
  consume,
  isAgentPersonaEmail,
  mintCode,
  sha256Hex,
} from "../convex/agentLogin";
import { agentCodeProvider } from "../convex/auth";
import AgentLoginPage from "../src/app/agent-login/page";
import { isAgentLoginPageEnabled } from "../src/lib/agent-auth";
import { parseAgentLoginFragment, sanitizeAgentLoginNextPath, stripFragment } from "../src/lib/agent-auth-shared";
import {
  buildLoginUrl,
  parseMintLoginArgs,
  parseMintOutput,
} from "../scripts/validation/mint-login";

type Row = Record<string, unknown> & { _id: string };

/** Minimal in-memory db covering the calls agentLogin.ts makes. */
function makeDb(seed: { users?: Row[]; agentLoginCodes?: Row[] } = {}) {
  const tables: Record<string, Map<string, Row>> = {
    users: new Map((seed.users ?? []).map((r) => [r._id, { ...r }])),
    agentLoginCodes: new Map((seed.agentLoginCodes ?? []).map((r) => [r._id, { ...r }])),
  };
  let nextId = 0;
  const tableOf = (id: string) => {
    for (const rows of Object.values(tables)) if (rows.has(id)) return rows;
    return null;
  };
  const db = {
    get: async (id: string) => tableOf(id)?.get(id) ?? null,
    insert: async (table: string, doc: Record<string, unknown>) => {
      const _id = `${table}_${++nextId}`;
      tables[table].set(_id, { ...doc, _id, _creationTime: 0 });
      return _id;
    },
    patch: async (id: string, fields: Record<string, unknown>) => {
      const row = tableOf(id)?.get(id);
      if (!row) throw new Error(`patch: missing ${id}`);
      for (const [k, v] of Object.entries(fields)) {
        if (v === undefined) delete row[k];
        else row[k] = v;
      }
    },
    delete: async (id: string) => {
      tableOf(id)?.delete(id);
    },
    query: (table: string) => ({
      withIndex: (
        _name: string,
        build: (q: {
          eq: (field: string, value: unknown) => unknown;
          lte: (field: string, value: number) => unknown;
        }) => unknown,
      ) => {
        const conds: Array<(r: Row) => boolean> = [];
        const q = {
          eq(field: string, value: unknown) {
            conds.push((r) => r[field] === value);
            return q;
          },
          lte(field: string, value: number) {
            conds.push((r) => (r[field] as number) <= value);
            return q;
          },
        };
        build(q);
        const rows = () => [...tables[table].values()].filter((r) => conds.every((c) => c(r)));
        return {
          first: async () => rows()[0] ?? null,
          take: async (n: number) => rows().slice(0, n),
        };
      },
    }),
  };
  return { ctx: { db }, tables };
}

type Handler = (ctx: unknown, args: unknown) => Promise<unknown>;
const handlerOf = (fn: unknown) => (fn as { _handler: Handler })._handler;
const mint = (ctx: unknown, args: { persona?: string } = {}) =>
  handlerOf(mintCode)(ctx, args) as Promise<{ code: string; email: string; expiresAt: number }>;
const redeem = (ctx: unknown, code: string) =>
  handlerOf(consume)(ctx, { code }) as Promise<Id<"users"> | null>;

const authorize = (agentCodeProvider as unknown as {
  options: { authorize: (params: Record<string, unknown>, ctx: unknown) => Promise<unknown> };
}).options.authorize;

const ENV_KEYS = [
  "UVS_VALIDATION_BACKEND",
  "CONVEX_CLOUD_URL",
  "NODE_ENV",
  "VERCEL",
  "NEXT_PUBLIC_CONVEX_URL",
] as const;
let saved: Record<string, string | undefined> = {};
const env = process.env as Record<string, string | undefined>;
function setEnv(values: Partial<Record<(typeof ENV_KEYS)[number], string | undefined>>) {
  for (const [k, v] of Object.entries(values)) {
    if (v === undefined) delete env[k];
    else env[k] = v;
  }
}
const LOCAL = { UVS_VALIDATION_BACKEND: "1", CONVEX_CLOUD_URL: "http://127.0.0.1:3404" };
const CLOUD = { UVS_VALIDATION_BACKEND: "1", CONVEX_CLOUD_URL: "https://example-123.convex.cloud" };

beforeEach(() => {
  saved = Object.fromEntries(ENV_KEYS.map((k) => [k, env[k]]));
  setEnv(LOCAL);
});
afterEach(() => setEnv(saved));

const withNow = async <T>(now: number, fn: () => Promise<T>): Promise<T> => {
  const real = Date.now;
  Date.now = () => now;
  try {
    return await fn();
  } finally {
    Date.now = real;
  }
};

describe("agentLogin gate", () => {
  test("mintCode and consume are internal functions", () => {
    for (const fn of [mintCode, consume]) {
      expect((fn as unknown as { isInternal?: boolean }).isInternal).toBe(true);
      expect((fn as unknown as { isPublic?: boolean }).isPublic).toBeUndefined();
    }
  });

  for (const [name, values] of [
    ["a cloud URL, even with UVS_VALIDATION_BACKEND=1", CLOUD],
    ["a missing flag", { UVS_VALIDATION_BACKEND: undefined, CONVEX_CLOUD_URL: LOCAL.CONVEX_CLOUD_URL }],
    ["a missing CONVEX_CLOUD_URL", { UVS_VALIDATION_BACKEND: "1", CONVEX_CLOUD_URL: undefined }],
  ] as const) {
    test(`mintCode and consume throw, and authorize returns null, on ${name}`, async () => {
      const { ctx, tables } = makeDb();
      const { code } = await mint(ctx);
      setEnv(values);
      await expect(mint(ctx)).rejects.toThrow(/validation backend/);
      await expect(redeem(ctx, code)).rejects.toThrow(/validation backend/);
      let calls = 0;
      const actionCtx = { runMutation: async () => (calls++, "users_1") };
      expect(await authorize({ code }, actionCtx)).toBeNull();
      expect(calls).toBe(0);
      expect(tables.agentLoginCodes.size).toBe(1);
    });
  }

  test("authorize passes a string code to consume on a validation backend", async () => {
    const seen: unknown[] = [];
    const actionCtx = {
      runMutation: async (_fn: unknown, args: unknown) => (seen.push(args), "users_1"),
    };
    expect(await authorize({ code: "abc" }, actionCtx)).toEqual({ userId: "users_1" });
    expect(seen).toEqual([{ code: "abc" }]);
    expect(await authorize({ code: 42 }, actionCtx)).toBeNull();
    expect(await authorize({}, actionCtx)).toBeNull();
    expect(seen).toHaveLength(1);
    const rejecting = { runMutation: async () => null };
    expect(await authorize({ code: "abc" }, rejecting)).toBeNull();
  });
});

describe("agentLogin.mintCode", () => {
  test("creates the reserved persona and stores only the code's hash, valid for 60s", async () => {
    const { ctx, tables } = makeDb();
    const minted = await withNow(1_000_000, () => mint(ctx));
    expect(minted.code).toMatch(/^[A-Za-z0-9_-]{43}$/);
    expect(minted.email).toBe("agent@validation.invalid");
    expect(minted.expiresAt).toBe(1_000_000 + AGENT_LOGIN_CODE_TTL_MS);
    const [user] = [...tables.users.values()];
    expect(user).toMatchObject({ email: "agent@validation.invalid", username: "agent" });
    expect(user.role).toBeUndefined();
    const [row] = [...tables.agentLoginCodes.values()];
    expect(row.codeHash).toBe(await sha256Hex(minted.code));
    expect(JSON.stringify(row)).not.toContain(minted.code);
    expect(row).toMatchObject({ userId: user._id, email: user.email, expiresAt: minted.expiresAt });
  });

  test("normalizes the persona, reuses the user, and forces its role empty", async () => {
    const { ctx, tables } = makeDb({
      users: [{ _id: "u_bot", email: "bot-1@validation.invalid", username: "bot-1", role: "Admin" }],
    });
    const minted = await mint(ctx, { persona: "  Bot-1 " });
    expect(minted.email).toBe("bot-1@validation.invalid");
    expect(tables.users.size).toBe(1);
    expect(tables.users.get("u_bot")?.role).toBeUndefined();
    expect(await redeem(ctx, minted.code)).toBe("u_bot" as Id<"users">);
  });

  test("codes are unique per mint", async () => {
    const { ctx } = makeDb();
    const a = await mint(ctx);
    const b = await mint(ctx);
    expect(a.code).not.toBe(b.code);
  });

  test("rejects personas that are not a plain reserved local part", async () => {
    const { ctx, tables } = makeDb();
    for (const persona of ["", "a@b", "x@validation.invalid", "-bot", "bot-", "a".repeat(21), "bot.1", "bot+1"]) {
      await expect(mint(ctx, { persona })).rejects.toThrow(/Invalid persona/);
    }
    expect(tables.users.size).toBe(0);
  });

  test("refuses a persona whose username belongs to a non-reserved account", async () => {
    const { ctx, tables } = makeDb({ users: [{ _id: "u_real", email: "real@example.com", username: "agent" }] });
    await expect(mint(ctx)).rejects.toThrow(/another account/);
    expect(tables.agentLoginCodes.size).toBe(0);
  });

  test("prunes expired codes", async () => {
    const { ctx, tables } = makeDb();
    await withNow(1_000, () => mint(ctx));
    await withNow(1_000 + AGENT_LOGIN_CODE_TTL_MS + 1, () => mint(ctx));
    expect(tables.agentLoginCodes.size).toBe(1);
  });
});

describe("agentLogin.consume", () => {
  test("is single use", async () => {
    const { ctx, tables } = makeDb();
    const { code } = await mint(ctx);
    const userId = await redeem(ctx, code);
    expect(userId).not.toBeNull();
    expect(tables.agentLoginCodes.size).toBe(0);
    expect(await redeem(ctx, code)).toBeNull();
  });

  test("an expired code fails and is burned", async () => {
    const { ctx, tables } = makeDb();
    const { code, expiresAt } = await withNow(5_000, () => mint(ctx));
    expect(await withNow(expiresAt, () => redeem(ctx, code))).toBeNull();
    expect(tables.agentLoginCodes.size).toBe(0);
    expect(await withNow(5_001, () => redeem(ctx, code))).toBeNull();
  });

  test("a code still works just before expiry", async () => {
    const { ctx } = makeDb();
    const { code, expiresAt } = await withNow(5_000, () => mint(ctx));
    expect(await withNow(expiresAt - 1, () => redeem(ctx, code))).not.toBeNull();
  });

  test("a mismatched user (email changed or role granted) fails and burns the code", async () => {
    for (const change of [{ email: "agent@example.com" }, { email: "other@validation.invalid" }, { role: "Admin" }]) {
      const { ctx, tables } = makeDb();
      const { code } = await mint(ctx);
      const [user] = [...tables.users.values()];
      Object.assign(user, change);
      expect(await redeem(ctx, code)).toBeNull();
      expect(tables.agentLoginCodes.size).toBe(0);
      Object.assign(user, { email: "agent@validation.invalid" });
      delete user.role;
      expect(await redeem(ctx, code)).toBeNull();
    }
  });

  test("a deleted user fails and burns the code", async () => {
    const { ctx, tables } = makeDb();
    const { code } = await mint(ctx);
    tables.users.clear();
    expect(await redeem(ctx, code)).toBeNull();
    expect(tables.agentLoginCodes.size).toBe(0);
  });

  test("rejects codes pointing at non-reserved users", async () => {
    const code = "A".repeat(43);
    const codeHash = await sha256Hex(code);
    for (const email of ["player@example.com", "agent@localhost.dev", "bot@run.validation.invalid"]) {
      const { ctx, tables } = makeDb({
        users: [{ _id: "u_x", email }],
        agentLoginCodes: [{ _id: "c_1", codeHash, userId: "u_x", email, expiresAt: Date.now() + 60_000 }],
      });
      expect(await redeem(ctx, code)).toBeNull();
      expect(tables.agentLoginCodes.size).toBe(0);
    }
  });

  test("unknown and malformed codes return null without touching stored codes", async () => {
    const { ctx, tables } = makeDb();
    const { code } = await mint(ctx);
    for (const wrong of ["", "short", `${code}x`, code.slice(0, 42), "B".repeat(43)]) {
      expect(await redeem(ctx, wrong)).toBeNull();
    }
    expect(tables.agentLoginCodes.size).toBe(1);
    expect(await redeem(ctx, code)).not.toBeNull();
  });

  test("isAgentPersonaEmail accepts only <persona>@validation.invalid", () => {
    expect(isAgentPersonaEmail("agent@validation.invalid")).toBe(true);
    expect(isAgentPersonaEmail("bot-2@validation.invalid")).toBe(true);
    for (const email of ["Agent@validation.invalid", "a@x.validation.invalid", "@validation.invalid", "agent@localhost.dev", undefined]) {
      expect(isAgentPersonaEmail(email)).toBe(false);
    }
  });
});

describe("/agent-login page gate", () => {
  const DEV = { NODE_ENV: "development", VERCEL: undefined, NEXT_PUBLIC_CONVEX_URL: "http://127.0.0.1:3404" };

  test("enabled only under development, off Vercel, with a loopback Convex URL", () => {
    setEnv(DEV);
    expect(isAgentLoginPageEnabled()).toBe(true);
    expect(isAgentLoginPageEnabled({ ...DEV, NEXT_PUBLIC_CONVEX_URL: "http://localhost:3404" })).toBe(true);
    for (const override of [
      { NEXT_PUBLIC_CONVEX_URL: "https://example-123.convex.cloud" },
      { NEXT_PUBLIC_CONVEX_URL: "http://192.168.1.5:3404" },
      { NEXT_PUBLIC_CONVEX_URL: undefined },
      { NODE_ENV: "production" },
      { VERCEL: "1" },
    ]) {
      expect(isAgentLoginPageEnabled({ ...DEV, ...override })).toBe(false);
    }
  });

  const notFoundDigest = (fn: () => unknown): string | null => {
    try {
      fn();
      return null;
    } catch (err) {
      return String((err as { digest?: unknown }).digest ?? "");
    }
  };

  test("the page 404s on a non-loopback deployment", () => {
    setEnv({ ...DEV, NEXT_PUBLIC_CONVEX_URL: "https://example-123.convex.cloud" });
    expect(notFoundDigest(() => AgentLoginPage())).toContain("404");
    setEnv({ ...DEV, VERCEL: "1" });
    expect(notFoundDigest(() => AgentLoginPage())).toContain("404");
    setEnv(DEV);
    expect(notFoundDigest(() => AgentLoginPage())).toBeNull();
  });
});

describe("agent login URL", () => {
  test("parseAgentLoginFragment reads the code and a safe next path", () => {
    const code = "A".repeat(43);
    expect(parseAgentLoginFragment(`#code=${code}&next=%2Fgallery`)).toEqual({ code, nextPath: "/gallery" });
    expect(parseAgentLoginFragment(`#code=${code}`)).toEqual({ code, nextPath: "/home" });
    expect(parseAgentLoginFragment("#code=bad&next=//evil.com")).toEqual({ code: null, nextPath: "/home" });
    expect(parseAgentLoginFragment("")).toEqual({ code: null, nextPath: "/home" });
  });

  test("stripFragment removes the fragment from every string in a history state", () => {
    const hash = `#code=${"C".repeat(43)}&next=/decks`;
    const state = {
      __NA: true,
      __PRIVATE_NEXTJS_INTERNALS_TREE: {
        tree: ["", { children: ["agent-login", { children: ["__PAGE__", {}, `/agent-login${hash}`, "refetch"] }] }],
        url: `http://localhost:8152/agent-login${hash}`,
      },
    };
    const clean = stripFragment(state, hash);
    expect(JSON.stringify(clean)).not.toContain("C".repeat(43));
    expect(clean).toEqual({
      __NA: true,
      __PRIVATE_NEXTJS_INTERNALS_TREE: {
        tree: ["", { children: ["agent-login", { children: ["__PAGE__", {}, "/agent-login", "refetch"] }] }],
        url: "http://localhost:8152/agent-login",
      },
    });
    expect(JSON.stringify(state)).toContain("C".repeat(43));
    expect(stripFragment(null, hash)).toBeNull();
    expect(stripFragment(state, "")).toBe(state);
  });

  test("sanitizeAgentLoginNextPath blocks open redirects", () => {
    expect(sanitizeAgentLoginNextPath("/gallery")).toBe("/gallery");
    for (const bad of ["//evil.com", "/\\evil.com", "https://evil.com", "/x?u=https://e", "/a\nb", "decks", undefined]) {
      expect(sanitizeAgentLoginNextPath(bad)).toBe("/home");
    }
  });

  test("mint-login builds a fragment-only URL", () => {
    const code = "A-_".repeat(14) + "A";
    const url = new URL(buildLoginUrl(8152, code, "/decks"));
    expect(url.origin).toBe("http://localhost:8152");
    expect(url.pathname).toBe("/agent-login");
    expect(url.search).toBe("");
    expect(parseAgentLoginFragment(url.hash)).toEqual({ code, nextPath: "/decks" });
  });

  test("mint-login parses its flags and the mint output", () => {
    expect(parseMintLoginArgs(["--", "--app-port", "8152", "--persona", "bot-1", "--next=/gallery"])).toEqual({
      appPortFlag: "8152",
      persona: "bot-1",
      next: "/gallery",
    });
    expect(parseMintLoginArgs([])).toEqual({ appPortFlag: undefined, persona: undefined, next: "/decks" });
    expect(() => parseMintLoginArgs(["--next", "https://evil.com"])).toThrow(/same-origin/);
    expect(() => parseMintLoginArgs(["--persona"])).toThrow(/needs a value/);
    expect(() => parseMintLoginArgs(["--prod"])).toThrow(/Unknown argument/);
    const out = `{\n  "code": "abc",\n  "email": "agent@validation.invalid",\n  "expiresAt": 1\n}\n`;
    expect(parseMintOutput(out)).toEqual({ code: "abc", email: "agent@validation.invalid", expiresAt: 1 });
    expect(() => parseMintOutput("Error")).toThrow(/Unexpected/);
  });
});
