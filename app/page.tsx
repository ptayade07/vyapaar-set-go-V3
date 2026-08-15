import Link from "next/link";
import { ChevronRight, Clock, IndianRupee, Plus, TrendingDown, TrendingUp, Truck } from "lucide-react";
import { computeOldestOpenUdhaarDate, daysBetweenNow } from "@/backend/lib/aging";
import { formatTimeIst, getIstDayRange, getTodayInputValue } from "@/backend/lib/format";
import { prisma } from "@/backend/lib/prisma";
import { getCurrentShopId } from "@/backend/lib/auth";
import { Money } from "@/frontend/components/money";
import { QuickEntry } from "@/frontend/components/quick-entry";
import { T } from "@/frontend/components/t-text";
import { getCustomerTransactionLabel, getSupplierTransactionLabel } from "@/frontend/components/transaction-label";

export const dynamic = "force-dynamic";

const AGING_BUCKETS = [
  { days: 7, labelHi: "7+ din", labelEn: "7+ days", color: "bg-yellow-50 text-yellow-800 border-yellow-200" },
  { days: 15, labelHi: "15+ din", labelEn: "15+ days", color: "bg-orange-50 text-orange-800 border-orange-200" },
  { days: 30, labelHi: "30+ din", labelEn: "30+ days", color: "bg-red-50 text-red-700 border-red-200" },
] as const;

export default async function DashboardPage() {
  const today = getTodayInputValue();
  const { start, end } = getIstDayRange(today);
  const shopId = await getCurrentShopId();
  const [
    customers,
    suppliers,
    customerToday,
    supplierToday,
    customerRecent,
    supplierRecent,
    debtors,
    todayReminders,
  ] = await Promise.all([
    prisma.customer.findMany({ where: { shopId }, select: { id: true, name: true, phone: true, balancePaise: true } }),
    prisma.supplier.findMany({ where: { shopId }, select: { balancePaise: true } }),
    prisma.customerTransaction.findMany({
      where: { shopId, createdAt: { gte: start, lt: end } },
      include: { customer: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.supplierTransaction.findMany({
      where: { shopId, createdAt: { gte: start, lt: end } },
      include: { supplier: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.customerTransaction.findMany({
      where: { shopId },
      take: 10,
      include: { customer: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.supplierTransaction.findMany({
      where: { shopId },
      take: 10,
      include: { supplier: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.customer.findMany({
      where: { shopId, balancePaise: { gt: 0 } },
      select: { transactions: { orderBy: { createdAt: "asc" }, select: { type: true, amountPaise: true, createdAt: true } } },
    }),
    prisma.note.findMany({
      where: { shopId, done: false, reminderDate: { lte: end } },
      orderBy: { reminderDate: "asc" },
    }),
  ]);

  const totalUdhaar = customers.reduce((sum, customer) => sum + Math.max(customer.balancePaise, 0), 0);
  const totalAdvance = customers.reduce((sum, customer) => sum + Math.abs(Math.min(customer.balancePaise, 0)), 0);
  const supplierDena = suppliers.reduce((sum, supplier) => sum + Math.max(supplier.balancePaise, 0), 0);
  const salesToday = customerToday
    .filter((transaction) => transaction.type === "UDHAAR")
    .reduce((sum, transaction) => sum + transaction.amountPaise, 0);
  const paymentsToday = customerToday
    .filter((transaction) => transaction.type === "PAYMENT")
    .reduce((sum, transaction) => sum + transaction.amountPaise, 0);
  const advancesToday = customerToday
    .filter((transaction) => transaction.type === "ADVANCE")
    .reduce((sum, transaction) => sum + transaction.amountPaise, 0);
  const todayTotal = salesToday + paymentsToday + advancesToday;
  const recent = [
    ...customerRecent.map((transaction) => ({
      id: transaction.id,
      name: transaction.customer.name,
      amountPaise: transaction.amountPaise,
      type: getCustomerTransactionLabel(transaction.type).label,
      isUdhaar: transaction.type === "UDHAAR",
      createdAt: transaction.createdAt,
    })),
    ...supplierRecent.map((transaction) => ({
      id: transaction.id,
      name: transaction.supplier.name,
      amountPaise: transaction.amountPaise,
      type: getSupplierTransactionLabel(transaction.type).label,
      isUdhaar: transaction.type === "CREDIT",
      createdAt: transaction.createdAt,
    })),
  ]
    .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
    .slice(0, 10);

  const agingDays = debtors
    .map((debtor) => {
      const oldest = computeOldestOpenUdhaarDate(debtor.transactions);
      return oldest ? daysBetweenNow(oldest) : null;
    })
    .filter((days): days is number => days !== null);
  const agingCounts = AGING_BUCKETS.map((bucket) => ({
    ...bucket,
    count: agingDays.filter((days) => days >= bucket.days).length,
  }));

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <div>
        <T as="h1" className="text-3xl font-bold text-gray-900 sm:text-4xl" hi="Namaste ji! 🙏" en="Welcome!" />
        <T as="p" className="mt-1 text-gray-500" hi="Aaj ka hisaab ek nazar mein" en="Your business at a glance" />
      </div>

      <QuickEntry customers={customers} />

      {agingCounts.some((bucket) => bucket.count > 0) ? (
        <section className="tactile-card p-6" data-testid="card-kal-kya-bacha">
          <div className="mb-4 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-100">
              <Clock className="h-5 w-5 text-amber-700" />
            </span>
            <div>
              <T as="h2" className="text-xl font-bold text-gray-900" hi="Kal kya bacha?" en="Aging Udhaar" />
              <T as="p" className="text-xs text-gray-500" hi="Purane udhaar wale grahak" en="Customers with old dues" />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {agingCounts.map((bucket) => (
              <Link
                key={bucket.days}
                href={`/customers?aging=${bucket.days}`}
                className={`tap-target rounded-2xl border-2 p-4 text-left transition active:scale-95 ${bucket.color}`}
              >
                <T
                  as="p"
                  className="text-xs font-semibold uppercase tracking-wide opacity-80"
                  hi={bucket.labelHi}
                  en={bucket.labelEn}
                />
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="font-mono-num text-3xl font-bold">{bucket.count}</span>
                  <T as="span" className="text-xs font-semibold" hi="grahak" en="customers" />
                </div>
                <div className="mt-2 inline-flex items-center gap-0.5 text-[10px] opacity-70">
                  <T hi="Dekho" en="View" /> <ChevronRight className="h-3 w-3" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        <SummaryCard
          titleHi="Total Udhaar"
          titleEn="Money customers owe"
          subtitle="Money customers owe"
          amountPaise={totalUdhaar}
          color="bg-red-500"
          Icon={TrendingUp}
        />
        <SummaryCard
          titleHi="Total Advance"
          titleEn="Customer paid ahead"
          subtitle="Customer paid ahead"
          amountPaise={totalAdvance}
          color="bg-green-600"
          Icon={TrendingDown}
        />
        <SummaryCard
          titleHi="Aaj ka Hisaab"
          titleEn="Today's cash in"
          subtitle="Today's cash in"
          amountPaise={todayTotal}
          color="bg-orange-600"
          Icon={IndianRupee}
        />
        <SummaryCard
          titleHi="Supplier Dena"
          titleEn="You owe suppliers"
          subtitle="You owe suppliers"
          amountPaise={supplierDena}
          color="bg-amber-700"
          Icon={Truck}
        />
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/customers"
          className="tap-target inline-flex items-center gap-2 rounded-2xl bg-orange-600 px-6 font-semibold text-white shadow-md transition hover:bg-orange-700 active:scale-95"
        >
          <Plus className="h-5 w-5" /> <T hi="Naya Grahak" en="New Customer" />
        </Link>
        <Link
          href="/suppliers"
          className="tap-target inline-flex items-center gap-2 rounded-2xl border-2 border-orange-200 bg-white px-6 font-semibold text-orange-700 transition hover:border-orange-400 active:scale-95"
        >
          <Plus className="h-5 w-5" /> <T hi="Naya Supplier" en="New Supplier" />
        </Link>
        <Link
          href="/hisaab"
          className="tap-target inline-flex items-center gap-2 rounded-2xl border-2 border-gray-200 bg-white px-6 font-semibold text-gray-800 transition hover:border-gray-400 active:scale-95"
        >
          <T hi="Aaj ka Hisaab" en="Daily Report" />
        </Link>
      </div>

      {todayReminders.length > 0 ? (
        <section className="tactile-card p-6" data-testid="today-reminders-block">
          <T as="h2" className="mb-4 text-xl font-bold text-gray-900" hi="Aaj ke Reminders" en="Today's Reminders" />
          <div className="space-y-2">
            {todayReminders.map((note) => (
              <div key={note.id} className="rounded-xl bg-orange-50 p-3">
                <p className="font-semibold text-gray-900">{note.title}</p>
                {note.text ? <p className="text-sm text-gray-600">{note.text}</p> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="tactile-card p-6" data-testid="recent-transactions-block">
        <h2 className="mb-4 text-xl font-bold text-gray-900">Recent Transactions</h2>
        <div className="divide-y divide-gray-100">
          {recent.length > 0 ? (
            recent.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between gap-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-gray-900">{transaction.name}</p>
                  <p className="text-xs text-gray-500">
                    {formatTimeIst(transaction.createdAt)} · {transaction.type}
                  </p>
                </div>
                <Money
                  amountPaise={transaction.amountPaise}
                  className={`text-lg font-bold ${transaction.isUdhaar ? "text-red-600" : "text-green-700"}`}
                />
              </div>
            ))
          ) : (
            <p className="py-6 text-center text-gray-400">Koi transaction nahi hai abhi.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  titleHi,
  titleEn,
  subtitle,
  amountPaise,
  color,
  Icon,
}: {
  titleHi: string;
  titleEn: string;
  subtitle: string;
  amountPaise: number;
  color: string;
  Icon: typeof TrendingUp;
}) {
  return (
    <div className="tactile-card p-6">
      <div className="mb-3 flex items-start justify-between">
        <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${color}`}>
          <Icon className="h-6 w-6 text-white" />
        </span>
      </div>
      <T as="p" className="text-sm font-semibold text-gray-700" hi={titleHi} en={titleEn} />
      <p className="mb-2 text-xs text-gray-400">{subtitle}</p>
      <Money amountPaise={amountPaise} className="block text-3xl font-bold text-gray-900 sm:text-4xl" />
    </div>
  );
}
