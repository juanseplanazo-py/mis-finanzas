"use client";

import { useCallback, useEffect, useState } from "react";
import { supabaseConfigured } from "@/lib/supabase";
import type { Periodo, Movimiento } from "@/lib/types";
import {
  fetchPeriodos,
  fetchMovimientos,
  updateIngreso,
  deleteMovimiento,
} from "@/lib/queries";
import { resolverSeleccionado, setPeriodoGuardado } from "@/lib/periodos";
import { calcularResumen, dentroDeLoPlanificado } from "@/lib/calc";
import { formatGuaranies, formatMontoInput, parseMonto } from "@/lib/format";
import { supabase } from "@/lib/supabase";
import MovimientosTabla from "./MovimientosTabla";
import PeriodoSelector from "./PeriodoSelector";
import AhorrosBloque from "./AhorrosBloque";
import TarjetasBloque from "./TarjetasBloque";
import MeDebenBloque from "./MeDebenBloque";

type Estado =
  | "cargando"
  | "listo"
  | "sin-config"
  | "migracion-pendiente"
  | "error";

function Kpi({
  label,
  valor,
  tono = "neutro",
}: {
  label: string;
  valor: number;
  tono?: "neutro" | "negativo";
}) {
  const color = tono === "negativo" ? "text-red-600" : "text-gray-900";
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
        {label}
      </p>
      <p className={`mt-1 text-xl font-semibold ${color}`}>
        {formatGuaranies(valor)}
      </p>
    </div>
  );
}

export default function Dashboard() {
  const [estado, setEstado] = useState<Estado>("cargando");
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [seleccionado, setSeleccionado] = useState<Periodo | null>(null);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);

  const [editandoIngreso, setEditandoIngreso] = useState(false);
  const [ingresoInput, setIngresoInput] = useState("");
  const [guardandoIngreso, setGuardandoIngreso] = useState(false);

  const cargarMovimientos = useCallback(async (periodo: Periodo) => {
    setMovimientos(await fetchMovimientos(periodo.id));
  }, []);

  const cargarTodo = useCallback(async () => {
    if (!supabaseConfigured) {
      setEstado("sin-config");
      return;
    }
    setEstado("cargando");
    try {
      const lista = await fetchPeriodos();
      if (lista.length === 0) {
        setEstado("migracion-pendiente");
        return;
      }
      const sel = resolverSeleccionado(lista) ?? lista[0];
      setPeriodos(lista);
      setSeleccionado(sel);
      setPeriodoGuardado(sel.id);
      await cargarMovimientos(sel);
      setEstado("listo");
    } catch {
      setEstado("migracion-pendiente");
    }
  }, [cargarMovimientos]);

  useEffect(() => {
    cargarTodo();
  }, [cargarTodo]);

  async function aplicarPeriodo(p: Periodo) {
    setSeleccionado(p);
    setPeriodoGuardado(p.id);
    setEditandoIngreso(false);
    setEstado("cargando");
    try {
      await cargarMovimientos(p);
      setEstado("listo");
    } catch {
      setEstado("error");
    }
  }

  function cambiarPeriodo(id: string) {
    const p = periodos.find((x) => x.id === id);
    if (p) aplicarPeriodo(p);
  }

  function periodoCreado(p: Periodo) {
    setPeriodos((prev) =>
      [p, ...prev].sort((a, b) => (a.fecha_inicio < b.fecha_inicio ? 1 : -1)),
    );
    aplicarPeriodo(p);
  }

  async function eliminarMovimiento(id: string) {
    await deleteMovimiento(id);
    if (seleccionado) await cargarMovimientos(seleccionado);
  }

  async function guardarIngreso() {
    if (!seleccionado) return;
    const nuevo = parseMonto(ingresoInput);
    setGuardandoIngreso(true);
    try {
      await updateIngreso(seleccionado.id, nuevo);
      const actualizado = { ...seleccionado, ingreso: nuevo };
      setSeleccionado(actualizado);
      setPeriodos((prev) =>
        prev.map((p) => (p.id === actualizado.id ? actualizado : p)),
      );
      setEditandoIngreso(false);
    } catch {
      /* se mantiene el valor anterior */
    } finally {
      setGuardandoIngreso(false);
    }
  }

  return (
    <main>
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Mis Finanzas</h1>
        <button
          type="button"
          onClick={() => supabase.auth.signOut()}
          className="text-xs font-medium text-gray-400 hover:text-gray-600"
        >
          Salir
        </button>
      </div>

      {estado === "sin-config" && (
        <p className="mt-4 text-sm text-red-600">
          Supabase no está configurado. Completá <code>.env.local</code> con las
          variables de Supabase.
        </p>
      )}

      {estado === "migracion-pendiente" && (
        <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          <p className="font-semibold">Falta ejecutar una migración de la base.</p>
          <p className="mt-1">
            Abrí Supabase → SQL Editor y ejecutá los archivos de{" "}
            <code>supabase/</code> que falten (migraciones 002, 003 y 004).
            Después recargá.
          </p>
        </div>
      )}

      {estado === "error" && (
        <p className="mt-4 text-sm text-red-600">
          No se pudieron cargar los datos. Reintentá en unos segundos.
        </p>
      )}

      {estado === "cargando" && (
        <p className="mt-4 text-sm text-gray-500">Cargando…</p>
      )}

      {estado === "listo" && seleccionado && (
        <DashboardContenido
          periodos={periodos}
          seleccionado={seleccionado}
          movimientos={movimientos}
          onSelectPeriodo={cambiarPeriodo}
          onPeriodoCreado={periodoCreado}
          onEliminarMovimiento={eliminarMovimiento}
          editandoIngreso={editandoIngreso}
          ingresoInput={ingresoInput}
          guardandoIngreso={guardandoIngreso}
          onEditarIngreso={() => {
            setIngresoInput(String(seleccionado.ingreso));
            setEditandoIngreso(true);
          }}
          onCancelarIngreso={() => setEditandoIngreso(false)}
          onCambiarIngresoInput={setIngresoInput}
          onGuardarIngreso={guardarIngreso}
        />
      )}
    </main>
  );
}

function DashboardContenido(props: {
  periodos: Periodo[];
  seleccionado: Periodo;
  movimientos: Movimiento[];
  onSelectPeriodo: (id: string) => void;
  onPeriodoCreado: (p: Periodo) => void;
  onEliminarMovimiento: (id: string) => Promise<void>;
  editandoIngreso: boolean;
  ingresoInput: string;
  guardandoIngreso: boolean;
  onEditarIngreso: () => void;
  onCancelarIngreso: () => void;
  onCambiarIngresoInput: (v: string) => void;
  onGuardarIngreso: () => void;
}) {
  const {
    periodos,
    seleccionado,
    movimientos,
    onSelectPeriodo,
    onPeriodoCreado,
    onEliminarMovimiento,
    editandoIngreso,
    ingresoInput,
    guardandoIngreso,
    onEditarIngreso,
    onCancelarIngreso,
    onCambiarIngresoInput,
    onGuardarIngreso,
  } = props;

  const resumen = calcularResumen(movimientos, seleccionado.ingreso);
  const ok = dentroDeLoPlanificado(resumen);

  return (
    <div className="mt-3 space-y-8">
      <PeriodoSelector
        periodos={periodos}
        seleccionado={seleccionado}
        onSelect={onSelectPeriodo}
        onCreado={onPeriodoCreado}
      />

      {/* ===== PRESUPUESTO ===== */}
      <div className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-gray-500">
          Presupuesto
        </h2>

        {/* Ingreso del período */}
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs font-medium uppercase tracking-wide text-gray-500">
            Ingreso
          </p>
          {editandoIngreso ? (
            <div className="mt-2 flex items-center gap-2">
              <div className="relative flex-1">
                <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-base text-gray-500">
                  Gs.
                </span>
                <input
                  type="text"
                  inputMode="numeric"
                  autoFocus
                  className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-11 pr-3 text-base text-gray-900 focus:border-blue-600 focus:outline-none focus:ring-1 focus:ring-blue-600"
                  value={formatMontoInput(ingresoInput)}
                  onChange={(e) => onCambiarIngresoInput(e.target.value)}
                />
              </div>
              <button
                type="button"
                onClick={onGuardarIngreso}
                disabled={guardandoIngreso}
                className="rounded-lg bg-blue-600 px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {guardandoIngreso ? "…" : "Guardar"}
              </button>
              <button
                type="button"
                onClick={onCancelarIngreso}
                className="px-2 py-2 text-sm text-gray-500"
              >
                Cancelar
              </button>
            </div>
          ) : (
            <div className="mt-1 flex items-baseline justify-between gap-3">
              <p className="text-xl font-semibold text-gray-900">
                {formatGuaranies(seleccionado.ingreso)}
              </p>
              <button
                type="button"
                onClick={onEditarIngreso}
                className="text-sm font-medium text-blue-600"
              >
                Editar
              </button>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Kpi label="Presupuestado" valor={resumen.presupuestado} />
          <Kpi label="Pagado" valor={resumen.pagado} />
          <Kpi
            label="Falta por gastar"
            valor={resumen.faltaPorGastar}
            tono={resumen.faltaPorGastar < 0 ? "negativo" : "neutro"}
          />
          <Kpi
            label="Disponible real"
            valor={resumen.disponibleReal}
            tono={resumen.disponibleReal < 0 ? "negativo" : "neutro"}
          />
        </div>

        {/* Resumen hoy */}
        <div
          className={`rounded-xl border p-4 ${
            ok
              ? "border-green-200 bg-green-50 text-green-800"
              : "border-amber-200 bg-amber-50 text-amber-800"
          }`}
        >
          <p className="text-sm font-semibold">
            {ok
              ? "✓ Vas dentro de lo planificado"
              : "Atención: tu disponible es menor a lo que falta por gastar"}
          </p>
          <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
            <div>
              <span className="opacity-70">Disponible real</span>
              <p className="font-semibold">
                {formatGuaranies(resumen.disponibleReal)}
              </p>
            </div>
            <div>
              <span className="opacity-70">Falta por gastar</span>
              <p className="font-semibold">
                {formatGuaranies(resumen.faltaPorGastar)}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ===== MOVIMIENTOS ===== */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Movimientos
        </h2>
        <MovimientosTabla
          movimientos={movimientos}
          onEliminar={onEliminarMovimiento}
        />
      </section>

      {/* ===== AHORROS / TARJETAS / ME DEBEN (independientes del período) ===== */}
      <AhorrosBloque />
      <TarjetasBloque />
      <MeDebenBloque />
    </div>
  );
}
