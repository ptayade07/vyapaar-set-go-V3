import { NextRequest, NextResponse } from "next/server";
import { verifySessionToken } from "@/backend/lib/session";

const UNLOCK_COOKIE = "vsg_unlocked";
const SESSION_COOKIE = "vsg_session";

// Order matters: log in first, then unlock *that* shop's PIN as a device-lock layer on top. The
// PIN is per-shop (see backend/lib/pin.ts), so there's no PIN to check until a session is known.
export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/login") {
    return NextResponse.next();
  }

  // Unlike Stage 1's plain shop-cookie presence check, this actually verifies the JWT signature
  // and expiry -- jose's verification is pure crypto, no DB call, so it's fine on the Edge
  // runtime middleware runs on (Prisma itself still isn't reachable here).
  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;
  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (pathname === "/lock") {
    return NextResponse.next();
  }

  const unlocked = request.cookies.get(UNLOCK_COOKIE)?.value === "1";
  if (!unlocked) {
    return NextResponse.redirect(new URL("/lock", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
