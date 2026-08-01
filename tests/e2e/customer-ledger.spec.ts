import { expect, test } from "@playwright/test";

test("create customer, add udhaar, then overpay into advance", async ({ page }) => {
  const customerName = `Codex Test ${Date.now()}`;

  await page.goto("/customers");
  await page.getByLabel("Name").fill(customerName);
  await page.getByLabel("Phone").fill("9000000001");
  await page.getByRole("button", { name: "+ New Customer" }).click();

  await expect(page.getByRole("heading", { name: customerName })).toBeVisible();

  await page.getByLabel("Entry type").selectOption("UDHAAR");
  await page.getByLabel("Amount").fill("500");
  await page.getByLabel("Short note").fill("Test udhaar");
  await page.getByRole("button", { name: "Save Entry" }).click();
  await expect(page.getByText("Udhaar ₹500").first()).toBeVisible();

  await page.getByLabel("Entry type").selectOption("PAYMENT");
  await page.getByLabel("Amount").fill("800");
  await page.getByLabel("Short note").fill("Test overpayment");
  await page.getByRole("button", { name: "Save Entry" }).click();
  await expect(page.getByText("Advance ₹300").first()).toBeVisible();
});
