import { describe, expect, test } from "bun:test";
import {
  enabledDeckSections,
  GAME_FEATURE_KEYS,
  isGameFeatureEnabled,
  type GameFeatures,
} from "../shared/games/features";
import { SHARED_GAME_MODULES } from "../shared/games/registry";
import { GAME_IDS } from "../shared/games/types";
import { CYBERPUNK_DECK_TEXT_PLACEHOLDER, parseCyberpunkDeckText } from "../shared/games/cyberpunk/deck-text";
import { buildMainNavItems } from "../src/components/shell/main-nav-build";
import { communityDestinationsFor } from "../src/components/community/community-destinations";
import { isGameFeatureRouteEnabled } from "../src/lib/routing/game-feature-route";

const UVS = SHARED_GAME_MODULES.uvs.features;
const CYBERPUNK = SHARED_GAME_MODULES.cyberpunk.features;

function withFeatures(patch: Partial<GameFeatures>): GameFeatures {
  return { ...UVS, ...patch };
}

describe("game feature manifest", () => {
  test("every module declares exactly every feature key", () => {
    const expected = [...GAME_FEATURE_KEYS].sort();
    for (const id of GAME_IDS) {
      expect(Object.keys(SHARED_GAME_MODULES[id].features).sort()).toEqual(expected);
    }
  });

  test("UniVersus ships every feature (pre-multi-game behavior)", () => {
    for (const key of GAME_FEATURE_KEYS) {
      expect(isGameFeatureEnabled(UVS, key)).toBe(true);
    }
    expect(UVS.deckImportExport && UVS.deckImportExport.formatLabel).toBe("UVS Ultra");
    expect(UVS.communityMedia && UVS.communityMedia.dockLabel).toBe("UniVersus");
  });

  test("Cyberpunk manifest", () => {
    expect(CYBERPUNK).toMatchObject({
      collection: true,
      deckStats: true,
      drawSimulator: true,
      deckValidation: true,
      sideboard: false,
      referenceSection: false,
      tierLists: true,
      rankings: true,
      creators: false,
      communityMedia: false,
      cardOcrDrafts: false,
    });
    expect(CYBERPUNK.deckImportExport && CYBERPUNK.deckImportExport.formatLabel).toBe("Plain text");
  });

  test("Cyberpunk import placeholder is its own deck text format", () => {
    expect(CYBERPUNK.deckImportExport && CYBERPUNK.deckImportExport.placeholder).toBe(
      CYBERPUNK_DECK_TEXT_PLACEHOLDER,
    );
    const parsed = parseCyberpunkDeckText(CYBERPUNK_DECK_TEXT_PLACEHOLDER);
    expect((parsed.setupCards ?? []).map((line) => line.name)).toEqual(["Legend Name", "Legend Name", "Legend Name"]);
    expect(parsed.main.map((line) => [line.quantity, line.name])).toEqual([[3, "Card Name"]]);
  });
});

describe("gating helpers", () => {
  test("object-valued features count as on, false as off", () => {
    expect(isGameFeatureEnabled(UVS, "deckImportExport")).toBe(true);
    expect(isGameFeatureEnabled(CYBERPUNK, "communityMedia")).toBe(false);
  });

  test("rankings require tier lists", () => {
    expect(isGameFeatureEnabled(withFeatures({ tierLists: false }), "rankings")).toBe(false);
    expect(isGameFeatureEnabled(withFeatures({ rankings: false }), "rankings")).toBe(false);
  });

  test("deck sections follow sideboard / reference flags", () => {
    expect(enabledDeckSections(UVS)).toEqual(["main", "side", "reference"]);
    expect(enabledDeckSections(CYBERPUNK)).toEqual(["main"]);
    expect(enabledDeckSections(withFeatures({ sideboard: false }))).toEqual(["main", "reference"]);
  });

  test("main nav hides Collection when the game has no collection", () => {
    expect(buildMainNavItems().map((item) => item.path)).toEqual(["gallery", "decks", "collection", "community"]);
    expect(buildMainNavItems(UVS).map((item) => item.path)).toEqual(["gallery", "decks", "collection", "community"]);
    expect(buildMainNavItems(withFeatures({ collection: false })).map((item) => item.path)).toEqual([
      "gallery",
      "decks",
      "community",
    ]);
  });

  test("community destination tabs follow tier lists / rankings / creators", () => {
    const values = (features: GameFeatures) => communityDestinationsFor(features).map((item) => item.value);
    expect(values(UVS)).toEqual(["tier-lists", "rankings", "creators"]);
    expect(values(CYBERPUNK)).toEqual(["tier-lists", "rankings"]);
    expect(values(withFeatures({ tierLists: false, creators: false }))).toEqual([]);
  });

  test("route guard resolves the game from params", () => {
    expect(isGameFeatureRouteEnabled("uvs", "creators")).toBe(true);
    expect(isGameFeatureRouteEnabled("cyberpunk", "creators")).toBe(false);
    expect(isGameFeatureRouteEnabled("cyberpunk", "cardOcrDrafts")).toBe(false);
    expect(isGameFeatureRouteEnabled("cyberpunk", "collection")).toBe(true);
    expect(isGameFeatureRouteEnabled("nope", "collection")).toBe(false);
  });
});
