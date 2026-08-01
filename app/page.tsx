import Link from "next/link";
import { BalanceBadge } from "@/components/balance-badge";
import { getCustomerTransactionLabel, getSupplierTransactionLabel } from "@/components/transaction-label";
import { formatMoneyPaise, formatTimeIst, getIstDayRange, getTodayInputValue } from "@/lib/format";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const today = getTodayInputValue();
  const { start, end } = getIstDayRange(today);
  const [customers, suppliers, customerToday, supplierToday, customerRecent, supplierRecent] = await Promise.all([
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

  return (
    <div className="grid gap-5">
      <section className="grid gap-2">
        <p className="text-sm font-black uppercase tracking-wide text-[#16803c]">Aaj ka dukaan view</p>
        <h1 className="text-3xl font-black text-[#1f271f] sm:text-4xl">Dashboard</h1>
      </section>

      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4" aria-label="Shop summaries">
        <SummaryCard title="Total Udhaar" subtitle="Customers owe me" amount={totalUdhaar} tone="red" />
        <SummaryCard title="Total Advance" subtitle="Customers paid ahead" amount={totalAdvance} tone="green" />
        <SummaryCard title="Aaj ka Hisaab" subtitle="Sales + payments received" amount={todayTotal} tone="saffron" />
        <SummaryCard title="Supplier Dena" subtitle="I owe suppliers" amount={supplierDena} tone="stone" />
      </section>

      <section className="grid gap-3 sm:grid-cols-3" aria-label="Quick actions">
        <QuickAction href="/customers" label="+ New Entry" subtitle="Choose customer khata" />
        <QuickAction href="/customers#add-customer" label="+ New Customer" subtitle="Naya khata kholo" />
        <QuickAction href="/suppliers#add-supplier" label="+ New Supplier" subtitle="Supplier jodo" />
      </section>

      <section className="rounded-lg border border-amber-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-black text-[#1f271f]">Recent Transactions</h2>
            <p className="text-sm font-semibold text-[#6f6a60]">Last 10 entries, newest first</p>
          </div>
          <BalanceBadge balancePaise={totalUdhaar - totalAdvance} />
        </div>
        <div className="grid gap-2">
          {recent.length > 0 ? (
            recent.map((transaction) => (
              <div
                key={transaction.id}
                className="grid grid-cols-[1fr_auto] gap-3 rounded-md border border-stone-200 bg-[#fffdf7] p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-base font-black text-[#1f271f]">{transaction.name}</p>
                  <p className="text-sm font-semibold text-[#6f6a60]">
                    {transaction.type} · {formatTimeIst(transaction.createdAt)}
                  </p>
                </div>
                <p className="text-lg font-black text-[#1f271f]">{formatMoneyPaise(transaction.amountPaise)}</p>
              </div>
            ))
          ) : (
            <p className="rounded-md bg-stone-100 p-4 text-sm font-bold text-stone-600">No transactions yet.</p>
          )}
        </div>
      </section>
    </div>
  );
}

function SummaryCard({
  title,
  subtitle,
  amount,
  tone,
}: {
  title: string;
  subtitle: string;
  amount: number;
  tone: "red" | "green" | "saffron" | "stone";
}) {
  const colors = {
    red: "border-red-200 bg-red-50 text-[#b42318]",
    green: "border-green-200 bg-green-50 text-[#16803c]",
    saffron: "border-amber-200 bg-amber-50 text-[#1f271f]",
    stone: "border-stone-200 bg-stone-50 text-[#1f271f]",
  };

  return (
    <div className={`rounded-lg border p-4 shadow-sm ${colors[tone]}`}>
      <p className="text-sm font-black">{title}</p>
      <p className="text-xs font-semibold text-[#6f6a60]">{subtitle}</p>
      <p className="mt-4 text-3xl font-black">{formatMoneyPaise(amount)}</p>
    </div>
  );
}

function QuickAction({ href, label, subtitle }: { href: string; label: string; subtitle: string }) {
  return (
    <Link
      href={href}
      className="tap-target rounded-lg border border-[#16803c] bg-[#16803c] p-4 text-white shadow-sm hover:bg-[#11652f] focus:outline-none focus:ring-2 focus:ring-[#f59e0b]"
    >
      <span className="block text-xl font-black">{label}</span>
      <span className="block text-sm font-semibold text-green-50">{subtitle}</span>
    </Link>
  );
}
