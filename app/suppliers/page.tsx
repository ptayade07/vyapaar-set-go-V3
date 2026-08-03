import Link from "next/link";
import { createSupplier } from "@/backend/actions/actions";
import { BalanceBadge } from "@/components/balance-badge";
import { prisma } from "@/backend/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SuppliersPage() {
  const suppliers = await prisma.supplier.findMany({
    include: {
      transactions: {
        where: {
          type: "CREDIT",
          dueDate: { lt: new Date() },
        },
      },
    },
    orderBy: [{ balancePaise: "desc" }, { name: "asc" }],
  });

  return (
    <div className="grid gap-5">
      <section>
        <p className="text-sm font-black uppercase tracking-wide text-orange-700">Supplier hisaab</p>
        <h1 className="text-3xl font-black text-gray-900">Suppliers</h1>
      </section>

      <section className="grid gap-3">
        {suppliers.map((supplier) => {
          const overdue = supplier.balancePaise > 0 && supplier.transactions.length > 0;
          return (
            <Link
              key={supplier.id}
              href={`/suppliers/${supplier.id}`}
              className="tactile-card grid gap-3 p-4 sm:grid-cols-[1fr_auto]"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-xl font-black text-gray-900">{supplier.name}</p>
                  {overdue ? (
                    <span className="rounded-full border border-red-100 bg-red-50 px-2 py-0.5 text-xs font-black text-red-700">
                      Overdue
                    </span>
                  ) : null}
                </div>
                <p className="text-sm font-semibold text-gray-500">{supplier.phone || "No phone"}</p>
              </div>
              <div className="self-center">
                <BalanceBadge balancePaise={supplier.balancePaise} kind="supplier" />
              </div>
            </Link>
          );
        })}
      </section>

      <section id="add-supplier" className="tactile-card p-4">
        <h2 className="text-xl font-black text-gray-900">Add Supplier</h2>
        <p className="mb-4 text-sm font-semibold text-gray-500">Naya supplier jodo</p>
        <form action={createSupplier} className="grid gap-3">
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
            + New Supplier
          </button>
        </form>
      </section>
    </div>
  );
}
