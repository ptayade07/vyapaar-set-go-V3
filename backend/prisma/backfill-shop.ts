/**
 * One-off migration: creates a single Shop row for all pre-existing data and stamps shopId onto
 * every row that predates multi-tenancy. Safe to re-run -- it's a no-op once shopId is populated.
 * See PRODUCTION_STAGES.md, Stage 1, step 2.
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  let shop = await prisma.shop.findFirst({ orderBy: { createdAt: "asc" } });
  if (!shop) {
    shop = await prisma.shop.create({ data: { name: "My Shop" } });
    console.log(`Created default shop: ${shop.id}`);
  } else {
    console.log(`Using existing shop: ${shop.id} (${shop.name})`);
  }

  const results = await prisma.$transaction([
    prisma.customer.updateMany({ where: { shopId: null }, data: { shopId: shop.id } }),
    prisma.customerTransaction.updateMany({ where: { shopId: null }, data: { shopId: shop.id } }),
    prisma.supplier.updateMany({ where: { shopId: null }, data: { shopId: shop.id } }),
    prisma.supplierTransaction.updateMany({ where: { shopId: null }, data: { shopId: shop.id } }),
    prisma.inventoryItem.updateMany({ where: { shopId: null }, data: { shopId: shop.id } }),
    prisma.note.updateMany({ where: { shopId: null }, data: { shopId: shop.id } }),
  ]);

  const [customers, customerTxns, suppliers, supplierTxns, items, notes] = results;
  console.log("Backfilled row counts:");
  console.log(`  Customer: ${customers.count}`);
  console.log(`  CustomerTransaction: ${customerTxns.count}`);
  console.log(`  Supplier: ${suppliers.count}`);
  console.log(`  SupplierTransaction: ${supplierTxns.count}`);
  console.log(`  InventoryItem: ${items.count}`);
  console.log(`  Note: ${notes.count}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
