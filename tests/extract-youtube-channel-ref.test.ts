import { describe, expect, test } from "bun:test";
import { extractYoutubeChannelRef } from "../shared/extract-youtube-channel-ref";

describe("extractYoutubeChannelRef", () => {
  test("reads a raw channel id", () => {
    expect(extractYoutubeChannelRef("UCabcdefghijklmnopqrstuv")).toEqual({
      kind: "id",
      channelId: "UCabcdefghijklmnopqrstuv",
    });
  });

  test("reads @handle and channel URLs", () => {
    expect(extractYoutubeChannelRef("@UniVersusTCG")).toEqual({
      kind: "handle",
      handle: "UniVersusTCG",
    });
    expect(extractYoutubeChannelRef("https://www.youtube.com/@UniVersusTCG")).toEqual({
      kind: "handle",
      handle: "UniVersusTCG",
    });
    expect(
      extractYoutubeChannelRef("https://www.youtube.com/channel/UCabcdefghijklmnopqrstuv"),
    ).toEqual({
      kind: "id",
      channelId: "UCabcdefghijklmnopqrstuv",
    });
    expect(extractYoutubeChannelRef("https://www.youtube.com/user/legacyname")).toEqual({
      kind: "username",
      username: "legacyname",
    });
  });

  test("rejects video links and empty input", () => {
    expect(extractYoutubeChannelRef("")).toBeNull();
    expect(extractYoutubeChannelRef("https://www.youtube.com/watch?v=dQw4w9WgXcQ")).toBeNull();
    expect(extractYoutubeChannelRef("https://youtu.be/dQw4w9WgXcQ")).toBeNull();
  });
});
