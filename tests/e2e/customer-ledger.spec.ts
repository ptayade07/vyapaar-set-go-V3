import { expect, test } from "@playwright/test";

test("create customer, add udhaar, then overpay into advance", async ({ page }) => {
  const customerName = `Codex Test ${Date.now()}`;

  await page.goto("/customers");
  const addCustomerForm = page.locator("#add-customer");
  await addCustomerForm.getByLabel("Name", { exact: true }).fill(customerName);
  await addCustomerForm.getByLabel("Phone", { exact: true }).fill("9000000001");
  await addCustomerForm.getByRole("button", { name: "+ New Customer" }).click();

  await expect(page.getByRole("heading", { name: customerName })).toBeVisible();

  await page.getByTestId("entry-type-UDHAAR").click();
  await page.getByLabel("Amount").fill("500");
  await page.getByLabel("Short note").fill("Test udhaar");
  await page.getByRole("button", { name: "Save Entry" }).click();
  await expect(page.getByText("Udhaar ₹500").first()).toBeVisible();

  await page.getByTestId("entry-type-PAYMENT").click();
  await page.getByLabel("Amount").fill("800");
  await page.getByLabel("Short note").fill("Test overpayment");
  await page.getByRole("button", { name: "Save Entry" }).click();
  await expect(page.getByText("Advance ₹300").first()).toBeVisible();
});
