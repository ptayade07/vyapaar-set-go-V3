"use server";

import { CustomerTransactionType, SupplierTransactionType } from "@prisma/client";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { applyCustomerEntry, applySupplierEntry } from "@/lib/balance";
import { optionalText, parseAmountToPaise } from "@/lib/format";
import { prisma } from "@/lib/prisma";

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
