import { expect, test } from "@playwright/test";

async function unlockPin(page: import("@playwright/test").Page) {
  await page.goto("/");
  for (const digit of ["1", "2", "3", "4"]) {
    await page.getByTestId(`pin-key-${digit}`).click();
  }
  await page.waitForURL("/");
}

test("create customer, add udhaar, then overpay into advance", async ({ page }) => {
  const customerName = `Codex Test ${Date.now()}`;

  await unlockPin(page);
  await page.goto("/customers");
  await page.getByRole("button", { name: "Naya Grahak" }).click();
  await page.getByPlaceholder("Naam (required)").fill(customerName);
  await page.getByPlaceholder("Phone (optional)").fill("9000000001");
  await page.getByRole("button", { name: "Save karo" }).click();
  await page.waitForLoadState("networkidle");

  await expect(page.getByRole("heading", { name: customerName })).toBeVisible({ timeout: 15000 });

  await page.getByRole("button", { name: "Udhaar Diya" }).click();
  await page.locator('input[name="amount"]').fill("500");
  await page.locator('input[name="description"]').fill("Test udhaar");
  await page.getByRole("button", { name: /Save/ }).click();
  await expect(page.locator('input[name="amount"]')).toBeHidden({ timeout: 15000 });
  await expect(page.getByText("+₹500").first()).toBeVisible();

  await page.getByRole("button", { name: "Payment Liya" }).click();
  await page.locator('input[name="amount"]').fill("800");
  await page.locator('input[name="description"]').fill("Test overpayment");
  await page.getByRole("button", { name: /Save/ }).click();
  await expect(page.locator('input[name="amount"]')).toBeHidden({ timeout: 15000 });

  await expect(page.getByText("Advance").first()).toBeVisible({ timeout: 15000 });
  await expect(page.getByText("₹300").first()).toBeVisible({ timeout: 15000 });
});
