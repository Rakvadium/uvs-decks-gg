import type { StatOperator } from "@/providers/UIStateProvider";

export const OPERATOR_OPTIONS: Array<{ value: StatOperator; label: string }> = [
  { value: "eq", label: "=" },
  { value: "neq", label: "!=" },
  { value: "gt", label: ">" },
  { value: "lt", label: "<" },
  { value: "gte", label: ">=" },
  { value: "lte", label: "<=" },
];

export const ZONE_OPTIONS = ["High", "Mid", "Low"] as const;
