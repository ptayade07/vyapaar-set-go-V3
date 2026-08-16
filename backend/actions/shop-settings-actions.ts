"use server";

import { put } from "@vercel/blob";
import { revalidatePath } from "next/cache";
import { getCurrentShopId } from "@/backend/lib/auth";
import { setPin, verifyPin } from "@/backend/lib/pin";
import { prisma } from "@/backend/lib/prisma";

export async function updateShopSettings(formData: FormData) {
  const shopId = await getCurrentShopId();
  const name = String(formData.get("name") ?? "").trim();
  const address = String(formData.get("address") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();

  if (!name) {
    throw new Error("Shop name is required.");
  }

  await prisma.shop.update({
    where: { id: shopId },
    data: { name, address: address || null, phone: phone || null },
  });

  revalidatePath("/settings");
}

const LOGO_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]);
const MAX_LOGO_BYTES = 2 * 1024 * 1024; // smaller than receipt photos -- this is a logo, not a receipt

export type UploadLogoResult = { ok: true; url: string } | { ok: false; reason: string };

export async function uploadShopLogo(formData: FormData): Promise<UploadLogoResult> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { ok: false, reason: "not_configured" };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, reason: "no_file" };
  }
  if (!LOGO_MIME_TYPES.has(file.type)) {
    return { ok: false, reason: "unsupported_type" };
  }
  if (file.size > MAX_LOGO_BYTES) {
    return { ok: false, reason: "too_large" };
  }

  const shopId = await getCurrentShopId();
  const extension = file.type.split("/")[1] ?? "bin";
  const blob = await put(`vyapaar-set-go/logos/${shopId}-${crypto.randomUUID()}.${extension}`, file, {
    access: "public",
    contentType: file.type,
  });

  await prisma.shop.update({ where: { id: shopId }, data: { logoUrl: blob.url } });
  revalidatePath("/settings");

  return { ok: true, url: blob.url };
}

/**
 * Requires the *current* PIN before allowing a change -- otherwise anyone at an already-unlocked
 * device could silently take over the lock. Returns a plain boolean, same shape as
 * verifyPinAction in actions.ts.
 */
export async function changePinAction(currentPin: string, newPin: string): Promise<boolean> {
  if (!/^\d{4}$/.test(newPin)) {
    return false;
  }

  const shopId = await getCurrentShopId();
  const correct = await verifyPin(shopId, currentPin);
  if (!correct) {
    return false;
  }

  await setPin(shopId, newPin);
  return true;
}
