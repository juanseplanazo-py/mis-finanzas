"use client";

import { useState } from "react";
import { parseMonto } from "@/lib/format";
import MontoInput from "./MontoInput";

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600";

export interface DatosDetalle {
  concepto: string;
  monto: number;
  fecha: string | null;
}

/** Form para agregar / editar un gasto detallado. Se usa dentro de un BottomSheet. */
export default function DetalleForm({
  inicial,
  onGuardar,
  onCancelar,
}: {
  inicial?: { concepto: string; monto: number; fecha: string | null };
  onGuardar: (d: DatosDetalle) => Promise<void>;
  onCancelar: () => void;
}) {
  const [concepto, setConcepto] = useState(inicial?.concepto ?? "");
  const [monto, setMonto] = useState(
    inicial?.monto != null ? String(inicial.monto) : "",
  );
  const [fecha, setFecha] = useState(inicial?.fecha ?? "");
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!concepto.trim()) {
          setError("El concepto es obligatorio.");
          return;
        }
        setGuardando(true);
        try {
          await onGuardar({
            concepto: concepto.trim(),
            monto: parseMonto(monto),
            fecha: fecha || null,
          });
        } catch {
          setError("No se pudo guardar.");
          setGuardando(false);
        }
      }}
      className="space-y-3"
    >
      <div>
        <label className="mb-1 block text-sm font-medium text-slate-700">
          Concepto
        </label>
        <input
          className={inputClass}
          value={concepto}
          onChange={(e) => setConcepto(e.target.value)}
          placeholder="Supermercado"
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
          Fecha <span className="font-normal text-slate-400">(opcional)</span>
        </label>
        <input
          type="date"
          className={inputClass}
          value={fecha}
          onChange={(e) => setFecha(e.target.value)}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-2 pt-1">
        <button
          type="submit"
          disabled={guardando}
          className="flex-1 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white active:bg-blue-700 disabled:opacity-60"
        >
          {guardando ? "Guardando…" : "Guardar"}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="rounded-xl border border-slate-200 px-4 py-3 text-sm font-medium text-slate-600 active:bg-slate-50"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
