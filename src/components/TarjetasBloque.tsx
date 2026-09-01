"use client";

import { useCallback, useEffect, useState } from "react";
import type {
  TarjetaCredito,
  TarjetaMovimiento,
  TipoTarjetaMovimiento,
} from "@/lib/types";
import { deudaTarjeta, disponibleTarjeta } from "@/lib/calc";
import { formatGuaranies, parseMonto } from "@/lib/format";
import {
  fetchTarjetas,
  fetchTarjetaMovimientos,
  insertTarjeta,
  updateTarjeta,
  deleteTarjeta,
  insertTarjetaMovimiento,
  updateTarjetaMovimiento,
  deleteTarjetaMovimiento,
} from "@/lib/queries";
import MontoInput from "./MontoInput";

const inputClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600";

// --- Formulario de tarjeta (nombre + línea) --------------------------------
function TarjetaForm({
  inicialNombre = "",
  inicialLinea = "",
  onGuardar,
  onCancelar,
}: {
  inicialNombre?: string;
  inicialLinea?: string;
  onGuardar: (nombre: string, linea: number) => Promise<void>;
  onCancelar: () => void;
}) {
  const [nombre, setNombre] = useState(inicialNombre);
  const [linea, setLinea] = useState(inicialLinea);
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
          await onGuardar(nombre.trim(), parseMonto(linea));
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
        placeholder="Nombre (ej. GNB)"
        autoFocus
      />
      <MontoInput
        value={linea}
        onChange={setLinea}
        placeholder="Línea de crédito"
      />
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

// --- Formulario de concepto (concepto + monto + tipo) ---------------------
function ConceptoForm({
  inicialConcepto = "",
  inicialMonto = "",
  inicialTipo = "cargo",
  onGuardar,
  onCancelar,
}: {
  inicialConcepto?: string;
  inicialMonto?: string;
  inicialTipo?: TipoTarjetaMovimiento;
  onGuardar: (
    concepto: string,
    monto: number,
    tipo: TipoTarjetaMovimiento,
  ) => Promise<void>;
  onCancelar: () => void;
}) {
  const [concepto, setConcepto] = useState(inicialConcepto);
  const [monto, setMonto] = useState(inicialMonto);
  const [tipo, setTipo] = useState<TipoTarjetaMovimiento>(inicialTipo);
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
          await onGuardar(concepto.trim(), parseMonto(monto), tipo);
        } catch {
          setError("No se pudo guardar.");
          setGuardando(false);
        }
      }}
      className="space-y-2 rounded-lg border border-gray-200 bg-white p-3"
    >
      <input
        className={inputClass}
        value={concepto}
        onChange={(e) => setConcepto(e.target.value)}
        placeholder="Concepto (ej. Agosto)"
        autoFocus
      />
      <MontoInput value={monto} onChange={setMonto} placeholder="Monto" />
      <select
        className={inputClass}
        value={tipo}
        onChange={(e) => setTipo(e.target.value as TipoTarjetaMovimiento)}
      >
        <option value="cargo">Cargo (suma a la deuda)</option>
        <option value="descuento">Descuento (resta de la deuda)</option>
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

// --- Una tarjeta -------------------------------------------------------------
function TarjetaCard({
  tarjeta,
  movimientos,
  onCambio,
}: {
  tarjeta: TarjetaCredito;
  movimientos: TarjetaMovimiento[];
  onCambio: () => Promise<void>;
}) {
  const [abierto, setAbierto] = useState(false);
  const [editandoTarjeta, setEditandoTarjeta] = useState(false);
  const [confirmandoTarjeta, setConfirmandoTarjeta] = useState(false);
  const [agregandoConcepto, setAgregandoConcepto] = useState(false);
  const [editandoConceptoId, setEditandoConceptoId] = useState<string | null>(
    null,
  );
  const [confirmandoConceptoId, setConfirmandoConceptoId] = useState<
    string | null
  >(null);

  const deuda = deudaTarjeta(movimientos);
  const disponible = disponibleTarjeta(tarjeta.linea_credito, deuda);

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      {editandoTarjeta ? (
        <TarjetaForm
          inicialNombre={tarjeta.nombre}
          inicialLinea={String(tarjeta.linea_credito)}
          onGuardar={async (nombre, linea) => {
            await updateTarjeta(tarjeta.id, {
              nombre,
              linea_credito: linea,
            });
            setEditandoTarjeta(false);
            await onCambio();
          }}
          onCancelar={() => setEditandoTarjeta(false)}
        />
      ) : (
        <>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-base font-semibold text-gray-900">
                {tarjeta.nombre}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Deuda{" "}
                <span className="font-semibold text-gray-900">
                  {formatGuaranies(deuda)}
                </span>
              </p>
              <p className="text-sm text-gray-600">
                Disponible{" "}
                <span
                  className={`font-semibold ${
                    disponible < 0 ? "text-red-600" : "text-green-700"
                  }`}
                >
                  {formatGuaranies(disponible)}
                </span>
              </p>
              <p className="text-xs text-gray-400">
                Línea {formatGuaranies(tarjeta.linea_credito)}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setAbierto((v) => !v)}
              className="shrink-0 text-sm font-medium text-blue-600"
            >
              {abierto ? "Ocultar" : "Ver / Editar"}
            </button>
          </div>

          {abierto && (
            <div className="mt-4 border-t border-gray-100 pt-4">
              {/* Conceptos */}
              <ul className="space-y-2">
                {movimientos.map((m) =>
                  editandoConceptoId === m.id ? (
                    <li key={m.id}>
                      <ConceptoForm
                        inicialConcepto={m.concepto}
                        inicialMonto={String(m.monto)}
                        inicialTipo={m.tipo}
                        onGuardar={async (concepto, monto, tipo) => {
                          await updateTarjetaMovimiento(m.id, {
                            concepto,
                            monto,
                            tipo,
                          });
                          setEditandoConceptoId(null);
                          await onCambio();
                        }}
                        onCancelar={() => setEditandoConceptoId(null)}
                      />
                    </li>
                  ) : (
                    <li
                      key={m.id}
                      className="flex items-center justify-between gap-3 text-sm"
                    >
                      <div className="min-w-0">
                        <span className="text-gray-900">{m.concepto}</span>
                        <span
                          className={`ml-2 text-xs ${
                            m.tipo === "descuento"
                              ? "text-green-600"
                              : "text-gray-400"
                          }`}
                        >
                          {m.tipo}
                        </span>
                      </div>
                      <div className="flex shrink-0 items-center gap-3">
                        <span className="font-medium text-gray-900">
                          {m.tipo === "descuento" ? "−" : ""}
                          {formatGuaranies(m.monto)}
                        </span>
                        {confirmandoConceptoId === m.id ? (
                          <span className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setConfirmandoConceptoId(null)}
                              className="text-gray-500"
                            >
                              Cancelar
                            </button>
                            <button
                              type="button"
                              onClick={async () => {
                                await deleteTarjetaMovimiento(m.id);
                                setConfirmandoConceptoId(null);
                                await onCambio();
                              }}
                              className="font-semibold text-red-600"
                            >
                              Eliminar
                            </button>
                          </span>
                        ) : (
                          <span className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => setEditandoConceptoId(m.id)}
                              className="font-medium text-blue-600"
                            >
                              Editar
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmandoConceptoId(m.id)}
                              className="font-medium text-red-600"
                            >
                              Eliminar
                            </button>
                          </span>
                        )}
                      </div>
                    </li>
                  ),
                )}
              </ul>

              {movimientos.length === 0 && (
                <p className="text-sm text-gray-500">Sin conceptos cargados.</p>
              )}

              <div className="mt-3">
                {agregandoConcepto ? (
                  <ConceptoForm
                    onGuardar={async (concepto, monto, tipo) => {
                      await insertTarjetaMovimiento({
                        tarjeta_id: tarjeta.id,
                        concepto,
                        monto,
                        tipo,
                      });
                      setAgregandoConcepto(false);
                      await onCambio();
                    }}
                    onCancelar={() => setAgregandoConcepto(false)}
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setAgregandoConcepto(true)}
                    className="text-sm font-medium text-blue-600"
                  >
                    + Agregar concepto
                  </button>
                )}
              </div>

              {/* Acciones de la tarjeta */}
              <div className="mt-4 border-t border-gray-100 pt-3 text-sm">
                {confirmandoTarjeta ? (
                  <div>
                    <p className="text-gray-600">
                      Eliminar la tarjeta <strong>{tarjeta.nombre}</strong>{" "}
                      también borra sus {movimientos.length} concepto(s). ¿Seguro?
                    </p>
                    <div className="mt-2 flex gap-3">
                      <button
                        type="button"
                        onClick={() => setConfirmandoTarjeta(false)}
                        className="text-gray-500"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={async () => {
                          await deleteTarjeta(tarjeta.id);
                          await onCambio();
                        }}
                        className="font-semibold text-red-600"
                      >
                        Eliminar tarjeta
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={() => setEditandoTarjeta(true)}
                      className="font-medium text-blue-600"
                    >
                      Editar tarjeta
                    </button>
                    <button
                      type="button"
                      onClick={() => setConfirmandoTarjeta(true)}
                      className="font-medium text-red-600"
                    >
                      Eliminar tarjeta
                    </button>
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// --- Bloque -----------------------------------------------------------------
export default function TarjetasBloque() {
  const [tarjetas, setTarjetas] = useState<TarjetaCredito[]>([]);
  const [movimientos, setMovimientos] = useState<TarjetaMovimiento[]>([]);
  const [estado, setEstado] = useState<"cargando" | "listo" | "error">(
    "cargando",
  );
  const [agregando, setAgregando] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const [ts, ms] = await Promise.all([
        fetchTarjetas(),
        fetchTarjetaMovimientos(),
      ]);
      setTarjetas(ts);
      setMovimientos(ms);
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
          Tarjetas de crédito
        </h2>
        {!agregando && (
          <button
            type="button"
            onClick={() => setAgregando(true)}
            className="text-sm font-medium text-blue-600"
          >
            + Agregar
          </button>
        )}
      </div>

      {estado === "error" && (
        <p className="text-sm text-red-600">
          No se pudieron cargar las tarjetas (¿corriste la migración 003?).
        </p>
      )}

      <div className="space-y-3">
        {agregando && (
          <TarjetaForm
            onGuardar={async (nombre, linea) => {
              await insertTarjeta({ nombre, linea_credito: linea });
              setAgregando(false);
              await cargar();
            }}
            onCancelar={() => setAgregando(false)}
          />
        )}

        {tarjetas.map((t) => (
          <TarjetaCard
            key={t.id}
            tarjeta={t}
            movimientos={movimientos.filter((m) => m.tarjeta_id === t.id)}
            onCambio={cargar}
          />
        ))}

        {estado === "listo" && tarjetas.length === 0 && !agregando && (
          <p className="text-sm text-gray-500">Todavía no cargaste tarjetas.</p>
        )}
      </div>
    </section>
  );
}
