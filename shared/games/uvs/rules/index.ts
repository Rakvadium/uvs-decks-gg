import type { GameDeckValidationRules } from "../../deck";
import { planLegacy, validateLegacy } from "./legacy";
import { planStandard, validateStandard } from "./standard";

/** UVS deck validation: the "standard" format key has its own rules; every other key uses legacy rules. */
export const UVS_DECK_VALIDATION_RULES: GameDeckValidationRules = {
  plan(deck, format) {
    return format.key === "standard" ? planStandard(deck) : planLegacy(deck);
  },
  validate(input) {
    return input.format.key === "standard" ? validateStandard(input) : validateLegacy(input);
  },
};
