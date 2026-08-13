import { describe, expect, test } from "bun:test";
import { communityDestinationFromLocation } from "../src/components/community/community-destinations";

describe("communityDestinationFromLocation", () => {
  test("treats the hub as having no destination tab pressed", () => {
    expect(communityDestinationFromLocation("/community", new URLSearchParams())).toBe("hub");
  });

  test("selects tier-lists for the public and mine browser tabs", () => {
    expect(communityDestinationFromLocation("/community/tier-lists", new URLSearchParams())).toBe(
      "tier-lists"
    );
    expect(
      communityDestinationFromLocation("/community/tier-lists", new URLSearchParams("tab=mine"))
    ).toBe("tier-lists");
  });

  test("selects rankings when the rankings query is present", () => {
    expect(
      communityDestinationFromLocation("/community/tier-lists", new URLSearchParams("tab=rankings"))
    ).toBe("rankings");
  });

  test("selects creators on the creator program route", () => {
    expect(communityDestinationFromLocation("/community/creators", new URLSearchParams())).toBe(
      "creators"
    );
  });
});
