import type { Page } from "@playwright/test";

export async function unlockPin(page: Page) {
  await page.goto("/");
  for (const digit of ["1", "2", "3", "4"]) {
    await page.getByTestId(`pin-key-${digit}`).click();
  }
  await page.waitForURL("/");
}
