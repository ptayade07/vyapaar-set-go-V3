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
  const addCustomerForm = page.locator("#add-customer");
  await addCustomerForm.getByLabel("Name", { exact: true }).fill(customerName);
  await addCustomerForm.getByLabel("Phone", { exact: true }).fill("9000000001");
  await addCustomerForm.getByRole("button", { name: "+ New Customer" }).click();
  await page.waitForLoadState("networkidle");

  await expect(page.getByRole("heading", { name: customerName })).toBeVisible({ timeout: 15000 });

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
