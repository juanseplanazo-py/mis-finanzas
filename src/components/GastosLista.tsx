"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Search, ChevronRight } from "lucide-react";
import type { Movimiento } from "@/lib/types";
import { formatGuaranies, formatFecha } from "@/lib/format";
import { StatusDot } from "./StatusBadge";
import ProgressBar from "./ProgressBar";
import EmptyState from "./EmptyState";

type Filtro = "todos" | "Fijo" | "Variable" | "Ahorro" | "Deuda";

const chips: { key: Filtro; label: string }[] = [
  { key: "todos", label: "Todos" },
  { key: "Fijo", label: "Fijos" },
  { key: "Variable", label: "Variables" },
  { key: "Ahorro", label: "Ahorro" },
  { key: "Deuda", label: "Deuda" },
];

// Orden de las secciones por categoría.
const ordenCategorias = ["Fijo", "Variable", "Ahorro", "Deuda"];

function coincide(m: Movimiento, q: string): boolean {
  if (!q) return true;
  const t = q.toLowerCase();
  return (
    m.razon.toLowerCase().includes(t) ||
    m.concepto.toLowerCase().includes(t) ||
    m.categoria.toLowerCase().includes(t) ||
    m.subcategoria.toLowerCase().includes(t)
  );
}

function GastoItem({ m }: { m: Movimiento }) {
  return (
    <Link
      href={`/gastos/${m.id}`}
      className="block rounded-2xl border border-slate-200 bg-white p-4 active:bg-slate-50"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <StatusDot mov={m} />
            {m.razon}
          </p>
          <p className="truncate text-sm text-slate-500">{m.concepto}</p>
          <p className="mt-0.5 text-xs text-slate-400">
            {m.subcategoria}
            {m.fecha ? ` · ${formatFecha(m.fecha)}` : ""}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <div className="text-right text-sm">
            <p className="text-xs text-slate-400">Sobrante</p>
            <p
              className={`font-semibold tabular-nums ${
                m.sobrante < 0 ? "text-red-600" : "text-slate-900"
              }`}
            >
              {formatGuaranies(m.sobrante)}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-slate-300" aria-hidden="true" />
        </div>
      </div>

      {m.inicial > 0 ? (
        <ProgressBar pagado={m.pagado} inicial={m.inicial} className="mt-3" />
      ) : (
        <p className="mt-2 text-xs text-slate-400">
          Sin presupuesto · Pagado {formatGuaranies(m.pagado)}
        </p>
      )}
    </Link>
  );
}

export default function GastosLista({
  movimientos,
}: {
  movimientos: Movimiento[];
}) {
  const [q, setQ] = useState("");
  const [filtro, setFiltro] = useState<Filtro>("todos");

  const grupos = useMemo(() => {
    const filtrados = movimientos.filter(
      (m) =>
        coincide(m, q) && (filtro === "todos" || m.categoria === filtro),
    );

    const porCat = new Map<string, Movimiento[]>();
    for (const m of filtrados) {
      const arr = porCat.get(m.categoria) ?? [];
      arr.push(m);
      porCat.set(m.categoria, arr);
    }

    const claves = [...porCat.keys()].sort((a, b) => {
      const ia = ordenCategorias.indexOf(a);
      const ib = ordenCategorias.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    });

    return claves.map((cat) => {
      const items = porCat.get(cat)!;
      return {
        cat,
        items,
        presupuestado: items.reduce((s, m) => s + m.inicial, 0),
      };
    });
  }, [movimientos, q, filtro]);

  const total = grupos.reduce((s, g) => s + g.items.length, 0);

  return (
    <div className="space-y-4">
      {/* Buscador */}
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
          aria-hidden="true"
        />
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Buscar por razón, concepto, categoría…"
          className="w-full rounded-xl border border-slate-300 bg-white py-2.5 pl-9 pr-3 text-sm text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
        />
      </div>

      {/* Chips */}
      <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1">
        {chips.map((c) => (
          <button
            key={c.key}
            type="button"
            onClick={() => setFiltro(c.key)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium ${
              filtro === c.key
                ? "bg-blue-600 text-white"
                : "bg-white text-slate-600 ring-1 ring-slate-200"
            }`}
          >
            {c.label}
          </button>
        ))}
      </div>

      {total === 0 ? (
        <EmptyState
          title={
            q || filtro !== "todos"
              ? "Sin resultados"
              : "Este período no tiene gastos"
          }
          hint={
            q || filtro !== "todos"
              ? "Probá con otro texto o filtro."
              : "Tocá + para agregar el primero."
          }
        />
      ) : (
        grupos.map((g) => (
          <section key={g.cat}>
            <div className="mb-2 flex items-baseline justify-between px-1">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
                {g.cat} · {g.items.length}
              </h2>
              <span className="text-xs text-slate-400 tabular-nums">
                {formatGuaranies(g.presupuestado)}
              </span>
            </div>
            <ul className="space-y-2">
              {g.items.map((m) => (
                <li key={m.id}>
                  <GastoItem m={m} />
                </li>
              ))}
            </ul>
          </section>
        ))
      )}
    </div>
  );
}
