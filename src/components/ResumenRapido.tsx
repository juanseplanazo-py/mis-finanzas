"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, PiggyBank, CreditCard, HandCoins } from "lucide-react";
import {
  fetchAhorros,
  fetchTarjetas,
  fetchTarjetaMovimientos,
  fetchDeudas,
} from "@/lib/queries";
import { totalAhorros, totalMeDeben, deudaTarjeta } from "@/lib/calc";
import Money from "./Money";

interface Totales {
  ahorros: number;
  deudaTarjetas: number;
  meDeben: number;
}

/** 3 tarjetas de acceso rápido en Inicio: Ahorros, Tarjetas, Me deben. */
export default function ResumenRapido() {
  const [t, setT] = useState<Totales | null>(null);

  useEffect(() => {
    let activo = true;
    Promise.all([
      fetchAhorros(),
      fetchTarjetas(),
      fetchTarjetaMovimientos(),
      fetchDeudas(),
    ])
      .then(([ahorros, tarjetas, tmovs, deudas]) => {
        if (!activo) return;
        const deudaTarjetas = tarjetas.reduce(
          (acc, tar) =>
            acc + deudaTarjeta(tmovs.filter((m) => m.tarjeta_id === tar.id)),
          0,
        );
        setT({
          ahorros: totalAhorros(ahorros),
          deudaTarjetas,
          meDeben: totalMeDeben(deudas),
        });
      })
      .catch(() => activo && setT({ ahorros: 0, deudaTarjetas: 0, meDeben: 0 }));
    return () => {
      activo = false;
    };
  }, []);

  const filas = [
    {
      href: "/ahorros",
      icon: PiggyBank,
      label: "Ahorros",
      valor: t?.ahorros ?? null,
      sub: "Total acumulado",
    },
    {
      href: "/tarjetas",
      icon: CreditCard,
      label: "Tarjetas",
      valor: t?.deudaTarjetas ?? null,
      sub: "Deuda total",
    },
    {
      href: "/me-deben",
      icon: HandCoins,
      label: "Me deben",
      valor: t?.meDeben ?? null,
      sub: "Pendiente",
    },
  ];

  return (
    <ul className="space-y-2">
      {filas.map(({ href, icon: Icon, label, valor, sub }) => (
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
                {label}
              </span>
              <span className="block text-xs text-slate-500">{sub}</span>
            </span>
            <span className="text-right">
              {valor === null ? (
                <span className="block font-semibold text-slate-400">—</span>
              ) : (
                <Money value={valor} className="block font-semibold" />
              )}
            </span>
            <ChevronRight
              className="h-4 w-4 shrink-0 text-slate-400"
              aria-hidden="true"
            />
          </Link>
        </li>
      ))}
    </ul>
  );
}
