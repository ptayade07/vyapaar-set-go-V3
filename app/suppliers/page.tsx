import Link from "next/link";
import { AlertTriangle, Phone } from "lucide-react";
import { createSupplier } from "@/backend/actions/actions";
import { prisma } from "@/backend/lib/prisma";
import { AddPersonPanel } from "@/frontend/components/add-person-panel";
import { BalanceText } from "@/frontend/components/balance-text";
import { T } from "@/frontend/components/t-text";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const suppliers = await prisma.supplier.findMany({
    include: {
      transactions: {
        where: {
          type: "CREDIT",
          dueDate: { lt: new Date() },
        },
      },
    },
    orderBy: [{ balancePaise: "desc" }, { name: "asc" }],
  });

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <AddPersonPanel
        titleHi="Suppliers"
        titleEn="Suppliers"
        subtitleHi="Jinke maal ka paisa dena hai"
        subtitleEn="Whom you owe"
        triggerLabelHi="Naya Supplier"
        triggerLabelEn="Add Supplier"
        action={createSupplier}
      />

      <div className="space-y-3">
        {suppliers.length === 0 ? (
          <T as="p" className="py-10 text-center text-gray-400" hi="Koi supplier nahi hai." en="No suppliers yet." />
        ) : null}
        {suppliers.map((supplier) => {
          const overdue = supplier.balancePaise > 0 && supplier.transactions.length > 0;
          return (
            <Link
              key={supplier.id}
              href={`/suppliers/${supplier.id}`}
              className="tactile-card flex items-center justify-between gap-4 p-5 hover:border-orange-300"
            >
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2 truncate text-lg font-bold text-gray-900">
                  {supplier.name}
                  {overdue ? (
                    <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                      <AlertTriangle className="h-3 w-3" /> Overdue
                    </span>
                  ) : null}
                </div>
                {supplier.phone ? (
                  <div className="mt-0.5 flex items-center gap-1 text-sm text-gray-500">
                    <Phone className="h-3.5 w-3.5" /> {supplier.phone}
                  </div>
                ) : null}
              </div>
              <BalanceText balancePaise={supplier.balancePaise} kind="supplier" />
            </Link>
          );
        })}
      </div>
    </div>
  );
}
