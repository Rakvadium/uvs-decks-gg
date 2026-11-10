import type { CardFilters, StatFilterValue } from "@/providers/UIStateProvider";
import type { UvsStatFilterKey } from "@shared/games/uvs/filters";
import type { CyberpunkStatFilterKey } from "@shared/games/cyberpunk/filters";

/** Every game's stat rule keys (each game's UI only renders its own definition's stats). */
export type StatFilterKey = UvsStatFilterKey | CyberpunkStatFilterKey;

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
