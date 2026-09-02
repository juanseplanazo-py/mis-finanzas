"use client";

import { useCallback, useEffect, useState } from "react";
import { PiggyBank, Plus, Pencil, Trash2 } from "lucide-react";
import type { Ahorro } from "@/lib/types";
import {
  fetchAhorros,
  insertAhorro,
  updateAhorro,
  deleteAhorro,
} from "@/lib/queries";
import { totalAhorros } from "@/lib/calc";
import { parseMonto } from "@/lib/format";
import PageHeader from "./PageHeader";
import Money from "./Money";
import BottomSheet from "./BottomSheet";
import ConfirmDialog from "./ConfirmDialog";
import EmptyState from "./EmptyState";
import MontoInput from "./MontoInput";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600";

function CuentaForm({
  inicial,
  onGuardar,
  onCancelar,
}: {
  inicial?: { nombre: string; saldo: number };
  onGuardar: (nombre: string, saldo: number) => Promise<void>;
  onCancelar: () => void;
}) {
  const [nombre, setNombre] = useState(inicial?.nombre ?? "");
  const [saldo, setSaldo] = useState(
    inicial?.saldo != null ? String(inicial.saldo) : "",
  );
  const [g, setG] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!nombre.trim()) return setErr("El nombre es obligatorio.");
        setG(true);
        try {
          await onGuardar(nombre.trim(), parseMonto(saldo));
        } catch {
          setErr("No se pudo guardar.");
          setG(false);
        }
      }}
      className="space-y-3"
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Nombre
        </label>
        <input
          className={inputClass}
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="BASA Cuenta"
          autoFocus
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Saldo
        </label>
        <MontoInput value={saldo} onChange={setSaldo} placeholder="0" />
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

export default function AhorrosVista({
  autoNuevo = false,
}: {
  autoNuevo?: boolean;
}) {
  const [ahorros, setAhorros] = useState<Ahorro[]>([]);
  const [estado, setEstado] = useState<"cargando" | "listo" | "error">(
    "cargando",
  );
  const [sheet, setSheet] = useState<
    { modo: "nuevo" } | { modo: "editar"; a: Ahorro } | null
  >(autoNuevo ? { modo: "nuevo" } : null);
  const [borrar, setBorrar] = useState<Ahorro | null>(null);
  const [proc, setProc] = useState(false);

  const cargar = useCallback(async () => {
    try {
      setAhorros(await fetchAhorros());
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
        title="Ahorros"
        subtitle="Saldo acumulado"
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
        <p className="text-sm text-red-600">No se pudieron cargar los ahorros.</p>
      )}

      {estado === "listo" && (
        <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
            Total ahorros
          </p>
          <Money
            value={totalAhorros(ahorros)}
            className="mt-1 block text-2xl font-bold"
          />
        </div>
      )}

      <div className="space-y-2">
        {estado === "listo" && ahorros.length === 0 && (
          <EmptyState
            title="No hay cuentas de ahorro"
            hint="Tocá Agregar para cargar la primera."
          />
        )}

        {ahorros.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white p-4"
          >
            <div className="flex min-w-0 items-center gap-3">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                <PiggyBank className="h-4 w-4" aria-hidden="true" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-900">
                  {a.nombre}
                </p>
                <Money value={a.saldo} className="block text-base font-semibold" />
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                aria-label="Editar cuenta"
                onClick={() => setSheet({ modo: "editar", a })}
                className="rounded-lg p-2 text-slate-400 active:bg-slate-100 active:text-blue-600"
              >
                <Pencil className="h-4 w-4" aria-hidden="true" />
              </button>
              <button
                type="button"
                aria-label="Eliminar cuenta"
                onClick={() => setBorrar(a)}
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
        title={sheet?.modo === "editar" ? "Editar cuenta" : "Nueva cuenta de ahorro"}
      >
        {sheet && (
          <CuentaForm
            inicial={
              sheet.modo === "editar"
                ? { nombre: sheet.a.nombre, saldo: sheet.a.saldo }
                : undefined
            }
            onCancelar={() => setSheet(null)}
            onGuardar={async (nombre, saldo) => {
              if (sheet.modo === "editar") {
                await updateAhorro(sheet.a.id, { nombre, saldo });
              } else {
                await insertAhorro({ nombre, saldo });
              }
              setSheet(null);
              await cargar();
            }}
          />
        )}
      </BottomSheet>

      <ConfirmDialog
        open={borrar !== null}
        title="¿Eliminar esta cuenta?"
        description={borrar?.nombre}
        confirmLabel="Eliminar"
        loading={proc}
        onCancel={() => setBorrar(null)}
        onConfirm={async () => {
          if (!borrar) return;
          setProc(true);
          try {
            await deleteAhorro(borrar.id);
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
