"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Pencil, Trash2, Plus, ListChecks } from "lucide-react";
import type { Movimiento, MovimientoDetalle } from "@/lib/types";
import {
  fetchMovimiento,
  deleteMovimiento,
  fetchDetalles,
  insertDetalle,
  updateDetalle,
  deleteDetalle,
  setUsarDetalles,
  guardarPagadoDerivado,
} from "@/lib/queries";
import { usePeriodo } from "@/lib/periodo-context";
import { sumaDetalles } from "@/lib/calc";
import { formatGuaranies, formatFecha } from "@/lib/format";
import ProgressBar from "./ProgressBar";
import StatusBadge from "./StatusBadge";
import CategoriaBadge from "./CategoriaBadge";
import ConfirmDialog from "./ConfirmDialog";
import BottomSheet from "./BottomSheet";
import DetalleForm, { type DatosDetalle } from "./DetalleForm";
import EmptyState from "./EmptyState";
import Money from "./Money";

type Sheet =
  | { modo: "nuevo" }
  | { modo: "editar"; detalle: MovimientoDetalle }
  | null;

export default function DetalleGasto({ id }: { id: string }) {
  const router = useRouter();
  const { recargarMovimientos } = usePeriodo();

  const [mov, setMov] = useState<Movimiento | null>(null);
  const [detalles, setDetalles] = useState<MovimientoDetalle[]>([]);
  const [estado, setEstado] = useState<"cargando" | "listo" | "no-existe">(
    "cargando",
  );

  const [sheet, setSheet] = useState<Sheet>(null);
  const [confirmarBorrarMov, setConfirmarBorrarMov] = useState(false);
  const [borrandoMov, setBorrandoMov] = useState(false);
  const [borrarDetalleId, setBorrarDetalleId] = useState<string | null>(null);
  const [confirmarActivar, setConfirmarActivar] = useState(false);
  const [confirmarDesactivar, setConfirmarDesactivar] = useState(false);
  const [procesando, setProcesando] = useState(false);

  useEffect(() => {
    let activo = true;
    Promise.all([fetchMovimiento(id), fetchDetalles(id)])
      .then(([m, ds]) => {
        if (!activo) return;
        setMov(m);
        setDetalles(ds);
        setEstado(m ? "listo" : "no-existe");
      })
      .catch(() => activo && setEstado("no-existe"));
    return () => {
      activo = false;
    };
  }, [id]);

  /** Tras cualquier cambio en detalles: si el modo derivado está activo, re-escribe pagado/sobrante. */
  async function sincronizar(movActual: Movimiento) {
    const ds = await fetchDetalles(movActual.id);
    setDetalles(ds);
    if (movActual.usar_detalles) {
      const pagado = sumaDetalles(ds);
      const sobrante = movActual.inicial - pagado;
      await guardarPagadoDerivado(movActual.id, pagado, sobrante);
      setMov({ ...movActual, pagado, sobrante });
      recargarMovimientos();
    }
  }

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

  const sumaActual = sumaDetalles(detalles);

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
            className="rounded-2xl border border-slate-200 bg-white p-2.5"
          >
            <p className="text-[10px] font-medium uppercase tracking-wide text-slate-500">
              {c.label}
            </p>
            <Money
              value={c.value}
              tono={
                c.label === "Disponible" && c.value < 0 ? "negativo" : "neutro"
              }
              className="mt-1 block text-[13px] font-semibold"
            />
          </div>
        ))}
      </div>

      {mov.inicial > 0 && (
        <ProgressBar pagado={mov.pagado} inicial={mov.inicial} className="mt-4" />
      )}

      {/* ===== Gastos detallados ===== */}
      <section className="mt-7">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-500">
            Gastos detallados
          </h2>
          <button
            type="button"
            onClick={() => setSheet({ modo: "nuevo" })}
            className="flex items-center gap-1 text-sm font-medium text-blue-600"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Agregar
          </button>
        </div>

        {mov.usar_detalles ? (
          <p className="mb-2 flex items-center gap-1.5 text-xs text-blue-600">
            <ListChecks className="h-3.5 w-3.5" aria-hidden="true" />
            Pagado se calcula automáticamente desde este detalle.
          </p>
        ) : (
          detalles.length > 0 && (
            <p className="mb-2 text-xs text-slate-400">
              Informativo. El Pagado (
              <Money value={mov.pagado} tono="tenue" className="text-xs" />) se
              edita a mano.
            </p>
          )
        )}

        {detalles.length === 0 ? (
          <EmptyState
            title="No hay gastos detallados todavía"
            hint="Agregá el primero con el botón de arriba."
          />
        ) : (
          <ul className="space-y-2">
            {detalles.map((d) => (
              <li
                key={d.id}
                className="flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-white p-3"
              >
                <div className="min-w-0">
                  <p className="truncate text-sm text-slate-900">{d.concepto}</p>
                  {d.fecha && (
                    <p className="text-xs text-slate-400">
                      {formatFecha(d.fecha)}
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <Money value={d.monto} className="text-sm font-semibold" />
                  <button
                    type="button"
                    aria-label="Editar gasto"
                    onClick={() => setSheet({ modo: "editar", detalle: d })}
                    className="text-slate-400 active:text-blue-600"
                  >
                    <Pencil className="h-4 w-4" aria-hidden="true" />
                  </button>
                  <button
                    type="button"
                    aria-label="Eliminar gasto"
                    onClick={() => setBorrarDetalleId(d.id)}
                    className="text-slate-400 active:text-red-600"
                  >
                    <Trash2 className="h-4 w-4" aria-hidden="true" />
                  </button>
                </div>
              </li>
            ))}
            <li className="flex items-center justify-between px-3 pt-1 text-sm">
              <span className="font-medium text-slate-500">Suma del detalle</span>
              <Money value={sumaActual} className="text-sm font-semibold" />
            </li>
          </ul>
        )}

        {/* Toggle modo derivado */}
        <div className="mt-3">
          {mov.usar_detalles ? (
            <button
              type="button"
              onClick={() => setConfirmarDesactivar(true)}
              className="text-sm font-medium text-slate-500 active:text-slate-700"
            >
              Volver a Pagado manual
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setConfirmarActivar(true)}
              className="text-sm font-medium text-blue-600"
            >
              Usar detalle de gastos para calcular Pagado
            </button>
          )}
        </div>
      </section>

      {/* ===== Acciones del movimiento ===== */}
      <div className="mt-7 flex gap-2">
        <Link
          href={`/editar/${mov.id}`}
          className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white active:bg-blue-700"
        >
          <Pencil className="h-4 w-4" aria-hidden="true" />
          Editar
        </Link>
        <button
          type="button"
          onClick={() => setConfirmarBorrarMov(true)}
          className="flex items-center justify-center gap-2 rounded-xl border border-red-200 px-4 py-3 text-sm font-semibold text-red-600 active:bg-red-50"
        >
          <Trash2 className="h-4 w-4" aria-hidden="true" />
          Eliminar
        </button>
      </div>

      {/* ===== Sheets y diálogos ===== */}
      <BottomSheet
        open={sheet !== null}
        onClose={() => setSheet(null)}
        title={sheet?.modo === "editar" ? "Editar gasto" : "Nuevo gasto"}
      >
        {sheet && (
          <DetalleForm
            inicial={
              sheet.modo === "editar"
                ? {
                    concepto: sheet.detalle.concepto,
                    monto: sheet.detalle.monto,
                    fecha: sheet.detalle.fecha,
                  }
                : undefined
            }
            onCancelar={() => setSheet(null)}
            onGuardar={async (d: DatosDetalle) => {
              if (sheet.modo === "editar") {
                await updateDetalle(sheet.detalle.id, d);
              } else {
                await insertDetalle({ movimiento_id: mov.id, ...d });
              }
              setSheet(null);
              await sincronizar(mov);
            }}
          />
        )}
      </BottomSheet>

      <ConfirmDialog
        open={borrarDetalleId !== null}
        title="¿Eliminar este gasto detallado?"
        confirmLabel="Eliminar"
        loading={procesando}
        onCancel={() => setBorrarDetalleId(null)}
        onConfirm={async () => {
          if (!borrarDetalleId) return;
          setProcesando(true);
          try {
            await deleteDetalle(borrarDetalleId);
            setBorrarDetalleId(null);
            await sincronizar(mov);
          } finally {
            setProcesando(false);
          }
        }}
      />

      <ConfirmDialog
        open={confirmarActivar}
        tone="primary"
        title="Usar detalle de gastos"
        description={
          <>
            Este movimiento registra{" "}
            <strong>{formatGuaranies(mov.pagado)}</strong> como pagado. Al
            activar el detalle, el Pagado pasará a calcularse desde los gastos
            detallados, que hoy suman{" "}
            <strong>{formatGuaranies(sumaActual)}</strong>.
          </>
        }
        confirmLabel="Activar detalle"
        loading={procesando}
        onCancel={() => setConfirmarActivar(false)}
        onConfirm={async () => {
          setProcesando(true);
          try {
            const pagado = sumaActual;
            const sobrante = mov.inicial - pagado;
            await setUsarDetalles(mov.id, true, pagado, sobrante);
            setMov({ ...mov, usar_detalles: true, pagado, sobrante });
            setConfirmarActivar(false);
            recargarMovimientos();
          } finally {
            setProcesando(false);
          }
        }}
      />

      <ConfirmDialog
        open={confirmarDesactivar}
        tone="primary"
        title="Volver a Pagado manual"
        description={
          <>
            El Pagado quedará en{" "}
            <strong>{formatGuaranies(mov.pagado)}</strong> y vas a poder
            editarlo a mano de nuevo. El detalle se conserva como informativo.
          </>
        }
        confirmLabel="Desactivar"
        loading={procesando}
        onCancel={() => setConfirmarDesactivar(false)}
        onConfirm={async () => {
          setProcesando(true);
          try {
            await setUsarDetalles(mov.id, false, mov.pagado, mov.sobrante);
            setMov({ ...mov, usar_detalles: false });
            setConfirmarDesactivar(false);
            recargarMovimientos();
          } finally {
            setProcesando(false);
          }
        }}
      />

      <ConfirmDialog
        open={confirmarBorrarMov}
        title="¿Eliminar este gasto?"
        description={`${mov.razon} · ${mov.concepto}${
          detalles.length > 0
            ? ` — también borra sus ${detalles.length} gasto(s) detallado(s)`
            : ""
        }`}
        confirmLabel="Eliminar"
        loading={borrandoMov}
        onCancel={() => setConfirmarBorrarMov(false)}
        onConfirm={async () => {
          setBorrandoMov(true);
          try {
            await deleteMovimiento(mov.id);
            await recargarMovimientos();
            router.push("/gastos");
          } catch {
            setBorrandoMov(false);
          }
        }}
      />
    </div>
  );
}
