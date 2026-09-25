import { describe, expect, test } from "bun:test";
import { UVS_FILTER_DEFINITION } from "../shared/games/uvs/filters";
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
    }, UVS_FILTER_DEFINITION);

    expect(written.get("q")).toBe("ryu");
    expect(written.get("sm")).toBe("name");
    expect(written.get("view")).toBe("list");
    expect(written.get("sort")).toBe("name");
    expect(written.get("dir")).toBe("desc");
    expect(written.get("format")).toBe("expanded");
    expect(written.get("type")).toBe("Character,Attack");
    expect(written.get("includeInfinity")).toBe("0");
    expect(written.get("difficulty")).toBe("gte:3");
    expect(galleryUrlHasState(written, UVS_FILTER_DEFINITION)).toBe(true);

    const parsed = parseGalleryUrlState(written, UVS_FILTER_DEFINITION);
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

  test("round-trips includeBanned", () => {
    const written = writeGalleryUrlState(new URLSearchParams(), {
      search: "",
      searchMode: "all",
      viewMode: "card",
      sortField: "default",
      sortDirection: "asc",
      defaultFormatKey: "standard",
      filters: {
        format: "standard",
        includeBanned: true,
      },
    }, UVS_FILTER_DEFINITION);

    expect(written.get("includeBanned")).toBe("1");
    expect(written.get("format")).toBeNull();

    const parsed = parseGalleryUrlState(written, UVS_FILTER_DEFINITION);
    expect(parsed.filters?.includeBanned).toBe(true);
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
    }, UVS_FILTER_DEFINITION);
    expect(written.toString()).toBe("");
    expect(galleryUrlHasState(written, UVS_FILTER_DEFINITION)).toBe(false);
  });
});
