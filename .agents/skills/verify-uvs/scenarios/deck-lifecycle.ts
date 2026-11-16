/**
 * Create a deck, add a card from the gallery, prove it persisted from a second clean browser
 * context, then delete the deck through the UI.
 *   bun .agents/skills/verify-uvs/scripts/drive.ts .agents/skills/verify-uvs/scenarios/deck-lifecycle.ts
 * Writes to the shared local backend; the deck is named verify-uvs-<timestamp> and deleted at the end.
 */
import { expect } from "./expect";
import type { DriveContext } from "../scripts/drive";

export default async function deckLifecycle({ page, context, hosts, step, signIn, log }: DriveContext) {
  const deckName = `verify-uvs-${Date.now()}`;
  await signIn(`${hosts.uvs}/decks`);

  const deckUrl = await step("create-deck", async () => {
    await page.goto(`${hosts.uvs}/decks`);
    await page.getByRole("button", { name: "New Deck" }).first().click();
    await page.locator("#create-deck-name").fill(deckName);
    await page.getByRole("button", { name: "Create Deck" }).click();
    await page.waitForURL(/\/decks\/[a-z0-9]+$/);
    await page.getByText(deckName).first().waitFor();
    return page.url();
  });
  log(`deck: ${deckUrl}`);

  // A new deck becomes the active deck. Hovering a gallery card reveals +/count/- controls;
  // characters (first in the default sort) show them disabled, so take the first enabled one.
  const cardName = await step("add-card-from-gallery", async () => {
    await page.goto(`${hosts.uvs}/gallery`);
    const cards = page.locator("main img[alt]");
    await cards.first().waitFor();
    const add = page.getByRole("button", { name: "Add to deck", exact: true });
    for (let i = 0; i < 36; i++) {
      await cards.nth(i).hover();
      const shown = await add.first().waitFor({ timeout: 1500 }).then(() => true, () => false);
      if (shown && (await add.count()) === 1 && (await add.isEnabled())) {
        const name = (await cards.nth(i).getAttribute("alt")) ?? "";
        await add.click();
        await page.getByRole("button", { name: "Remove from deck", exact: true }).and(page.locator(":enabled")).waitFor();
        return name;
      }
    }
    throw new Error("no gallery card offered an enabled Add to deck button");
  });
  log(`added: ${cardName}`);

  await step("deck-shows-card", async () => {
    await page.goto(deckUrl);
    await page.getByRole("button", { name: /^Main Deck\s*1$/ }).waitFor();
    await page.getByRole("img", { name: cardName }).first().waitFor();
  });

  // Second context: no local cache or IndexedDB, so this reads what the backend stored.
  await step("persisted-in-backend", async () => {
    const fresh = await context.browser()!.newContext({ storageState: await context.storageState() });
    const other = await fresh.newPage();
    await other.goto(deckUrl);
    await other.getByRole("button", { name: /^Main Deck\s*1$/ }).waitFor({ timeout: 60_000 });
    await fresh.close();
  });

  await step("delete-deck", async () => {
    await page.goto(deckUrl);
    await page.getByRole("button", { name: "Edit" }).click();
    await page.getByRole("button", { name: "Delete deck" }).click();
    const confirm = page.getByRole("alertdialog");
    await confirm.getByRole("button", { name: /delete/i }).click();
    await page.waitForURL((url) => !url.pathname.includes("/decks/"));
  });

  await step("deck-gone-from-list", async () => {
    await page.goto(`${hosts.uvs}/decks`);
    await page.getByRole("button", { name: "New Deck" }).first().waitFor();
    await page.waitForTimeout(1500);
    expect(await page.getByText(deckName).count(), 0, "deleted deck still listed");
  });
}
