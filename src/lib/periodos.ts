import type { Periodo } from "./types";
import { hoyISO } from "./format";

const LS_KEY = "mf_periodo_id";

export function getPeriodoGuardado(): string | null {
  try {
    return localStorage.getItem(LS_KEY);
  } catch {
    return null;
  }
}

export function setPeriodoGuardado(id: string): void {
  try {
    localStorage.setItem(LS_KEY, id);
  } catch {
    /* private mode / storage bloqueado: se ignora */
  }
}

/** Período cuyo rango contiene la fecha de hoy; si no hay, el más reciente. */
export function resolverPeriodoActual(periodos: Periodo[]): Periodo | null {
  if (periodos.length === 0) return null;
  const hoy = hoyISO();
  const enCurso = periodos.find(
    (p) => p.fecha_inicio <= hoy && hoy <= p.fecha_fin,
  );
  if (enCurso) return enCurso;
  return [...periodos].sort((a, b) =>
    a.fecha_inicio < b.fecha_inicio ? 1 : -1,
  )[0];
}

/** Período guardado en localStorage si sigue existiendo; si no, el actual por fecha. */
export function resolverSeleccionado(periodos: Periodo[]): Periodo | null {
  const guardadoId = getPeriodoGuardado();
  const guardado = guardadoId
    ? periodos.find((p) => p.id === guardadoId)
    : undefined;
  return guardado ?? resolverPeriodoActual(periodos);
}
