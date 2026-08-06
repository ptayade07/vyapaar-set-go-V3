import { expect, test } from "@playwright/test";
import { unlockPin } from "./utils";

test("create note, mark it done, then delete it", async ({ page }) => {
  const title = `Codex Note ${Date.now()}`;

  await unlockPin(page);
  await page.goto("/notes");

  await page.getByRole("button", { name: "Naya Note" }).click();
  await page.getByPlaceholder("Title").fill(title);
  await page.getByRole("button", { name: "Save", exact: true }).click();

  const row = page.locator(".tactile-card", { hasText: title });
  await expect(row).toBeVisible({ timeout: 15000 });

  await row.getByRole("button", { name: "Mark done" }).click();
  await expect(row.getByRole("button", { name: "Mark not done" })).toBeVisible({ timeout: 15000 });

  page.once("dialog", (dialog) => dialog.accept());
  await row.getByRole("button", { name: "Delete note" }).click();
  await expect(page.locator(".tactile-card", { hasText: title })).toHaveCount(0, { timeout: 15000 });
});
