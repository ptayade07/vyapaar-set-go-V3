import { createShopAction, selectShopAction } from "@/backend/actions/shop-actions";
import { prisma } from "@/backend/lib/prisma";

export const dynamic = "force-dynamic";

export default async function SelectShopPage() {
  const shops = await prisma.shop.findMany({ orderBy: { createdAt: "asc" } });

  return (
    <div className="min-h-screen overflow-y-auto bg-[var(--background)] px-4 py-10">
      <div className="mx-auto w-full max-w-sm space-y-6">
        <div className="text-center">
          <span className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-orange-600 text-2xl font-bold text-white">
            व
          </span>
          <h1 className="text-2xl font-bold text-gray-900">Which shop?</h1>
          <p className="mt-1 text-sm text-gray-500">
            Temporary picker until real login exists (Stage 2, see PRODUCTION_STAGES.md).
          </p>
        </div>

        {shops.length > 0 ? (
          <div className="tactile-card space-y-2 p-4">
            {shops.map((shop) => (
              <form key={shop.id} action={selectShopAction}>
                <input type="hidden" name="shopId" value={shop.id} />
                <button
                  type="submit"
                  className="tap-target w-full rounded-xl border border-gray-200 bg-white px-4 text-left font-semibold text-gray-900 hover:border-orange-300"
                >
                  {shop.name}
                </button>
              </form>
            ))}
          </div>
        ) : null}

        <form action={createShopAction} className="tactile-card space-y-3 p-4">
          <label className="grid gap-2 text-sm font-semibold text-gray-700">
            New shop name
            <input
              name="name"
              required
              placeholder="e.g. Ramesh Kirana"
              className="h-14 w-full rounded-xl border border-gray-200 px-4 text-base focus:outline-none focus:border-orange-500"
            />
          </label>
          <button
            type="submit"
            className="tap-target w-full rounded-xl bg-orange-600 font-semibold text-white hover:bg-orange-700"
          >
            Create &amp; use this shop
          </button>
        </form>
      </div>
    </div>
  );
}
