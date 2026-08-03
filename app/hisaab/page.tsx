import { CashMilao } from "@/frontend/components/cash-milao";
import { HisaabAiSummary } from "@/frontend/components/hisaab-ai-summary";
import { Money } from "@/frontend/components/money";
import { T } from "@/frontend/components/t-text";
import { getCustomerTransactionLabel } from "@/frontend/components/transaction-label";
import { formatDateIst, getIstDayRange, getTodayInputValue } from "@/backend/lib/format";
import { prisma } from "@/backend/lib/prisma";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{ date?: string }>;
};

export default async function HisaabPage({ searchParams }: Props) {
  const params = await searchParams;
  const selectedDate = params?.date || getTodayInputValue();
  const { start, end } = getIstDayRange(selectedDate);
  const [transactions, supplierPaymentsToday, openingCashRow] = await Promise.all([
    prisma.customerTransaction.findMany({
      where: { createdAt: { gte: start, lt: end } },
      include: { customer: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.supplierTransaction.findMany({
      where: { createdAt: { gte: start, lt: end }, type: "PAYMENT" },
      select: { amountPaise: true },
    }),
    prisma.openingCash.findUnique({ where: { date: selectedDate } }),
  ]);
  const udhaar = transactions
    .filter((transaction) => transaction.type === "UDHAAR")
    .reduce((sum, transaction) => sum + transaction.amountPaise, 0);
  const payments = transactions
    .filter((transaction) => transaction.type === "PAYMENT")
    .reduce((sum, transaction) => sum + transaction.amountPaise, 0);
  const advances = transactions
    .filter((transaction) => transaction.type === "ADVANCE")
    .reduce((sum, transaction) => sum + transaction.amountPaise, 0);
  const net = payments + advances - udhaar;
  const supplierPaymentsTodayPaise = supplierPaymentsToday.reduce((sum, t) => sum + t.amountPaise, 0);

  return (
    <div className="grid gap-5">
      <section>
        <T as="p" className="text-sm font-black uppercase tracking-wide text-orange-700" hi="End-of-day tally" en="End-of-day tally" />
        <T as="h1" className="text-3xl font-black text-gray-900" hi="Aaj ka Hisaab" en="Daily Report" />
      </section>

      <form action="/hisaab" className="tactile-card p-4">
        <label className="grid gap-2 text-sm font-bold text-gray-700">
          <T hi="Date" en="Date" />
          <div className="flex gap-2">
            <input
              name="date"
              type="date"
              defaultValue={selectedDate}
              className="tap-target min-w-0 flex-1 rounded-xl border border-gray-300 px-3 text-base font-bold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
            />
            <button className="tap-target rounded-xl bg-orange-600 px-4 font-black text-white hover:bg-orange-700">
              <T hi="Dekho" en="Show" />
            </button>
          </div>
        </label>
      </form>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ReportCard title="Udhaar Given" subtitle="Credit sales" amountPaise={udhaar} />
        <ReportCard title="Payments Received" subtitle="Cash collected" amountPaise={payments} />
        <ReportCard title="Advance Collected" subtitle="Paid ahead" amountPaise={advances} />
        <ReportCard title="Net for Day" subtitle="Cash minus udhaar" amountPaise={net} />
      </section>

      <HisaabAiSummary date={selectedDate} />

      <CashMilao
        date={selectedDate}
        openingPaise={openingCashRow?.amountPaise ?? 0}
        paymentsTotalPaise={payments}
        advanceTotalPaise={advances}
        supplierPaymentsTodayPaise={supplierPaymentsTodayPaise}
      />

      <section className="tactile-card p-4">
        <T as="h2" className="text-xl font-black text-gray-900" hi="Transactions" en="Transactions" />
        <p className="mb-4 text-sm font-semibold text-gray-500">{formatDateIst(start)} entries</p>
        <div className="grid gap-2">
          {transactions.length > 0 ? (
            transactions.map((transaction) => {
              const label = getCustomerTransactionLabel(transaction.type);
              return (
                <div
                  key={transaction.id}
                  className="grid grid-cols-[1fr_auto] gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-base font-black text-gray-900">{transaction.customer.name}</p>
                    <p className="text-sm font-semibold text-gray-500">
                      {label.label} · {transaction.description || label.subtitle}
                    </p>
                  </div>
                  <Money amountPaise={transaction.amountPaise} className="text-lg font-black text-gray-900" />
                </div>
              );
            })
          ) : (
            <p className="rounded-xl bg-gray-100 p-4 text-sm font-bold text-gray-600">No entries for this date.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function ReportCard({ title, subtitle, amountPaise }: { title: string; subtitle: string; amountPaise: number }) {
  const color = amountPaise < 0 ? "text-red-700" : "text-gray-900";

  return (
    <div className="tactile-card p-6">
      <p className="text-sm font-black text-gray-700">{title}</p>
      <p className="text-xs font-semibold text-gray-500">{subtitle}</p>
      <p className={`mt-4 text-3xl font-black ${color}`}>
        {amountPaise < 0 ? "-" : ""}
        <Money amountPaise={Math.abs(amountPaise)} />
      </p>
    </div>
  );
}
