import Link from "next/link";
import { notFound } from "next/navigation";
import { addSupplierEntry } from "@/app/actions";
import { BalanceBadge } from "@/components/balance-badge";
import { EntryForm } from "@/components/entry-form";
import { getSupplierTransactionLabel } from "@/components/transaction-label";
import { formatDateIst, formatMoneyPaise } from "@/lib/format";
import { prisma } from "@/lib/prisma";

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

  return (
    <div className="grid gap-5">
      <Link href="/suppliers" className="text-sm font-black text-[#16803c]">
        Back to Suppliers
      </Link>
      <section className="rounded-lg border border-amber-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div className="min-w-0">
            <p className="text-sm font-black uppercase tracking-wide text-[#16803c]">Supplier detail</p>
            <h1 className="truncate text-3xl font-black text-[#1f271f]">{supplier.name}</h1>
            <p className="text-base font-semibold text-[#6f6a60]">{supplier.phone || "No phone"}</p>
          </div>
          <div className="self-center">
            <BalanceBadge balancePaise={supplier.balancePaise} kind="supplier" large />
          </div>
        </div>
      </section>

      <EntryForm
        title="Supplier Entry"
        subtitle="Maal credit ya supplier payment"
        action={action}
        showDueDate
        options={[
          { value: "CREDIT", label: "Maal Liya", subtitle: "bought on credit" },
          { value: "PAYMENT", label: "Payment Diya", subtitle: "paid supplier" },
        ]}
      />

      <section className="rounded-lg border border-amber-200 bg-white p-4 shadow-sm">
        <h2 className="text-xl font-black text-[#1f271f]">Supplier History</h2>
        <p className="mb-4 text-sm font-semibold text-[#6f6a60]">Oldest first with running balance</p>
        <div className="grid gap-2">
          {supplier.transactions.length > 0 ? (
            supplier.transactions.map((transaction) => {
              const label = getSupplierTransactionLabel(transaction.type);
              const overdue =
                transaction.type === "CREDIT" &&
                Boolean(transaction.dueDate) &&
                transaction.dueDate!.getTime() < Date.now() &&
                transaction.balanceAfterPaise > 0;
              return (
                <div
                  key={transaction.id}
                  className="grid gap-2 rounded-md border border-stone-200 bg-[#fffdf7] p-3 sm:grid-cols-[120px_1fr_auto_auto]"
                >
                  <p className="font-bold text-[#6f6a60]">{formatDateIst(transaction.createdAt)}</p>
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-black text-[#1f271f]">{label.label}</p>
                      {overdue ? (
                        <span className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-black text-[#b42318]">
                          Overdue
                        </span>
                      ) : null}
                    </div>
                    <p className="text-sm font-semibold text-[#6f6a60]">
                      {transaction.description || label.subtitle}
                      {transaction.dueDate ? ` · Due ${formatDateIst(transaction.dueDate)}` : ""}
                    </p>
                  </div>
                  <p className="text-lg font-black text-[#1f271f]">{formatMoneyPaise(transaction.amountPaise)}</p>
                  <BalanceBadge balancePaise={transaction.balanceAfterPaise} kind="supplier" />
                </div>
              );
            })
          ) : (
            <p className="rounded-md bg-stone-100 p-4 text-sm font-bold text-stone-600">No entries yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
