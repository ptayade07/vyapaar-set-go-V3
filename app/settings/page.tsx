import { updateShopSettings } from "@/backend/actions/shop-settings-actions";
import { prisma } from "@/backend/lib/prisma";
import { getCurrentShopId } from "@/backend/lib/auth";
import { ChangePinForm } from "@/frontend/components/change-pin-form";
import { LogoUpload } from "@/frontend/components/logo-upload";
import { T } from "@/frontend/components/t-text";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const shopId = await getCurrentShopId();
  const shop = await prisma.shop.findUniqueOrThrow({ where: { id: shopId } });
  const blobConfigured = Boolean(process.env.BLOB_READ_WRITE_TOKEN);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <T as="h1" className="text-2xl font-bold text-gray-900" hi="Shop Settings" en="Shop Settings" />
        <T
          as="p"
          className="mt-1 text-sm text-gray-500"
          hi="Ye jaankari aapke PDF statement aur WhatsApp reminders mein dikhegi."
          en="This shows up on your PDF statements and WhatsApp reminders."
        />
      </div>

      <div className="tactile-card space-y-4 p-6">
        <form action={updateShopSettings} className="grid gap-4">
          <label className="grid gap-1 text-sm font-semibold text-gray-700">
            <T hi="Shop naam" en="Shop name" />
            <input
              name="name"
              required
              defaultValue={shop.name}
              className="h-12 w-full rounded-xl border border-gray-200 px-4 text-base focus:outline-none focus:border-orange-500"
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-gray-700">
            <T hi="Address (optional)" en="Address (optional)" />
            <input
              name="address"
              defaultValue={shop.address ?? ""}
              className="h-12 w-full rounded-xl border border-gray-200 px-4 text-base focus:outline-none focus:border-orange-500"
            />
          </label>
          <label className="grid gap-1 text-sm font-semibold text-gray-700">
            <T hi="Phone (optional)" en="Phone (optional)" />
            <input
              name="phone"
              defaultValue={shop.phone ?? ""}
              className="h-12 w-full rounded-xl border border-gray-200 px-4 text-base focus:outline-none focus:border-orange-500"
            />
          </label>
          <button
            type="submit"
            className="tap-target w-fit rounded-xl bg-orange-600 px-6 font-semibold text-white hover:bg-orange-700"
          >
            <T hi="Save karo" en="Save" />
          </button>
        </form>

        {blobConfigured ? (
          <div className="border-t border-gray-100 pt-4">
            <p className="mb-2 text-sm font-semibold text-gray-700">
              <T hi="Logo" en="Logo" />
            </p>
            <LogoUpload currentLogoUrl={shop.logoUrl} />
          </div>
        ) : null}
      </div>

      <div className="tactile-card space-y-3 p-6">
        <T as="h2" className="text-lg font-bold text-gray-900" hi="PIN badlo" en="Change PIN" />
        <ChangePinForm />
      </div>
    </div>
  );
}
