import { expect, test } from "@playwright/test";
import { loginAsTestUser } from "./utils";

async function unlockWithPin(page: import("@playwright/test").Page, digits: string[]) {
  await page.getByTestId("pin-dots").waitFor({ state: "visible", timeout: 15000 });
  for (const digit of digits) {
    await page.getByTestId(`pin-key-${digit}`).click();
  }
  await page.getByTestId("pin-dots").waitFor({ state: "hidden", timeout: 15000 });
}

test("update shop settings, PDF still downloads, and PIN can be changed", async ({ page }) => {
  test.setTimeout(60000);

  // A dedicated shop, not the shared fixed test user -- this test changes the PIN, which would
  // break every other spec relying on the shared shop's default 1234.
  const stamp = Date.now();
  const email = `shop-settings-${stamp}@vyapaarsetgo.test`;
  const shopName = `Settings Test Shop ${stamp}`;

  await loginAsTestUser(page, { email, shopName });
  await unlockWithPin(page, ["1", "2", "3", "4"]);

  // Update name/address/phone and confirm they persist across a reload.
  await page.goto("/settings");
  const updatedName = `${shopName} Updated`;
  await page.getByLabel("Shop naam").fill(updatedName);
  await page.getByLabel("Address (optional)").fill("221B Baker Street, Pune");
  await page.getByLabel("Phone (optional)").fill("9998887770");
  await page.getByRole("button", { name: "Save karo" }).click();
  await page.waitForLoadState("networkidle");

  await page.reload();
  await expect(page.getByLabel("Shop naam")).toHaveValue(updatedName);
  await expect(page.getByLabel("Address (optional)")).toHaveValue("221B Baker Street, Pune");
  await expect(page.getByLabel("Phone (optional)")).toHaveValue("9998887770");

  // A customer needs to exist for the statement route to have something to render.
  await page.goto("/customers");
  await page.getByRole("button", { name: "Naya Grahak" }).click();
  await page.getByPlaceholder("Naam (required)").fill(`Statement Test Customer ${stamp}`);
  await page.getByRole("button", { name: "Save karo" }).click();
  await page.waitForLoadState("networkidle");
  const customerId = page.url().split("/").pop();

  const statementResponse = await page.request.get(`/api/customers/${customerId}/statement`);
  expect(statementResponse.status()).toBe(200);
  expect(statementResponse.headers()["content-type"]).toBe("application/pdf");

  // Wrong current PIN is rejected.
  await page.goto("/settings");
  await page.getByLabel("Current PIN").fill("9999");
  await page.getByLabel("Naya PIN", { exact: true }).fill("5678");
  await page.getByLabel("Naya PIN confirm karo").fill("5678");
  await page.getByRole("button", { name: "PIN badlo" }).click();
  await expect(page.getByTestId("change-pin-message")).toContainText("galat", { timeout: 15000 });

  // Correct current PIN succeeds.
  await page.getByLabel("Current PIN").fill("1234");
  await page.getByLabel("Naya PIN", { exact: true }).fill("5678");
  await page.getByLabel("Naya PIN confirm karo").fill("5678");
  await page.getByRole("button", { name: "PIN badlo" }).click();
  await expect(page.getByTestId("change-pin-message")).toContainText("badal", { timeout: 15000 });

  // The new PIN, not the old default, is what unlocks next time.
  await page.getByRole("button", { name: "Lock karo" }).click();
  await page.getByTestId("pin-dots").waitFor({ state: "visible", timeout: 15000 });
  for (const digit of ["1", "2", "3", "4"]) {
    await page.getByTestId(`pin-key-${digit}`).click();
  }
  await expect(page.getByTestId("pin-error")).toBeVisible({ timeout: 15000 });

  await unlockWithPin(page, ["5", "6", "7", "8"]);
});
