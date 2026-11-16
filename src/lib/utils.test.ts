import { expect, test } from "bun:test";
import { cn } from "./utils";

test("cn treats role radii as radii, so a later radius replaces a component default", () => {
  expect(cn("rounded-island p-px", "rounded-xl")).toBe("p-px rounded-xl");
  expect(cn("rounded-xl", "rounded-island")).toBe("rounded-island");
});

test("cn treats named z-index steps as z-index", () => {
  expect(cn("z-shell", "z-modal")).toBe("z-modal");
});
