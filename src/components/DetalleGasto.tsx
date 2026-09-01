"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2 } from "lucide-react";
import type { Movimiento } from "@/lib/types";
import { fetchMovimiento, deleteMovimiento } from "@/lib/queries";
import { usePeriodo } from "@/lib/periodo-context";
import { formatGuaranies, formatFecha } from "@/lib/format";
import ProgressBar from "./ProgressBar";
import StatusBadge from "./StatusBadge";
import CategoriaBadge from "./CategoriaBadge";
import ConfirmDialog from "./ConfirmDialog";

export default function DetalleGasto({ id }: { id: string }) {
  const router = useRouter();
  const { recargarMovimientos } = usePeriodo();
  const [mov, setMov] = useState<Movimiento | null>(null);
  const [estado, setEstado] = useState<"cargando" | "listo" | "no-existe">(
    "cargando",
  );
  const [confirmar, setConfirmar] = useState(false);
  const [borrando, setBorrando] = useState(false);

  useEffect(() => {
    let activo = true;
    fetchMovimiento(id)
      .then((m) => {
        if (!activo) return;
        setMov(m);
        setEstado(m ? "listo" : "no-existe");
      })
      .catch(() => activo && setEstado("no-existe"));
    return () => {
      activo = false;
    };
  }, [id]);

  if (estado === "cargando") {
    return (
      <div className="mt-10 flex justify-center">
        <div
          className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600"
          aria-label="Cargando"
        />
      </div>
    );
  }

  if (estado === "no-existe" || !mov) {
    return (
      <div className="space-y-3">
        <p className="text-sm text-red-600">Ese gasto no existe.</p>
        <Link href="/gastos" className="text-sm font-medium text-blue-600">
          Volver a Gastos
        </Link>
      </div>
    );
  }

  return (
    <div>
      <header className="mb-5 flex items-center gap-2">
        <Link
          href="/gastos"
          aria-label="Volver a Gastos"
          className="-ml-1 rounded-lg p-1 text-slate-500 active:bg-slate-100"
        >
          <ArrowLeft className="h-6 w-6" aria-hidden="true" />
        </Link>
        <div className="min-w-0">
          <h1 className="truncate text-xl font-bold tracking-tight text-slate-900">
            {mov.razon}
          </h1>
          <p className="truncate text-sm text-slate-500">{mov.concepto}</p>
        </div>
      </header>

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <CategoriaBadge categoria={mov.categoria} />
        <StatusBadge mov={mov} />
        <span className="text-xs text-slate-400">
          {mov.subcategoria}
          {mov.fecha ? ` · ${formatFecha(mov.fecha)}` : ""}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { label: "Presupuesto", value: mov.inicial },
          { label: "Gastado", value: mov.pagado },
          { label: "Disponible", value: mov.sobrante },
        ].map((c) => (
          <div
            key={c.label}
            className="rounded-2xl border border-slate-200 bg-white p-3"
          >
            <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
              {c.label}
            </p>
            <p
              className={`mt-1 text-sm font-semibold tabular-nums ${
                c.label === "Disponible" && c.value < 0
                  ? "text-red-600"
                  : "text-slate-900"
              }`}
            >
              {formatGuaranies(c.value)}
            </p>
          </div>
        ))}
      </div>

      {mov.inicial > 0 && (
        <ProgressBar
          pagado={mov.pagado}
          inicial={mov.inicial}
          className="mt-4"
        />
      )}

      <div className="mt-6 flex gap-2">
        <Link
          href={`/editar/${mov.id}`}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white active:bg-blue-700"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Editar
        </Link>
        <button
          type="button"
          onClick={() => setConfirmar(true)}
          className="flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 active:bg-red-50"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Eliminar
        </button>
      </div>

      <ConfirmDialog
        open={confirmar}
        title="¿Eliminar este gasto?"
        description={`${mov.razon} · ${mov.concepto}`}
        confirmLabel="Eliminar"
        loading={borrando}
        onCancel={() => setConfirmar(false)}
        onConfirm={async () => {
          setBorrando(true);
          try {
            await deleteMovimiento(mov.id);
            await recargarMovimientos();
            router.push("/gastos");
          } catch {
            setBorrando(false);
          }
        }}
      />
    </div>
  );
}
