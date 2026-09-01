"use client";

import Link from "next/link";
import {
  Receipt,
  ListChecks,
  PiggyBank,
  CreditCard,
  HandCoins,
  type LucideIcon,
} from "lucide-react";

const opciones: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Nuevo movimiento", href: "/nuevo", icon: Receipt },
  { label: "Nuevo gasto detallado", href: "/nuevo?detalle=1", icon: ListChecks },
  { label: "Nuevo ahorro", href: "/ahorros?nuevo=1", icon: PiggyBank },
  { label: "Nueva tarjeta", href: "/tarjetas?nueva=1", icon: CreditCard },
  { label: 'Nuevo "Me deben"', href: "/me-deben?nuevo=1", icon: HandCoins },
];

export default function AddMenu({ onNavigate }: { onNavigate: () => void }) {
  return (
    <ul className="space-y-1">
      {opciones.map(({ label, href, icon: Icon }) => (
        <li key={href}>
          <Link
            href={href}
            onClick={onNavigate}
            className="flex items-center gap-3 rounded-xl px-3 py-3 text-base text-slate-900 active:bg-slate-100"
          >
            <Icon className="h-5 w-5 text-blue-600" aria-hidden="true" />
            {label}
          </Link>
        </li>
      ))}
    </ul>
  );
}
