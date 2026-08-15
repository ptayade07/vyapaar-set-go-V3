"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/backend/lib/prisma";
import { SHOP_COOKIE } from "@/backend/lib/shop-context";

/**
 * Temporary stand-in for real login (Stage 2). Anyone who can reach this page -- gated by the
 * existing PIN lock -- can switch which shop's data they're looking at. Fine for one operator
 * managing a handful of pilot shops by hand; not meant to survive into public signup.
 */
export async function selectShopAction(formData: FormData) {
  const shopId = String(formData.get("shopId") ?? "");
  const shop = await prisma.shop.findUnique({ where: { id: shopId }, select: { id: true } });
  if (!shop) {
    throw new Error("Shop not found.");
  }

  const cookieStore = await cookies();
  cookieStore.set(SHOP_COOKIE, shop.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  redirect("/");
}

export async function createShopAction(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  if (!name) {
    throw new Error("Shop name is required.");
  }

  const shop = await prisma.shop.create({ data: { name } });

  const cookieStore = await cookies();
  cookieStore.set(SHOP_COOKIE, shop.id, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  });
  redirect("/");
}
