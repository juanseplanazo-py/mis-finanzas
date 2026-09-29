"use client";

import { useState } from "react";
import { Copy } from "lucide-react";
import type { Periodo } from "@/lib/types";
import {
  formatMontoInput,
  parseMonto,
  sumarDiasISO,
  sumarMesesISO,
  nombrePeriodoSugerido,
} from "@/lib/format";
import { insertPeriodo, duplicarPeriodo, fetchMovimientos } from "@/lib/queries";
import ConfirmDialog from "./ConfirmDialog";
import Money from "./Money";

const fieldClass =
  "w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-base text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600";

export default function PeriodoSelector({
  periodos,
  seleccionado,
  onSelect,
  onCreado,
}: {
  periodos: Periodo[];
  seleccionado: Periodo;
  onSelect: (id: string) => void;
  onCreado: (periodo: Periodo) => void;
}) {
  const [creando, setCreando] = useState(false);
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [confirmarDup, setConfirmarDup] = useState(false);
  const [cantidadAnterior, setCantidadAnterior] = useState<number | null>(
    null,
  );
  const [duplicando, setDuplicando] = useState(false);
  const [errorDup, setErrorDup] = useState<string | null>(null);

  // Sugerencia: el período siguiente al más reciente.
  const masReciente = periodos[0];
  const inicioSug = masReciente
    ? sumarDiasISO(masReciente.fecha_fin, 1)
    : new Date().toISOString().slice(0, 10);
  // Un mes después del inicio, menos un día (mismo patrón 25 -> 24 del Excel).
  const finSug = sumarDiasISO(sumarMesesISO(inicioSug, 1), -1);
  const nombreSug = nombrePeriodoSugerido(inicioSug);

  const [nombre, setNombre] = useState(nombreSug);
  const [inicio, setInicio] = useState(inicioSug);
  const [fin, setFin] = useState(finSug);
  const [ingreso, setIngreso] = useState(
    masReciente ? String(masReciente.ingreso) : "",
  );

  async function abrirConfirmarDup() {
    if (!masReciente) return;
    setErrorDup(null);
    setConfirmarDup(true);
    setCantidadAnterior(null);
    try {
      const movs = await fetchMovimientos(masReciente.id);
      setCantidadAnterior(movs.length);
    } catch {
      setErrorDup("No se pudo revisar el período anterior.");
    }
  }

  async function confirmarDuplicar() {
    if (!masReciente) return;
    setDuplicando(true);
    setErrorDup(null);
    try {
      const { periodo } = await duplicarPeriodo(
        {
          nombre: nombreSug,
          fecha_inicio: inicioSug,
          fecha_fin: finSug,
          ingreso: masReciente.ingreso,
        },
        masReciente.id,
      );
      setConfirmarDup(false);
      onCreado(periodo);
    } catch {
      setErrorDup("No se pudo duplicar el período.");
    } finally {
      setDuplicando(false);
    }
  }

  async function crear(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (!nombre.trim() || !inicio || !fin) {
      setError("Completá nombre, inicio y fin.");
      return;
    }
    setGuardando(true);
    try {
      const nuevo = await insertPeriodo({
        nombre: nombre.trim(),
        fecha_inicio: inicio,
        fecha_fin: fin,
        ingreso: parseMonto(ingreso),
      });
      setCreando(false);
      onCreado(nuevo);
    } catch {
      setError("No se pudo crear el período.");
    } finally {
      setGuardando(false);
    }
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <select
          aria-label="Período"
          className={`${fieldClass} font-semibold`}
          value={seleccionado.id}
          onChange={(e) => onSelect(e.target.value)}
        >
          {periodos.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nombre}
            </option>
          ))}
        </select>
        <button
          type="button"
          onClick={() => setCreando((v) => !v)}
          className="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-600"
        >
          {creando ? "Cancelar" : "+ Período"}
        </button>
      </div>

      {!creando && masReciente && (
        <button
          type="button"
          onClick={abrirConfirmarDup}
          className="mt-2 flex items-center gap-1.5 text-sm font-medium text-blue-600"
        >
          <Copy className="h-4 w-4" aria-hidden="true" />
          Duplicar último período
        </button>
      )}

      {creando && (
        <form
          onSubmit={crear}
          className="mt-3 space-y-3 rounded-xl border border-gray-200 bg-white p-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Nombre
            </label>
            <input
              className={fieldClass}
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              placeholder="Septiembre - Octubre 2026"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Inicio
              </label>
              <input
                type="date"
                className={fieldClass}
                value={inicio}
                onChange={(e) => setInicio(e.target.value)}
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Fin
              </label>
              <input
                type="date"
                className={fieldClass}
                value={fin}
                onChange={(e) => setFin(e.target.value)}
              />
            </div>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">
              Ingreso del período
            </label>
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-gray-500">
                Gs.
              </span>
              <input
                type="text"
                inputMode="numeric"
                className={`${fieldClass} pl-11`}
                value={formatMontoInput(ingreso)}
                onChange={(e) => setIngreso(e.target.value)}
                placeholder="4.000.000"
              />
            </div>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}

          <button
            type="submit"
            disabled={guardando}
            className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white active:bg-blue-700 disabled:opacity-60"
          >
            {guardando ? "Creando…" : "Crear período"}
          </button>
        </form>
      )}

      {masReciente && (
        <ConfirmDialog
          open={confirmarDup}
          title="¿Duplicar último período?"
          tone="primary"
          confirmLabel="Duplicar"
          loading={duplicando}
          description={
            errorDup ? (
              <span className="text-red-600">{errorDup}</span>
            ) : (
              <>
                Se creará <strong>{nombreSug}</strong> ({inicioSug} al{" "}
                {finSug}) con el mismo ingreso (
                <Money value={masReciente.ingreso} />) y{" "}
                {cantidadAnterior === null
                  ? "los gastos de"
                  : `los ${cantidadAnterior} gasto(s) presupuestado(s) de`}{" "}
                {masReciente.nombre}, todos con pagado en 0. No se modifica el
                período anterior.
              </>
            )
          }
          onCancel={() => setConfirmarDup(false)}
          onConfirm={confirmarDuplicar}
        />
      )}
    </div>
  );
}
