import { expect, test } from "@playwright/test";
import { unlockPin } from "./utils";

test("language toggle switches nav labels and persists across reload", async ({ page }) => {
  await unlockPin(page);

  // Every assertion here gets the same generous 15s budget as the rest of the suite -- Neon's
  // free-tier round-trip latency (see README) makes even a bare "is this text visible" check
  // marginal against Playwright's plain 5s default, especially under repeated back-to-back runs.
  await expect(page.locator("aside").getByText("Grahak", { exact: true })).toBeVisible({ timeout: 15000 });

  await page.getByRole("button", { name: "English" }).click();
  await expect(page.locator("aside").getByText("Customers", { exact: true })).toBeVisible({ timeout: 15000 });
  await expect(page.getByRole("button", { name: "हिंग्लिश" })).toBeVisible({ timeout: 15000 });

  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("aside").getByText("Customers", { exact: true })).toBeVisible({ timeout: 15000 });

  await page.getByRole("button", { name: "हिंग्लिश" }).click();
  await expect(page.locator("aside").getByText("Grahak", { exact: true })).toBeVisible({ timeout: 15000 });
});
