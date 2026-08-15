import { expect, test } from "@playwright/test";
import { loginAsTestUser } from "./utils";

test("wrong PIN shows an error and resets, correct PIN still unlocks after", async ({ page }) => {
  await loginAsTestUser(page);
  await page.getByTestId("pin-dots").waitFor({ state: "visible", timeout: 15000 });

  for (const digit of ["9", "9", "9", "9"]) {
    await page.getByTestId(`pin-key-${digit}`).click();
  }
  await expect(page.getByTestId("pin-error")).toBeVisible({ timeout: 15000 });

  // Dots reset to empty after the ~800ms error flash.
  await expect(page.getByTestId("pin-dot-0")).not.toHaveClass(/bg-orange-600/, { timeout: 5000 });

  for (const digit of ["1", "2", "3", "4"]) {
    await page.getByTestId(`pin-key-${digit}`).click();
  }
  await page.getByTestId("pin-dots").waitFor({ state: "hidden", timeout: 15000 });
});

test("lock button returns to the PIN screen", async ({ page }) => {
  await loginAsTestUser(page);
  await page.getByTestId("pin-dots").waitFor({ state: "visible", timeout: 15000 });
  for (const digit of ["1", "2", "3", "4"]) {
    await page.getByTestId(`pin-key-${digit}`).click();
  }
  await page.getByTestId("pin-dots").waitFor({ state: "hidden", timeout: 15000 });

  await page.getByRole("button", { name: "Lock karo" }).click();
  await page.getByTestId("pin-dots").waitFor({ state: "visible", timeout: 15000 });

  // The lock is server-enforced (httpOnly cookie), not just a client route -- confirm a direct
  // navigation to a real page also bounces back to /lock instead of rendering.
  await page.goto("/customers");
  await page.getByTestId("pin-dots").waitFor({ state: "visible", timeout: 15000 });
});
