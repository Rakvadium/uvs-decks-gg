import type { StatOperator } from "@/providers/UIStateProvider";
import { STAT_OPERATOR_OPTIONS } from "@shared/games/filters";
import { UVS_ZONE_OPTIONS } from "@shared/games/uvs/filters";

export const OPERATOR_OPTIONS: Array<{ value: StatOperator; label: string }> = STAT_OPERATOR_OPTIONS.map(
  ({ value, label }) => ({ value, label })
);

/** @deprecated Read zone options from `useGameModule().filters.zones`. */
export const ZONE_OPTIONS = UVS_ZONE_OPTIONS;
