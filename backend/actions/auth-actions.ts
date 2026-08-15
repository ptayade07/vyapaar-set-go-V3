"use server";

import { createHash } from "node:crypto";
import { compare, hash } from "bcryptjs";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/backend/lib/auth";
import { prisma } from "@/backend/lib/prisma";
import { createSessionToken } from "@/backend/lib/session";

const UNLOCK_COOKIE = "vsg_unlocked";
const MIN_PASSWORD_LENGTH = 8;
const SALT_ROUNDS = 12; // matches backend/prisma/create-pilot-user.ts
const SIGNUP_RATE_LIMIT = 5;
const SIGNUP_RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

/**
 * Verifies email+password against the User table and, on success, sets the session cookie.
 * Returns a plain boolean rather than throwing on bad credentials -- mirrors verifyPinAction's
 * shape in actions.ts -- and never distinguishes "email not found" from "wrong password" in what
 * it returns, so a failed attempt can't be used to enumerate registered emails.
 */
export async function loginAction(email: string, password: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    return false;
  }

  const valid = await compare(password, user.passwordHash);
  if (!valid) {
    return false;
  }

  const token = await createSessionToken({ userId: user.id, shopId: user.shopId });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  return true;
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(UNLOCK_COOKIE);
  redirect("/login");
}

// A hash of the caller's IP, not the raw address -- SignupAttempt doesn't become a second place
// raw IPs are stored. Falls back to a constant bucket when there's no proxy in front of the
// request (e.g. local dev without x-forwarded-for) -- rate limiting degrades to "one shared bucket
// for all local requests" there, which only matters for local testing, not production on Vercel.
async function getCallerIpHash(): Promise<string> {
  const headerStore = await headers();
  const forwardedFor = headerStore.get("x-forwarded-for");
  const ip = forwardedFor?.split(",")[0]?.trim() || "unknown";
  return createHash("sha256").update(ip).digest("hex");
}

export type SignupResult =
  | { ok: true }
  | { ok: false; error: "EMAIL_TAKEN" | "WEAK_PASSWORD" | "RATE_LIMITED" };

/**
 * Creates a new Shop + User in one call (the self-serve counterpart to
 * backend/prisma/create-pilot-user.ts) and logs the new user straight in. Unlike loginAction, this
 * *does* reveal whether an email is already registered -- that's normal, expected signup UX, not
 * an enumeration risk, since the person typing it already knows whether it's their own email. Rate
 * limited per caller IP -- see PRODUCTION_STAGES.md, Stage 3, for why: this is the app's first
 * fully public write endpoint.
 */
export async function signupAction(email: string, password: string, shopName: string): Promise<SignupResult> {
  if (password.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: "WEAK_PASSWORD" };
  }

  const ipHash = await getCallerIpHash();
  const windowStart = new Date(Date.now() - SIGNUP_RATE_WINDOW_MS);
  const recentAttempts = await prisma.signupAttempt.count({
    where: { ipHash, createdAt: { gte: windowStart } },
  });
  if (recentAttempts >= SIGNUP_RATE_LIMIT) {
    return { ok: false, error: "RATE_LIMITED" };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    // A collision still counts against the rate limit -- someone probing emails shouldn't get
    // unlimited free attempts just because each one fails.
    await prisma.signupAttempt.create({ data: { ipHash } });
    return { ok: false, error: "EMAIL_TAKEN" };
  }

  const passwordHash = await hash(password, SALT_ROUNDS);
  const shop = await prisma.shop.create({ data: { name: shopName.trim() || "My Shop" } });
  const user = await prisma.user.create({ data: { email: normalizedEmail, passwordHash, shopId: shop.id } });
  await prisma.signupAttempt.create({ data: { ipHash } });

  const token = await createSessionToken({ userId: user.id, shopId: user.shopId });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });

  return { ok: true };
}
