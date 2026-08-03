import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { notFound } from "next/navigation";
import { addCustomerEntry } from "@/backend/actions/actions";
import { getCustomerBalanceDisplay } from "@/backend/lib/balance";
import { formatDateTimeIst } from "@/backend/lib/format";
import { prisma } from "@/backend/lib/prisma";
import { CustomerTxnButtons } from "@/frontend/components/customer-txn-buttons";
import { DeleteTxnButton } from "@/frontend/components/delete-txn-button";
import { Money } from "@/frontend/components/money";
import { PhotoThumbnail } from "@/frontend/components/photo-lightbox";
import { ReminderButton } from "@/frontend/components/reminder-button";
import { getCustomerTransactionLabel } from "@/frontend/components/transaction-label";

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
  const balanceColor =
    customer.balancePaise > 0 ? "text-red-600" : customer.balancePaise < 0 ? "text-green-700" : "text-gray-600";
  const balanceDisplay = getCustomerBalanceDisplay(customer.balancePaise);
  const chipClass =
    balanceDisplay.tone === "udhaar"
      ? "bg-red-50 text-red-700"
      : balanceDisplay.tone === "advance"
        ? "bg-green-50 text-green-700"
        : "bg-gray-100 text-gray-600";
  const recentFirst = [...customer.transactions].reverse();

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <Link href="/customers" className="inline-flex items-center gap-2 font-semibold text-orange-700">
        <ArrowLeft className="h-4 w-4" /> Wapas
      </Link>

      <div className="tactile-card p-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{customer.name}</h1>
            {customer.phone ? <p className="mt-1 text-gray-500">{customer.phone}</p> : null}
            {customer.note ? <p className="mt-1 text-sm text-gray-400">{customer.note}</p> : null}
          </div>
          <div className="text-right">
            <p className="mb-1 text-xs text-gray-500">Current Balance</p>
            <Money
              amountPaise={Math.abs(customer.balancePaise)}
              className={`block text-4xl font-bold sm:text-5xl ${balanceColor}`}
            />
            <span className={`mt-2 inline-block rounded-full px-3 py-1 text-xs font-semibold ${chipClass}`}>
              {balanceDisplay.label}
            </span>
          </div>
        </div>

        <div className="mt-5 flex flex-wrap gap-3 border-t border-gray-100 pt-5">
          <ReminderButton name={customer.name} phone={customer.phone} balancePaise={customer.balancePaise} />
          <a
            href={`/api/customers/${customer.id}/statement`}
            target="_blank"
            rel="noreferrer"
            className="tap-target inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 font-semibold text-white transition hover:bg-orange-700 active:scale-95"
          >
            <FileText className="h-4 w-4" /> Statement download karo
          </a>
        </div>
      </div>

      <CustomerTxnButtons
        customerName={customer.name}
        action={action}
        allowPhoto={Boolean(process.env.BLOB_READ_WRITE_TOKEN)}
      />

      <div className="tactile-card overflow-hidden">
        <div className="p-6 pb-2">
          <h2 className="text-xl font-bold text-gray-900">Passbook</h2>
          <p className="text-sm text-gray-500">Har transaction ki poori history</p>
        </div>
        <div className="divide-y divide-gray-100">
          {recentFirst.length === 0 ? (
            <div className="p-6 text-center text-gray-400">Koi transaction nahi hai.</div>
          ) : (
            recentFirst.map((transaction) => {
              const meta = getCustomerTransactionLabel(transaction.type);
              const balanceCaption =
                transaction.balanceAfterPaise > 0
                  ? "udhaar"
                  : transaction.balanceAfterPaise < 0
                    ? "advance"
                    : "settled";
              return (
                <div key={transaction.id} className="flex items-center justify-between gap-4 p-4 sm:p-5">
                  <div className="flex min-w-0 flex-1 items-start gap-3">
                    {transaction.photoUrl ? (
                      <PhotoThumbnail src={transaction.photoUrl} alt={`${meta.label} receipt`} />
                    ) : null}
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${meta.badgeClass}`}>
                          {meta.label}
                        </span>
                        <span className="text-xs text-gray-400">{formatDateTimeIst(transaction.createdAt)}</span>
                      </div>
                      {transaction.description ? (
                        <p className="mt-1 text-sm text-gray-600">{transaction.description}</p>
                      ) : null}
                      <p className="mt-1 text-xs text-gray-400">
                        Balance:{" "}
                        <Money amountPaise={Math.abs(transaction.balanceAfterPaise)} className="font-semibold" />{" "}
                        {balanceCaption}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`text-xl font-bold ${meta.amountColor}`}>
                      {meta.sign}
                      <Money amountPaise={transaction.amountPaise} />
                    </span>
                    <DeleteTxnButton customerId={customer.id} transactionId={transaction.id} />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
