"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Receipt,
  CreditCard,
  PiggyBank,
  HandCoins,
  type LucideIcon,
} from "lucide-react";

const items: { href: string; label: string; icon: LucideIcon }[] = [
  { href: "/", label: "Inicio", icon: Home },
  { href: "/gastos", label: "Gastos", icon: Receipt },
  { href: "/tarjetas", label: "Tarjetas", icon: CreditCard },
  { href: "/ahorros", label: "Ahorros", icon: PiggyBank },
  { href: "/me-deben", label: "Me deben", icon: HandCoins },
];

function esActiva(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-20 border-t border-slate-200 bg-white pb-[env(safe-area-inset-bottom)]">
      <ul className="mx-auto flex w-full max-w-2xl">
        {items.map(({ href, label, icon: Icon }) => {
          const activa = esActiva(pathname, href);
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                aria-current={activa ? "page" : undefined}
                className={`flex min-h-[56px] flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium leading-none whitespace-nowrap ${
                  activa ? "text-blue-600" : "text-slate-400"
                }`}
              >
                <Icon
                  className="h-5 w-5"
                  strokeWidth={activa ? 2.4 : 2}
                  aria-hidden="true"
                />
                {label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
