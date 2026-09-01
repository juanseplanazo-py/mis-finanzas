"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { Periodo, Movimiento } from "./types";
import {
  fetchPeriodos,
  fetchMovimientos,
  updateIngreso,
  deleteMovimiento,
} from "./queries";
import { resolverSeleccionado, setPeriodoGuardado } from "./periodos";
import { supabaseConfigured } from "./supabase";

export type EstadoPeriodo =
  | "cargando"
  | "listo"
  | "sin-config"
  | "migracion-pendiente"
  | "error";

interface PeriodoCtx {
  estado: EstadoPeriodo;
  periodos: Periodo[];
  periodo: Periodo | null;
  movimientos: Movimiento[];
  seleccionarPeriodo: (id: string) => void;
  registrarPeriodoNuevo: (p: Periodo) => void;
  cambiarIngreso: (ingreso: number) => Promise<void>;
  recargarMovimientos: () => Promise<void>;
  eliminarMovimiento: (id: string) => Promise<void>;
}

const Ctx = createContext<PeriodoCtx | null>(null);

export function usePeriodo(): PeriodoCtx {
  const c = useContext(Ctx);
  if (!c) throw new Error("usePeriodo debe usarse dentro de <PeriodoProvider>");
  return c;
}

/** Datos centrales del período (compartidos entre Inicio y Gastos). */
export function PeriodoProvider({ children }: { children: React.ReactNode }) {
  const [estado, setEstado] = useState<EstadoPeriodo>("cargando");
  const [periodos, setPeriodos] = useState<Periodo[]>([]);
  const [periodo, setPeriodo] = useState<Periodo | null>(null);
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);

  const cargarMovs = useCallback(async (p: Periodo) => {
    setMovimientos(await fetchMovimientos(p.id));
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
      setPeriodo(sel);
      setPeriodoGuardado(sel.id);
      await cargarMovs(sel);
      setEstado("listo");
    } catch {
      setEstado("migracion-pendiente");
    }
  }, [cargarMovs]);

  useEffect(() => {
    cargarTodo();
  }, [cargarTodo]);

  const aplicar = useCallback(
    async (p: Periodo) => {
      setPeriodo(p);
      setPeriodoGuardado(p.id);
      setEstado("cargando");
      try {
        await cargarMovs(p);
        setEstado("listo");
      } catch {
        setEstado("error");
      }
    },
    [cargarMovs],
  );

  const seleccionarPeriodo = useCallback(
    (id: string) => {
      const p = periodos.find((x) => x.id === id);
      if (p) aplicar(p);
    },
    [periodos, aplicar],
  );

  const registrarPeriodoNuevo = useCallback(
    (p: Periodo) => {
      setPeriodos((prev) =>
        [p, ...prev].sort((a, b) => (a.fecha_inicio < b.fecha_inicio ? 1 : -1)),
      );
      aplicar(p);
    },
    [aplicar],
  );

  const cambiarIngreso = useCallback(
    async (ingreso: number) => {
      if (!periodo) return;
      await updateIngreso(periodo.id, ingreso);
      const upd = { ...periodo, ingreso };
      setPeriodo(upd);
      setPeriodos((prev) => prev.map((p) => (p.id === upd.id ? upd : p)));
    },
    [periodo],
  );

  const recargarMovimientos = useCallback(async () => {
    if (periodo) await cargarMovs(periodo);
  }, [periodo, cargarMovs]);

  const eliminarMov = useCallback(
    async (id: string) => {
      await deleteMovimiento(id);
      if (periodo) await cargarMovs(periodo);
    },
    [periodo, cargarMovs],
  );

  return (
    <Ctx.Provider
      value={{
        estado,
        periodos,
        periodo,
        movimientos,
        seleccionarPeriodo,
        registrarPeriodoNuevo,
        cambiarIngreso,
        recargarMovimientos,
        eliminarMovimiento: eliminarMov,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
