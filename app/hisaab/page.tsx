import { CashMilao } from "@/frontend/components/cash-milao";
import { HisaabAiSummary } from "@/frontend/components/hisaab-ai-summary";
import { HisaabDatePicker } from "@/frontend/components/hisaab-date-picker";
import { Money } from "@/frontend/components/money";
import { T } from "@/frontend/components/t-text";
import { getCustomerTransactionLabel } from "@/frontend/components/transaction-label";
import { formatDateIst, formatDateTimeIst, getIstDayRange, getTodayInputValue } from "@/backend/lib/format";
import { prisma } from "@/backend/lib/prisma";
import { getCurrentShopId } from "@/backend/lib/shop-context";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{ date?: string }>;
};

export default async function HisaabPage({ searchParams }: Props) {
  const params = await searchParams;
  const selectedDate = params?.date || getTodayInputValue();
  const { start, end } = getIstDayRange(selectedDate);
  const shopId = await getCurrentShopId();
  const [transactions, supplierPaymentsToday, openingCashRow] = await Promise.all([
    prisma.customerTransaction.findMany({
      where: { shopId, createdAt: { gte: start, lt: end } },
      include: { customer: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.supplierTransaction.findMany({
      where: { shopId, createdAt: { gte: start, lt: end }, type: "PAYMENT" },
      select: { amountPaise: true },
    }),
    prisma.openingCash.findUnique({ where: { shopId_date: { shopId, date: selectedDate } } }),
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
  const netCashIn = payments + advances;
  const supplierPaymentsTodayPaise = supplierPaymentsToday.reduce((sum, t) => sum + t.amountPaise, 0);

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <div>
        <T as="h1" className="text-3xl font-bold text-gray-900" hi="Daily Hisaab" en="Daily Report" />
        <T as="p" className="text-sm text-gray-500" hi="Din bhar ka poora hisaab" en="Full day's summary" />
      </div>

      <HisaabDatePicker date={selectedDate} displayDate={formatDateIst(start)} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryTile labelHi="Udhaar Diya" labelEn="Credit Given" amountPaise={udhaar} color="text-red-600" />
        <SummaryTile labelHi="Payment Liya" labelEn="Received" amountPaise={payments} color="text-green-700" />
        <SummaryTile labelHi="Advance Liya" labelEn="Advance Rcvd" amountPaise={advances} color="text-blue-700" />
        <SummaryTile
          labelHi="Net Cash In"
          labelEn="Net Cash In"
          amountPaise={netCashIn}
          color="text-orange-700"
          tint
        />
      </div>

      <HisaabAiSummary date={selectedDate} />

      <CashMilao
        date={selectedDate}
        openingPaise={openingCashRow?.amountPaise ?? 0}
        paymentsTotalPaise={payments}
        advanceTotalPaise={advances}
        supplierPaymentsTodayPaise={supplierPaymentsTodayPaise}
      />

      <div className="tactile-card overflow-hidden">
        <div className="p-6 pb-2">
          <T as="h2" className="text-xl font-bold text-gray-900" hi="Din ka poora hisaab" en="All transactions" />
        </div>
        <div className="divide-y divide-gray-100">
          {transactions.length === 0 ? (
            <T
              as="p"
              className="p-6 text-center text-gray-400"
              hi="Is din koi transaction nahi hua."
              en="No transactions on this date."
            />
          ) : (
            transactions.map((transaction) => {
              const meta = getCustomerTransactionLabel(transaction.type);
              return (
                <div key={transaction.id} className="flex items-center justify-between gap-4 p-4 sm:p-5">
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-gray-900">{transaction.customer.name}</p>
                    <p className="text-xs text-gray-500">
                      {formatDateTimeIst(transaction.createdAt)} · {meta.label}
                      {transaction.description ? ` · ${transaction.description}` : ""}
                    </p>
                  </div>
                  <span className={`font-mono-num text-lg font-bold ${meta.amountColor}`}>
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

function SummaryTile({
  labelHi,
  labelEn,
  amountPaise,
  color,
  tint,
}: {
  labelHi: string;
  labelEn: string;
  amountPaise: number;
  color: string;
  tint?: boolean;
}) {
  return (
    <div className={`tactile-card p-5 ${tint ? "border-orange-200 bg-orange-50" : ""}`}>
      <T as="p" className="text-xs text-gray-500" hi={labelHi} en={labelEn} />
      <Money amountPaise={amountPaise} className={`font-mono-num mt-2 block text-2xl font-bold ${color}`} />
    </div>
  );
}
