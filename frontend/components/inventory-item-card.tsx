"use client";

import { AlertTriangle, Minus, Plus, Trash2 } from "lucide-react";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type { InventoryItem } from "@prisma/client";
import { adjustInventoryQuantity, deleteInventoryItem, updateInventoryItem } from "@/backend/actions/inventory-actions";
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

  function handleDelete() {
    if (!window.confirm(`Delete ${item.name}?`)) return;
    startTransition(async () => {
      await deleteInventoryItem(item.id);
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
    <div className={`tactile-card flex items-center justify-between gap-4 p-5 ${lowStock ? "border-red-200" : ""}`}>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-lg font-bold text-gray-900">
          {item.name}
          {lowStock ? (
            <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
              <AlertTriangle className="h-3 w-3" /> Kam stock!
            </span>
          ) : null}
        </div>
        <div className="font-mono-num mt-1 text-xs text-gray-500">
          Purchase: <Money amountPaise={item.purchasePricePaise} /> · Selling: <Money amountPaise={item.sellingPricePaise} />
        </div>
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-2 text-xs font-black text-orange-700 underline-offset-2 hover:underline"
        >
          Edit
        </button>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => handleAdjust(-1)}
          disabled={isPending || item.quantity <= 0}
          aria-label={`Ghatao ${item.name} quantity`}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 transition hover:bg-gray-200 active:scale-90 disabled:opacity-40"
        >
          <Minus className="h-4 w-4" />
        </button>
        <div className={`font-mono-num min-w-[3rem] text-center text-2xl font-bold ${lowStock ? "text-red-600" : "text-gray-900"}`}>
          {item.quantity}
        </div>
        <button
          type="button"
          onClick={() => handleAdjust(1)}
          disabled={isPending}
          aria-label={`Badhao ${item.name} quantity`}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-100 text-orange-700 transition hover:bg-orange-200 active:scale-90 disabled:opacity-40"
        >
          <Plus className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={isPending}
          aria-label={`Delete ${item.name}`}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-gray-300 hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
