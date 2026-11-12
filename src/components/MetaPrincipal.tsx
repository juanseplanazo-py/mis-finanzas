"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ChevronRight, Target } from "lucide-react";
import { fetchMetasConProgreso } from "@/lib/metas-data";
import type { MetaConProgreso } from "@/lib/analisis";
import Money from "./Money";

/** Una sola línea en Inicio con el avance de la meta principal (la más antigua). */
export default function MetaPrincipal() {
  const [meta, setMeta] = useState<MetaConProgreso | null>(null);

  useEffect(() => {
    let activo = true;
    fetchMetasConProgreso()
      .then((m) => activo && setMeta(m[0] ?? null))
      .catch(() => {});
    return () => {
      activo = false;
    };
  }, []);

  if (!meta) return null;

  return (
    <Link
      href="/ahorros?vista=metas"
      className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-4 active:bg-slate-50"
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
        <Target className="h-5 w-5" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-semibold text-slate-900">
            {meta.meta.nombre}
          </span>
          <span className="shrink-0 text-sm font-semibold text-slate-900">
            {Math.round(meta.pct)}%
          </span>
        </span>
        <span className="mt-1.5 block h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
          <span
            className="block h-full rounded-full bg-blue-600"
            style={{ width: `${Math.min(Math.max(meta.pct, 0), 100)}%` }}
          />
        </span>
        <span className="mt-1 block text-xs text-slate-500">
          {meta.actual === null ? (
            "Cuenta vinculada no encontrada"
          ) : (
            <>
              <Money value={meta.actual} tono="tenue" className="text-xs" /> de{" "}
              <Money value={meta.meta.monto_meta} tono="tenue" className="text-xs" />
            </>
          )}
        </span>
      </span>
      <ChevronRight className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />
    </Link>
  );
}
