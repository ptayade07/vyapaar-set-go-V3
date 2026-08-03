"use client";

import { Plus } from "lucide-react";
import { useState, useTransition } from "react";
import { createInventoryItem } from "@/backend/actions/inventory-actions";

export function AddInventoryPanel() {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      await createInventoryItem(formData);
      setOpen(false);
    });
  }

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Saman / Stock</h1>
          <p className="text-sm text-gray-500">Dukan ka stock</p>
        </div>
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="tap-target inline-flex items-center gap-2 rounded-2xl bg-orange-600 px-6 font-semibold text-white shadow-md transition hover:bg-orange-700 active:scale-95"
        >
          <Plus className="h-5 w-5" /> Naya Item
        </button>
      </div>
      {open ? (
        <form action={handleSubmit} className="tactile-card grid grid-cols-1 gap-4 p-6 sm:grid-cols-2">
          <input
            name="name"
            required
            placeholder="Item ka naam"
            className="h-14 rounded-xl border border-gray-200 px-4 text-lg focus:outline-none focus:border-orange-500 sm:col-span-2"
          />
          <input
            name="quantity"
            type="number"
            min="0"
            step="1"
            inputMode="numeric"
            placeholder="Quantity"
            className="h-14 rounded-xl border border-gray-200 px-4 text-lg focus:outline-none focus:border-orange-500"
          />
          <input
            name="purchasePrice"
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            required
            placeholder="Purchase price ₹"
            className="h-14 rounded-xl border border-gray-200 px-4 text-lg focus:outline-none focus:border-orange-500"
          />
          <input
            name="sellingPrice"
            type="number"
            min="0.01"
            step="0.01"
            inputMode="decimal"
            required
            placeholder="Selling price ₹"
            className="h-14 rounded-xl border border-gray-200 px-4 text-lg focus:outline-none focus:border-orange-500 sm:col-span-2"
          />
          <div className="flex gap-3 sm:col-span-2">
            <button
              type="submit"
              disabled={isPending}
              className="h-14 rounded-2xl bg-orange-600 px-8 font-semibold text-white transition hover:bg-orange-700 active:scale-95 disabled:opacity-50"
            >
              {isPending ? "Save ho raha hai..." : "Save"}
            </button>
            <button
              type="button"
              onClick={() => setOpen(false)}
              disabled={isPending}
              className="h-14 rounded-2xl bg-gray-100 px-6 font-semibold text-gray-700 disabled:opacity-50"
            >
              Cancel
            </button>
          </div>
        </form>
      ) : null}
    </>
  );
}
