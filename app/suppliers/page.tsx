import Link from "next/link";
import { createSupplier } from "@/app/actions";
import { BalanceBadge } from "@/components/balance-badge";
import { prisma } from "@/lib/prisma";

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
        <p className="text-sm font-black uppercase tracking-wide text-[#16803c]">Supplier hisaab</p>
        <h1 className="text-3xl font-black text-[#1f271f]">Suppliers</h1>
      </section>

      <section className="grid gap-3">
        {suppliers.map((supplier) => {
          const overdue = supplier.balancePaise > 0 && supplier.transactions.length > 0;
          return (
            <Link
              key={supplier.id}
              href={`/suppliers/${supplier.id}`}
              className="grid gap-3 rounded-lg border border-stone-200 bg-white p-4 shadow-sm hover:border-[#16803c] focus:outline-none focus:ring-2 focus:ring-[#16803c] sm:grid-cols-[1fr_auto]"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="truncate text-xl font-black text-[#1f271f]">{supplier.name}</p>
                  {overdue ? (
                    <span className="rounded-md border border-red-200 bg-red-50 px-2 py-1 text-xs font-black text-[#b42318]">
                      Overdue
                    </span>
                  ) : null}
                </div>
                <p className="text-sm font-semibold text-[#6f6a60]">{supplier.phone || "No phone"}</p>
              </div>
              <div className="self-center">
                <BalanceBadge balancePaise={supplier.balancePaise} kind="supplier" />
              </div>
            </Link>
          );
        })}
      </section>

      <section id="add-supplier" className="rounded-lg border border-amber-200 bg-white p-4 shadow-sm">
        <h2 className="text-xl font-black text-[#1f271f]">Add Supplier</h2>
        <p className="mb-4 text-sm font-semibold text-[#6f6a60]">Naya supplier jodo</p>
        <form action={createSupplier} className="grid gap-3">
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
            + New Supplier
          </button>
        </form>
      </section>
    </div>
  );
}
