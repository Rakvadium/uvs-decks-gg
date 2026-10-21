import { describe, expect, test } from "bun:test";
import { filterSetOptionsForFormat, legalSelectedSetCodes } from "../src/components/gallery/filter-dialog/set-options";

const options = [
  { code: "mha", name: "My Hero" },
  { code: "sf6", name: "Street Fighter" },
  { code: "promo", name: "Promo" },
];

function isLegal(setCode: string, formatKey: string) {
  if (setCode === "promo") return true;
  if (formatKey === "standard") return setCode === "mha";
  if (formatKey === "retro") return setCode === "sf6" || setCode === "mha";
  return false;
}

describe("filterSetOptionsForFormat", () => {
  test("keeps only sets legal in the selected format", () => {
    expect(filterSetOptionsForFormat(options, "standard", isLegal).map((set) => set.code)).toEqual([
      "mha",
      "promo",
    ]);
    expect(filterSetOptionsForFormat(options, "retro", isLegal).map((set) => set.code)).toEqual([
      "mha",
      "sf6",
      "promo",
    ]);
  });

  test("returns every set when no format is selected", () => {
    expect(filterSetOptionsForFormat(options, undefined, isLegal)).toEqual(options);
  });
});

describe("legalSelectedSetCodes", () => {
  test("drops selected sets that are outside the format", () => {
    expect(legalSelectedSetCodes(["sf6", "mha"], "standard", isLegal)).toEqual(["mha"]);
    expect(legalSelectedSetCodes(["sf6"], "standard", isLegal)).toBeUndefined();
  });

  test("keeps the same selection when every set is still legal", () => {
    const selected = ["mha"];
    expect(legalSelectedSetCodes(selected, "standard", isLegal)).toBe(selected);
  });
});
