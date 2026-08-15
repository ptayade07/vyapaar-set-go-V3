"use server";

import { revalidatePath } from "next/cache";
import { parseAmountToPaise } from "@/backend/lib/format";
import { prisma } from "@/backend/lib/prisma";
import { getCurrentShopId } from "@/backend/lib/auth";

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
  const shopId = await getCurrentShopId();

  await prisma.inventoryItem.create({
    data: {
      shopId,
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
  const shopId = await getCurrentShopId();

  // Prisma's "extended where" lets a non-unique field (shopId) ride alongside the unique id on a
  // singular update: it throws RecordNotFound if the item exists but belongs to another shop,
  // rather than silently updating someone else's item.
  await prisma.inventoryItem.update({
    where: { id: itemId, shopId },
    data: {
      name,
      purchasePricePaise: parseAmountToPaise(formData.get("purchasePrice")),
      sellingPricePaise: parseAmountToPaise(formData.get("sellingPrice")),
    },
  });

  revalidatePath("/inventory");
}

export async function deleteInventoryItem(itemId: string) {
  const shopId = await getCurrentShopId();
  await prisma.inventoryItem.delete({ where: { id: itemId, shopId } });
  revalidatePath("/inventory");
}

export async function adjustInventoryQuantity(itemId: string, delta: number) {
  if (!Number.isInteger(delta) || delta === 0) {
    throw new Error("Quantity delta must be a non-zero whole number.");
  }
  const shopId = await getCurrentShopId();

  // A read-then-write (SELECT then UPDATE) would race under concurrent taps: two overlapping
  // requests can both read the same starting quantity and one increment gets lost. A single
  // atomic UPDATE lets Postgres's row lock serialize concurrent adjustments correctly.
  const updated = await prisma.$executeRaw`
    UPDATE "InventoryItem"
    SET quantity = GREATEST(0, quantity + ${delta}), "updatedAt" = now()
    WHERE id = ${itemId} AND "shopId" = ${shopId}
  `;

  if (updated === 0) {
    throw new Error("Inventory item not found.");
  }

  revalidatePath("/inventory");
}
