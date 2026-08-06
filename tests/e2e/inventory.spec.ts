import { expect, test } from "@playwright/test";
import { unlockPin } from "./utils";

test("create item, adjust stock into low-stock, edit price, then delete", async ({ page }) => {
  const itemName = `Codex Item ${Date.now()}`;

  await unlockPin(page);
  await page.goto("/inventory");

  await page.getByRole("button", { name: "Naya Item" }).click();
  await page.getByPlaceholder("Item ka naam").fill(itemName);
  await page.getByPlaceholder("Quantity").fill("6");
  await page.getByPlaceholder("Purchase price ₹").fill("10");
  await page.getByPlaceholder("Selling price ₹").fill("15");
  await page.getByRole("button", { name: "Save", exact: true }).click();

  // exact: true matters here -- the timestamp in itemName can coincidentally contain the same
  // digit as the quantity, and a substring match would then hit both the name and the quantity.
  const row = page.locator(".tactile-card", { hasText: itemName });
  await expect(row).toBeVisible({ timeout: 15000 });
  await expect(row.getByText("6", { exact: true })).toBeVisible();
  await expect(row.getByText("Kam stock!")).toHaveCount(0);

  await row.getByRole("button", { name: `Ghatao ${itemName} quantity` }).click();
  await expect(row.getByText("5", { exact: true })).toBeVisible({ timeout: 15000 });
  await expect(row.getByText("Kam stock!")).toBeVisible();

  // The edit form only holds itemName as an <input> value, not visible text, so the `row`
  // locator (which filters on hasText) stops matching once editing starts -- go unscoped for
  // the duration of the edit, on the assumption only one item is being edited at a time here.
  await row.getByRole("button", { name: "Edit" }).click();
  await page.locator('input[name="purchasePrice"]').fill("12");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await expect(row.getByText("₹12")).toBeVisible({ timeout: 15000 });

  page.once("dialog", (dialog) => dialog.accept());
  await row.getByRole("button", { name: `Delete ${itemName}` }).click();
  await expect(page.locator(".tactile-card", { hasText: itemName })).toHaveCount(0, { timeout: 15000 });
});
