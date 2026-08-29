import { expect, test } from "@playwright/test";
import { PrismaClient } from "@prisma/client";
import { ensureTestUser, loginAsTestUser } from "./utils";

const prisma = new PrismaClient();

test("wrong credentials show an inline error and don't log in", async ({ page }) => {
  await ensureTestUser(); // make sure the fixed test user exists, so this is a genuinely wrong password
  await page.goto("/login");
  await page.getByLabel("Email").fill("nobody@vyapaarsetgo.test");
  await page.getByLabel("Password").fill("wrong-password");
  await page.getByRole("button", { name: "Login karo" }).click();
  await expect(page.getByTestId("login-error")).toBeVisible({ timeout: 15000 });
});

test("correct credentials log in, land on the PIN screen, and logout ends the session", async ({ page }) => {
  await loginAsTestUser(page);
  await page.getByTestId("pin-dots").waitFor({ state: "visible", timeout: 15000 });
  for (const digit of ["1", "2", "3", "4"]) {
    await page.getByTestId(`pin-key-${digit}`).click();
  }
  await page.getByTestId("pin-dots").waitFor({ state: "hidden", timeout: 15000 });

  await page.getByRole("button", { name: "Logout" }).click();
  await page.getByLabel("Email").waitFor({ state: "visible", timeout: 15000 });

  // The session is server-enforced (httpOnly cookie), not just a client route -- confirm a direct
  // navigation to a real page also bounces back to /login instead of rendering.
  await page.goto("/customers");
  await page.getByLabel("Email").waitFor({ state: "visible", timeout: 15000 });
});

test("repeated wrong-password attempts eventually get rate limited", async ({ page }) => {
  test.setTimeout(60000);
  // The rate limit is per caller IP, not per email -- other tests in this same file (and this
  // worker's shared IP bucket) may have already used up part of the budget, so this doesn't assert
  // on a specific attempt number. It just proves the limit is reachable and shows the right
  // message once it is.
  //
  // Cleanup at the end matters here more than in most other tests: every real user of this suite
  // shares one local IP bucket, so if this test doesn't clear the LoginAttempt rows it creates, it
  // poisons every *other* test that needs to log in for the rest of the run -- they'd all hit this
  // same exhausted rate limit and never reach the PIN screen. In real production this can't happen
  // (different users have different real IPs); it's purely a local-testing artifact.
  try {
    let sawRateLimited = false;
    for (let attempt = 0; attempt < 6 && !sawRateLimited; attempt++) {
      await page.goto("/login");
      await page.getByLabel("Email").fill(`rate-limit-probe-${attempt}@vyapaarsetgo.test`);
      await page.getByLabel("Password").fill("wrong-password");
      await page.getByRole("button", { name: "Login karo" }).click();
      await expect(page.getByTestId("login-error")).toBeVisible({ timeout: 15000 });
      const text = await page.getByTestId("login-error").innerText();
      sawRateLimited = text.includes("Too many attempts");
    }
    expect(sawRateLimited).toBe(true);
  } finally {
    await prisma.loginAttempt.deleteMany({});
  }
});
