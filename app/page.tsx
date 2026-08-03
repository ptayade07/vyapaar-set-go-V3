import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { BalanceBadge } from "@/components/balance-badge";
import { Money } from "@/components/money";
import { QuickEntry } from "@/components/quick-entry";
import { getCustomerTransactionLabel, getSupplierTransactionLabel } from "@/components/transaction-label";
import { computeOldestOpenUdhaarDate, daysBetweenNow } from "@/lib/aging";
import { formatTimeIst, getIstDayRange, getTodayInputValue } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const AGING_BUCKETS = [
  { days: 7, label: "7+ din", color: "bg-yellow-50 text-yellow-800 border-yellow-200" },
  { days: 15, label: "15+ din", color: "bg-orange-50 text-orange-800 border-orange-200" },
  { days: 30, label: "30+ din", color: "bg-red-50 text-red-700 border-red-200" },
] as const;

export default async function DashboardPage() {
  const today = getTodayInputValue();
  const { start, end } = getIstDayRange(today);
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
    prisma.customer.findMany({ select: { balancePaise: true } }),
    prisma.supplier.findMany({ select: { balancePaise: true } }),
    prisma.customerTransaction.findMany({
      where: { createdAt: { gte: start, lt: end } },
      include: { customer: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.supplierTransaction.findMany({
      where: { createdAt: { gte: start, lt: end } },
      include: { supplier: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.customerTransaction.findMany({
      take: 10,
      include: { customer: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.supplierTransaction.findMany({
      take: 10,
      include: { supplier: { select: { name: true } } },
      orderBy: { createdAt: "desc" },
    }),
    prisma.customer.findMany({
      where: { balancePaise: { gt: 0 } },
      select: { transactions: { orderBy: { createdAt: "asc" }, select: { type: true, amountPaise: true, createdAt: true } } },
    }),
    prisma.note.findMany({
      where: { done: false, reminderDate: { lte: end } },
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
      createdAt: transaction.createdAt,
    })),
    ...supplierRecent.map((transaction) => ({
      id: transaction.id,
      name: transaction.supplier.name,
      amountPaise: transaction.amountPaise,
      type: getSupplierTransactionLabel(transaction.type).label,
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
    <div className="grid gap-5">
      <section className="grid gap-2">
        <p className="text-sm font-black uppercase tracking-wide text-orange-700">Aaj ka dukaan view</p>
        <h1 className="text-3xl font-black text-gray-900 sm:text-4xl">Dashboard</h1>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Shop summaries">
        <SummaryCard title="Total Udhaar" subtitle="Customers owe me" amountPaise={totalUdhaar} tone="red" />
        <SummaryCard title="Total Advance" subtitle="Customers paid ahead" amountPaise={totalAdvance} tone="green" />
        <SummaryCard title="Aaj ka Hisaab" subtitle="Sales + payments received" amountPaise={todayTotal} tone="saffron" />
        <SummaryCard title="Supplier Dena" subtitle="I owe suppliers" amountPaise={supplierDena} tone="stone" />
      </section>

      {agingCounts.some((bucket) => bucket.count > 0) ? (
        <section className="tactile-card p-6" data-testid="card-kal-kya-bacha">
          <h2 className="text-xl font-black text-gray-900">Kal kya bacha?</h2>
          <p className="mb-3 text-sm font-semibold text-gray-500">Purana udhaar jo abhi tak clear nahi hua</p>
          <div className="grid grid-cols-3 gap-3">
            {agingCounts.map((bucket) => (
              <Link
                key={bucket.days}
                href={`/customers?aging=${bucket.days}`}
                className={`tap-target rounded-2xl border-2 p-4 text-left transition active:scale-95 ${bucket.color}`}
              >
                <div className="text-xs font-semibold uppercase tracking-wide opacity-80">{bucket.label}</div>
                <div className="mt-1 flex items-baseline gap-1">
                  <span className="font-mono-num text-3xl font-bold">{bucket.count}</span>
                  <span className="text-xs font-semibold">customers</span>
                </div>
                <div className="mt-2 inline-flex items-center gap-0.5 text-[10px] opacity-70">
                  Dekho <ChevronRight className="h-3 w-3" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      ) : null}

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Quick actions">
        <QuickAction href="/customers" label="+ New Entry" subtitle="Choose customer khata" />
        <QuickAction href="/customers#add-customer" label="+ New Customer" subtitle="Naya khata kholo" />
        <QuickAction href="/suppliers#add-supplier" label="+ New Supplier" subtitle="Supplier jodo" />
      </section>

      <QuickEntry />

      {todayReminders.length > 0 ? (
        <section className="tactile-card p-6" data-testid="today-reminders-block">
          <h2 className="text-xl font-black text-gray-900">Aaj ke Reminders</h2>
          <p className="mb-3 text-sm font-semibold text-gray-500">Notes jo aaj tak due hain</p>
          <div className="grid gap-2">
            {todayReminders.map((note) => (
              <div key={note.id} className="rounded-xl bg-orange-50 p-3">
                <p className="font-semibold text-gray-900">{note.title}</p>
                {note.text ? <p className="text-sm text-gray-600">{note.text}</p> : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="tactile-card p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-gray-900">Recent Transactions</h2>
            <p className="text-sm font-semibold text-gray-500">Last 10 entries, newest first</p>
          </div>
          <BalanceBadge balancePaise={totalUdhaar - totalAdvance} />
        </div>
        <div className="grid gap-2">
          {recent.length > 0 ? (
            recent.map((transaction) => (
              <div
                key={transaction.id}
                className="grid grid-cols-[1fr_auto] gap-3 rounded-xl border border-gray-100 bg-gray-50 p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-base font-black text-gray-900">{transaction.name}</p>
                  <p className="text-sm font-semibold text-gray-500">
                    {transaction.type} · {formatTimeIst(transaction.createdAt)}
                  </p>
                </div>
                <Money amountPaise={transaction.amountPaise} className="text-lg font-black text-gray-900" />
              </div>
            ))
          ) : (
            <p className="rounded-xl bg-gray-100 p-4 text-sm font-bold text-gray-600">No transactions yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  title,
  subtitle,
  amountPaise,
  tone,
}: {
  title: string;
  subtitle: string;
  amountPaise: number;
  tone: "red" | "green" | "saffron" | "stone";
}) {
  const colors = {
    red: "border-red-100 bg-red-50 text-red-700",
    green: "border-green-100 bg-green-50 text-green-700",
    saffron: "border-orange-100 bg-orange-50 text-gray-900",
    stone: "border-gray-200 bg-gray-50 text-gray-900",
  };

  return (
    <div className={`tactile-card border p-6 ${colors[tone]}`}>
      <p className="text-sm font-black">{title}</p>
      <p className="text-xs font-semibold text-gray-500">{subtitle}</p>
      <Money amountPaise={amountPaise} className="mt-4 block text-3xl font-bold" />
    </div>
  );
}

function QuickAction({ href, label, subtitle }: { href: string; label: string; subtitle: string }) {
  return (
    <Link
      href={href}
      className="tap-target rounded-2xl border border-orange-600 bg-orange-600 p-4 text-white shadow-sm transition hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-700 active:scale-95"
    >
      <span className="block text-xl font-black">{label}</span>
      <span className="block text-sm font-semibold text-orange-50">{subtitle}</span>
    </Link>
  );
}
