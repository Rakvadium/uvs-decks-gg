import type { StatOperator } from "@/providers/UIStateProvider";
import { STAT_OPERATOR_OPTIONS } from "@shared/games/filters";

export const OPERATOR_OPTIONS: Array<{ value: StatOperator; label: string }> = STAT_OPERATOR_OPTIONS.map(
  ({ value, label }) => ({ value, label })
);
