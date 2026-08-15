import { NextRequest, NextResponse } from "next/server";

const UNLOCK_COOKIE = "vsg_unlocked";
const SHOP_COOKIE = "vsg_shop";

// Order matters: pick a shop first, then unlock *that* shop's PIN. The PIN is per-shop (see
// backend/lib/pin.ts), so there's no PIN to check until a shop is known.
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/select-shop") {
    return NextResponse.next();
  }

  // Cheap presence check only -- middleware runs on the Edge runtime and shouldn't reach for
  // Prisma. The actual shop list (and validating the cookie's id still exists) lives in the
  // /select-shop Server Component itself.
  if (!request.cookies.get(SHOP_COOKIE)?.value) {
    return NextResponse.redirect(new URL("/select-shop", request.url));
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
