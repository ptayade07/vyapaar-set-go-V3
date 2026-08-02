import { HisaabAiSummary } from "@/components/hisaab-ai-summary";
import { getCustomerTransactionLabel } from "@/components/transaction-label";
import { formatDateIst, formatMoneyPaise, getIstDayRange, getTodayInputValue } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{ date?: string }>;
};

export default async function HisaabPage({ searchParams }: Props) {
  const params = await searchParams;
  const selectedDate = params?.date || getTodayInputValue();
  const { start, end } = getIstDayRange(selectedDate);
  const transactions = await prisma.customerTransaction.findMany({
    where: { createdAt: { gte: start, lt: end } },
    include: { customer: { select: { name: true } } },
    orderBy: { createdAt: "desc" },
  });
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

  return (
    <div className="grid gap-5">
      <section>
        <p className="text-sm font-black uppercase tracking-wide text-[#16803c]">End-of-day tally</p>
        <h1 className="text-3xl font-black text-[#1f271f]">Aaj ka Hisaab</h1>
      </section>

      <form action="/hisaab" className="rounded-lg border border-amber-200 bg-white p-4 shadow-sm">
        <label className="grid gap-2 text-sm font-bold text-[#384238]">
          Date
          <div className="flex gap-2">
            <input
              name="date"
              type="date"
              defaultValue={selectedDate}
              className="tap-target min-w-0 flex-1 rounded-md border border-stone-300 px-3 text-base font-bold focus:outline-none focus:ring-2 focus:ring-[#16803c]"
            />
            <button className="tap-target rounded-md bg-[#f59e0b] px-4 font-black text-[#1f271f]">Show</button>
          </div>
        </label>
      </form>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <ReportCard title="Udhaar Given" subtitle="Credit sales" amount={udhaar} />
        <ReportCard title="Payments Received" subtitle="Cash collected" amount={payments} />
        <ReportCard title="Advance Collected" subtitle="Paid ahead" amount={advances} />
        <ReportCard title="Net for Day" subtitle="Cash minus udhaar" amount={net} />
      </section>

      <HisaabAiSummary date={selectedDate} />

      <section className="rounded-lg border border-amber-200 bg-white p-4 shadow-sm">
        <h2 className="text-xl font-black text-[#1f271f]">Transactions</h2>
        <p className="mb-4 text-sm font-semibold text-[#6f6a60]">{formatDateIst(start)} entries</p>
        <div className="grid gap-2">
          {transactions.length > 0 ? (
            transactions.map((transaction) => {
              const label = getCustomerTransactionLabel(transaction.type);
              return (
                <div
                  key={transaction.id}
                  className="grid grid-cols-[1fr_auto] gap-3 rounded-md border border-stone-200 bg-[#fffdf7] p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-base font-black text-[#1f271f]">{transaction.customer.name}</p>
                    <p className="text-sm font-semibold text-[#6f6a60]">
                      {label.label} · {transaction.description || label.subtitle}
                    </p>
                  </div>
                  <p className="text-lg font-black text-[#1f271f]">{formatMoneyPaise(transaction.amountPaise)}</p>
                </div>
              );
            })
          ) : (
            <p className="rounded-md bg-stone-100 p-4 text-sm font-bold text-stone-600">No entries for this date.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function ReportCard({ title, subtitle, amount }: { title: string; subtitle: string; amount: number }) {
  const color = amount < 0 ? "text-[#b42318]" : "text-[#1f271f]";

  return (
    <div className="rounded-lg border border-amber-200 bg-white p-4 shadow-sm">
      <p className="text-sm font-black text-[#384238]">{title}</p>
      <p className="text-xs font-semibold text-[#6f6a60]">{subtitle}</p>
      <p className={`mt-4 text-3xl font-black ${color}`}>{amount < 0 ? "-" : ""}{formatMoneyPaise(amount)}</p>
    </div>
  );
}
