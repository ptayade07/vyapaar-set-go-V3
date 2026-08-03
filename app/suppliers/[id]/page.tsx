import Link from "next/link";
import { ArrowLeft, AlertTriangle } from "lucide-react";
import { notFound } from "next/navigation";
import { addSupplierEntry } from "@/backend/actions/actions";
import { formatDateIst, formatDateTimeIst } from "@/backend/lib/format";
import { prisma } from "@/backend/lib/prisma";
import { Money } from "@/frontend/components/money";
import { SupplierTxnPanel } from "@/frontend/components/supplier-txn-panel";
import { T } from "@/frontend/components/t-text";
import { getSupplierTransactionLabel } from "@/frontend/components/transaction-label";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function SupplierDetailPage({ params }: Props) {
  const { id } = await params;
  const supplier = await prisma.supplier.findUnique({
    where: { id },
    include: {
      transactions: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!supplier) {
    notFound();
  }

  const action = addSupplierEntry.bind(null, supplier.id);
  const recentFirst = [...supplier.transactions].reverse();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/suppliers" className="inline-flex items-center gap-2 font-semibold text-orange-700">
        <ArrowLeft className="h-4 w-4" /> <T hi="Wapas" en="Back" />
      </Link>

      <div className="tactile-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{supplier.name}</h1>
            {supplier.phone ? <p className="mt-1 text-gray-500">{supplier.phone}</p> : null}
          </div>
          <div className="text-right">
            <p className="mb-1 text-xs text-gray-500">Dena hai</p>
            <Money
              amountPaise={Math.abs(supplier.balancePaise)}
              className={`block text-4xl font-bold sm:text-5xl ${supplier.balancePaise > 0 ? "text-red-600" : "text-gray-500"}`}
            />
          </div>
        </div>
      </div>

      <SupplierTxnPanel action={action} />

      <div className="tactile-card overflow-hidden">
        <div className="p-6 pb-2">
          <h2 className="text-xl font-bold text-gray-900">Supplier Passbook</h2>
        </div>
        <div className="divide-y divide-gray-100">
          {recentFirst.length === 0 ? (
            <div className="p-6 text-center text-gray-400">Koi entry nahi hai.</div>
          ) : (
            recentFirst.map((transaction) => {
              const meta = getSupplierTransactionLabel(transaction.type);
              const overdue =
                transaction.type === "CREDIT" &&
                Boolean(transaction.dueDate) &&
                transaction.dueDate!.getTime() < Date.now() &&
                transaction.balanceAfterPaise > 0;
              return (
                <div key={transaction.id} className="flex items-center justify-between gap-4 p-4 sm:p-5">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${meta.badgeClass}`}>
                        {meta.label}
                      </span>
                      {overdue ? (
                        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700">
                          <AlertTriangle className="h-3 w-3" /> Overdue
                        </span>
                      ) : null}
                      <span className="text-xs text-gray-400">{formatDateTimeIst(transaction.createdAt)}</span>
                    </div>
                    {transaction.description ? (
                      <p className="mt-1 text-sm text-gray-600">{transaction.description}</p>
                    ) : null}
                    {transaction.dueDate ? (
                      <p className="mt-1 text-xs text-gray-500">Due: {formatDateIst(transaction.dueDate)}</p>
                    ) : null}
                  </div>
                  <span className={`text-xl font-bold ${meta.amountColor}`}>
                    {meta.sign}
                    <Money amountPaise={transaction.amountPaise} />
                  </span>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
