import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vyapaar Set Go",
  description: "Simple digital khata and shop hisaab for Indian small businesses.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#fff7df",
};

const navItems = [
  { href: "/", label: "Dashboard" },
  { href: "/customers", label: "Khata" },
  { href: "/suppliers", label: "Suppliers" },
  { href: "/inventory", label: "Inventory" },
  { href: "/hisaab", label: "Hisaab" },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en-IN">
      <body>
        <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-24 pt-4 sm:px-6 lg:px-8">
          <header className="sticky top-0 z-20 -mx-4 border-b border-amber-200/70 bg-[#fffdf7]/95 px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
            <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
              <Link href="/" className="min-w-0">
                <p className="text-xl font-black leading-tight text-[#1f271f]">Vyapaar Set Go</p>
                <p className="text-xs font-semibold text-[#6f6a60]">Digital bahi-khata</p>
              </Link>
              <nav aria-label="Main navigation" className="hidden items-center gap-2 md:flex">
                {navItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className="rounded-md px-4 py-3 text-sm font-bold text-[#384238] hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-[#16803c]"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
            </div>
          </header>
          <main className="flex-1 py-5">{children}</main>
          <nav
            aria-label="Mobile navigation"
            className="fixed inset-x-0 bottom-0 z-30 border-t border-amber-200 bg-[#fffdf7] px-2 py-2 shadow-[0_-8px_30px_rgba(31,39,31,0.08)] md:hidden"
          >
            <div className="mx-auto grid max-w-md grid-cols-5 gap-1">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="tap-target rounded-md px-2 py-2 text-center text-xs font-black text-[#384238] hover:bg-amber-100 focus:outline-none focus:ring-2 focus:ring-[#16803c]"
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
