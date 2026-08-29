import { Lock, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { lockAction } from "@/backend/actions/actions";
import { logoutAction } from "@/backend/actions/auth-actions";
import { SidebarLangToggle, MobileLangToggle } from "@/frontend/components/lang-toggle";
import { MobileNavLinks, SidebarNavLinks } from "@/frontend/components/nav-links";
import { LangProvider } from "@/frontend/lib/i18n";

// The sidebar/nav shell and LangProvider only belong here, not in the root layout -- /login,
// /signup, /lock, /terms, and /privacy render standalone, with nothing to navigate to yet and no
// i18n toggle in any of them.
export default function AppLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <LangProvider>
      <div className="flex min-h-screen">
        {/* Sidebar — desktop */}
        <aside className="sticky top-0 hidden h-screen md:flex md:w-64 md:flex-col md:border-r md:border-orange-100 md:bg-white">
          <div className="border-b border-orange-100 px-6 py-6">
            <Link href="/" className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-600 text-xl font-bold text-white">
                व
              </span>
              <span>
                <span className="block text-lg font-bold leading-tight text-gray-900">Vyapaar</span>
                <span className="block text-xs leading-tight text-gray-500">Set Go</span>
              </span>
            </Link>
          </div>
          <nav aria-label="Main navigation" className="flex-1 space-y-1 px-3 py-4">
            <SidebarNavLinks />
          </nav>
          <div className="space-y-2 border-t border-orange-100 p-3">
            <SidebarLangToggle />
            <Link
              href="/settings"
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
            <form action={lockAction}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
              >
                <Lock className="h-4 w-4" />
                Lock karo
              </button>
            </form>
            <form action={logoutAction}>
              <button
                type="submit"
                className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-orange-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </form>
          </div>
        </aside>

        {/* Main */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Top bar — mobile */}
          <div className="sticky top-0 z-30 flex items-center justify-between border-b border-orange-100 bg-white px-4 py-3 md:hidden">
            <Link href="/" className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-orange-600 text-sm font-bold text-white">
                व
              </span>
              <span className="font-bold text-gray-900">Vyapaar Set Go</span>
            </Link>
            <div className="flex items-center gap-1">
              <MobileLangToggle />
              <Link
                href="/settings"
                aria-label="Settings"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-gray-500 hover:bg-orange-50 hover:text-orange-700"
              >
                <Settings className="h-5 w-5" />
              </Link>
            </div>
          </div>

          <main className="flex-1 px-4 py-6 pb-24 sm:px-8 md:pb-8">{children}</main>

          {/* Bottom nav — mobile */}
          <nav
            aria-label="Mobile navigation"
            className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-6 border-t border-orange-100 bg-white md:hidden"
          >
            <MobileNavLinks />
          </nav>
        </div>
      </div>
    </LangProvider>
  );
}
