import { CustomerTransactionType, PrismaClient, SupplierTransactionType } from "@prisma/client";
import { applyCustomerEntry, applySupplierEntry } from "../lib/balance";

const prisma = new PrismaClient();

// This script only ever touches one dedicated demo shop, found-or-created by name -- never "any
// shop with no data yet." That's the fix for the pre-multi-tenant version of this script, which
// checked global row counts: a brand-new real shop signing up with zero customers would have
// looked exactly like "needs seeding" and gotten a pile of fake demo data. See PRODUCTION_STAGES.md
// Stage 1, step 8.
const DEMO_SHOP_NAME = "Demo Shop";

type CustomerSeed = {
  name: string;
  phone?: string;
  note?: string;
  entries: {
    type: CustomerTransactionType;
    amountPaise: number;
    description: string;
    daysAgo: number;
  }[];
};

type SupplierSeed = {
  name: string;
  phone?: string;
  note?: string;
  entries: {
    type: SupplierTransactionType;
    amountPaise: number;
    description: string;
    daysAgo: number;
    dueInDays?: number;
  }[];
};

const customers: CustomerSeed[] = [
  {
    name: "Ramesh Kirana",
    phone: "9876543210",
    note: "Monthly grocery khata",
    entries: [
      { type: "UDHAAR", amountPaise: 150000, description: "Rice, oil, dal", daysAgo: 6 },
      { type: "PAYMENT", amountPaise: 30000, description: "Cash received", daysAgo: 3 },
      { type: "UDHAAR", amountPaise: 64000, description: "Monthly ration top-up", daysAgo: 1 },
    ],
  },
  {
    name: "Meena Boutique",
    phone: "9988776655",
    note: "Advance customer",
    entries: [
      { type: "ADVANCE", amountPaise: 80000, description: "Advance for blouse stitching", daysAgo: 4 },
      { type: "UDHAAR", amountPaise: 30000, description: "Material adjusted", daysAgo: 2 },
    ],
  },
  {
    name: "Iqbal Studio",
    phone: "9123456780",
    note: "Settled account",
    entries: [
      { type: "UDHAAR", amountPaise: 35000, description: "Photo prints", daysAgo: 5 },
      { type: "PAYMENT", amountPaise: 35000, description: "UPI settled", daysAgo: 4 },
    ],
  },
  {
    name: "Sunita Sharma",
    phone: "9012345678",
    entries: [
      { type: "UDHAAR", amountPaise: 98000, description: "Clothes purchase", daysAgo: 3 },
      { type: "PAYMENT", amountPaise: 20000, description: "Partial payment", daysAgo: 1 },
    ],
  },
  {
    name: "Arjun Tea Stall",
    phone: "8899001122",
    entries: [
      { type: "ADVANCE", amountPaise: 100000, description: "Weekly advance", daysAgo: 6 },
      { type: "UDHAAR", amountPaise: 75000, description: "Milk and snacks", daysAgo: 0 },
    ],
  },
  {
    name: "Priya Garments",
    phone: "9090909090",
    entries: [{ type: "UDHAAR", amountPaise: 42000, description: "Dupatta set", daysAgo: 2 }],
  },
  {
    name: "Vikram Electronics",
    phone: "8080808080",
    entries: [
      { type: "UDHAAR", amountPaise: 32500, description: "Mobile cover stock", daysAgo: 1 },
      { type: "PAYMENT", amountPaise: 20000, description: "Cash received", daysAgo: 0 },
    ],
  },
  {
    name: "Lata Devi",
    phone: "7777777777",
    entries: [
      { type: "UDHAAR", amountPaise: 24000, description: "Household items", daysAgo: 2 },
      { type: "PAYMENT", amountPaise: 24000, description: "Settled in cash", daysAgo: 0 },
    ],
  },
];

type InventoryItemSeed = {
  name: string;
  quantity: number;
  purchasePricePaise: number;
  sellingPricePaise: number;
};

const inventoryItems: InventoryItemSeed[] = [
  { name: "Chai Patti 250g", quantity: 40, purchasePricePaise: 12000, sellingPricePaise: 15000 },
  { name: "Chawal 1kg", quantity: 30, purchasePricePaise: 4500, sellingPricePaise: 6000 },
  { name: "Sarson Tel 1L", quantity: 4, purchasePricePaise: 15000, sellingPricePaise: 19000 },
  { name: "Maggi Pack", quantity: 25, purchasePricePaise: 1200, sellingPricePaise: 1500 },
  { name: "Toothpaste", quantity: 3, purchasePricePaise: 4000, sellingPricePaise: 5500 },
  { name: "Biscuit Packet", quantity: 50, purchasePricePaise: 800, sellingPricePaise: 1000 },
  { name: "Detergent 1kg", quantity: 15, purchasePricePaise: 9000, sellingPricePaise: 12000 },
];

const suppliers: SupplierSeed[] = [
  {
    name: "Shakti Distributors",
    phone: "9820011100",
    note: "Main grocery wholesaler",
    entries: [
      { type: "CREDIT", amountPaise: 275000, description: "Wholesale goods", daysAgo: 6, dueInDays: -2 },
      { type: "PAYMENT", amountPaise: 50000, description: "Bank transfer", daysAgo: 2 },
    ],
  },
  {
    name: "Fresh Dairy Supply",
    phone: "9811112233",
    entries: [{ type: "CREDIT", amountPaise: 58000, description: "Milk crates", daysAgo: 1, dueInDays: 3 }],
  },
  {
    name: "Patel Textiles",
    phone: "9797979797",
    entries: [
      { type: "CREDIT", amountPaise: 90000, description: "Fabric bundle", daysAgo: 5, dueInDays: 1 },
      { type: "PAYMENT", amountPaise: 90000, description: "Settled via UPI", daysAgo: 3 },
    ],
  },
];

async function main() {
  const shop =
    (await prisma.shop.findFirst({ where: { name: DEMO_SHOP_NAME } })) ??
    (await prisma.shop.create({ data: { name: DEMO_SHOP_NAME } }));

  const [customerCount, supplierCount, inventoryCount] = await Promise.all([
    prisma.customer.count({ where: { shopId: shop.id } }),
    prisma.supplier.count({ where: { shopId: shop.id } }),
    prisma.inventoryItem.count({ where: { shopId: shop.id } }),
  ]);

  if (customerCount > 0 || supplierCount > 0) {
    console.log(`Khata seed skipped: "${DEMO_SHOP_NAME}" already has demo records.`);
  } else {
    await seedKhata(shop.id);
  }

  if (inventoryCount > 0) {
    console.log(`Inventory seed skipped: "${DEMO_SHOP_NAME}" already has items.`);
  } else {
    await prisma.inventoryItem.createMany({ data: inventoryItems.map((item) => ({ ...item, shopId: shop.id })) });
    console.log("Seed complete: demo inventory is ready.");
  }
}

async function seedKhata(shopId: string) {
  for (const customerSeed of customers) {
    let balancePaise = 0;
    const customer = await prisma.customer.create({
      data: {
        shopId,
        name: customerSeed.name,
        phone: customerSeed.phone,
        note: customerSeed.note,
      },
    });

    for (const entry of customerSeed.entries) {
      balancePaise = applyCustomerEntry(balancePaise, entry.type, entry.amountPaise);
      await prisma.customerTransaction.create({
        data: {
          shopId,
          customerId: customer.id,
          type: entry.type,
          amountPaise: entry.amountPaise,
          description: entry.description,
          balanceAfterPaise: balancePaise,
          createdAt: daysAgo(entry.daysAgo),
        },
      });
    }

    await prisma.customer.update({
      where: { id: customer.id },
      data: { balancePaise },
    });
  }

  for (const supplierSeed of suppliers) {
    let balancePaise = 0;
    const supplier = await prisma.supplier.create({
      data: {
        shopId,
        name: supplierSeed.name,
        phone: supplierSeed.phone,
        note: supplierSeed.note,
      },
    });

    for (const entry of supplierSeed.entries) {
      balancePaise = applySupplierEntry(balancePaise, entry.type, entry.amountPaise);
      await prisma.supplierTransaction.create({
        data: {
          shopId,
          supplierId: supplier.id,
          type: entry.type,
          amountPaise: entry.amountPaise,
          description: entry.description,
          dueDate: entry.type === "CREDIT" && entry.dueInDays !== undefined ? daysFromNow(entry.dueInDays) : null,
          balanceAfterPaise: balancePaise,
          createdAt: daysAgo(entry.daysAgo),
        },
      });
    }

    await prisma.supplier.update({
      where: { id: supplier.id },
      data: { balancePaise },
    });
  }

  console.log("Seed complete: demo khata data is ready.");
}

function daysAgo(days: number) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  date.setHours(10 + (days % 8), 15, 0, 0);
  return date;
}

function daysFromNow(days: number) {
  const date = new Date();
  date.setDate(date.getDate() + days);
  date.setHours(0, 0, 0, 0);
  return date;
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
