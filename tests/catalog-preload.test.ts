import { afterAll, describe, expect, test } from "bun:test";
import { catalogPreloadLink } from "../src/lib/universus/catalog-preload";

const originalFetch = globalThis.fetch;
const originalConvexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
process.env.NEXT_PUBLIC_CONVEX_URL = "https://example.convex.cloud";

let calls = 0;
globalThis.fetch = (async (_input: unknown, init?: RequestInit) => {
  calls += 1;
  const { args } = JSON.parse(String(init?.body)) as { args: { game: string } };
  if (args.game === "cyberpunk") throw new Error("network down");
  return new Response(
    JSON.stringify({
      status: "success",
      value: { version: 31, catalogUrl: "https://bucket.example/catalog/uvs/v31.json.gz" },
    })
  );
}) as typeof fetch;

afterAll(() => {
  globalThis.fetch = originalFetch;
  process.env.NEXT_PUBLIC_CONVEX_URL = originalConvexUrl;
});

describe("catalogPreloadLink", () => {
  test("preloads the proxy path when the browser has no cached catalog", async () => {
    expect(await catalogPreloadLink("uvs", undefined)).toBe(
      "</catalog-proxy/uvs/v31.json.gz>; rel=preload; as=fetch; crossorigin=anonymous; fetchpriority=high"
    );
  });

  test("skips the preload when the cookie holds the current version, reusing the cached lookup", async () => {
    const before = calls;
    expect(await catalogPreloadLink("uvs", "31")).toBeNull();
    expect(await catalogPreloadLink("uvs", "30")).not.toBeNull();
    expect(calls).toBe(before);
  });

  test("a failed lookup sends no header", async () => {
    expect(await catalogPreloadLink("cyberpunk", undefined)).toBeNull();
  });
});
