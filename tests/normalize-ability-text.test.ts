import { describe, expect, test } from "bun:test";
import { normalizeAbilityText } from "../convex/lib/normalizeAbilityText";

describe("normalizeAbilityText", () => {
  test("drops Powerful reminder transcribed as an Enhance ability", () => {
    expect(
      normalizeAbilityText(
        "Blitz: Mill 1. Look at the top card of your deck. You may mill 1. | Enhance {Powerful: 2}: Spend 1 or more momentum: This attack gets +2 damage for each momentum spent to pay the cost of this ability."
      )
    ).toBe("Blitz: Mill 1. Look at the top card of your deck. You may mill 1.");
  });

  test("collapses a timing colon when the cost already has a colon", () => {
    expect(normalizeAbilityText("Enhance: Mill 1: Your rival mills 1.")).toBe(
      "Enhance Mill 1: Your rival mills 1."
    );
  });

  test("strips parenthetical Mill reminder segments and trailing Drive reminders", () => {
    expect(
      normalizeAbilityText(
        'Before the game begins, search your deck for up to 1 copy of "Departure" and add it to your discard pile. | Response [Twice per Enhance Step, Tenacious]: After you mill 1 or more attack cards, this attack gets +2 or -2 damage. | (Mill 1—Add the top card of your deck to your discard pile.)'
      )
    ).toBe(
      'Before the game begins, search your deck for up to 1 copy of "Departure" and add it to your discard pile. | Response [Twice per Enhance Step, Tenacious]: After you mill 1 or more attack cards, this attack gets +2 or -2 damage.'
    );

    expect(
      normalizeAbilityText(
        "Blitz Drive 1: Build 1 foundation with difficulty 2 or less from your discard pile committed. (Drive 1—Commit 1 foundation or spend 1 momentum.)"
      )
    ).toBe(
      "Blitz Drive 1: Build 1 foundation with difficulty 2 or less from your discard pile committed."
    );
  });

  test("drops Stun, EX, Breaker, and Echo keyword reminders", () => {
    expect(
      normalizeAbilityText(
        "Blitz Drive 2: Mill 5. This attack gets +2 speed for each attack milled this way. | Enhance {stun:2}: Your rival commits 2 foundations."
      )
    ).toBe(
      "Blitz Drive 2: Mill 5. This attack gets +2 speed for each attack milled this way."
    );

    expect(
      normalizeAbilityText(
        "Blitz: Change the zone of this attack. | Enhance [EX: 2]: Spend 1 or more momentum: This attack gets +2 speed for each momentum spent to pay the cost of this ability."
      )
    ).toBe("Blitz: Change the zone of this attack.");

    expect(
      normalizeAbilityText(
        "Blitz Drive 1: Each player can play only 1 enhance ability during this Enhance Step. | Breaker: 1 Response: After you block with this card, your rival's next check to play a card gets -1. | (Drive 1—Commit 1 foundation or spend 1 momentum.)"
      )
    ).toBe(
      "Blitz Drive 1: Each player can play only 1 enhance ability during this Enhance Step."
    );

    expect(
      normalizeAbilityText(
        "Blitz Mill 2: If you mill an attack card this way, you may discard cards as though you were spending momentum to pay the cost of this attack's Echo ability. | Echo Response Spend 1 momentum: After this attack resolves, you may try to play it as your next form this turn. If you do, flip it after it resolves."
      )
    ).toBe(
      "Blitz Mill 2: If you mill an attack card this way, you may discard cards as though you were spending momentum to pay the cost of this attack's Echo ability."
    );
  });

  test("keeps a unique Enhance that happens to commit foundations", () => {
    expect(
      normalizeAbilityText(
        "Blitz: If you have 9 or more foundations, this attack gets +1 speed and +2 damage. | Enhance: Your rival commits 1 foundation."
      )
    ).toBe(
      "Blitz: If you have 9 or more foundations, this attack gets +1 speed and +2 damage. | Enhance: Your rival commits 1 foundation."
    );
  });

  test("keeps a single cost colon and restriction-before-colon form", () => {
    expect(
      normalizeAbilityText("Enhance {commit}: This attack gets +2 damage.")
    ).toBe("Enhance {commit}: This attack gets +2 damage.");

    expect(
      normalizeAbilityText("Enhance: [Once per turn]: Do something")
    ).toBe("Enhance [Once per turn]: Do something");

    expect(
      normalizeAbilityText("Response [Once per turn]: After you mill 1 or more Psycho cards, add 1 of them to your hand.")
    ).toBe(
      "Response [Once per turn]: After you mill 1 or more Psycho cards, add 1 of them to your hand."
    );
  });

  test("keeps mid-sentence parentheses that are not reminder boxes", () => {
    expect(
      normalizeAbilityText(
        "Enhance: This attack deals half damage (rounded up) during the Damage Step."
      )
    ).toBe(
      "Enhance: This attack deals half damage (rounded up) during the Damage Step."
    );
  });

  test("collapses the timing colon on a bulleted choice list but keeps option colons", () => {
    expect(
      normalizeAbilityText(
        "Enhance: Mill 1: Use 1 effect below that matches the check value of a card milled this way— • 6 or greater: Your rival loses 1 health. • 4 or 5: You may discard 1 card. If you do, draw 1 card. • 3 or less: Your rival’s next check gets -1."
      )
    ).toBe(
      "Enhance Mill 1: Use 1 effect below that matches the check value of a card milled this way— • 6 or greater: Your rival loses 1 health. • 4 or 5: You may discard 1 card. If you do, draw 1 card. • 3 or less: Your rival’s next check gets -1."
    );
  });

  test("keeps Enhance: Choose one: as the bulleted-choice exception", () => {
    expect(
      normalizeAbilityText(
        "Enhance: Choose one: • Deal 1 damage. • Draw 1 card."
      )
    ).toBe("Enhance: Choose one: • Deal 1 damage. • Draw 1 card.");
  });

  test("collapses Drive/Flip double colons", () => {
    expect(normalizeAbilityText("Blitz: Drive 2: Your checks to play Kick attacks get +1 this turn.")).toBe(
      "Blitz Drive 2: Your checks to play Kick attacks get +1 this turn."
    );
    expect(normalizeAbilityText("Enhance: Flip: Seal 1 non-attack card in your card pool.")).toBe(
      "Enhance Flip: Seal 1 non-attack card in your card pool."
    );
    expect(normalizeAbilityText("Response: Sacrifice: After an attack is played, its damage cannot be modified.")).toBe(
      "Response Sacrifice: After an attack is played, its damage cannot be modified."
    );
  });

  test("leaves abilities that already have a correct timing+cost colon", () => {
    expect(
      normalizeAbilityText(
        "Enhance Mill 1: This attack gets -1 speed or +2 damage. | Response [Once per turn]: After you mill 1 or more Psycho cards, add 1 of them to your hand."
      )
    ).toBe(
      "Enhance Mill 1: This attack gets -1 speed or +2 damage. | Response [Once per turn]: After you mill 1 or more Psycho cards, add 1 of them to your hand."
    );
  });
});
