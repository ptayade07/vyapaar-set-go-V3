import { AddInventoryPanel } from "@/frontend/components/add-inventory-panel";
import { InventoryItemCard } from "@/frontend/components/inventory-item-card";
import { T } from "@/frontend/components/t-text";
import { isLowStock } from "@/backend/lib/inventory";
import { prisma } from "@/backend/lib/prisma";
import { getCurrentShopId } from "@/backend/lib/auth";

export const dynamic = "force-dynamic";

export default async function InventoryPage() {
  const shopId = await getCurrentShopId();
  const items = await prisma.inventoryItem.findMany({ where: { shopId }, orderBy: { name: "asc" } });
  const lowStockCount = items.filter((item) => isLowStock(item.quantity)).length;

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <AddInventoryPanel />

      {lowStockCount > 0 ? (
        <T
          as="p"
          className="text-sm font-semibold text-red-700"
          hi={`${lowStockCount} item${lowStockCount > 1 ? "s" : ""} mein kam stock hai.`}
          en={`${lowStockCount} item${lowStockCount > 1 ? "s" : ""} low on stock.`}
        />
      ) : null}

      <div className="space-y-3">
        {items.length > 0 ? (
          items.map((item) => <InventoryItemCard key={item.id} item={item} />)
        ) : (
          <T as="p" className="py-10 text-center text-gray-400" hi="Koi item nahi hai." en="No items yet." />
        )}
      </div>
    </div>
  );
}
