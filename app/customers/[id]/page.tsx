import Link from "next/link";
import { notFound } from "next/navigation";
import { addCustomerEntry } from "@/app/actions";
import { BalanceBadge } from "@/components/balance-badge";
import { EntryForm } from "@/components/entry-form";
import { Money } from "@/components/money";
import { PhotoThumbnail } from "@/components/photo-lightbox";
import { ReminderButton } from "@/components/reminder-button";
import { getCustomerTransactionLabel } from "@/components/transaction-label";
import { formatDateIst } from "@/lib/format";
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
      <Link href="/customers" className="text-sm font-black text-orange-700">
        Back to Customers
      </Link>
      <section className="tactile-card p-4">
        <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
          <div className="min-w-0">
            <p className="text-sm font-black uppercase tracking-wide text-orange-700">Customer detail</p>
            <h1 className="truncate text-3xl font-black text-gray-900">{customer.name}</h1>
            <p className="text-base font-semibold text-gray-500">{customer.phone || "No phone"}</p>
          </div>
          <div className="self-center">
            <BalanceBadge balancePaise={customer.balancePaise} large />
          </div>
        </div>
        <div className="mt-4">
          <a
            href={`/api/customers/${customer.id}/statement`}
            target="_blank"
            rel="noreferrer"
            className="tap-target inline-flex items-center gap-2 rounded-xl bg-gray-100 px-5 text-base font-black text-gray-800 hover:bg-gray-200"
          >
            Download Statement
          </a>
        </div>
      </section>

      <ReminderButton name={customer.name} phone={customer.phone} balancePaise={customer.balancePaise} />

      <EntryForm
        title="New Khata Entry"
        subtitle="Udhaar, payment, ya advance add karo"
        action={action}
        allowPhoto={Boolean(process.env.BLOB_READ_WRITE_TOKEN)}
        options={[
          { value: "UDHAAR", label: "Udhaar Diya", subtitle: "gave goods on credit" },
          { value: "PAYMENT", label: "Payment Liya", subtitle: "received payment" },
          { value: "ADVANCE", label: "Advance Liya", subtitle: "customer paid ahead" },
        ]}
      />

      <section className="tactile-card p-4">
        <h2 className="text-xl font-black text-gray-900">Passbook History</h2>
        <p className="mb-4 text-sm font-semibold text-gray-500">Oldest first with running balance</p>
        <div className="grid gap-2">
          {customer.transactions.length > 0 ? (
            customer.transactions.map((transaction) => {
              const label = getCustomerTransactionLabel(transaction.type);
              return (
                <div
                  key={transaction.id}
                  className="grid gap-2 rounded-xl border border-gray-100 bg-gray-50 p-3 sm:grid-cols-[56px_120px_1fr_auto_auto] sm:items-center"
                >
                  {transaction.photoUrl ? (
                    <PhotoThumbnail src={transaction.photoUrl} alt={`${label.label} receipt`} />
                  ) : (
                    <span className="hidden sm:block" />
                  )}
                  <p className="font-bold text-gray-500">{formatDateIst(transaction.createdAt)}</p>
                  <div>
                    <p className="font-black text-gray-900">{label.label}</p>
                    <p className="text-sm font-semibold text-gray-500">
                      {transaction.description || label.subtitle}
                    </p>
                  </div>
                  <Money amountPaise={transaction.amountPaise} className="text-lg font-black text-gray-900" />
                  <BalanceBadge balancePaise={transaction.balanceAfterPaise} />
                </div>
              );
            })
          ) : (
            <p className="rounded-xl bg-gray-100 p-4 text-sm font-bold text-gray-600">No entries yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}
