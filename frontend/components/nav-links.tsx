"use client";

import { Calculator, Home, Package, StickyNote, Truck, Users } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLang } from "@/frontend/lib/i18n";

const navItems = [
  { href: "/", labelHi: "Dashboard", labelEn: "Dashboard", icon: Home },
  { href: "/customers", labelHi: "Grahak", labelEn: "Customers", icon: Users },
  { href: "/suppliers", labelHi: "Supplier", labelEn: "Suppliers", icon: Truck },
  { href: "/inventory", labelHi: "Saman", labelEn: "Inventory", icon: Package },
  { href: "/notes", labelHi: "Notes", labelEn: "Notes", icon: StickyNote },
  { href: "/hisaab", labelHi: "Hisaab", labelEn: "Daily Report", icon: Calculator },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SidebarNavLinks() {
  const pathname = usePathname();
  const { lang } = useLang();

  return (
    <>
      {navItems.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 rounded-xl px-4 py-3 text-base font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 ${
              active ? "bg-orange-50 text-orange-700" : "text-gray-700 hover:bg-orange-50/60"
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span className="flex flex-col leading-tight">
              <span>{lang === "en" ? item.labelEn : item.labelHi}</span>
              {lang !== "en" ? <span className="text-[10px] font-normal text-gray-400">{item.labelEn}</span> : null}
            </span>
          </Link>
        );
      })}
    </>
  );
}

export function MobileNavLinks() {
  const pathname = usePathname();
  const { lang } = useLang();

  return (
    <>
      {navItems.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`tap-target flex flex-col items-center justify-center gap-1 py-2 text-[10px] font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-orange-600 ${
              active ? "text-orange-700" : "text-gray-500"
            }`}
          >
            <item.icon className="h-5 w-5" />
            {lang === "en" ? item.labelEn : item.labelHi}
          </Link>
        );
      })}
    </>
  );
}
