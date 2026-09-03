import { describe, expect, test } from "bun:test";
import {
  formatKeywordList,
  parseKeywordList,
  titleMatchesFilters,
} from "../shared/youtube-title-filters";
import { extractYoutubePlaylistId } from "../shared/extract-youtube-playlist-id";

describe("youtube title filters", () => {
  test("parses comma lists", () => {
    expect(parseKeywordList("UniVersus, UVS; universus")).toEqual([
      "UniVersus",
      "UVS",
      "universus",
    ]);
    expect(formatKeywordList(["UniVersus", "UVS"])).toBe("UniVersus, UVS");
  });

  test("keeps matching titles and drops excluded games", () => {
    expect(
      titleMatchesFilters("UniVersus Locals Recap", ["universus", "uvs"], ["flesh and blood"]),
    ).toBe(true);
    expect(
      titleMatchesFilters("Flesh and Blood starter", ["universus", "uvs"], []),
    ).toBe(false);
    expect(
      titleMatchesFilters("UniVersus vs Flesh and Blood", ["universus"], ["flesh and blood"]),
    ).toBe(false);
    expect(titleMatchesFilters("Weekly locals", [], [])).toBe(true);
  });
});

describe("extractYoutubePlaylistId", () => {
  test("reads playlist URLs and ids", () => {
    expect(extractYoutubePlaylistId("PLabcdefghijklmnopqrstuvwx")).toBe(
      "PLabcdefghijklmnopqrstuvwx",
    );
    expect(
      extractYoutubePlaylistId(
        "https://www.youtube.com/playlist?list=PLabcdefghijklmnopqrstuvwx",
      ),
    ).toBe("PLabcdefghijklmnopqrstuvwx");
  });
});
