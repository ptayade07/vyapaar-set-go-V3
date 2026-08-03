import { AddInventoryPanel } from "@/frontend/components/add-inventory-panel";
import { InventoryItemCard } from "@/frontend/components/inventory-item-card";
import { isLowStock } from "@/backend/lib/inventory";
import { prisma } from "@/backend/lib/prisma";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const items = await prisma.inventoryItem.findMany({ orderBy: { name: "asc" } });
  const lowStockCount = items.filter((item) => isLowStock(item.quantity)).length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <AddInventoryPanel />

      {lowStockCount > 0 ? (
        <p className="text-sm font-semibold text-red-700">
          {lowStockCount} item{lowStockCount > 1 ? "s" : ""} mein kam stock hai.
        </p>
      ) : null}

      <div className="space-y-3">
        {items.length > 0 ? (
          items.map((item) => <InventoryItemCard key={item.id} item={item} />)
        ) : (
          <div className="py-10 text-center text-gray-400">Koi item nahi hai.</div>
        )}
      </div>
    </div>
  );
}
