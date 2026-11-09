import { describe, expect, test } from "bun:test";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { cn } from "../src/lib/utils";

const ladders = readFileSync(join(import.meta.dir, "../src/styles/system/ladders.css"), "utf8");

// Every named utility in ladders.css with the raw class it stands for.
const utilities = [
  ...ladders.matchAll(/@utility\s+([\w-]+)\s*\{\s*(?:@apply\s+([^;]+?);|z-index:\s*(\d+);)/g),
].map((match) => ({ name: match[1], raw: match[2] ?? `z-${match[3]}` }));

const familyOf = (name: string) => name.split("-")[0];
const families = [...new Set(utilities.map((u) => familyOf(u.name)))];

// Classes that set a different property, so cn must keep them next to the named utility.
const unrelated: Record<string, string[]> = {
  bg: ["bg-cover", "bg-no-repeat", "bg-clip-text", "bg-linear-to-r"],
  border: ["border", "border-2", "border-t", "border-dashed"],
  ring: ["ring", "ring-2", "ring-inset", "ring-offset-2"],
  z: ["relative", "isolate"],
};

// A raw class of the same group that is not the utility's own raw equivalent.
const rawSibling: Record<string, string> = {
  bg: "bg-transparent",
  border: "border-input",
  ring: "ring-ring",
  z: "z-[60]",
};

test("ladders.css parses into the expected families", () => {
  expect(utilities.length).toBe(80);
  expect(families.sort()).toEqual(["bg", "border", "ring", "z"]);
  expect(utilities.filter((u) => familyOf(u.name) === "z").length).toBe(11);
});

describe("issue #209 cases", () => {
  test("named z vs named z: the later one wins", () => {
    expect(cn("z-select", "z-dock")).toBe("z-dock");
    expect(cn("z-dock", "z-select")).toBe("z-select");
  });

  test("named z vs arbitrary z: the call-site override wins", () => {
    expect(cn("z-modal", "z-[60]")).toBe("z-[60]");
    expect(cn("z-[60]", "z-modal")).toBe("z-modal");
  });

  test("named z vs numeric and auto z", () => {
    expect(cn("z-popover", "z-50")).toBe("z-50");
    expect(cn("z-10", "z-sticky")).toBe("z-sticky");
    expect(cn("z-auto", "z-drag")).toBe("z-drag");
    expect(cn("z-nested-dialog", "-z-10")).toBe("-z-10");
  });

  test("variants stay separate and conflict within themselves", () => {
    expect(cn("hover:z-select", "hover:z-dock")).toBe("hover:z-dock");
    expect(cn("md:z-modal", "md:z-[60]")).toBe("md:z-[60]");
    expect(cn("md:z-select", "z-dock")).toBe("md:z-select z-dock");
  });

  test("named colors still merge as colors (no registration needed)", () => {
    expect(cn("bg-primary-wash", "bg-transparent")).toBe("bg-transparent");
    expect(cn("border-hairline", "border-primary-soft")).toBe("border-primary-soft");
    expect(cn("ring-primary-soft", "ring-ring")).toBe("ring-ring");
    expect(cn("border-2 border-hairline", "border-t")).toBe("border-2 border-hairline border-t");
  });
});

describe.each(utilities)("$name", ({ name, raw }) => {
  const family = familyOf(name);
  const siblings = utilities.filter((u) => u.name !== name && familyOf(u.name) === family);
  const sibling = siblings[0].name;

  test(`conflicts with its raw equivalent ${raw}`, () => {
    expect(cn(raw, name)).toBe(name);
    expect(cn(name, raw)).toBe(raw);
    expect(cn(`hover:${raw}`, `hover:${name}`)).toBe(`hover:${name}`);
  });

  test("conflicts with a sibling named utility", () => {
    expect(cn(sibling, name)).toBe(name);
    expect(cn(name, sibling)).toBe(sibling);
  });

  test(`conflicts with raw ${rawSibling[family]}`, () => {
    expect(cn(name, rawSibling[family])).toBe(rawSibling[family]);
    expect(cn(rawSibling[family], name)).toBe(name);
  });

  test("keeps classes for other properties", () => {
    for (const other of unrelated[family]) {
      expect(cn(other, name)).toBe(`${other} ${name}`);
      expect(cn(name, other)).toBe(`${name} ${other}`);
    }
  });
});
