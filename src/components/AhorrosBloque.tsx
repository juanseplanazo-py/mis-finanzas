"use client";

import { useCallback, useEffect, useState } from "react";
import type { Ahorro } from "@/lib/types";
import { totalAhorros } from "@/lib/calc";
import { formatGuaranies, parseMonto } from "@/lib/format";
import {
  fetchAhorros,
  insertAhorro,
  updateAhorro,
  deleteAhorro,
} from "@/lib/queries";
import MontoInput from "./MontoInput";

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600";

function CuentaForm({
  inicialNombre = "",
  inicialSaldo = "",
  onGuardar,
  onCancelar,
}: {
  inicialNombre?: string;
  inicialSaldo?: string;
  onGuardar: (nombre: string, saldo: number) => Promise<void>;
  onCancelar: () => void;
}) {
  const [nombre, setNombre] = useState(inicialNombre);
  const [saldo, setSaldo] = useState(inicialSaldo);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (!nombre.trim()) {
          setError("El nombre es obligatorio.");
          return;
        }
        setGuardando(true);
        try {
          await onGuardar(nombre.trim(), parseMonto(saldo));
        } catch {
          setError("No se pudo guardar.");
          setGuardando(false);
        }
      }}
      className="space-y-2 rounded-lg border border-gray-200 bg-gray-50 p-3"
    >
      <input
        className={inputClass}
        value={nombre}
        onChange={(e) => setNombre(e.target.value)}
        placeholder="Nombre (ej. BASA Cuenta)"
        autoFocus
      />
      <MontoInput value={saldo} onChange={setSaldo} placeholder="Saldo" />
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

export default function AhorrosBloque() {
  const [ahorros, setAhorros] = useState<Ahorro[]>([]);
  const [estado, setEstado] = useState<"cargando" | "listo" | "error">(
    "cargando",
  );
  const [agregando, setAgregando] = useState(false);
  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [confirmandoId, setConfirmandoId] = useState<string | null>(null);

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
    <section>
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Ahorros
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
            + Agregar
          </button>
        )}
      </div>

      {estado === "error" && (
        <p className="text-sm text-red-600">
          No se pudieron cargar los ahorros (¿corriste la migración 003?).
        </p>
      )}

      <div className="space-y-3">
        {agregando && (
          <CuentaForm
            onGuardar={async (nombre, saldo) => {
              await insertAhorro({ nombre, saldo });
              setAgregando(false);
              await cargar();
            }}
            onCancelar={() => setAgregando(false)}
          />
        )}

        {ahorros.map((a) =>
          editandoId === a.id ? (
            <CuentaForm
              key={a.id}
              inicialNombre={a.nombre}
              inicialSaldo={String(a.saldo)}
              onGuardar={async (nombre, saldo) => {
                await updateAhorro(a.id, { nombre, saldo });
                setEditandoId(null);
                await cargar();
              }}
              onCancelar={() => setEditandoId(null)}
            />
          ) : (
            <div
              key={a.id}
              className="rounded-xl border border-gray-200 bg-white p-4"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-gray-900">
                    {a.nombre}
                  </p>
                  <p className="mt-0.5 text-lg font-semibold text-gray-900">
                    {formatGuaranies(a.saldo)}
                  </p>
                </div>
                {confirmandoId === a.id ? (
                  <div className="text-right text-sm">
                    <p className="text-gray-600">¿Eliminar esta cuenta?</p>
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
                          await deleteAhorro(a.id);
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
                        setEditandoId(a.id);
                        setAgregando(false);
                      }}
                      className="font-medium text-blue-600"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmandoId(a.id)}
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

        {estado === "listo" && ahorros.length === 0 && !agregando && (
          <p className="text-sm text-gray-500">Todavía no cargaste cuentas de ahorro.</p>
        )}

        <div className="flex items-center justify-between rounded-xl bg-gray-100 px-4 py-3">
          <span className="text-sm font-semibold text-gray-700">
            Total ahorros
          </span>
          <span className="text-lg font-bold text-gray-900">
            {formatGuaranies(totalAhorros(ahorros))}
          </span>
        </div>
      </div>
    </section>
  );
}
