"use client";

import { useState } from "react";
import { usePeriodo } from "@/lib/periodo-context";
import { formatGuaranies, parseMonto } from "@/lib/format";
import MontoInput from "./MontoInput";

/** Card del ingreso del período, editable inline. */
export default function IngresoEditable() {
  const { periodo, cambiarIngreso } = usePeriodo();
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState("");
  const [guardando, setGuardando] = useState(false);

  if (!periodo) return null;

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        Ingreso del período
      </p>

      {editando ? (
        <div className="mt-2 flex items-center gap-2">
          <div className="flex-1">
            <MontoInput value={valor} onChange={setValor} autoFocus />
          </div>
          <button
            type="button"
            disabled={guardando}
            onClick={async () => {
              setGuardando(true);
              try {
                await cambiarIngreso(parseMonto(valor));
                setEditando(false);
              } finally {
                setGuardando(false);
              }
            }}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {guardando ? "…" : "Guardar"}
          </button>
          <button
            type="button"
            onClick={() => setEditando(false)}
            className="px-2 py-2 text-sm text-slate-500"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <div className="mt-1 flex items-baseline justify-between gap-3">
          <p className="text-2xl font-semibold tabular-nums text-slate-900">
            {formatGuaranies(periodo.ingreso)}
          </p>
          <button
            type="button"
            onClick={() => {
              setValor(String(periodo.ingreso));
              setEditando(true);
            }}
            className="text-sm font-medium text-blue-600"
          >
            Editar
          </button>
        </div>
      )}
    </div>
  );
}
