import type { GameDeckValidationRules } from "../../deck";
import { planCyberpunk, validateCyberpunk } from "./standard";

export { cyberpunkCopyGroupKey, cyberpunkRamBudget } from "./standard";

/** Cyberpunk TCG has one ruleset; every format key (today only `standard`) uses it. */
export const CYBERPUNK_DECK_VALIDATION_RULES: GameDeckValidationRules = {
  plan(deck) {
    return planCyberpunk(deck);
  },
  validate(input) {
    return validateCyberpunk(input);
  },
};
