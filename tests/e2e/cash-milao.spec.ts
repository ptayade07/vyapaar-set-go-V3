import { expect, test } from "@playwright/test";
import { unlockPin } from "./utils";

// A date far enough in the past to guarantee zero seeded/created transactions, so expected
// drawer cash is exactly the opening cash entered -- no need to know today's live totals.
const EMPTY_DATE = "2020-01-01";

test("cash milao reports match, short, and extra correctly", async ({ page }) => {
  await unlockPin(page);
  await page.goto(`/hisaab?date=${EMPTY_DATE}`);

  const openingInput = page.getByTestId("opening-cash-input");
  await openingInput.fill("1000");
  await page.getByTestId("save-opening-btn").click();
  await expect(page.getByTestId("expected-cash")).toHaveText("₹1,000", { timeout: 15000 });

  const actualInput = page.getByTestId("actual-cash-input");

  await actualInput.fill("1000");
  await expect(page.getByTestId("cash-match")).toBeVisible({ timeout: 15000 });

  await actualInput.fill("900");
  await expect(page.getByTestId("cash-short")).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId("cash-short")).toContainText("₹100");

  await actualInput.fill("1200");
  await expect(page.getByTestId("cash-extra")).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId("cash-extra")).toContainText("₹200");
});
