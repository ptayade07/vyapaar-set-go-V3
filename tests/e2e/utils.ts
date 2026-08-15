import type { Page } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

// Direct Prisma access here (not through the app) mirrors backend/prisma/create-pilot-user.ts --
// the same "hand-create a Shop + User" mechanism Stage 2 uses for real pilot shopkeepers, just
// invoked from test setup instead of the CLI.
const prisma = new PrismaClient();

const DEFAULT_TEST_EMAIL = "e2e-test@vyapaarsetgo.test";
const DEFAULT_TEST_PASSWORD = "e2e-test-password-1234";
const DEFAULT_TEST_SHOP_NAME = "E2E Test Shop";

type TestUserOptions = {
  email?: string;
  password?: string;
  shopName?: string;
};

// Every spec here only cares about being logged into *some* shop with a clean, predictable slate
// -- not a specific one. With no options passed, this re-uses the same fixed test user every run
// (found by email) rather than creating a fresh one per test, which would otherwise pile up junk
// shops on every run. tenant-isolation.spec.ts passes distinct emails/shop names to get two
// genuinely separate accounts.
export async function ensureTestUser(options: TestUserOptions = {}) {
  const email = options.email ?? DEFAULT_TEST_EMAIL;
  const password = options.password ?? DEFAULT_TEST_PASSWORD;
  const shopName = options.shopName ?? DEFAULT_TEST_SHOP_NAME;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { user: existing, email, password };
  }

  const shop = await prisma.shop.create({ data: { name: shopName } });
  const passwordHash = await hash(password, 10);
  const user = await prisma.user.create({ data: { email, passwordHash, shopId: shop.id } });
  return { user, email, password };
}

export async function loginAsTestUser(page: Page, options: TestUserOptions = {}) {
  const { email, password } = await ensureTestUser(options);
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill(password);
  await page.getByRole("button", { name: "Login karo" }).click();
}

export async function unlockPin(page: Page, options: TestUserOptions = {}) {
  await loginAsTestUser(page, options);
  // A Server Action redirect() followed via the client router's RSC transition renders /lock's
  // content correctly but doesn't reliably update the address bar to match (see
  // tenant-isolation.spec.ts) -- wait on the PIN keypad itself rather than the URL.
  await page.getByTestId("pin-dots").waitFor({ state: "visible", timeout: 15000 });
  for (const digit of ["1", "2", "3", "4"]) {
    await page.getByTestId(`pin-key-${digit}`).click();
  }
  await page.getByTestId("pin-dots").waitFor({ state: "hidden", timeout: 15000 });
}
