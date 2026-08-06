import { expect, test } from "@playwright/test";
import { unlockPin } from "./utils";

test("language toggle switches nav labels and persists across reload", async ({ page }) => {
  await unlockPin(page);

  await expect(page.locator("aside").getByText("Grahak", { exact: true })).toBeVisible();

  await page.getByRole("button", { name: "English" }).click();
  await expect(page.locator("aside").getByText("Customers", { exact: true })).toBeVisible({ timeout: 5000 });
  await expect(page.getByRole("button", { name: "हिंग्लिश" })).toBeVisible();

  await page.reload({ waitUntil: "networkidle" });
  await expect(page.locator("aside").getByText("Customers", { exact: true })).toBeVisible({ timeout: 15000 });

  await page.getByRole("button", { name: "हिंग्लिश" }).click();
  await expect(page.locator("aside").getByText("Grahak", { exact: true })).toBeVisible({ timeout: 5000 });
});
