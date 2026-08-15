import { expect, test } from "@playwright/test";
import { ensureTestUser, loginAsTestUser } from "./utils";

test("wrong credentials show an inline error and don't log in", async ({ page }) => {
  await ensureTestUser(); // make sure the fixed test user exists, so this is a genuinely wrong password
  await page.goto("/login");
  await page.getByLabel("Email").fill("nobody@vyapaarsetgo.test");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Login karo" }).click();
  await expect(page.getByTestId("login-error")).toBeVisible({ timeout: 15000 });
});

test("correct credentials log in, land on the PIN screen, and logout ends the session", async ({ page }) => {
  await loginAsTestUser(page);
  await page.getByTestId("pin-dots").waitFor({ state: "visible", timeout: 15000 });
  for (const digit of ["1", "2", "3", "4"]) {
    await page.getByTestId(`pin-key-${digit}`).click();
  }
  await page.getByTestId("pin-dots").waitFor({ state: "hidden", timeout: 15000 });

  await page.getByRole("button", { name: "Logout" }).click();
  await page.getByLabel("Email").waitFor({ state: "visible", timeout: 15000 });

  // The session is server-enforced (httpOnly cookie), not just a client route -- confirm a direct
  // navigation to a real page also bounces back to /login instead of rendering.
  await page.goto("/customers");
  await page.getByLabel("Email").waitFor({ state: "visible", timeout: 15000 });
});
