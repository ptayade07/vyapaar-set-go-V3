import { createInventoryItem } from "@/app/inventory-actions";
import { InventoryItemCard } from "@/components/inventory-item-card";
import { isLowStock } from "@/lib/inventory";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const items = await prisma.inventoryItem.findMany({ orderBy: { name: "asc" } });
  const lowStockCount = items.filter((item) => isLowStock(item.quantity)).length;

  return (
    <div className="grid gap-5">
      <section>
        <p className="text-sm font-black uppercase tracking-wide text-[#16803c]">Stock register</p>
        <h1 className="text-3xl font-black text-[#1f271f]">Inventory</h1>
        {lowStockCount > 0 ? (
          <p className="mt-1 text-sm font-bold text-[#b42318]">
            {lowStockCount} item{lowStockCount > 1 ? "s" : ""} mein kam stock hai.
          </p>
        ) : null}
      </section>

      <section className="grid gap-3">
        {items.length > 0 ? (
          items.map((item) => <InventoryItemCard key={item.id} item={item} />)
        ) : (
          <p className="rounded-md bg-stone-100 p-4 text-sm font-bold text-stone-600">No items yet.</p>
        )}
      </section>

      <section id="add-item" className="rounded-lg border border-amber-200 bg-white p-4 shadow-sm">
        <h2 className="text-xl font-black text-[#1f271f]">Add Item</h2>
        <p className="mb-4 text-sm font-semibold text-[#6f6a60]">Naya item jodo</p>
        <form action={createInventoryItem} className="grid gap-3">
          <label className="grid gap-2 text-sm font-bold text-[#384238]">
            Item name
            <input
              name="name"
              required
              className="tap-target rounded-md border border-stone-300 px-3 text-base focus:outline-none focus:ring-2 focus:ring-[#16803c]"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-[#384238]">
            Starting quantity
            <input
              name="quantity"
              type="number"
              min="0"
              step="1"
              inputMode="numeric"
              placeholder="0"
              className="tap-target rounded-md border border-stone-300 px-3 text-lg font-black focus:outline-none focus:ring-2 focus:ring-[#16803c]"
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
                placeholder="₹ amount"
                required
                className="tap-target rounded-md border border-stone-300 px-3 text-lg font-black focus:outline-none focus:ring-2 focus:ring-[#16803c]"
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
                placeholder="₹ amount"
                required
                className="tap-target rounded-md border border-stone-300 px-3 text-lg font-black focus:outline-none focus:ring-2 focus:ring-[#16803c]"
              />
            </label>
          </div>
          <button className="tap-target rounded-md bg-[#16803c] px-5 py-3 text-lg font-black text-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b]">
            + New Item
          </button>
        </form>
      </section>
    </div>
  );
}
