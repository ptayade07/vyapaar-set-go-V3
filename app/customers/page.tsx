import Link from "next/link";
import { createCustomer } from "@/app/actions";
import { BalanceBadge } from "@/components/balance-badge";
import { computeOldestOpenUdhaarDate, daysBetweenNow } from "@/lib/aging";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{ q?: string; aging?: string }>;
};

export default async function CustomersPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = String(params?.q ?? "").trim();
  const agingThreshold = params?.aging ? Number(params.aging) : null;

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
    orderBy: [{ balancePaise: "desc" }, { name: "asc" }],
  });

  const withAging = customers.map((customer) => {
    const oldest = customer.balancePaise > 0 ? computeOldestOpenUdhaarDate(customer.transactions) : null;
    return { ...customer, oldestUdhaarDays: oldest ? daysBetweenNow(oldest) : null };
  });

  const visible =
    agingThreshold !== null
      ? withAging.filter((customer) => (customer.oldestUdhaarDays ?? -1) >= agingThreshold)
      : withAging;

  return (
    <div className="grid gap-5">
      <section>
        <p className="text-sm font-black uppercase tracking-wide text-orange-700">Customer bahi-khata</p>
        <h1 className="text-3xl font-black text-gray-900">Customers</h1>
        {agingThreshold !== null ? (
          <p className="mt-1 text-sm font-bold text-gray-500">
            Showing {agingThreshold}+ din purana udhaar ·{" "}
            <Link href="/customers" className="text-orange-700 underline-offset-2 hover:underline">
              Clear filter
            </Link>
          </p>
        ) : null}
      </section>

      <form action="/customers" className="tactile-card p-4">
        <label className="grid gap-2 text-sm font-bold text-gray-700">
          Search by name or phone
          <div className="flex gap-2">
            <input
              name="q"
              defaultValue={query}
              placeholder="Example: Ramesh or 98765"
              className="tap-target min-w-0 flex-1 rounded-xl border border-gray-300 px-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-600"
            />
            <button className="tap-target rounded-xl bg-orange-600 px-4 font-black text-white hover:bg-orange-700">
              Search
            </button>
          </div>
        </label>
      </form>

      <section className="grid gap-3">
        {visible.map((customer) => (
          <Link
            key={customer.id}
            href={`/customers/${customer.id}`}
            className="tactile-card grid gap-3 p-4 sm:grid-cols-[1fr_auto]"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="truncate text-xl font-black text-gray-900">{customer.name}</p>
                {customer.oldestUdhaarDays !== null ? (
                  <span className="rounded-full border border-orange-200 bg-orange-50 px-2 py-0.5 text-xs font-black text-orange-700">
                    {customer.oldestUdhaarDays}d
                  </span>
                ) : null}
              </div>
              <p className="text-sm font-semibold text-gray-500">{customer.phone || "No phone"}</p>
            </div>
            <div className="self-center">
              <BalanceBadge balancePaise={customer.balancePaise} />
            </div>
          </Link>
        ))}
        {visible.length === 0 ? (
          <p className="rounded-xl bg-gray-100 p-4 text-sm font-bold text-gray-600">No customers match.</p>
        ) : null}
      </section>

      <section id="add-customer" className="tactile-card p-4">
        <h2 className="text-xl font-black text-gray-900">Add Customer</h2>
        <p className="mb-4 text-sm font-semibold text-gray-500">Naya khata kholo</p>
        <form action={createCustomer} className="grid gap-3">
          <label className="grid gap-2 text-sm font-bold text-gray-700">
            Name
            <input
              name="name"
              className="tap-target rounded-xl border border-gray-300 px-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-600"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-gray-700">
            Phone
            <input
              name="phone"
              inputMode="tel"
              className="tap-target rounded-xl border border-gray-300 px-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-600"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-gray-700">
            Note
            <textarea
              name="note"
              rows={2}
              className="rounded-xl border border-gray-300 px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-orange-600"
            />
          </label>
          <button className="tap-target rounded-xl bg-orange-600 px-5 py-3 text-lg font-black text-white hover:bg-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-700">
            + New Customer
          </button>
        </form>
      </section>
    </div>
  );
}
