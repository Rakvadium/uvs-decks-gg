import { describe, expect, test } from "bun:test";
import {
  COMMUNITY_DESKTOP_DESTINATIONS,
  COMMUNITY_DESTINATIONS,
  COMMUNITY_HUB_DESTINATION,
  communityDestinationFromLocation,
} from "../src/components/community/community-destinations";

describe("community destinations", () => {
  test("maps hub, leaf routes, and rankings query", () => {
    expect(communityDestinationFromLocation("/community")).toBe("hub");
    expect(communityDestinationFromLocation("/community/")).toBe("hub");
    expect(communityDestinationFromLocation("/community/tier-lists")).toBe("tier-lists");
    expect(
      communityDestinationFromLocation("/community/tier-lists", {
        get: (key) => (key === "tab" ? "rankings" : null),
      }),
    ).toBe("rankings");
    expect(communityDestinationFromLocation("/community/creators")).toBe("creators");
  });

  test("desktop tabs include hub so hub value matches an item", () => {
    expect(COMMUNITY_DESTINATIONS.map((item) => item.value)).toEqual([
      "tier-lists",
      "rankings",
      "creators",
    ]);
    expect(COMMUNITY_HUB_DESTINATION.value).toBe("hub");
    expect(COMMUNITY_HUB_DESTINATION.href).toBe("/community");
    expect(COMMUNITY_DESKTOP_DESTINATIONS.map((item) => item.value)).toEqual([
      "hub",
      "tier-lists",
      "rankings",
      "creators",
    ]);
    expect(
      COMMUNITY_DESKTOP_DESTINATIONS.some(
        (item) => item.value === communityDestinationFromLocation("/community"),
      ),
    ).toBe(true);
  });
});
