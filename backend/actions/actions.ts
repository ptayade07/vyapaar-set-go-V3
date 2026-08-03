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
import { parseQuickEntryWithLlm } from "@/backend/lib/quick-entry-llm";
import { MAX_QUICK_ENTRY_AMOUNT_PAISE, parseQuickEntryDeterministic, type QuickEntryType } from "@/backend/lib/quick-entry";

const UNLOCK_COOKIE = "vsg_unlocked";

export async function verifyPinAction(pin: string): Promise<boolean> {
  const correct = await verifyPin(pin);
  if (correct) {
    const cookieStore = await cookies();
    cookieStore.set(UNLOCK_COOKIE, "1", { httpOnly: true, sameSite: "lax", path: "/" });
  }
  return correct;
}

export async function lockAction() {
  const cookieStore = await cookies();
  cookieStore.delete(UNLOCK_COOKIE);
  redirect("/lock");
}

export async function setOpeningCash(date: string, amountPaise: number) {
  if (!Number.isInteger(amountPaise) || amountPaise < 0) {
    throw new Error("Opening cash must be zero or a positive whole paise value.");
  }

  await prisma.openingCash.upsert({
    where: { date },
    create: { date, amountPaise },
    update: { amountPaise },
  });

  revalidatePath("/hisaab");
}

export async function createCustomer(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    throw new Error("Customer name is required.");
  }

  const customer = await prisma.customer.create({
    data: {
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

  await prisma.$transaction(async (tx) => {
    const customer = await tx.customer.findUniqueOrThrow({
      where: { id: customerId },
      select: { balancePaise: true },
    });
    const balanceAfterPaise = applyCustomerEntry(customer.balancePaise, type, amountPaise);

    await tx.customer.update({
      where: { id: customerId },
      data: { balancePaise: balanceAfterPaise },
    });
    await tx.customerTransaction.create({
      data: {
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
  await prisma.$transaction(async (tx) => {
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

  const supplier = await prisma.supplier.create({
    data: {
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

  await prisma.$transaction(async (tx) => {
    const supplier = await tx.supplier.findUniqueOrThrow({
      where: { id: supplierId },
      select: { balancePaise: true },
    });
    const balanceAfterPaise = applySupplierEntry(supplier.balancePaise, type, amountPaise);

    await tx.supplier.update({
      where: { id: supplierId },
      data: { balancePaise: balanceAfterPaise },
    });
    await tx.supplierTransaction.create({
      data: {
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

export type QuickEntryParsePayload = {
  raw: string;
  amountPaise: number | null;
  type: QuickEntryType | null;
  customerId: string | null;
  customerName: string | null;
  source: "rule" | "llm";
  complete: boolean;
};

export async function parseQuickEntry(text: string): Promise<QuickEntryParsePayload> {
  const raw = text.trim();
  const customers = await prisma.customer.findMany({ select: { id: true, name: true } });
  const ruleResult = parseQuickEntryDeterministic(raw, customers);

  if (ruleResult.complete || !process.env.OPENAI_API_KEY) {
    return { ...ruleResult, source: "rule" };
  }

  const llmResult = await parseQuickEntryWithLlm(raw, customers);
  if (!llmResult) {
    return { ...ruleResult, source: "rule" };
  }

  const llmAmountPaise =
    llmResult.amountPaise !== null && llmResult.amountPaise <= MAX_QUICK_ENTRY_AMOUNT_PAISE
      ? llmResult.amountPaise
      : null;
  const amountPaise = llmAmountPaise ?? ruleResult.amountPaise;
  const type = llmResult.type ?? ruleResult.type;
  const nameGuess = llmResult.customerName ?? ruleResult.customerName;
  const matchedCustomer = nameGuess
    ? (customers.find((customer) => customer.name.toLowerCase() === nameGuess.toLowerCase()) ??
      customers.find((customer) => customer.name.toLowerCase().startsWith(nameGuess.toLowerCase())))
    : undefined;

  return {
    raw,
    amountPaise,
    type,
    customerName: matchedCustomer?.name ?? nameGuess,
    customerId: matchedCustomer?.id ?? null,
    source: "llm",
    complete: amountPaise !== null && type !== null && Boolean(nameGuess),
  };
}

export async function confirmQuickEntry(payload: {
  customerId: string | null;
  customerName: string;
  amountPaise: number;
  type: QuickEntryType;
  createCustomer: boolean;
  note: string;
}) {
  const customerName = payload.customerName.trim();

  if (!customerName) {
    throw new Error("Customer name is required.");
  }
  if (
    !Number.isInteger(payload.amountPaise) ||
    payload.amountPaise <= 0 ||
    payload.amountPaise > MAX_QUICK_ENTRY_AMOUNT_PAISE
  ) {
    throw new Error("Amount must be a positive paise value under the quick-entry limit.");
  }
  if (!["UDHAAR", "PAYMENT", "ADVANCE"].includes(payload.type)) {
    throw new Error("Invalid customer transaction type.");
  }
  if (!payload.customerId && !payload.createCustomer) {
    throw new Error("Unknown customer: confirm customer creation to save this entry.");
  }

  const customerId = await prisma.$transaction(async (tx) => {
    const resolvedId = payload.customerId
      ? payload.customerId
      : (await tx.customer.create({ data: { name: customerName } })).id;

    const customer = await tx.customer.findUniqueOrThrow({
      where: { id: resolvedId },
      select: { balancePaise: true },
    });
    const balanceAfterPaise = applyCustomerEntry(customer.balancePaise, payload.type, payload.amountPaise);

    await tx.customer.update({
      where: { id: resolvedId },
      data: { balancePaise: balanceAfterPaise },
    });
    await tx.customerTransaction.create({
      data: {
        customerId: resolvedId,
        type: payload.type,
        amountPaise: payload.amountPaise,
        description: payload.note,
        balanceAfterPaise,
      },
    });

    return resolvedId;
  });

  revalidatePath("/");
  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);

  return { customerId };
}
