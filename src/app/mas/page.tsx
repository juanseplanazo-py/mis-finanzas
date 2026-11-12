import Link from "next/link";
import { ChevronRight, CreditCard, HandCoins } from "lucide-react";
import PageHeader from "@/components/PageHeader";

const secciones = [
  {
    href: "/tarjetas",
    icon: CreditCard,
    titulo: "Tarjetas de crédito",
    sub: "Deuda, línea disponible y conceptos",
  },
  {
    href: "/me-deben",
    icon: HandCoins,
    titulo: "Me deben · Yo debo",
    sub: "Plata que te deben y plata que debés",
  },
];

export default function MasPage() {
  return (
    <main>
      <PageHeader title="Más" />
      <ul className="space-y-2">
        {secciones.map(({ href, icon: Icon, titulo, sub }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 active:bg-slate-50"
            >
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <Icon className="h-5 w-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-slate-900">
                  {titulo}
                </span>
                <span className="block text-xs text-slate-500">{sub}</span>
              </span>
              <ChevronRight
                className="h-4 w-4 shrink-0 text-slate-400"
                aria-hidden="true"
              />
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
