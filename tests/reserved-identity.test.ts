import { describe, expect, test } from "bun:test";
import type { Doc, Id } from "../convex/_generated/dataModel";
import { ensureAdminForAction } from "../convex/admin";
import { listDirectory, setAccountStatus, setUserRole } from "../convex/adminUsers";
import passwordProvider from "../convex/auth";
import {
  buildAdminSearchText,
  isAdminRole,
  isEffectiveAdmin,
} from "../convex/lib/accountStatus";
import { isReservedAgentEmail, isReservedAgentUser } from "../convex/lib/reservedIdentity";
import { isAdminForUserId } from "../convex/user";
import { requireAdmin } from "../convex/utils/validation";

type User = Doc<"users">;

function makeUser(id: string, overrides: Partial<User> = {}): User {
  const user = {
    _id: id as Id<"users">,
    _creationTime: 0,
    accountStatus: "active",
    ...overrides,
  } as User;
  return { ...user, adminSearchText: buildAdminSearchText(user) };
}

const admin = () => makeUser("u_admin", { email: "owner@example.com", role: "Admin" });
const admin2 = () => makeUser("u_admin2", { email: "mod@example.com", role: "Admin" });
const normal = () => makeUser("u_normal", { email: "player@example.com" });
const reservedAdmin = () =>
  makeUser("u_reserved", { email: "bot-1@validation.invalid", role: "Admin" });
const legacyAgentAdmin = () =>
  makeUser("u_legacy", { email: "agent@localhost.dev", role: "Admin" });
const reservedUser = () => makeUser("u_reserved_user", { email: "bot-2@validation.invalid" });

/** Minimal in-memory ctx covering the db/auth calls the admin gates make. */
function makeCtx(users: User[], authUserId?: string) {
  const byId = new Map(users.map((u) => [u._id as string, u]));
  const inserts: Array<{ table: string; doc: unknown }> = [];
  const ctx = {
    auth: {
      getUserIdentity: async () =>
        authUserId ? { subject: `${authUserId}|session`, tokenIdentifier: "t", issuer: "i" } : null,
    },
    scheduler: {},
    db: {
      get: async (id: string) => byId.get(id) ?? null,
      patch: async (id: string, fields: Partial<User>) => {
        const u = byId.get(id);
        if (u) Object.assign(u, fields);
      },
      insert: async (table: string, doc: unknown) => {
        inserts.push({ table, doc });
        return `${table}_${inserts.length}`;
      },
      query: () => ({
        withIndex: (
          _name: string,
          build: (q: { eq: (field: string, value: unknown) => unknown }) => unknown,
        ) => {
          const conds: Array<[string, unknown]> = [];
          const q = {
            eq(field: string, value: unknown) {
              conds.push([field, value]);
              return q;
            },
          };
          build(q);
          const rows = [...byId.values()].filter((u) =>
            conds.every(([f, v]) => (u as Record<string, unknown>)[f] === v),
          );
          return { collect: async () => rows };
        },
        withSearchIndex: (
          _name: string,
          build: (q: {
            search: (field: string, term: string) => unknown;
            eq: (field: string, value: unknown) => unknown;
          }) => unknown,
        ) => {
          const conds: Array<(u: Record<string, unknown>) => boolean> = [];
          const q = {
            search(field: string, term: string) {
              conds.push((u) => String(u[field] ?? "").includes(term.toLowerCase()));
              return q;
            },
            eq(field: string, value: unknown) {
              conds.push((u) => u[field] === value);
              return q;
            },
          };
          build(q);
          const rows = [...byId.values()].filter((u) =>
            conds.every((c) => c(u as Record<string, unknown>)),
          );
          return {
            paginate: async () => ({ page: rows, isDone: true, continueCursor: "" }),
          };
        },
        order: () => ({
          paginate: async () => ({
            page: [...byId.values()],
            isDone: true,
            continueCursor: "",
          }),
        }),
      }),
    },
  };
  return { ctx, byId, inserts };
}

type Handler = (ctx: unknown, args: unknown) => Promise<unknown>;
function handlerOf(fn: unknown): Handler {
  return (fn as { _handler: Handler })._handler;
}

const profile = (passwordProvider as unknown as {
  options: { profile: (params: Record<string, unknown>, ctx: unknown) => unknown };
}).options.profile;

describe("isReservedAgentEmail / isReservedAgentUser", () => {
  test("matches the validation.invalid domain (any case, whitespace, subdomain)", () => {
    expect(isReservedAgentEmail("bot@validation.invalid")).toBe(true);
    expect(isReservedAgentEmail("  Bot@Validation.Invalid ")).toBe(true);
    expect(isReservedAgentEmail("bot@run-1.validation.invalid")).toBe(true);
    expect(isReservedAgentEmail("bot@validation.invalid.")).toBe(true);
  });

  test("matches the legacy agent email only for local part agent", () => {
    expect(isReservedAgentEmail("agent@localhost.dev")).toBe(true);
    expect(isReservedAgentEmail("AGENT@LOCALHOST.DEV")).toBe(true);
    expect(isReservedAgentEmail("someone@localhost.dev")).toBe(false);
  });

  test("matches plus-addressed legacy agent variants without reserving the domain", () => {
    expect(isReservedAgentEmail("agent+anything@localhost.dev")).toBe(true);
    expect(isReservedAgentEmail("Agent+Run-42@LocalHost.dev")).toBe(true);
    expect(isReservedAgentEmail("agent+@localhost.dev")).toBe(true);
    expect(isReservedAgentEmail("notagent+x@localhost.dev")).toBe(false);
    expect(isReservedAgentEmail("agentx@localhost.dev")).toBe(false);
    expect(isReservedAgentEmail("agent.x@localhost.dev")).toBe(false);
    expect(isReservedAgentEmail("x+agent@localhost.dev")).toBe(false);
    expect(isReservedAgentEmail("agent+x@example.com")).toBe(false);
  });

  test("does not match normal or malformed emails", () => {
    expect(isReservedAgentEmail("player@example.com")).toBe(false);
    expect(isReservedAgentEmail("agent@example.com")).toBe(false);
    expect(isReservedAgentEmail("bot@notvalidation.invalid")).toBe(false);
    expect(isReservedAgentEmail("bot@validation.invalid.example.com")).toBe(false);
    expect(isReservedAgentEmail("validation.invalid")).toBe(false);
    expect(isReservedAgentEmail("@validation.invalid")).toBe(false);
    expect(isReservedAgentEmail("")).toBe(false);
    expect(isReservedAgentEmail(undefined)).toBe(false);
    expect(isReservedAgentEmail(42)).toBe(false);
  });

  test("isReservedAgentUser reads the user email", () => {
    expect(isReservedAgentUser(reservedUser())).toBe(true);
    expect(isReservedAgentUser(normal())).toBe(false);
    expect(isReservedAgentUser({})).toBe(false);
    expect(isReservedAgentUser(null)).toBe(false);
    expect(isReservedAgentUser(undefined)).toBe(false);
  });
});

describe("isEffectiveAdmin", () => {
  test("normal admins stay admins; non-admins stay non-admins", () => {
    expect(isEffectiveAdmin(admin())).toBe(true);
    expect(isEffectiveAdmin(makeUser("u_noemail", { role: "Admin" }))).toBe(true);
    expect(isEffectiveAdmin(normal())).toBe(false);
    expect(isEffectiveAdmin(null)).toBe(false);
  });

  test("reserved accounts are never admin, even with the Admin role", () => {
    expect(isAdminRole(reservedAdmin().role)).toBe(true);
    expect(isEffectiveAdmin(reservedAdmin())).toBe(false);
    expect(isEffectiveAdmin(legacyAgentAdmin())).toBe(false);
  });
});

describe("requireAdmin", () => {
  test("allows a normal admin", async () => {
    const { ctx } = makeCtx([admin()], "u_admin");
    expect(await requireAdmin(ctx as never)).toBe("u_admin" as Id<"users">);
  });

  test("rejects normal users and unauthenticated callers", async () => {
    await expect(requireAdmin(makeCtx([normal()], "u_normal").ctx as never)).rejects.toThrow(
      "Admin role required",
    );
    await expect(requireAdmin(makeCtx([admin()]).ctx as never)).rejects.toThrow(
      "Not authenticated",
    );
  });

  test("rejects reserved accounts holding the Admin role", async () => {
    await expect(
      requireAdmin(makeCtx([reservedAdmin()], "u_reserved").ctx as never),
    ).rejects.toThrow("Admin role required");
    await expect(
      requireAdmin(makeCtx([legacyAgentAdmin()], "u_legacy").ctx as never),
    ).rejects.toThrow("Admin role required");
  });

  test("still rejects an inactive admin", async () => {
    const banned = makeUser("u_banned", { email: "x@example.com", role: "Admin", accountStatus: "banned" });
    await expect(requireAdmin(makeCtx([banned], "u_banned").ctx as never)).rejects.toThrow(
      "Admin access requires an active account",
    );
  });
});

describe("ensureAdminForAction", () => {
  const run = handlerOf(ensureAdminForAction);

  test("allows a normal admin", async () => {
    const { ctx } = makeCtx([admin()]);
    expect(await run(ctx, { userId: "u_admin" })).toBeNull();
  });

  test("rejects normal users and reserved admins", async () => {
    await expect(run(makeCtx([normal()]).ctx, { userId: "u_normal" })).rejects.toThrow(
      "Admin role required",
    );
    await expect(run(makeCtx([reservedAdmin()]).ctx, { userId: "u_reserved" })).rejects.toThrow(
      "Admin role required",
    );
    await expect(run(makeCtx([legacyAgentAdmin()]).ctx, { userId: "u_legacy" })).rejects.toThrow(
      "Admin role required",
    );
  });
});

describe("isAdminForUserId", () => {
  const run = handlerOf(isAdminForUserId);

  test("true for a normal admin, false for everyone else", async () => {
    const { ctx } = makeCtx([admin(), normal(), reservedAdmin(), legacyAgentAdmin()]);
    expect(await run(ctx, { userId: "u_admin" })).toBe(true);
    expect(await run(ctx, { userId: "u_normal" })).toBe(false);
    expect(await run(ctx, { userId: "u_reserved" })).toBe(false);
    expect(await run(ctx, { userId: "u_legacy" })).toBe(false);
    expect(await run(ctx, { userId: "u_missing" })).toBe(false);
  });
});

describe("setUserRole", () => {
  const run = handlerOf(setUserRole);

  test("promotes and demotes normal users as before", async () => {
    const { ctx, byId, inserts } = makeCtx([admin(), normal()], "u_admin");
    await run(ctx, { targetUserId: "u_normal", role: "Admin" });
    expect(byId.get("u_normal")?.role).toBe("Admin");
    await run(ctx, { targetUserId: "u_normal", role: "user" });
    expect(byId.get("u_normal")?.role).toBeUndefined();
    expect(inserts.length).toBe(2);
  });

  test("refuses to promote a reserved user to Admin", async () => {
    const { ctx, byId, inserts } = makeCtx([admin(), reservedUser()], "u_admin");
    await expect(run(ctx, { targetUserId: "u_reserved_user", role: "Admin" })).rejects.toThrow(
      "Reserved test accounts cannot be promoted to Admin.",
    );
    expect(byId.get("u_reserved_user")?.role).toBeUndefined();
    expect(inserts.length).toBe(0);
  });

  test("allows demoting a reserved account that already holds the Admin role", async () => {
    const { ctx, byId } = makeCtx([admin(), reservedAdmin()], "u_admin");
    await run(ctx, { targetUserId: "u_reserved", role: "user" });
    expect(byId.get("u_reserved")?.role).toBeUndefined();
  });

  test("reserved admins do not count toward the last-admin guard", async () => {
    const { ctx } = makeCtx([admin(), reservedAdmin()], "u_admin");
    await expect(run(ctx, { targetUserId: "u_admin", role: "user" })).rejects.toThrow(
      "The last admin cannot be demoted.",
    );
  });

  test("a second real admin can still be demoted", async () => {
    const { ctx, byId } = makeCtx([admin(), admin2()], "u_admin");
    await run(ctx, { targetUserId: "u_admin2", role: "user" });
    expect(byId.get("u_admin2")?.role).toBeUndefined();
  });

  test("a reserved admin cannot call it at all", async () => {
    const { ctx } = makeCtx([reservedAdmin(), normal()], "u_reserved");
    await expect(run(ctx, { targetUserId: "u_normal", role: "Admin" })).rejects.toThrow(
      "Admin role required",
    );
  });
});

describe("setAccountStatus", () => {
  const run = handlerOf(setAccountStatus);

  test("a reserved admin can be restricted even when only one real admin exists", async () => {
    const { ctx, byId } = makeCtx([admin(), reservedAdmin()], "u_admin");
    await run(ctx, { targetUserId: "u_reserved", nextStatus: "banned" });
    expect(byId.get("u_reserved")?.accountStatus).toBe("banned");
  });

  test("a real admin can be restricted by another real admin, as before", async () => {
    const { ctx, byId } = makeCtx([admin(), admin2()], "u_admin2");
    await run(ctx, { targetUserId: "u_admin", nextStatus: "suspended" });
    expect(byId.get("u_admin")?.accountStatus).toBe("suspended");
  });

  test("last-admin check: a real admin can be restricted with a reserved admin present", async () => {
    // Actor and target are both real admins, so the guard sees two; the
    // reserved Admin-role account must not change the outcome or be touched.
    const { ctx, byId } = makeCtx([admin(), admin2(), reservedAdmin()], "u_admin");
    await run(ctx, { targetUserId: "u_admin2", nextStatus: "write_restricted" });
    expect(byId.get("u_admin2")?.accountStatus).toBe("write_restricted");
    expect(byId.get("u_reserved")?.accountStatus).toBe("active");
    expect(byId.get("u_reserved")?.role).toBe("Admin");
  });

  test("last-admin check: restricting a reserved admin never trips the guard", async () => {
    for (const status of ["suspended", "banned", "write_restricted"] as const) {
      const { ctx, byId } = makeCtx([admin(), reservedAdmin(), legacyAgentAdmin()], "u_admin");
      await run(ctx, { targetUserId: "u_legacy", nextStatus: status });
      expect(byId.get("u_legacy")?.accountStatus).toBe(status);
    }
  });

  test("a reserved admin cannot restrict anyone", async () => {
    const { ctx } = makeCtx([reservedAdmin(), normal()], "u_reserved");
    await expect(run(ctx, { targetUserId: "u_normal", nextStatus: "banned" })).rejects.toThrow(
      "Admin role required",
    );
  });
});

describe("listDirectory role filter", () => {
  const run = handlerOf(listDirectory);
  const ids = (r: unknown) =>
    (r as { page: Array<{ _id: string }> }).page.map((u) => u._id).sort();

  test("Admin filter returns only effective admins", async () => {
    const { ctx } = makeCtx([admin(), normal(), reservedAdmin()], "u_admin");
    const r = await run(ctx, { paginationOpts: { numItems: 50, cursor: null }, role: "Admin" });
    expect(ids(r)).toEqual(["u_admin"]);
  });

  test("user filter includes reserved accounts holding the Admin role", async () => {
    const { ctx } = makeCtx([admin(), normal(), reservedAdmin()], "u_admin");
    const r = await run(ctx, { paginationOpts: { numItems: 50, cursor: null }, role: "user" });
    expect(ids(r)).toEqual(["u_normal", "u_reserved"]);
  });

  test("all filter is unchanged", async () => {
    const { ctx } = makeCtx([admin(), normal(), reservedAdmin()], "u_admin");
    const r = await run(ctx, { paginationOpts: { numItems: 50, cursor: null } });
    expect(ids(r)).toEqual(["u_admin", "u_normal", "u_reserved"]);
  });

  describe("search path", () => {
    const users = () => [admin(), normal(), reservedAdmin(), legacyAgentAdmin()];
    const search = (searchTerm: string, role?: "Admin" | "user") =>
      run(makeCtx(users(), "u_admin").ctx, {
        paginationOpts: { numItems: 50, cursor: null },
        search: searchTerm,
        ...(role ? { role } : {}),
      });

    test("Admin filter drops reserved Admin-role users the index prefilter lets through", async () => {
      expect(ids(await search("validation.invalid", "Admin"))).toEqual([]);
      expect(ids(await search("localhost.dev", "Admin"))).toEqual([]);
      expect(ids(await search("owner", "Admin"))).toEqual(["u_admin"]);
    });

    test("user filter finds reserved Admin-role users", async () => {
      expect(ids(await search("validation.invalid", "user"))).toEqual(["u_reserved"]);
      expect(ids(await search("example.com", "user"))).toEqual(["u_normal"]);
    });

    test("no role filter is unchanged", async () => {
      expect(ids(await search("example.com"))).toEqual(["u_admin", "u_normal"]);
      expect(ids(await search("validation.invalid"))).toEqual(["u_reserved"]);
    });
  });
});

describe("Password provider profile", () => {
  const reservedEmails = [
    "bot@validation.invalid",
    " Agent@LocalHost.dev ",
    "agent+run-7@localhost.dev",
  ];

  for (const flow of ["signUp", "signIn", "reset", "reset-verification"]) {
    test(`rejects reserved emails on ${flow}`, () => {
      for (const email of reservedEmails) {
        expect(() => profile({ flow, email, username: "agent" }, {})).toThrow(
          "This account cannot use password sign-in.",
        );
      }
    });
  }

  test("normal sign-up and sign-in are unchanged", () => {
    expect(profile({ flow: "signUp", email: " Player@Example.com ", username: " Player " }, {})).toEqual({
      email: "player@example.com",
      username: "player",
    });
    expect(profile({ flow: "signIn", email: "Player@Example.com" }, {})).toEqual({
      email: "player@example.com",
    });
    expect(profile({ flow: "signIn", email: "someone@localhost.dev" }, {})).toEqual({
      email: "someone@localhost.dev",
    });
    expect(profile({ flow: "signIn", email: "notagent+x@localhost.dev" }, {})).toEqual({
      email: "notagent+x@localhost.dev",
    });
  });

  test("invalid email still fails with the existing message", () => {
    expect(() => profile({ flow: "signIn", email: "not-an-email" }, {})).toThrow(
      "Invalid email format",
    );
  });
});
