import { describe, expect, test } from "bun:test";
import { gunzipSync, gzipSync } from "zlib";
import { createHash } from "crypto";

describe("static catalog blob format", () => {
  test("gzip round-trip preserves gallery payload and sha256 of compressed bytes", () => {
    const payload = {
      schemaVersion: 1,
      version: 42,
      cardCount: 1,
      cards: [
        {
          _id: "cards:demo",
          _creationTime: 1,
          name: "Demo Card",
          setCode: "DEMO",
        },
      ],
    };
    const json = JSON.stringify(payload);
    const compressed = gzipSync(Buffer.from(json, "utf8"));
    const digest = createHash("sha256").update(compressed).digest("hex");
    const restored = JSON.parse(gunzipSync(compressed).toString("utf8"));

    expect(digest).toHaveLength(64);
    expect(restored.version).toBe(42);
    expect(restored.cards[0].name).toBe("Demo Card");
  });
});
