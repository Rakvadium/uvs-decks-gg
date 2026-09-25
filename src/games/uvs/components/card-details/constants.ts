import { UNIVERSUS_KEYWORD_ABILITIES } from "@/games/uvs/config";

export const TIMING_COLORS: Record<string, string> = {
  enhance: "#F1841B",
  response: "#009956",
  blitz: "#CD1181",
  form: "#0081C9",
};

export const KEYWORD_ABILITY_MAP = new Map(
  UNIVERSUS_KEYWORD_ABILITIES.map((keywordAbility) => [keywordAbility.name.toLowerCase(), keywordAbility])
);
