/**
 * Read-only smoke: signed-out gallery search, sign-in round trip, silent SSO on Cyberpunk.
 *   bun .agents/skills/verify-uvs/scripts/drive.ts .agents/skills/verify-uvs/scenarios/smoke.ts
 * Copy this file as the starting point for a new scenario.
 */
import type { DriveContext } from "../scripts/drive";
import { envValue } from "../scripts/lib";

// The signed-in user menu is a button named after the account; silent SSO renders it a moment
// after the page, so wait for it rather than checking that "Sign In" is absent.
const username = envValue("LOCAL_TEST_USERNAME") ?? "";

export default async function smoke({ page, hosts, step, signIn }: DriveContext) {
  await step("uvs-gallery-signed-out", async () => {
    await page.goto(`${hosts.uvs}/gallery`);
    await page.locator("main img[alt]").first().waitFor();
    await page.getByRole("button", { name: "Sign In", exact: true }).waitFor();
  });

  await step("gallery-search", async () => {
    await page.getByLabel("Search cards").first().fill("Natsu");
    await page.waitForURL(/[?&]q=Natsu/);
    await page.getByRole("img", { name: "Natsu Dragneel, Fire Dragon Slayer" }).first().waitFor();
  });

  await step("sign-in-returns-to-gallery", async () => {
    await signIn(`${hosts.uvs}/gallery`);
    await page.waitForURL(`${hosts.uvs}/gallery`);
    await page.getByRole("button", { name: username }).first().waitFor();
  });

  await step("cyberpunk-silent-sso", async () => {
    await page.goto(`${hosts.cyberpunk}/gallery`);
    await page.locator("main img[alt]").first().waitFor();
    await page.getByRole("button", { name: username }).first().waitFor({ timeout: 60_000 });
  });
}
