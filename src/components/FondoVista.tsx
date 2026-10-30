"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, Plus, Pencil, Trash2 } from "lucide-react";
import type { FondoMovimiento, TipoFondo } from "@/lib/types";
import {
  fetchFondoMovimientos,
  insertFondoMovimiento,
  updateFondoMovimiento,
  deleteFondoMovimiento,
} from "@/lib/queries";
import { resumenFondo } from "@/lib/calc";
import { formatFecha, hoyISO, parseMonto } from "@/lib/format";
import PageHeader from "./PageHeader";
import Money from "./Money";
import BottomSheet from "./BottomSheet";
import ConfirmDialog from "./ConfirmDialog";
import EmptyState from "./EmptyState";
import MontoInput from "./MontoInput";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600";

interface Datos {
  tipo: TipoFondo;
  concepto: string;
  monto: number;
  fecha: string;
}

function MovimientoFondoForm({
  inicial,
  onGuardar,
  onCancelar,
}: {
  inicial?: FondoMovimiento;
  onGuardar: (d: Datos) => Promise<void>;
  onCancelar: () => void;
}) {
  const [tipo, setTipo] = useState<TipoFondo>(inicial?.tipo ?? "gasto");
  const [concepto, setConcepto] = useState(inicial?.concepto ?? "");
  const [monto, setMonto] = useState(
    inicial?.monto != null ? String(inicial.monto) : "",
  );
  const [fecha, setFecha] = useState(inicial?.fecha ?? hoyISO());
  const [g, setG] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!concepto.trim()) return setErr("El concepto es obligatorio.");
        if (parseMonto(monto) <= 0) return setErr("Ingresá un monto mayor a 0.");
        if (!fecha) return setErr("La fecha es obligatoria.");
        setG(true);
        try {
          await onGuardar({
            tipo,
            concepto: concepto.trim(),
            monto: parseMonto(monto),
            fecha,
          });
        } catch {
          setErr("No se pudo guardar.");
          setG(false);
        }
      }}
      className="space-y-3"
    >
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-slate-100 p-1">
        {(
          [
            { key: "gasto", label: "Gasto (−)" },
            { key: "aporte", label: "Aporte (+)" },
          ] as const
        ).map((o) => (
          <button
            key={o.key}
            type="button"
            onClick={() => setTipo(o.key)}
            className={`rounded-lg py-2 text-sm font-semibold ${
              tipo === o.key
                ? "bg-white text-slate-900 shadow-sm"
                : "text-slate-500"
            }`}
          >
            {o.label}
          </button>
        ))}
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Concepto
        </label>
        <input
          className={inputClass}
          value={concepto}
          onChange={(e) => setConcepto(e.target.value)}
          placeholder={tipo === "gasto" ? "Farmacia" : "Transferencia al fondo"}
          autoFocus
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Monto
        </label>
        <MontoInput value={monto} onChange={setMonto} placeholder="0" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Fecha
        </label>
        <input
          type="date"
          className={inputClass}
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={g}
          className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white active:bg-blue-700 disabled:opacity-60"
        >
          {g ? "Guardando…" : "Guardar"}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default function FondoVista({
  selector,
}: {
  selector?: React.ReactNode;
}) {
  const [movs, setMovs] = useState<FondoMovimiento[]>([]);
  const [estado, setEstado] = useState<"cargando" | "listo" | "error">(
    "cargando",
  );
  const [sheet, setSheet] = useState<
    { modo: "nuevo" } | { modo: "editar"; m: FondoMovimiento } | null
  >(null);
  const [borrar, setBorrar] = useState<FondoMovimiento | null>(null);
  const [proc, setProc] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setMovs(await fetchFondoMovimientos());
      setEstado("listo");
    } catch {
      setEstado("error");
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const r = useMemo(() => resumenFondo(movs), [movs]);

  return (
    <div>
      <PageHeader
        title="Ahorros"
        subtitle="Fondo de emergencia"
        right={
          <button
            type="button"
            onClick={() => setSheet({ modo: "nuevo" })}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm font-medium text-blue-600"
          >
            <Plus className="h-4 w-4" aria-hidden="true" />
            Agregar
          </button>
        }
      />

      {selector}

      {estado === "error" && (
        <p className="text-sm text-red-600">
          No se pudo cargar el fondo de emergencia.
        </p>
      )}

      {estado === "listo" && (
        <div className="mb-4 space-y-2">
          <div className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
              Te queda en el fondo
            </p>
            <Money
              value={r.saldo}
              tono={r.saldo < 0 ? "negativo" : "neutro"}
              className="mt-1 block text-2xl font-bold"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Aportado
              </p>
              <Money
                value={r.aportado}
                tono="positivo"
                className="mt-0.5 block text-base font-semibold"
              />
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-3">
              <p className="text-[11px] font-medium uppercase tracking-wide text-slate-500">
                Gastado
              </p>
              <Money
                value={r.gastado}
                className="mt-0.5 block text-base font-semibold"
              />
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        {estado === "listo" && movs.length === 0 && (
          <EmptyState
            title="El fondo está vacío"
            hint="Tocá Agregar y registrá primero un aporte (lo que transferiste)."
          />
        )}

        {movs.map((m) => (
          <div
            key={m.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${
                  m.tipo === "aporte"
                    ? "bg-green-50 text-green-600"
                    : "bg-slate-100 text-slate-600"
                }`}
              >
                {m.tipo === "aporte" ? (
                  <ArrowDownLeft className="h-4 w-4" aria-hidden="true" />
                ) : (
                  <ArrowUpRight className="h-4 w-4" aria-hidden="true" />
                )}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {m.concepto}
                </p>
                <p className="text-xs text-slate-400">{formatFecha(m.fecha)}</p>
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <span className="mr-1 text-sm font-semibold">
                <span
                  className={
                    m.tipo === "aporte" ? "text-green-600" : "text-slate-900"
                  }
                >
                  {m.tipo === "aporte" ? "+" : "−"}
                </span>
                <Money
                  value={m.monto}
                  tono={m.tipo === "aporte" ? "positivo" : "neutro"}
                  className="font-semibold"
                />
              </span>
              <button
                type="button"
                aria-label="Editar"
                onClick={() => setSheet({ modo: "editar", m })}
                className="rounded-lg p-2 text-slate-400 active:bg-slate-100 active:text-blue-600"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Eliminar"
                onClick={() => setBorrar(m)}
                className="rounded-lg p-2 text-slate-400 active:bg-red-50 active:text-red-600"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
      </div>

      <BottomSheet
        open={sheet !== null}
        onClose={() => setSheet(null)}
        title={sheet?.modo === "editar" ? "Editar movimiento" : "Nuevo movimiento"}
      >
        {sheet && (
          <MovimientoFondoForm
            inicial={sheet.modo === "editar" ? sheet.m : undefined}
            onCancelar={() => setSheet(null)}
            onGuardar={async (datos) => {
              if (sheet.modo === "editar") {
                await updateFondoMovimiento(sheet.m.id, datos);
              } else {
                await insertFondoMovimiento(datos);
              }
              setSheet(null);
              await cargar();
            }}
          />
        )}
      </BottomSheet>

      <ConfirmDialog
        open={borrar !== null}
        title="¿Eliminar este movimiento?"
        description={
          borrar
            ? `${borrar.concepto} — esto cambia lo que te queda en el fondo.`
            : undefined
        }
        confirmLabel="Eliminar"
        loading={proc}
        onCancel={() => setBorrar(null)}
        onConfirm={async () => {
          if (!borrar) return;
          setProc(true);
          try {
            await deleteFondoMovimiento(borrar.id);
            setBorrar(null);
            await cargar();
          } finally {
            setProc(false);
          }
        }}
      />
    </div>
  );
}
