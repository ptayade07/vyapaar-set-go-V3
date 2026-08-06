import { expect, test } from "@playwright/test";
import { unlockPin } from "./utils";

test("create supplier, take maal on credit, then pay it down", async ({ page }) => {
  const supplierName = `Codex Supplier ${Date.now()}`;

  await unlockPin(page);
  await page.goto("/suppliers");
  await page.getByRole("button", { name: "Naya Supplier" }).click();
  await page.getByPlaceholder("Naam (required)").fill(supplierName);
  await page.getByPlaceholder("Phone (optional)").fill("9000000002");
  await page.getByRole("button", { name: "Save karo" }).click();
  await page.waitForLoadState("networkidle");

  await expect(page.getByRole("heading", { name: supplierName })).toBeVisible({ timeout: 15000 });

  await page.getByRole("button", { name: "Maal Liya" }).click();
  await page.locator('input[name="amount"]').fill("1000");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("+₹1,000").first()).toBeVisible({ timeout: 15000 });
  await expect(page.getByText("₹1,000").first()).toBeVisible({ timeout: 15000 });

  await page.getByRole("button", { name: "Payment Diya" }).click();
  await page.locator('input[name="amount"]').fill("400");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(page.getByText("-₹400").first()).toBeVisible({ timeout: 15000 });
  await expect(page.getByText("₹600").first()).toBeVisible({ timeout: 15000 });
});
