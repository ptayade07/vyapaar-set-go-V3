import { Lock } from "lucide-react";
import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, Work_Sans } from "next/font/google";
import Link from "next/link";
import { lockAction } from "@/app/actions";
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

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/customers", label: "Khata" },
  { href: "/suppliers", label: "Suppliers" },
  { href: "/inventory", label: "Inventory" },
  { href: "/notes", label: "Notes" },
  { href: "/hisaab", label: "Hisaab" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN" className={`${workSans.variable} ${ibmPlexMono.variable}`}>
      <body>
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-24 pt-4 sm:px-6 lg:px-8">
          <header className="sticky top-0 z-20 -mx-4 border-b border-orange-100 bg-white/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
              <Link href="/" className="flex min-w-0 items-center gap-3">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-600 text-lg font-bold text-white">
                  व
                </span>
                <span className="min-w-0">
                  <p className="truncate text-xl font-black leading-tight text-gray-900">Vyapaar Set Go</p>
                  <p className="text-xs font-semibold text-gray-500">Digital bahi-khata</p>
                </span>
              </Link>
              <nav aria-label="Main navigation" className="hidden items-center gap-1 md:flex">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-xl px-4 py-3 text-sm font-bold text-gray-700 hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-600"
                  >
                    {item.label}
                  </Link>
                ))}
                <form action={lockAction}>
                  <button
                    type="submit"
                    aria-label="Lock app"
                    className="tap-target flex items-center justify-center rounded-xl px-3 text-gray-500 hover:bg-orange-50 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-orange-600"
                  >
                    <Lock className="h-4 w-4" />
                  </button>
                </form>
              </nav>
            </div>
          </header>
          <main className="flex-1 py-5">{children}</main>
          <nav
            aria-label="Mobile navigation"
            className="fixed inset-x-0 bottom-0 z-30 border-t border-orange-100 bg-white px-1 py-2 shadow-[0_-8px_30px_rgba(31,39,31,0.08)] md:hidden"
          >
            <div className="mx-auto grid max-w-md grid-cols-6 gap-0.5">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="tap-target flex items-center justify-center rounded-xl px-1 py-2 text-center text-[11px] font-black leading-tight text-gray-700 hover:bg-orange-50 focus:outline-none focus:ring-2 focus:ring-orange-600"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </nav>
        </div>
      </body>
    </html>
  );
}
