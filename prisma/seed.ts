import { CustomerTransactionType, PrismaClient, SupplierTransactionType } from "@prisma/client";
import { applyCustomerEntry, applySupplierEntry } from "../lib/balance";

const prisma = new PrismaClient();

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
  const [customerCount, supplierCount] = await Promise.all([prisma.customer.count(), prisma.supplier.count()]);

  if (customerCount > 0 || supplierCount > 0) {
    console.log("Seed skipped: database already has demo records.");
    return;
  }

  for (const customerSeed of customers) {
    let balancePaise = 0;
    const customer = await prisma.customer.create({
      data: {
        name: customerSeed.name,
        phone: customerSeed.phone,
        note: customerSeed.note,
      },
    });

    for (const entry of customerSeed.entries) {
      balancePaise = applyCustomerEntry(balancePaise, entry.type, entry.amountPaise);
      await prisma.customerTransaction.create({
        data: {
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
        name: supplierSeed.name,
        phone: supplierSeed.phone,
        note: supplierSeed.note,
      },
    });

    for (const entry of supplierSeed.entries) {
      balancePaise = applySupplierEntry(balancePaise, entry.type, entry.amountPaise);
      await prisma.supplierTransaction.create({
        data: {
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
