"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { InventoryItem } from "@prisma/client";
import { adjustInventoryQuantity, updateInventoryItem } from "@/backend/actions/inventory-actions";
import { Money } from "@/frontend/components/money";
import { isLowStock } from "@/backend/lib/inventory";

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
      <form action={handleSaveEdit} className="tactile-card grid gap-3 border-2 border-orange-200 bg-orange-50 p-4">
        <label className="grid gap-2 text-sm font-bold text-gray-700">
          Item name
          <input
            name="name"
            defaultValue={item.name}
            required
            className="tap-target rounded-xl border border-gray-300 bg-white px-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-600"
          />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-2 text-sm font-bold text-gray-700">
            Purchase price
            <input
              name="purchasePrice"
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              defaultValue={(item.purchasePricePaise / 100).toFixed(2)}
              required
              className="tap-target rounded-xl border border-gray-300 bg-white px-3 text-lg font-black focus:outline-none focus:ring-2 focus:ring-orange-600"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-gray-700">
            Selling price
            <input
              name="sellingPrice"
              type="number"
              min="0.01"
              step="0.01"
              inputMode="decimal"
              defaultValue={(item.sellingPricePaise / 100).toFixed(2)}
              required
              className="tap-target rounded-xl border border-gray-300 bg-white px-3 text-lg font-black focus:outline-none focus:ring-2 focus:ring-orange-600"
            />
          </label>
        </div>
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={isPending}
            className="tap-target flex-1 rounded-xl bg-orange-600 px-4 text-base font-black text-white hover:bg-orange-700 disabled:opacity-50"
          >
            {isPending ? "Save ho raha hai..." : "Save"}
          </button>
          <button
            type="button"
            onClick={() => setEditing(false)}
            disabled={isPending}
            className="tap-target rounded-xl border border-gray-300 bg-white px-4 text-base font-black text-gray-700 disabled:opacity-50"
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <div
      className={`tactile-card grid gap-3 border-2 p-4 sm:grid-cols-[1fr_auto] ${
        lowStock ? "border-red-200 bg-red-50" : "border-transparent"
      }`}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-xl font-black text-gray-900">{item.name}</p>
          {lowStock ? (
            <span className="rounded-full border border-red-100 bg-red-100 px-2 py-0.5 text-xs font-black text-red-700">
              Kam stock!
            </span>
          ) : null}
        </div>
        <p className="text-sm font-semibold text-gray-500">
          Kharid <Money amountPaise={item.purchasePricePaise} /> · Bikri{" "}
          <Money amountPaise={item.sellingPricePaise} />
        </p>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-2 text-sm font-black text-orange-700 underline-offset-2 hover:underline"
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
          className="tap-target flex h-12 w-12 items-center justify-center rounded-xl border-2 border-gray-300 bg-white text-2xl font-black text-gray-900 disabled:opacity-40"
        >
          −
        </button>
        <p
          className={`font-mono-num min-w-[3ch] text-center text-2xl font-black ${lowStock ? "text-red-700" : "text-gray-900"}`}
        >
          {item.quantity}
        </p>
        <button
          type="button"
          onClick={() => handleAdjust(1)}
          disabled={isPending}
          aria-label={`Badhao ${item.name} quantity`}
          className="tap-target flex h-12 w-12 items-center justify-center rounded-xl border-2 border-orange-600 bg-orange-600 text-2xl font-black text-white disabled:opacity-40"
        >
          +
        </button>
      </div>
    </div>
  );
}
