import { describe, expect, test } from "bun:test";
import { getFilterGroupLayout, statStandaloneLabel } from "@shared/games/filters";
import { SHARED_GAME_MODULES } from "@shared/games/registry";
import { UVS_FILTER_DEFINITION } from "@shared/games/uvs/filters";

describe("game filter definitions", () => {
  test("param orders list exactly the stat/zone descriptors; groups are known", () => {
    for (const gameModule of Object.values(SHARED_GAME_MODULES)) {
      const { stats, zones, groups, statParamOrder, zoneParamOrder } = gameModule.filters;
      expect([...statParamOrder].sort()).toEqual(stats.map((s) => s.key).sort());
      expect([...zoneParamOrder].sort()).toEqual(zones.map((z) => z.key).sort());
      const groupIds = new Set(groups.map((g) => g.id));
      for (const item of [...stats, ...zones]) expect(groupIds.has(item.group)).toBe(true);
    }
  });

  test("UVS layout matches the legacy stats UI", () => {
    const layout = getFilterGroupLayout(UVS_FILTER_DEFINITION).map((group) => ({
      label: group.label,
      zones: group.zones.map((z) => z.key),
      stats: group.stats.map((s) => [s.label, statStandaloneLabel(s)]),
    }));
    expect(layout).toEqual([
      {
        label: "General",
        zones: [],
        stats: [
          ["Difficulty", "Difficulty"],
          ["Control", "Control"],
          ["Health", "Health"],
          ["Hand Size", "Hand Size"],
          ["Stamina", "Stamina"],
        ],
      },
      { label: "Block", zones: ["blockZone"], stats: [["Modifier", "Block Mod"]] },
      { label: "Attack", zones: ["attackZone"], stats: [["Speed", "Speed"], ["Damage", "Damage"]] },
    ]);
  });
});
