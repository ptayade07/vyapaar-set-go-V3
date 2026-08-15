import { expect, test } from "@playwright/test";
import { ensureTestUser } from "./utils";

test("successful signup lands on the PIN screen with a genuinely empty new shop", async ({ page }) => {
  const stamp = Date.now();
  const email = `signup-${stamp}@vyapaarsetgo.test`;

  await page.goto("/signup");
  await page.getByLabel("Shop naam — Shop name").fill(`Signup Test Shop ${stamp}`);
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("signup-test-password");
  await page.getByLabel(/Terms/).check();
  await page.getByRole("button", { name: "Shop banao — Create shop" }).click();

  await page.getByTestId("pin-dots").waitFor({ state: "visible", timeout: 15000 });
  for (const digit of ["1", "2", "3", "4"]) {
    await page.getByTestId(`pin-key-${digit}`).click();
  }
  await page.getByTestId("pin-dots").waitFor({ state: "hidden", timeout: 15000 });

  await page.goto("/customers");
  await expect(page.getByText("Koi grahak nahi mila.")).toBeVisible({ timeout: 15000 });
});

test("signing up with an already-registered email shows a specific error", async ({ page }) => {
  const { email } = await ensureTestUser(); // the shared fixed test user always exists

  await page.goto("/signup");
  await page.getByLabel("Shop naam — Shop name").fill("Duplicate Email Shop");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("some-other-password");
  await page.getByLabel(/Terms/).check();
  await page.getByRole("button", { name: "Shop banao — Create shop" }).click();

  await expect(page.getByTestId("signup-error")).toContainText("already registered", { timeout: 15000 });
});

test("submit is disabled until the Terms/Privacy checkbox is checked", async ({ page }) => {
  await page.goto("/signup");
  await page.getByLabel("Shop naam — Shop name").fill("Unchecked Box Shop");
  await page.getByLabel("Email").fill(`unchecked-${Date.now()}@vyapaarsetgo.test`);
  await page.getByLabel("Password").fill("some-password-here");

  await expect(page.getByRole("button", { name: "Shop banao — Create shop" })).toBeDisabled();
  await page.getByLabel(/Terms/).check();
  await expect(page.getByRole("button", { name: "Shop banao — Create shop" })).toBeEnabled();
});
