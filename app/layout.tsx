import { LogOut } from "lucide-react";
import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Work_Sans } from "next/font/google";
import Link from "next/link";
import { lockAction } from "@/backend/actions/actions";
import { MobileNavLinks, SidebarNavLinks } from "@/frontend/components/nav-links";
import "./globals.css";

const workSans = Work_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-work-sans",
});

const ibmPlexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-ibm-plex-mono",
});

export const metadata: Metadata = {
  title: "Vyapaar Set Go",
  description: "Simple digital khata and shop hisaab for Indian small businesses.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#faf8f5",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN" className={`${workSans.variable} ${ibmPlexMono.variable}`}>
      <body>
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
            <div className="border-t border-orange-100 p-3">
              <form action={lockAction}>
                <button
                  type="submit"
                  className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-600"
                >
                  <LogOut className="h-4 w-4" />
                  Lock karo
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
      </body>
    </html>
  );
}
