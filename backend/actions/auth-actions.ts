"use server";

import { compare, hash } from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/backend/lib/auth";
import { prisma } from "@/backend/lib/prisma";
import { getCallerIpHash, isWithinRateLimit, recordAttempt } from "@/backend/lib/rate-limit";
import { createSessionToken } from "@/backend/lib/session";

const UNLOCK_COOKIE = "vsg_unlocked";
const MIN_PASSWORD_LENGTH = 8;
const SALT_ROUNDS = 12; // matches backend/prisma/create-pilot-user.ts
const SIGNUP_RATE_LIMIT = 5;
const SIGNUP_RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const LOGIN_RATE_LIMIT = 5;
const LOGIN_RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour

async function setSessionCookie(userId: string, shopId: string) {
  const token = await createSessionToken({ userId, shopId });
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
}

export type LoginResult = { ok: true } | { ok: false; error: "INVALID_CREDENTIALS" | "RATE_LIMITED" };

/**
 * Verifies email+password against the User table and, on success, sets the session cookie.
 * Never distinguishes "email not found" from "wrong password" in what it returns, so a failed
 * attempt can't be used to enumerate registered emails.
 *
 * Rate limited per caller IP, counting only *failed* attempts -- a legitimate shopkeeper logging
 * in and out several times across devices in an hour shouldn't ever brush up against this; only
 * repeated wrong-password guesses do. Distinct from signupAction's rate limit, which counts every
 * attempt including the eventual successful one, because that limit is about signup *volume*, not
 * specifically about guessing.
 */
export async function loginAction(email: string, password: string): Promise<LoginResult> {
  const ipHash = await getCallerIpHash();
  const allowed = await isWithinRateLimit(prisma.loginAttempt, ipHash, LOGIN_RATE_LIMIT, LOGIN_RATE_WINDOW_MS);
  if (!allowed) {
    return { ok: false, error: "RATE_LIMITED" };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (!user) {
    await recordAttempt(prisma.loginAttempt, ipHash);
    return { ok: false, error: "INVALID_CREDENTIALS" };
  }

  const valid = await compare(password, user.passwordHash);
  if (!valid) {
    await recordAttempt(prisma.loginAttempt, ipHash);
    return { ok: false, error: "INVALID_CREDENTIALS" };
  }

  await setSessionCookie(user.id, user.shopId);
  return { ok: true };
}

export async function logoutAction() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(UNLOCK_COOKIE);
  redirect("/login");
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
  const allowed = await isWithinRateLimit(prisma.signupAttempt, ipHash, SIGNUP_RATE_LIMIT, SIGNUP_RATE_WINDOW_MS);
  if (!allowed) {
    return { ok: false, error: "RATE_LIMITED" };
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (existing) {
    // A collision still counts against the rate limit -- someone probing emails shouldn't get
    // unlimited free attempts just because each one fails.
    await recordAttempt(prisma.signupAttempt, ipHash);
    return { ok: false, error: "EMAIL_TAKEN" };
  }

  const passwordHash = await hash(password, SALT_ROUNDS);
  const shop = await prisma.shop.create({ data: { name: shopName.trim() || "My Shop" } });
  const user = await prisma.user.create({ data: { email: normalizedEmail, passwordHash, shopId: shop.id } });
  await recordAttempt(prisma.signupAttempt, ipHash);

  await setSessionCookie(user.id, user.shopId);
  return { ok: true };
}
