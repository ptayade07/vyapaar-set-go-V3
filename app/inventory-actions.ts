"use server";

import { revalidatePath } from "next/cache";
import { parseAmountToPaise } from "@/lib/format";
import { prisma } from "@/lib/prisma";

function parseQuantity(value: FormDataEntryValue | null) {
  const text = String(value ?? "").trim();
  if (!text) return 0;

  const numeric = Number(text);
  if (!Number.isInteger(numeric) || numeric < 0) {
    throw new Error("Quantity must be a whole number, zero or more.");
  }

  return numeric;
}

export async function createInventoryItem(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    throw new Error("Item name is required.");
  }

  await prisma.inventoryItem.create({
    data: {
      name,
      quantity: parseQuantity(formData.get("quantity")),
      purchasePricePaise: parseAmountToPaise(formData.get("purchasePrice")),
      sellingPricePaise: parseAmountToPaise(formData.get("sellingPrice")),
    },
  });

  revalidatePath("/inventory");
}

export async function updateInventoryItem(itemId: string, formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();

  if (!name) {
    throw new Error("Item name is required.");
  }

  await prisma.inventoryItem.update({
    where: { id: itemId },
    data: {
      name,
      purchasePricePaise: parseAmountToPaise(formData.get("purchasePrice")),
      sellingPricePaise: parseAmountToPaise(formData.get("sellingPrice")),
    },
  });

  revalidatePath("/inventory");
}

export async function adjustInventoryQuantity(itemId: string, delta: number) {
  if (!Number.isInteger(delta) || delta === 0) {
    throw new Error("Quantity delta must be a non-zero whole number.");
  }

  await prisma.$transaction(async (tx) => {
    const item = await tx.inventoryItem.findUniqueOrThrow({
      where: { id: itemId },
      select: { quantity: true },
    });
    const quantity = Math.max(0, item.quantity + delta);

    await tx.inventoryItem.update({
      where: { id: itemId },
      data: { quantity },
    });
  });

  revalidatePath("/inventory");
}
