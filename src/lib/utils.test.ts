import { expect, test } from "bun:test";
import { cn } from "./utils";

test("cn treats rounded-pill as a radius, so a later radius replaces it", () => {
  expect(cn("rounded-pill p-px", "rounded-3xl")).toBe("p-px rounded-3xl");
  expect(cn("rounded-3xl", "rounded-pill")).toBe("rounded-pill");
});

test("cn treats named z-index steps as z-index", () => {
  expect(cn("z-shell", "z-modal")).toBe("z-modal");
});
