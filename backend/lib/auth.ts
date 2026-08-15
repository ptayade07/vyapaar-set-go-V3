import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { verifySessionToken } from "@/backend/lib/session";

export const SESSION_COOKIE = "vsg_session";

/**
 * Resolves the shop the current request belongs to, from a real login session (see
 * PRODUCTION_STAGES.md, Stage 2). This replaces backend/lib/shop-context.ts's Stage 1 stand-in,
 * which read a bare, unauthenticated "which shop did you click" cookie -- same job, real identity
 * underneath it. Every scoped query in the app should route through this function.
 */
export async function getCurrentShopId(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) {
    redirect("/login");
  }
  return session.shopId;
}

export async function getCurrentUserId(): Promise<string> {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) {
    redirect("/login");
  }
  return session.userId;
}
