import { describe, expect, test } from "bun:test";
import { recordCardTextHistoryIfChanged } from "../convex/lib/cardTextHistory";

describe("recordCardTextHistoryIfChanged", () => {
  test("skips empty previous text and unchanged text without writing", async () => {
    const inserts: unknown[] = [];
    const ctx = {
      db: {
        insert: async (_table: string, doc: unknown) => {
          inserts.push(doc);
          return "id";
        },
      },
    };

    const skippedEmpty = await recordCardTextHistoryIfChanged(ctx as never, {
      cardId: "card1" as never,
      previousText: undefined,
      nextText: "Enhance: New.",
      source: "admin_edit",
    });
    const skippedSame = await recordCardTextHistoryIfChanged(ctx as never, {
      cardId: "card1" as never,
      previousText: "Enhance: Same.",
      nextText: "Enhance: Same.",
      source: "admin_edit",
    });
    const wrote = await recordCardTextHistoryIfChanged(ctx as never, {
      cardId: "card1" as never,
      previousText: "Enhance: Old.",
      nextText: "Enhance: New.",
      source: "admin_edit",
      now: 123,
    });

    expect(skippedEmpty).toBe(false);
    expect(skippedSame).toBe(false);
    expect(wrote).toBe(true);
    expect(inserts).toEqual([
      {
        cardId: "card1",
        text: "Enhance: Old.",
        recordedAt: 123,
        source: "admin_edit",
      },
    ]);
  });
});
