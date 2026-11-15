import { describe, expect, test } from "bun:test";
import { updateProfile } from "../convex/user";

type Handler = (ctx: unknown, args: Record<string, unknown>) => Promise<null>;
const handler = (updateProfile as unknown as { _handler: Handler })._handler;

type FakeUser = { _id: string; _creationTime: number; username?: string; email?: string };

function makeCtx(users: FakeUser[], signedInAs = "user1") {
  const byId = new Map(users.map((u) => [u._id, { ...u }]));
  const ctx = {
    auth: {
      getUserIdentity: async () => ({ subject: `${signedInAs}|session1`, tokenIdentifier: signedInAs, issuer: "test" }),
    },
    db: {
      get: async (id: string) => byId.get(id) ?? null,
      patch: async (id: string, value: Record<string, unknown>) => {
        Object.assign(byId.get(id)!, value);
      },
      query: () => ({
        withIndex: (_name: string, build: (q: { eq: (field: string, value: unknown) => unknown }) => unknown) => {
          let wanted: unknown;
          build({ eq: (_field, value) => (wanted = value) });
          return { unique: async () => [...byId.values()].find((u) => u.username === wanted) ?? null };
        },
      }),
    },
  };
  return { ctx, usernameOf: (id: string) => byId.get(id)?.username };
}

const users = (): FakeUser[] => [
  { _id: "user1", _creationTime: 0, username: "original", email: "one@example.com" },
  { _id: "user2", _creationTime: 0, username: "taken", email: "two@example.com" },
];

describe("user.updateProfile username", () => {
  test("rejects empty and whitespace-only names and keeps the old one", async () => {
    for (const username of ["", "   "]) {
      const { ctx, usernameOf } = makeCtx(users());
      await expect(handler(ctx, { username })).rejects.toThrow("Username is required");
      expect(usernameOf("user1")).toBe("original");
    }
  });

  test("saves names with spaces and symbols", async () => {
    const { ctx, usernameOf } = makeCtx(users());
    await handler(ctx, { username: "bad name!!@#" });
    expect(usernameOf("user1")).toBe("bad name!!@#");
  });

  test("saves the trimmed name", async () => {
    const { ctx, usernameOf } = makeCtx(users());
    await handler(ctx, { username: "  padded  " });
    expect(usernameOf("user1")).toBe("padded");
  });

  test("rejects a name another user holds", async () => {
    const { ctx, usernameOf } = makeCtx(users());
    await expect(handler(ctx, { username: "taken" })).rejects.toThrow("Username already taken");
    expect(usernameOf("user1")).toBe("original");
  });

  test("rejects zero-width characters", async () => {
    const { ctx } = makeCtx(users());
    await expect(handler(ctx, { username: "bad​name" })).rejects.toThrow(
      "Username cannot contain control or zero-width characters",
    );
  });

  test("averages under 5 ms per call", async () => {
    const { ctx } = makeCtx(users());
    const runs = 1000;
    const start = performance.now();
    for (let i = 0; i < runs; i++) {
      await handler(ctx, { username: `name ${i % 50}` });
    }
    const mean = (performance.now() - start) / runs;
    console.log(`updateProfile mean ${mean.toFixed(4)} ms over ${runs} calls`);
    expect(mean).toBeLessThan(5);
  });
});
