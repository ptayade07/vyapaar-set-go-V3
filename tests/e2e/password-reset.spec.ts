import { createHash, randomBytes } from "node:crypto";
import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { hash } from "bcryptjs";

// A dedicated PrismaClient here (not routed through utils.ts) mirrors the pattern already used
// elsewhere in this suite (e.g. utils.ts's own client) -- this file needs direct access to create
// users with known passwords and insert PasswordResetToken rows directly.
const prisma = new PrismaClient();

test("requesting a reset creates a token and shows the generic success message", async ({ page }) => {
  const stamp = Date.now();
  const email = `reset-request-${stamp}@vyapaarsetgo.test`;
  const shop = await prisma.shop.create({ data: { name: `Reset Request Shop ${stamp}` } });
  const user = await prisma.user.create({
    data: { email, passwordHash: await hash("original-password", 10), shopId: shop.id },
  });

  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Reset link bhejo — Send reset link" }).click();
  await page.waitForSelector("text=reset link bhej diya gaya hai", { timeout: 15000 });

  const tokens = await prisma.passwordResetToken.findMany({ where: { userId: user.id } });
  expect(tokens.length).toBe(1);
});

test("requesting a reset for an unregistered email shows the same generic message (no enumeration)", async ({
  page,
}) => {
  await page.goto("/forgot-password");
  await page.getByLabel("Email").fill(`nobody-${Date.now()}@vyapaarsetgo.test`);
  await page.getByRole("button", { name: "Reset link bhejo — Send reset link" }).click();
  await page.waitForSelector("text=reset link bhej diya gaya hai", { timeout: 15000 });
});

test("a valid token lets you set a new password; old password stops working; token can't be reused", async ({
  page,
}) => {
  test.setTimeout(60000);
  const stamp = Date.now();
  const email = `reset-consume-${stamp}@vyapaarsetgo.test`;
  const shop = await prisma.shop.create({ data: { name: `Reset Consume Shop ${stamp}` } });
  const user = await prisma.user.create({
    data: { email, passwordHash: await hash("original-password", 10), shopId: shop.id },
  });

  // Insert a known token directly -- mirrors what requestPasswordResetAction does, without needing
  // a real email service to deliver it (see backend/lib/email.ts's sandbox-mode note).
  const rawToken = randomBytes(32).toString("hex");
  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  await prisma.passwordResetToken.create({
    data: { tokenHash, userId: user.id, expiresAt: new Date(Date.now() + 60 * 60 * 1000) },
  });

  await page.goto(`/reset-password?token=${rawToken}`);
  await page.getByLabel("Naya password — New password").fill("brand-new-password-999");
  await page.getByLabel("Confirm karo — Confirm new password").fill("brand-new-password-999");
  await page.getByRole("button", { name: "Password badlo — Reset password" }).click();
  await page.waitForSelector("text=Password badal gaya", { timeout: 15000 });

  await page.waitForTimeout(2200); // the success screen auto-redirects to /login after 2s
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password").fill("original-password");
  await page.getByRole("button", { name: "Login karo" }).click();
  await page.getByTestId("login-error").waitFor({ state: "visible", timeout: 15000 });

  await page.getByLabel("Password").fill("brand-new-password-999");
  await page.getByRole("button", { name: "Login karo" }).click();
  await page.getByTestId("pin-dots").waitFor({ state: "visible", timeout: 15000 });

  // The same token, reused -- should now be rejected (deleted on successful consumption).
  await page.goto(`/reset-password?token=${rawToken}`);
  await page.getByLabel("Naya password — New password").fill("yet-another-password");
  await page.getByLabel("Confirm karo — Confirm new password").fill("yet-another-password");
  await page.getByRole("button", { name: "Password badlo — Reset password" }).click();
  await page.getByTestId("reset-password-error").waitFor({ state: "visible", timeout: 15000 });
});

test("mismatched confirm password shows an error before calling the server", async ({ page }) => {
  await page.goto("/reset-password?token=irrelevant-for-this-check");
  await page.getByLabel("Naya password — New password").fill("password-one-123");
  await page.getByLabel("Confirm karo — Confirm new password").fill("password-two-456");
  await page.getByRole("button", { name: "Password badlo — Reset password" }).click();
  await page.getByTestId("reset-password-error").waitFor({ state: "visible", timeout: 15000 });
});
