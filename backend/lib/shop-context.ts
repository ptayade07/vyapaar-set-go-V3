import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const SHOP_COOKIE = "vsg_shop";

/**
 * Resolves the shop the current request belongs to. This is the one function every scoped query
 * in the app should route through -- see PRODUCTION_STAGES.md, Stage 1.
 *
 * There's no real login yet (that's Stage 2), so "current shop" today just means "whichever shop
 * was picked at /select-shop and is remembered in a cookie" -- a stand-in that Stage 2's real auth
 * replaces without touching any of the query-scoping code that calls this.
 */
export async function getCurrentShopId(): Promise<string> {
  const cookieStore = await cookies();
  const shopId = cookieStore.get(SHOP_COOKIE)?.value;
  if (!shopId) {
    redirect("/select-shop");
  }
  return shopId;
}
