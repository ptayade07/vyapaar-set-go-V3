"use server";

import { compare } from "bcryptjs";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/backend/lib/auth";
import { prisma } from "@/backend/lib/prisma";
import { createSessionToken } from "@/backend/lib/session";

const UNLOCK_COOKIE = "vsg_unlocked";

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
