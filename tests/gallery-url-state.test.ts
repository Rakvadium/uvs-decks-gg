import { describe, expect, test } from "bun:test";
import {
  galleryUrlHasState,
  parseGalleryUrlState,
  writeGalleryUrlState,
} from "../src/lib/gallery/url-state";

describe("gallery url state", () => {
  test("round-trips search, mode, view, and filters", () => {
    const written = writeGalleryUrlState(new URLSearchParams(), {
      search: "ryu",
      searchMode: "name",
      viewMode: "list",
      sortField: "name",
      sortDirection: "desc",
      defaultFormatKey: "standard",
      filters: {
        format: "expanded",
        type: ["Character", "Attack"],
        includeInfinity: false,
        difficulty: { operator: "gte", value: 3 },
      },
    });

    expect(written.get("q")).toBe("ryu");
    expect(written.get("sm")).toBe("name");
    expect(written.get("view")).toBe("list");
    expect(written.get("sort")).toBe("name");
    expect(written.get("dir")).toBe("desc");
    expect(written.get("format")).toBe("expanded");
    expect(written.get("type")).toBe("Character,Attack");
    expect(written.get("includeInfinity")).toBe("0");
    expect(written.get("difficulty")).toBe("gte:3");
    expect(galleryUrlHasState(written)).toBe(true);

    const parsed = parseGalleryUrlState(written);
    expect(parsed.search).toBe("ryu");
    expect(parsed.searchMode).toBe("name");
    expect(parsed.viewMode).toBe("list");
    expect(parsed.sortField).toBe("name");
    expect(parsed.sortDirection).toBe("desc");
    expect(parsed.filters?.format).toBe("expanded");
    expect(parsed.filters?.type).toEqual(["Character", "Attack"]);
    expect(parsed.filters?.includeInfinity).toBe(false);
    expect(parsed.filters?.difficulty).toEqual({ operator: "gte", value: 3 });
  });

  test("omits default search mode and view", () => {
    const written = writeGalleryUrlState(new URLSearchParams(), {
      search: "",
      searchMode: "all",
      viewMode: "card",
      sortField: "default",
      sortDirection: "asc",
      defaultFormatKey: "standard",
      filters: { format: "standard" },
    });
    expect(written.toString()).toBe("");
    expect(galleryUrlHasState(written)).toBe(false);
  });
});
