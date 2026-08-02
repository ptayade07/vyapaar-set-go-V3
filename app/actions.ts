"use server";

import { CustomerTransactionType, SupplierTransactionType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { applyCustomerEntry, applySupplierEntry } from "@/lib/balance";
import { optionalText, parseAmountToPaise } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { parseQuickEntryWithLlm } from "@/lib/quick-entry-llm";
import { MAX_QUICK_ENTRY_AMOUNT_PAISE, parseQuickEntryDeterministic, type QuickEntryType } from "@/lib/quick-entry";

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
        balanceAfterPaise,
      },
    });
  });

  revalidatePath("/");
  revalidatePath("/customers");
  revalidatePath(`/customers/${customerId}`);
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
