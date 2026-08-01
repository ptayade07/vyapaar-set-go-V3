import Link from "next/link";
import { notFound } from "next/navigation";
import { addCustomerEntry } from "@/app/actions";
import { BalanceBadge } from "@/components/balance-badge";
import { EntryForm } from "@/components/entry-form";
import { ReminderButton } from "@/components/reminder-button";
import { getCustomerTransactionLabel } from "@/components/transaction-label";
import { formatDateIst, formatMoneyPaise } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function CustomerDetailPage({ params }: Props) {
  const { id } = await params;
  const customer = await prisma.customer.findUnique({
    where: { id },
    include: {
      transactions: {
        orderBy: { createdAt: "asc" },
      },
    },
  });

  if (!customer) {
    notFound();
  }

  const action = addCustomerEntry.bind(null, customer.id);

  return (
    <div className="grid gap-5">
      <Link href="/customers" className="text-sm font-black text-[#16803c]">
        Back to Customers
      </Link>
      <section className="rounded-lg border border-amber-200 bg-white p-4 shadow-sm">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div className="min-w-0">
            <p className="text-sm font-black uppercase tracking-wide text-[#16803c]">Customer detail</p>
            <h1 className="truncate text-3xl font-black text-[#1f271f]">{customer.name}</h1>
            <p className="text-base font-semibold text-[#6f6a60]">{customer.phone || "No phone"}</p>
          </div>
          <div className="self-center">
            <BalanceBadge balancePaise={customer.balancePaise} large />
          </div>
        </div>
      </section>

      <ReminderButton name={customer.name} balancePaise={customer.balancePaise} />

      <EntryForm
        title="New Khata Entry"
        subtitle="Udhaar, payment, ya advance add karo"
        action={action}
        options={[
          { value: "UDHAAR", label: "Udhaar Diya", subtitle: "gave goods on credit" },
          { value: "PAYMENT", label: "Payment Liya", subtitle: "received payment" },
          { value: "ADVANCE", label: "Advance Liya", subtitle: "customer paid ahead" },
        ]}
      />

      <section className="rounded-lg border border-amber-200 bg-white p-4 shadow-sm">
        <h2 className="text-xl font-black text-[#1f271f]">Passbook History</h2>
        <p className="mb-4 text-sm font-semibold text-[#6f6a60]">Oldest first with running balance</p>
        <div className="grid gap-2">
          {customer.transactions.length > 0 ? (
            customer.transactions.map((transaction) => {
              const label = getCustomerTransactionLabel(transaction.type);
              return (
                <div
                  key={transaction.id}
                  className="grid gap-2 rounded-md border border-stone-200 bg-[#fffdf7] p-3 sm:grid-cols-[120px_1fr_auto_auto]"
                >
                  <p className="font-bold text-[#6f6a60]">{formatDateIst(transaction.createdAt)}</p>
                  <div>
                    <p className="font-black text-[#1f271f]">{label.label}</p>
                    <p className="text-sm font-semibold text-[#6f6a60]">
                      {transaction.description || label.subtitle}
                    </p>
                  </div>
                  <p className="text-lg font-black text-[#1f271f]">{formatMoneyPaise(transaction.amountPaise)}</p>
                  <BalanceBadge balancePaise={transaction.balanceAfterPaise} />
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
