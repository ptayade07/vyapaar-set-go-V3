"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { InventoryItem } from "@prisma/client";
import { adjustInventoryQuantity, updateInventoryItem } from "@/app/inventory-actions";
import { formatMoneyPaise } from "@/lib/format";
import { isLowStock } from "@/lib/inventory";

type Props = {
  item: InventoryItem;
};

export function InventoryItemCard({ item }: Props) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [isPending, startTransition] = useTransition();
  const lowStock = isLowStock(item.quantity);

  function handleAdjust(delta: number) {
    startTransition(async () => {
      await adjustInventoryQuantity(item.id, delta);
      router.refresh();
    });
  }

  function handleSaveEdit(formData: FormData) {
    startTransition(async () => {
      await updateInventoryItem(item.id, formData);
      setEditing(false);
      router.refresh();
    });
  }

  if (editing) {
    return (
      <form action={handleSaveEdit} className="grid gap-3 rounded-lg border-2 border-amber-300 bg-amber-50 p-4">
        <label className="grid gap-2 text-sm font-bold text-[#384238]">
          Item name
          <input
            name="name"
            defaultValue={item.name}
            required
            className="tap-target rounded-md border border-stone-300 bg-white px-3 text-base focus:outline-none focus:ring-2 focus:ring-[#16803c]"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold text-[#384238]">
            Purchase price
            <input
              name="purchasePrice"
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              defaultValue={(item.purchasePricePaise / 100).toFixed(2)}
              required
              className="tap-target rounded-md border border-stone-300 bg-white px-3 text-lg font-black focus:outline-none focus:ring-2 focus:ring-[#16803c]"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-[#384238]">
            Selling price
            <input
              name="sellingPrice"
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              defaultValue={(item.sellingPricePaise / 100).toFixed(2)}
              required
              className="tap-target rounded-md border border-stone-300 bg-white px-3 text-lg font-black focus:outline-none focus:ring-2 focus:ring-[#16803c]"
            />
          </label>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="tap-target flex-1 rounded-md bg-[#16803c] px-4 text-base font-black text-white disabled:opacity-50"
          >
            {isPending ? "Save ho raha hai..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            disabled={isPending}
            className="tap-target rounded-md border border-stone-300 bg-white px-4 text-base font-black text-[#384238] disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div
      className={`grid gap-3 rounded-lg border-2 p-4 shadow-sm sm:grid-cols-[1fr_auto] ${
        lowStock ? "border-red-300 bg-red-50" : "border-stone-200 bg-white"
      }`}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-xl font-black text-[#1f271f]">{item.name}</p>
          {lowStock ? (
            <span className="rounded-md border border-red-300 bg-red-100 px-2 py-1 text-xs font-black text-[#b42318]">
              Kam stock!
            </span>
          ) : null}
        </div>
        <p className="text-sm font-semibold text-[#6f6a60]">
          Kharid {formatMoneyPaise(item.purchasePricePaise)} · Bikri {formatMoneyPaise(item.sellingPricePaise)}
        </p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-2 text-sm font-black text-[#16803c] underline-offset-2 hover:underline"
        >
          Edit
        </button>
      </div>
      <div className="flex items-center gap-3 self-center">
        <button
          type="button"
          onClick={() => handleAdjust(-1)}
          disabled={isPending || item.quantity <= 0}
          aria-label={`Ghatao ${item.name} quantity`}
          className="tap-target flex h-12 w-12 items-center justify-center rounded-md border-2 border-stone-300 bg-white text-2xl font-black text-[#1f271f] disabled:opacity-40"
        >
          −
        </button>
        <p
          className={`min-w-[3ch] text-center text-2xl font-black ${lowStock ? "text-[#b42318]" : "text-[#1f271f]"}`}
        >
          {item.quantity}
        </p>
        <button
          type="button"
          onClick={() => handleAdjust(1)}
          disabled={isPending}
          aria-label={`Badhao ${item.name} quantity`}
          className="tap-target flex h-12 w-12 items-center justify-center rounded-md border-2 border-[#16803c] bg-[#16803c] text-2xl font-black text-white disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  );
}
