"use client";

import { useCallback, useEffect, useState } from "react";
import type { DeudaAFavor, EstadoDeuda } from "@/lib/types";
import { totalMeDeben } from "@/lib/calc";
import { formatGuaranies, parseMonto } from "@/lib/format";
import {
  fetchDeudas,
  insertDeuda,
  updateDeuda,
  deleteDeuda,
} from "@/lib/queries";
import MontoInput from "./MontoInput";

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600";

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
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!persona.trim()) {
          setError("La persona es obligatoria.");
          return;
        }
        setGuardando(true);
        try {
          await onGuardar({
            persona: persona.trim(),
            concepto: concepto.trim(),
            monto: parseMonto(monto),
            estado,
          });
        } catch {
          setError("No se pudo guardar.");
          setGuardando(false);
        }
      }}
      className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3"
    >
      <input
        className={inputClass}
        value={persona}
        onChange={(e) => setPersona(e.target.value)}
        placeholder="Persona"
        autoFocus
      />
      <input
        className={inputClass}
        value={concepto}
        onChange={(e) => setConcepto(e.target.value)}
        placeholder="Concepto"
      />
      <MontoInput value={monto} onChange={setMonto} placeholder="Monto" />
      <select
        className={inputClass}
        value={estado}
        onChange={(e) => setEstado(e.target.value as EstadoDeuda)}
      >
        <option value="pendiente">Pendiente</option>
        <option value="pagado">Pagado</option>
      </select>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button
          type="submit"
          disabled={guardando}
          className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
        >
          {guardando ? "Guardando…" : "Guardar"}
        </button>
        <button
          type="button"
          onClick={onCancelar}
          className="px-2 py-2 text-sm text-gray-500"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}

export default function MeDebenBloque() {
  const [deudas, setDeudas] = useState<DeudaAFavor[]>([]);
  const [estado, setEstado] = useState<"cargando" | "listo" | "error">(
    "cargando",
  );
  const [agregando, setAgregando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);

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
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Me deben
        </h2>
        {!agregando && (
          <button
            type="button"
            onClick={() => {
              setAgregando(true);
              setEditandoId(null);
            }}
            className="text-sm font-medium text-blue-600"
          >
            + Agregar deuda a favor
          </button>
        )}
      </div>

      {estado === "error" && (
        <p className="text-sm text-red-600">
          No se pudieron cargar las deudas a favor.
        </p>
      )}

      <div className="space-y-3">
        {agregando && (
          <DeudaForm
            onGuardar={async (d) => {
              await insertDeuda(d);
              setAgregando(false);
              await cargar();
            }}
            onCancelar={() => setAgregando(false)}
          />
        )}

        {deudas.map((d) =>
          editandoId === d.id ? (
            <DeudaForm
              key={d.id}
              inicial={d}
              onGuardar={async (datos) => {
                await updateDeuda(d.id, datos);
                setEditandoId(null);
                await cargar();
              }}
              onCancelar={() => setEditandoId(null)}
            />
          ) : (
            <div
              key={d.id}
              className="rounded-xl border border-gray-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900">
                    {d.persona}
                  </p>
                  {d.concepto && (
                    <p className="truncate text-sm text-gray-600">
                      {d.concepto}
                    </p>
                  )}
                  <p className="mt-0.5 text-lg font-semibold text-gray-900">
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
                {confirmandoId === d.id ? (
                  <div className="text-right text-sm">
                    <p className="text-gray-600">¿Eliminar?</p>
                    <div className="mt-1 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => setConfirmandoId(null)}
                        className="text-gray-500"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await deleteDeuda(d.id);
                          setConfirmandoId(null);
                          await cargar();
                        }}
                        className="font-semibold text-red-600"
                      >
                        Eliminar
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex shrink-0 gap-3 text-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setEditandoId(d.id);
                        setAgregando(false);
                      }}
                      className="font-medium text-blue-600"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmandoId(d.id)}
                      className="font-medium text-red-600"
                    >
                      Eliminar
                    </button>
                  </div>
                )}
              </div>
            </div>
          ),
        )}

        {estado === "listo" && deudas.length === 0 && !agregando && (
          <p className="text-sm text-gray-500">Nadie te debe nada registrado.</p>
        )}

        <div className="flex items-center justify-between rounded-xl bg-gray-100 px-4 py-3">
          <span className="text-sm font-semibold text-gray-700">
            Total (pendiente)
          </span>
          <span className="text-lg font-bold text-gray-900">
            {formatGuaranies(totalMeDeben(deudas))}
          </span>
        </div>
      </div>
    </section>
  );
}
