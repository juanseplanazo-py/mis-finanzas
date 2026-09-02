"use client";

import { useCallback, useEffect, useState } from "react";
import { HandCoins, Plus, Pencil, Trash2 } from "lucide-react";
import type { DeudaAFavor, EstadoDeuda } from "@/lib/types";
import {
  fetchDeudas,
  insertDeuda,
  updateDeuda,
  deleteDeuda,
} from "@/lib/queries";
import { totalMeDeben } from "@/lib/calc";
import { formatGuaranies, parseMonto } from "@/lib/format";
import PageHeader from "./PageHeader";
import BottomSheet from "./BottomSheet";
import ConfirmDialog from "./ConfirmDialog";
import EmptyState from "./EmptyState";
import MontoInput from "./MontoInput";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600";

interface Datos {
  persona: string;
  concepto: string;
  monto: number;
  estado: EstadoDeuda;
}

function DeudaForm({
  inicial,
  onGuardar,
  onCancelar,
}: {
  inicial?: Partial<DeudaAFavor>;
  onGuardar: (d: Datos) => Promise<void>;
  onCancelar: () => void;
}) {
  const [persona, setPersona] = useState(inicial?.persona ?? "");
  const [concepto, setConcepto] = useState(inicial?.concepto ?? "");
  const [monto, setMonto] = useState(
    inicial?.monto != null ? String(inicial.monto) : "",
  );
  const [estado, setEstado] = useState<EstadoDeuda>(
    inicial?.estado ?? "pendiente",
  );
  const [g, setG] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!persona.trim()) return setErr("La persona es obligatoria.");
        setG(true);
        try {
          await onGuardar({
            persona: persona.trim(),
            concepto: concepto.trim(),
            monto: parseMonto(monto),
            estado,
          });
        } catch {
          setErr("No se pudo guardar.");
          setG(false);
        }
      }}
      className="space-y-3"
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Persona
        </label>
        <input
          className={inputClass}
          value={persona}
          onChange={(e) => setPersona(e.target.value)}
          placeholder="Pablo"
          autoFocus
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Concepto
        </label>
        <input
          className={inputClass}
          value={concepto}
          onChange={(e) => setConcepto(e.target.value)}
          placeholder="Cena, préstamo…"
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
          Estado
        </label>
        <select
          className={inputClass}
          value={estado}
          onChange={(e) => setEstado(e.target.value as EstadoDeuda)}
        >
          <option value="pendiente">Pendiente</option>
          <option value="pagado">Pagado</option>
        </select>
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

export default function MeDebenVista({
  autoNuevo = false,
}: {
  autoNuevo?: boolean;
}) {
  const [deudas, setDeudas] = useState<DeudaAFavor[]>([]);
  const [estado, setEstado] = useState<"cargando" | "listo" | "error">(
    "cargando",
  );
  const [sheet, setSheet] = useState<
    { modo: "nuevo" } | { modo: "editar"; d: DeudaAFavor } | null
  >(autoNuevo ? { modo: "nuevo" } : null);
  const [borrar, setBorrar] = useState<DeudaAFavor | null>(null);
  const [proc, setProc] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setDeudas(await fetchDeudas());
      setEstado("listo");
    } catch {
      setEstado("error");
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  return (
    <div>
      <PageHeader
        title="Me deben"
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

      {estado === "error" && (
        <p className="text-sm text-red-600">
          No se pudieron cargar las deudas a favor.
        </p>
      )}

      {estado === "listo" && (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Total pendiente
          </p>
          <p className="mt-1 text-2xl font-bold tabular-nums text-slate-900">
            {formatGuaranies(totalMeDeben(deudas))}
          </p>
        </div>
      )}

      <div className="space-y-2">
        {estado === "listo" && deudas.length === 0 && (
          <EmptyState
            title="No hay deudas pendientes"
            hint="Tocá Agregar para registrar una."
          />
        )}

        {deudas.map((d) => (
          <div
            key={d.id}
            className="flex items-start justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div className="flex min-w-0 items-start gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <HandCoins className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {d.persona}
                </p>
                {d.concepto && (
                  <p className="truncate text-sm text-slate-500">{d.concepto}</p>
                )}
                <p className="text-base font-semibold tabular-nums text-slate-900">
                  {formatGuaranies(d.monto)}
                </p>
                <span
                  className={`mt-1 inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    d.estado === "pendiente"
                      ? "bg-amber-100 text-amber-700"
                      : "bg-green-100 text-green-700"
                  }`}
                >
                  {d.estado === "pendiente" ? "Pendiente" : "Pagado"}
                </span>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                aria-label="Editar"
                onClick={() => setSheet({ modo: "editar", d })}
                className="rounded-lg p-2 text-slate-400 active:bg-slate-100 active:text-blue-600"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Eliminar"
                onClick={() => setBorrar(d)}
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
        title={sheet?.modo === "editar" ? "Editar" : "Nueva deuda a favor"}
      >
        {sheet && (
          <DeudaForm
            inicial={sheet.modo === "editar" ? sheet.d : undefined}
            onCancelar={() => setSheet(null)}
            onGuardar={async (datos) => {
              if (sheet.modo === "editar") {
                await updateDeuda(sheet.d.id, datos);
              } else {
                await insertDeuda(datos);
              }
              setSheet(null);
              await cargar();
            }}
          />
        )}
      </BottomSheet>

      <ConfirmDialog
        open={borrar !== null}
        title="¿Eliminar este registro?"
        description={borrar ? `${borrar.persona}` : undefined}
        confirmLabel="Eliminar"
        loading={proc}
        onCancel={() => setBorrar(null)}
        onConfirm={async () => {
          if (!borrar) return;
          setProc(true);
          try {
            await deleteDeuda(borrar.id);
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
