"use server";

import { createHash, randomBytes } from "node:crypto";
import { compare, hash } from "bcryptjs";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/backend/lib/auth";
import { sendPasswordResetEmail } from "@/backend/lib/email";
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
const PASSWORD_RESET_RATE_LIMIT = 5;
const PASSWORD_RESET_RATE_WINDOW_MS = 60 * 60 * 1000; // 1 hour
const PASSWORD_RESET_TOKEN_TTL_MS = 60 * 60 * 1000; // 1 hour

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

async function getBaseUrl(): Promise<string> {
  const headerStore = await headers();
  const host = headerStore.get("host") ?? "localhost:3000";
  const proto = headerStore.get("x-forwarded-proto") ?? (process.env.NODE_ENV === "production" ? "https" : "http");
  return `${proto}://${host}`;
}

export type RequestPasswordResetResult = { ok: true } | { ok: false; error: "RATE_LIMITED" };

/**
 * Always returns { ok: true } for a request that isn't rate limited -- regardless of whether the
 * email actually belongs to a User -- and only sends an email when it does. Same anti-enumeration
 * principle as loginAction: the response can't be used to check which emails are registered.
 * Rate limiting itself is a different, revealable concern (too many *requests* from this IP, not
 * "this specific email exists"), so RATE_LIMITED is a distinct, visible result.
 */
export async function requestPasswordResetAction(email: string): Promise<RequestPasswordResetResult> {
  const ipHash = await getCallerIpHash();
  const allowed = await isWithinRateLimit(
    prisma.passwordResetAttempt,
    ipHash,
    PASSWORD_RESET_RATE_LIMIT,
    PASSWORD_RESET_RATE_WINDOW_MS,
  );
  if (!allowed) {
    return { ok: false, error: "RATE_LIMITED" };
  }
  await recordAttempt(prisma.passwordResetAttempt, ipHash);

  const normalizedEmail = email.trim().toLowerCase();
  const user = await prisma.user.findUnique({ where: { email: normalizedEmail } });
  if (user) {
    const rawToken = randomBytes(32).toString("hex");
    const tokenHash = createHash("sha256").update(rawToken).digest("hex");
    const expiresAt = new Date(Date.now() + PASSWORD_RESET_TOKEN_TTL_MS);
    await prisma.passwordResetToken.create({ data: { tokenHash, userId: user.id, expiresAt } });

    const baseUrl = await getBaseUrl();
    await sendPasswordResetEmail(user.email, `${baseUrl}/reset-password?token=${rawToken}`);
  }

  return { ok: true };
}

export type ResetPasswordResult =
  | { ok: true }
  | { ok: false; error: "INVALID_OR_EXPIRED_TOKEN" | "WEAK_PASSWORD" };

/**
 * Looks the token up by its hash (never the raw value -- see the PasswordResetToken model), and
 * deliberately collapses "no such token" and "token expired" into one INVALID_OR_EXPIRED_TOKEN
 * result -- distinguishing them tells an attacker holding a guessed/leaked token more than they
 * need to know.
 */
export async function resetPasswordAction(rawToken: string, newPassword: string): Promise<ResetPasswordResult> {
  if (newPassword.length < MIN_PASSWORD_LENGTH) {
    return { ok: false, error: "WEAK_PASSWORD" };
  }

  const tokenHash = createHash("sha256").update(rawToken).digest("hex");
  const resetToken = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });
  if (!resetToken || resetToken.expiresAt < new Date()) {
    return { ok: false, error: "INVALID_OR_EXPIRED_TOKEN" };
  }

  const passwordHash = await hash(newPassword, SALT_ROUNDS);
  await prisma.user.update({ where: { id: resetToken.userId }, data: { passwordHash } });
  // Every outstanding token for this user, not just the one used -- if multiple reset emails were
  // requested, using one invalidates the others too, so an old leaked link stops working.
  await prisma.passwordResetToken.deleteMany({ where: { userId: resetToken.userId } });

  return { ok: true };
}
