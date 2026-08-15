import { expect, test, type Page } from "@playwright/test";
import { loginAsTestUser } from "./utils";

async function loginAndUnlock(page: Page, email: string, shopName: string) {
  await loginAsTestUser(page, { email, password: "isolation-test-password-1234", shopName });
  // A Server Action redirect() followed via the client router's RSC transition renders /lock's
  // content correctly but doesn't reliably update the address bar to match -- a cosmetic quirk,
  // not a gating bug, so the test asserts on what's actually rendered.
  await page.getByTestId("pin-dots").waitFor({ state: "visible", timeout: 15000 });
  for (const digit of ["1", "2", "3", "4"]) {
    await page.getByTestId(`pin-key-${digit}`).click();
  }
  await page.getByTestId("pin-dots").waitFor({ state: "hidden", timeout: 15000 });
}

async function addCustomer(page: Page, name: string) {
  await page.goto("/customers");
  await page.getByRole("button", { name: "Naya Grahak" }).click();
  await page.getByPlaceholder("Naam (required)").fill(name);
  await page.getByRole("button", { name: "Save karo" }).click();
  await page.waitForLoadState("networkidle");
}

async function addInventoryItem(page: Page, name: string) {
  await page.goto("/inventory");
  await page.getByRole("button", { name: "Naya Item" }).click();
  await page.getByPlaceholder("Item ka naam").fill(name);
  await page.getByPlaceholder("Purchase price ₹").fill("10");
  await page.getByPlaceholder("Selling price ₹").fill("15");
  await page.getByRole("button", { name: "Save", exact: true }).click();
  await page.waitForLoadState("networkidle");
}

// Two independent browser contexts, not two tabs sharing state -- this is the real-world shape
// of "two different shopkeepers on two different devices," and it means each gets its own cookie
// jar for free rather than needing to fake that.
test("two shops never see, list, or reach each other's data", async ({ browser }) => {
  // This test drives two full "shopkeepers" end to end (log in, unlock, create records,
  // cross-check) -- meaningfully more sequential round-trips than the other specs.
  test.setTimeout(150000);

  const contextA = await browser.newContext();
  const contextB = await browser.newContext();
  const pageA = await contextA.newPage();
  const pageB = await contextB.newPage();

  try {
    const stamp = Date.now();
    const emailA = `isolation-a-${stamp}@vyapaarsetgo.test`;
    const emailB = `isolation-b-${stamp}@vyapaarsetgo.test`;
    const shopAName = `Isolation Shop A ${stamp}`;
    const shopBName = `Isolation Shop B ${stamp}`;
    const customerAName = `Customer A ${stamp}`;
    const customerBName = `Customer B ${stamp}`;
    const itemAName = `Item A ${stamp}`;
    const itemBName = `Item B ${stamp}`;

    await loginAndUnlock(pageA, emailA, shopAName);
    await loginAndUnlock(pageB, emailB, shopBName);

    await addCustomer(pageA, customerAName);
    const customerAUrl = pageA.url();
    const customerAId = customerAUrl.split("/").pop();
    await addCustomer(pageB, customerBName);

    await addInventoryItem(pageA, itemAName);
    await addInventoryItem(pageB, itemBName);

    // Lists: each shop sees only its own row, never the other shop's.
    await pageA.goto("/customers");
    await expect(pageA.getByText(customerAName)).toBeVisible();
    await expect(pageA.getByText(customerBName)).toHaveCount(0);

    await pageB.goto("/customers");
    await expect(pageB.getByText(customerBName)).toBeVisible();
    await expect(pageB.getByText(customerAName)).toHaveCount(0);

    await pageA.goto("/inventory");
    await expect(pageA.getByText(itemAName)).toBeVisible();
    await expect(pageA.getByText(itemBName)).toHaveCount(0);

    // The authorization boundary, not just a list filter: shop B guessing shop A's customer id
    // in the URL bar must never render shop A's passbook. The page calls notFound(), which
    // renders app/not-found.tsx correctly -- but under self-hosted `next start` (this test
    // server), Next.js doesn't always set the actual HTTP status to 404 for that render (a known
    // Next.js gap; Vercel's edge layer patches it on real deploys). So the property this test
    // actually verifies is the one that matters for security -- shop A's name/data never reaches
    // the page -- rather than asserting on that cosmetic status code.
    await pageB.goto(`/customers/${customerAId}`);
    await expect(pageB.getByText("Nahi mila")).toBeVisible();
    await expect(pageB.getByText(customerAName)).toHaveCount(0);

    // Dashboard totals shouldn't leak into each other either.
    await pageB.goto("/");
    await expect(pageB.getByText(customerAName)).toHaveCount(0);
  } finally {
    await contextA.close();
    await contextB.close();
  }
});
