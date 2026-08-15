import type { Page } from "@playwright/test";

// Every spec here predates multi-tenancy and only cares about landing inside *some* shop with a
// clean, predictable slate -- not a specific one. Each test gets its own fresh browser context (no
// shared cookies), so this re-selects the same fixed shop by name every time rather than creating a
// fresh one per test, which would otherwise pile up junk shops in the picker on every run.
const TEST_SHOP_NAME = "E2E Test Shop";

export async function selectOrCreateTestShop(page: Page) {
  await page.goto("/select-shop");
  const existingButton = page.getByRole("button", { name: TEST_SHOP_NAME, exact: true });
  if (await existingButton.count()) {
    await existingButton.click();
    return;
  }
  await page.getByPlaceholder("e.g. Ramesh Kirana").fill(TEST_SHOP_NAME);
  await page.getByRole("button", { name: "Create & use this shop" }).click();
}

export async function unlockPin(page: Page) {
  await selectOrCreateTestShop(page);
  // A Server Action redirect() followed via the client router's RSC transition renders /lock's
  // content correctly but doesn't reliably update the address bar to match (see
  // tenant-isolation.spec.ts) -- wait on the PIN keypad itself rather than the URL.
  await page.getByTestId("pin-dots").waitFor({ state: "visible", timeout: 15000 });
  for (const digit of ["1", "2", "3", "4"]) {
    await page.getByTestId(`pin-key-${digit}`).click();
  }
  await page.getByTestId("pin-dots").waitFor({ state: "hidden", timeout: 15000 });
}
