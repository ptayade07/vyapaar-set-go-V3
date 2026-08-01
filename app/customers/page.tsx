import Link from "next/link";
import { createCustomer } from "@/app/actions";
import { BalanceBadge } from "@/components/balance-badge";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

type Props = {
  searchParams?: Promise<{ q?: string }>;
};

export default async function CustomersPage({ searchParams }: Props) {
  const params = await searchParams;
  const query = String(params?.q ?? "").trim();
  const customers = await prisma.customer.findMany({
    where: query
      ? {
          OR: [
            { name: { contains: query, mode: "insensitive" } },
            { phone: { contains: query, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: [{ balancePaise: "desc" }, { name: "asc" }],
  });

  return (
    <div className="grid gap-5">
      <section>
        <p className="text-sm font-black uppercase tracking-wide text-[#16803c]">Customer bahi-khata</p>
        <h1 className="text-3xl font-black text-[#1f271f]">Customers</h1>
      </section>

      <form action="/customers" className="rounded-lg border border-amber-200 bg-white p-4 shadow-sm">
        <label className="grid gap-2 text-sm font-bold text-[#384238]">
          Search by name or phone
          <div className="flex gap-2">
            <input
              name="q"
              defaultValue={query}
              placeholder="Example: Ramesh or 98765"
              className="tap-target min-w-0 flex-1 rounded-md border border-stone-300 px-3 text-base focus:outline-none focus:ring-2 focus:ring-[#16803c]"
            />
            <button className="tap-target rounded-md bg-[#f59e0b] px-4 font-black text-[#1f271f]">Search</button>
          </div>
        </label>
      </form>

      <section className="grid gap-3">
        {customers.map((customer) => (
          <Link
            key={customer.id}
            href={`/customers/${customer.id}`}
            className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-sm hover:border-[#16803c] focus:outline-none focus:ring-2 focus:ring-[#16803c] sm:grid-cols-[1fr_auto]"
          >
            <div className="min-w-0">
              <p className="truncate text-xl font-black text-[#1f271f]">{customer.name}</p>
              <p className="text-sm font-semibold text-[#6f6a60]">{customer.phone || "No phone"}</p>
            </div>
            <div className="self-center">
              <BalanceBadge balancePaise={customer.balancePaise} />
            </div>
          </Link>
        ))}
      </section>

      <section id="add-customer" className="rounded-lg border border-amber-200 bg-white p-4 shadow-sm">
        <h2 className="text-xl font-black text-[#1f271f]">Add Customer</h2>
        <p className="mb-4 text-sm font-semibold text-[#6f6a60]">Naya khata kholo</p>
        <form action={createCustomer} className="grid gap-3">
          <label className="grid gap-2 text-sm font-bold text-[#384238]">
            Name
            <input
              name="name"
              className="tap-target rounded-md border border-stone-300 px-3 text-base focus:outline-none focus:ring-2 focus:ring-[#16803c]"
              required
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-[#384238]">
            Phone
            <input
              name="phone"
              inputMode="tel"
              className="tap-target rounded-md border border-stone-300 px-3 text-base focus:outline-none focus:ring-2 focus:ring-[#16803c]"
            />
          </label>
          <label className="grid gap-2 text-sm font-bold text-[#384238]">
            Note
            <textarea
              name="note"
              rows={2}
              className="rounded-md border border-stone-300 px-3 py-3 text-base focus:outline-none focus:ring-2 focus:ring-[#16803c]"
            />
          </label>
          <button className="tap-target rounded-md bg-[#16803c] px-5 py-3 text-lg font-black text-white focus:outline-none focus:ring-2 focus:ring-[#f59e0b]">
            + New Customer
          </button>
        </form>
      </section>
    </div>
  );
}
