import type { CardFilters, StatFilterValue } from "@/providers/UIStateProvider";

export type StatFilterKey =
  | "difficulty"
  | "control"
  | "speed"
  | "damage"
  | "blockModifier"
  | "handSize"
  | "health"
  | "stamina";

export type StringArrayFilterKey = Extract<
  {
    [K in keyof CardFilters]: CardFilters[K] extends string[] | undefined ? K : never;
  }[keyof CardFilters],
  string
>;

export interface SetFilterOption {
  name: string;
  code: string;
  number: number;
}

export type StatFilterMap = Partial<Record<StatFilterKey, StatFilterValue | undefined>>;
