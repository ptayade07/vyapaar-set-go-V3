import { NextRequest, NextResponse } from "next/server";

const UNLOCK_COOKIE = "vsg_unlocked";

export function middleware(request: NextRequest) {
  if (request.nextUrl.pathname === "/lock") {
    return NextResponse.next();
  }

  const unlocked = request.cookies.get(UNLOCK_COOKIE)?.value === "1";
  if (unlocked) {
    return NextResponse.next();
  }

  const lockUrl = new URL("/lock", request.url);
  return NextResponse.redirect(lockUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
