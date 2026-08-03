import { createInventoryItem } from "@/backend/actions/inventory-actions";
import { InventoryItemCard } from "@/components/inventory-item-card";
import { isLowStock } from "@/backend/lib/inventory";
import { prisma } from "@/backend/lib/prisma";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const items = await prisma.inventoryItem.findMany({ orderBy: { name: "asc" } });
  const lowStockCount = items.filter((item) => isLowStock(item.quantity)).length;

  return (
    <div className="grid gap-5">
      <section>
        <p className="text-sm font-black uppercase tracking-wide text-orange-700">Stock register</p>
        <h1 className="text-3xl font-black text-gray-900">Inventory</h1>
        {lowStockCount > 0 ? (
          <p className="mt-1 text-sm font-bold text-red-700">
            {lowStockCount} item{lowStockCount > 1 ? "s" : ""} mein kam stock hai.
          </p>
        ) : null}
      </section>

      <section className="grid gap-3">
        {items.length > 0 ? (
          items.map((item) => <InventoryItemCard key={item.id} item={item} />)
        ) : (
          <p className="rounded-xl bg-gray-100 p-4 text-sm font-bold text-gray-600">No items yet.</p>
        )}
      </section>

      <section id="add-item" className="tactile-card p-4">
        <h2 className="text-xl font-black text-gray-900">Add Item</h2>
        <p className="mb-4 text-sm font-semibold text-gray-500">Naya item jodo</p>
        <form action={createInventoryItem} className="grid gap-3">
          <label className="grid gap-2 text-sm font-bold text-gray-700">
            Item name
            <input
              name="name"
              required
              className="tap-target rounded-xl border border-gray-300 px-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-600"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-gray-700">
            Starting quantity
            <input
              name="quantity"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              placeholder="0"
              className="tap-target rounded-xl border border-gray-300 px-3 text-lg font-black focus:outline-none focus:ring-2 focus:ring-orange-600"
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
                placeholder="₹ amount"
                required
                className="tap-target rounded-xl border border-gray-300 px-3 text-lg font-black focus:outline-none focus:ring-2 focus:ring-orange-600"
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
                placeholder="₹ amount"
                required
                className="tap-target rounded-xl border border-gray-300 px-3 text-lg font-black focus:outline-none focus:ring-2 focus:ring-orange-600"
              />
            </label>
          </div>
          <button className="tap-target rounded-xl bg-orange-600 px-5 py-3 text-lg font-black text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-700">
            + New Item
          </button>
        </form>
      </section>
    </div>
  );
}
