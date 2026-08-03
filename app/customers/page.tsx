import Link from "next/link";
import { ArrowDownAZ, ArrowDownWideNarrow, Clock, Phone, Search, X } from "lucide-react";
import { createCustomer } from "@/backend/actions/actions";
import { computeOldestOpenUdhaarDate, daysBetweenNow } from "@/backend/lib/aging";
import { prisma } from "@/backend/lib/prisma";
import { AddPersonPanel } from "@/frontend/components/add-person-panel";
import { BalanceText } from "@/frontend/components/balance-text";
import { T } from "@/frontend/components/t-text";

export const dynamic = "force-dynamic";

const SORT_OPTIONS = [
  { key: "udhaar", labelHi: "Sabse zyada udhaar", labelEn: "Highest Udhaar", icon: ArrowDownWideNarrow },
  { key: "recent", labelHi: "Recent", labelEn: "Recent", icon: Clock },
  { key: "az", labelHi: "A-Z", labelEn: "A-Z", icon: ArrowDownAZ },
] as const;

type Props = {
  searchParams?: Promise<{ q?: string; aging?: string; sort?: string }>;
};

export default async function CustomersPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = String(params?.q ?? "").trim();
  const agingThreshold = params?.aging ? Number(params.aging) : null;
  const sortKey = params?.sort === "recent" || params?.sort === "az" ? params.sort : "udhaar";

  const customers = await prisma.customer.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { phone: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    include: {
      transactions: {
        where: { type: "UDHAAR" },
        select: { type: true, amountPaise: true, createdAt: true },
      },
    },
  });

  const withAging = customers.map((customer) => {
    const oldest = customer.balancePaise > 0 ? computeOldestOpenUdhaarDate(customer.transactions) : null;
    return { ...customer, oldestUdhaarDays: oldest ? daysBetweenNow(oldest) : null };
  });

  let visible = withAging;
  if (agingThreshold !== null) {
    visible = visible
      .filter((customer) => (customer.oldestUdhaarDays ?? -1) >= agingThreshold)
      .sort((a, b) => (b.oldestUdhaarDays ?? 0) - (a.oldestUdhaarDays ?? 0));
  } else if (sortKey === "recent") {
    visible = [...visible].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  } else if (sortKey === "az") {
    visible = [...visible].sort((a, b) => a.name.localeCompare(b.name));
  } else {
    visible = [...visible].sort((a, b) => b.balancePaise - a.balancePaise);
  }

  return (
    <div className="mx-auto max-w-4xl space-y-6">
      <AddPersonPanel
        titleHi="Grahak (Khata)"
        titleEn="Customers"
        subtitleHi="Sab customers ki list"
        subtitleEn="All customers"
        triggerLabelHi="Naya Grahak"
        triggerLabelEn="Add Customer"
        action={createCustomer}
      />

      <form action="/customers" className="relative">
        <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
        <input
          name="q"
          defaultValue={query}
          placeholder="Naam ya phone se search karo / Search by name or phone"
          className="h-14 w-full rounded-2xl border border-gray-200 bg-white pl-12 pr-4 text-lg focus:outline-none focus:border-orange-500"
        />
      </form>

      {agingThreshold === null ? (
        <div className="flex flex-wrap gap-2">
          <span className="mr-1 self-center text-xs font-semibold text-gray-500">
            <T hi="Sort:" en="Sort:" />
          </span>
          {SORT_OPTIONS.map((option) => (
            <Link
              key={option.key}
              href={`/customers?sort=${option.key}`}
              className={`inline-flex h-9 items-center gap-1.5 rounded-full px-3 text-sm font-semibold transition ${
                sortKey === option.key
                  ? "bg-orange-600 text-white shadow-sm"
                  : "border border-gray-200 bg-white text-gray-700 hover:border-orange-300"
              }`}
            >
              <option.icon className="h-3.5 w-3.5" />
              <T hi={option.labelHi} en={option.labelEn} />
            </Link>
          ))}
        </div>
      ) : (
        <div className="tactile-card flex items-center justify-between gap-3 border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-3">
            <Clock className="h-5 w-5 text-amber-700" />
            <div>
              <T
                as="p"
                className="font-bold text-gray-900"
                hi={`${agingThreshold}+ din se udhaar`}
                en={`${agingThreshold}+ days old`}
              />
              <T
                as="p"
                className="text-xs text-gray-600"
                hi={`${visible.length} grahak — purane pehle`}
                en={`${visible.length} customers — oldest first`}
              />
            </div>
          </div>
          <Link
            href="/customers"
            className="inline-flex h-9 items-center gap-1 rounded-full border border-gray-200 bg-white px-3 text-sm font-semibold text-gray-700 hover:border-orange-300"
          >
            <X className="h-3.5 w-3.5" /> <T hi="Filter clear" en="Clear" />
          </Link>
        </div>
      )}

      <div className="space-y-3">
        {visible.length === 0 ? (
          <T as="p" className="py-10 text-center text-gray-400" hi="Koi grahak nahi mila." en="No customers found." />
        ) : null}
        {visible.map((customer) => (
          <Link
            key={customer.id}
            href={`/customers/${customer.id}`}
            className="tactile-card flex items-center justify-between gap-4 p-5 hover:border-orange-300"
          >
            <div className="min-w-0 flex-1">
              <div className="truncate text-lg font-bold text-gray-900">{customer.name}</div>
              {customer.phone ? (
                <div className="mt-0.5 flex items-center gap-1 text-sm text-gray-500">
                  <Phone className="h-3.5 w-3.5" /> {customer.phone}
                </div>
              ) : null}
              {agingThreshold !== null && customer.oldestUdhaarDays ? (
                <div className="mt-1.5">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      customer.oldestUdhaarDays >= 30
                        ? "bg-red-100 text-red-700"
                        : customer.oldestUdhaarDays >= 15
                          ? "bg-orange-100 text-orange-700"
                          : "bg-yellow-100 text-yellow-800"
                    }`}
                  >
                    <Clock className="h-3 w-3" />{" "}
                    <T hi={`${customer.oldestUdhaarDays} din purana`} en={`${customer.oldestUdhaarDays} days old`} />
                  </span>
                </div>
              ) : null}
            </div>
            <BalanceText balancePaise={customer.balancePaise} />
          </Link>
        ))}
      </div>
    </div>
  );
}
