"use server";

import { put } from "@vercel/blob";
import { CustomerTransactionType, SupplierTransactionType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { applyCustomerEntry, applySupplierEntry } from "@/backend/lib/balance";
import { optionalText, parseAmountToPaise } from "@/backend/lib/format";
import { verifyPin } from "@/backend/lib/pin";
import { prisma } from "@/backend/lib/prisma";
import { getCurrentShopId, SHOP_COOKIE } from "@/backend/lib/shop-context";

const UNLOCK_COOKIE = "vsg_unlocked";

export async function verifyPinAction(pin: string): Promise<boolean> {
  const shopId = await getCurrentShopId();
  const correct = await verifyPin(shopId, pin);
  if (correct) {
    const cookieStore = await cookies();
    cookieStore.set(UNLOCK_COOKIE, "1", {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
    });
  }
  return correct;
}

/** Locks the current shop's session but stays on the same shop -- the PIN screen for that same
 * shop reappears rather than forcing a re-pick. See switchShopAction for actually changing shops. */
export async function lockAction() {
  const cookieStore = await cookies();
  cookieStore.delete(UNLOCK_COOKIE);
  redirect("/lock");
}

export async function switchShopAction() {
  const cookieStore = await cookies();
  cookieStore.delete(UNLOCK_COOKIE);
  cookieStore.delete(SHOP_COOKIE);
  redirect("/select-shop");
}

export async function setOpeningCash(date: string, amountPaise: number) {
  if (!Number.isInteger(amountPaise) || amountPaise < 0) {
    throw new Error("Opening cash must be zero or a positive whole paise value.");
  }
  const shopId = await getCurrentShopId();

  await prisma.openingCash.upsert({
    where: { shopId_date: { shopId, date } },
    create: { shopId, date, amountPaise },
    update: { amountPaise },
  });

  revalidatePath("/hisaab");
}

export async function createCustomer(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    throw new Error("Customer name is required.");
  }
  const shopId = await getCurrentShopId();

  const customer = await prisma.customer.create({
    data: {
      shopId,
      name,
      phone: optionalText(formData.get("phone")),
      note: optionalText(formData.get("note")),
    },
  });

  revalidatePath("/customers");
  revalidatePath("/");
  redirect(`/customers/${customer.id}`);
}

export async function addCustomerEntry(customerId: string, formData: FormData) {
  const type = String(formData.get("type")) as CustomerTransactionType;
  const amountPaise = parseAmountToPaise(formData.get("amount"));
  const description = optionalText(formData.get("description"));
  const photoUrl = optionalText(formData.get("photoUrl"));

  if (!["UDHAAR", "PAYMENT", "ADVANCE"].includes(type)) {
    throw new Error("Invalid customer transaction type.");
  }
  const shopId = await getCurrentShopId();

  await prisma.$transaction(async (tx) => {
    // findFirstOrThrow with shopId in the where clause, not findUnique-by-id-then-check: this is
    // the authorization boundary that stops shop A from posting an entry against shop B's
    // customer id even if they somehow get hold of it.
    const customer = await tx.customer.findFirstOrThrow({
      where: { id: customerId, shopId },
      select: { balancePaise: true },
    });
    const balanceAfterPaise = applyCustomerEntry(customer.balancePaise, type, amountPaise);

    await tx.customer.update({
      where: { id: customerId },
      data: { balancePaise: balanceAfterPaise },
    });
    await tx.customerTransaction.create({
      data: {
        shopId,
        customerId,
        type,
        amountPaise,
        description,
        photoUrl,
        balanceAfterPaise,
      },
    });
  });

  revalidatePath("/");
  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
}

export async function deleteCustomerTransaction(customerId: string, transactionId: string) {
  const shopId = await getCurrentShopId();

  await prisma.$transaction(async (tx) => {
    // Ownership check up front -- everything else in this function only ever touches rows
    // scoped by customerId, so this one check covers the whole transaction.
    await tx.customer.findFirstOrThrow({ where: { id: customerId, shopId }, select: { id: true } });

    const transactions = await tx.customerTransaction.findMany({
      where: { customerId },
      orderBy: { createdAt: "asc" },
    });
    const remaining = transactions.filter((transaction) => transaction.id !== transactionId);

    let runningBalance = 0;
    for (const transaction of remaining) {
      runningBalance = applyCustomerEntry(runningBalance, transaction.type, transaction.amountPaise);
      if (transaction.balanceAfterPaise !== runningBalance) {
        await tx.customerTransaction.update({
          where: { id: transaction.id },
          data: { balanceAfterPaise: runningBalance },
        });
      }
    }

    await tx.customerTransaction.delete({ where: { id: transactionId } });
    await tx.customer.update({ where: { id: customerId }, data: { balancePaise: runningBalance } });
  });

  revalidatePath("/");
  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
}

const PHOTO_MIME_TYPES = new Set(["image/jpeg", "image/png", "image/gif", "image/webp", "image/heic"]);
const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

export type UploadPhotoResult = { ok: true; url: string } | { ok: false; reason: string };

export async function uploadTransactionPhoto(formData: FormData): Promise<UploadPhotoResult> {
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return { ok: false, reason: "not_configured" };
  }

  const file = formData.get("file");
  if (!(file instanceof File)) {
    return { ok: false, reason: "no_file" };
  }
  if (!PHOTO_MIME_TYPES.has(file.type)) {
    return { ok: false, reason: "unsupported_type" };
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return { ok: false, reason: "too_large" };
  }

  const extension = file.type.split("/")[1] ?? "bin";
  const blob = await put(`vyapaar-set-go/receipts/${crypto.randomUUID()}.${extension}`, file, {
    access: "public",
    contentType: file.type,
  });

  return { ok: true, url: blob.url };
}

export async function createSupplier(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    throw new Error("Supplier name is required.");
  }
  const shopId = await getCurrentShopId();

  const supplier = await prisma.supplier.create({
    data: {
      shopId,
      name,
      phone: optionalText(formData.get("phone")),
      note: optionalText(formData.get("note")),
    },
  });

  revalidatePath("/suppliers");
  revalidatePath("/");
  redirect(`/suppliers/${supplier.id}`);
}

export async function addSupplierEntry(supplierId: string, formData: FormData) {
  const type = String(formData.get("type")) as SupplierTransactionType;
  const amountPaise = parseAmountToPaise(formData.get("amount"));
  const description = optionalText(formData.get("description"));
  const dueDateValue = optionalText(formData.get("dueDate"));

  if (!["CREDIT", "PAYMENT"].includes(type)) {
    throw new Error("Invalid supplier transaction type.");
  }
  const shopId = await getCurrentShopId();

  await prisma.$transaction(async (tx) => {
    const supplier = await tx.supplier.findFirstOrThrow({
      where: { id: supplierId, shopId },
      select: { balancePaise: true },
    });
    const balanceAfterPaise = applySupplierEntry(supplier.balancePaise, type, amountPaise);

    await tx.supplier.update({
      where: { id: supplierId },
      data: { balancePaise: balanceAfterPaise },
    });
    await tx.supplierTransaction.create({
      data: {
        shopId,
        supplierId,
        type,
        amountPaise,
        description,
        dueDate: dueDateValue && type === "CREDIT" ? new Date(`${dueDateValue}T00:00:00+05:30`) : null,
        balanceAfterPaise,
      },
    });
  });

  revalidatePath("/");
  revalidatePath("/suppliers");
  revalidatePath(`/suppliers/${supplierId}`);
}
