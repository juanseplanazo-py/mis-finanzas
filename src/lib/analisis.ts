import type { Movimiento, MetaAhorro, Periodo } from "./types";
import { calcularResumen } from "./calc";
import { hoyISO, sumarMesesISO } from "./format";

// Funciones puras de la pestaña Análisis. NO modifican calc.ts ni escriben datos.

const suma = (nums: number[]) => nums.reduce((a, n) => a + (n || 0), 0);

function diasEntre(desdeISO: string, hastaISO: string): number {
  const [y1, m1, d1] = desdeISO.split("-").map(Number);
  const [y2, m2, d2] = hastaISO.split("-").map(Number);
  return Math.round(
    (Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000,
  );
}

// ===== Control del período ================================================

export type Semaforo = "verde" | "amarillo" | "rojo";

export interface ControlPeriodo {
  semaforo: Semaforo;
  /** Disponible real - Falta por gastar (misma regla que "dentro de lo planificado"). */
  margen: number;
  /** pagado / presupuestado, en %. 0 si no hay presupuesto. */
  consumidoPct: number;
  /** SUMA de lo que todavía falta pagar de cada ítem (nunca negativo por ítem). */
  pendiente: number;
  /** Cierre estimado si todo lo pendiente se paga según lo presupuestado. */
  cierreSegunPresupuesto: number;
  /** Cierre estimado si lo pendiente se desvía igual que lo ya pagado. */
  cierreAlRitmo: number;
  /** Desvío promedio de los ítems ya pagados completos (0.1 = 10% más caro). */
  tasaDesvio: number;
  diasTotales: number;
  diasTranscurridos: number;
}

export function controlPeriodo(
  movimientos: Movimiento[],
  periodo: Pick<Periodo, "ingreso" | "fecha_inicio" | "fecha_fin">,
  hoy: string = hoyISO(),
): ControlPeriodo {
  const r = calcularResumen(movimientos, periodo.ingreso);
  const margen = r.disponibleReal - r.faltaPorGastar;
  const pendiente = suma(
    movimientos.map((m) => Math.max(m.inicial - m.pagado, 0)),
  );

  const completos = movimientos.filter((m) => m.inicial > 0 && m.pagado >= m.inicial);
  const iniCompletos = suma(completos.map((m) => m.inicial));
  const tasaDesvio =
    iniCompletos > 0
      ? Math.max(suma(completos.map((m) => m.pagado)) / iniCompletos - 1, 0)
      : 0;

  let semaforo: Semaforo = "verde";
  if (margen < 0) semaforo = "rojo";
  else if (margen < 0.1 * Math.max(r.faltaPorGastar, 0)) semaforo = "amarillo";

  const diasTotales = Math.max(diasEntre(periodo.fecha_inicio, periodo.fecha_fin) + 1, 1);
  const diasTranscurridos = Math.min(
    Math.max(diasEntre(periodo.fecha_inicio, hoy) + 1, 0),
    diasTotales,
  );

  return {
    semaforo,
    margen,
    consumidoPct: r.presupuestado > 0 ? (r.pagado / r.presupuestado) * 100 : 0,
    pendiente,
    cierreSegunPresupuesto: periodo.ingreso - (r.pagado + pendiente),
    cierreAlRitmo: periodo.ingreso - (r.pagado + pendiente * (1 + tasaDesvio)),
    tasaDesvio,
    diasTotales,
    diasTranscurridos,
  };
}

// ===== ¿Por dónde se va la plata? =========================================

export interface GastoCategoria {
  nombre: string;
  total: number;
  /** % sobre el total gastado (sin contar ahorro). */
  pct: number;
}

/** Categorías con más gasto pagado. Excluye los ítems de categoría "Ahorro". */
export function topCategorias(movimientos: Movimiento[], n = 5): GastoCategoria[] {
  const porNombre = new Map<string, number>();
  for (const m of movimientos) {
    if (m.categoria === "Ahorro" || m.pagado <= 0) continue;
    const nombre = m.subcategoria?.trim() || m.razon;
    porNombre.set(nombre, (porNombre.get(nombre) ?? 0) + m.pagado);
  }
  const total = suma([...porNombre.values()]);
  return [...porNombre.entries()]
    .map(([nombre, t]) => ({ nombre, total: t, pct: total > 0 ? (t / total) * 100 : 0 }))
    .sort((a, b) => b.total - a.total)
    .slice(0, n);
}

export interface Desvio {
  nombre: string;
  exceso: number;
  /** % sobre lo presupuestado; null si el ítem no tenía presupuesto. */
  pct: number | null;
}

/** Ítems donde se pagó más de lo presupuestado, de mayor a menor exceso. */
export function mayoresDesvios(movimientos: Movimiento[], n = 5): Desvio[] {
  return movimientos
    .filter((m) => m.categoria !== "Ahorro" && m.pagado > m.inicial)
    .map((m) => ({
      nombre: m.concepto ? `${m.razon} · ${m.concepto}` : m.razon,
      exceso: m.pagado - m.inicial,
      pct: m.inicial > 0 ? ((m.pagado - m.inicial) / m.inicial) * 100 : null,
    }))
    .sort((a, b) => b.exceso - a.exceso)
    .slice(0, n);
}

// ===== Patrimonio líquido =================================================

/** Disponible real + ahorros - deuda de tarjetas + me deben - yo debo. */
export function patrimonioLiquido(p: {
  disponibleReal: number;
  ahorros: number;
  deudaTarjetas: number;
  meDeben: number;
  yoDebo: number;
}): number {
  return p.disponibleReal + p.ahorros - p.deudaTarjetas + p.meDeben - p.yoDebo;
}

// ===== Metas de ahorro ====================================================

export interface MetaConProgreso {
  meta: MetaAhorro;
  /** Saldo actual de lo vinculado. null si la cuenta vinculada ya no existe. */
  actual: number | null;
  /** Avance en % (sin tope; >100 si se superó la meta). */
  pct: number;
  restante: number;
}

export function construirMetas(
  metas: MetaAhorro[],
  ahorros: { id: string; saldo: number }[],
  saldoFondo: number,
): MetaConProgreso[] {
  return metas.map((meta) => {
    const actual =
      meta.origen === "fondo"
        ? saldoFondo
        : (ahorros.find((a) => a.id === meta.ahorro_id)?.saldo ?? null);
    const base = actual ?? 0;
    return {
      meta,
      actual,
      pct: meta.monto_meta > 0 ? (base / meta.monto_meta) * 100 : 0,
      restante: Math.max(meta.monto_meta - base, 0),
    };
  });
}

export interface EstimacionMeta {
  /** Cantidad de períodos (de ~1 mes) que faltan al ritmo del ahorro reservado. */
  periodos: number;
  fechaISO: string;
}

/** Cuándo se alcanza la meta si cada período se aparta `reservado`. */
export function estimarMeta(
  restante: number,
  reservado: number,
  finPeriodoISO: string,
): EstimacionMeta | null {
  if (restante <= 0 || reservado <= 0) return null;
  const periodos = Math.ceil(restante / reservado);
  return { periodos, fechaISO: sumarMesesISO(finPeriodoISO, periodos) };
}

/** Cuánto habría que apartar por período para llegar a la fecha objetivo. */
export function aporteNecesario(
  restante: number,
  finPeriodoISO: string,
  objetivoISO: string,
): number | null {
  if (restante <= 0) return null;
  const dias = diasEntre(finPeriodoISO, objetivoISO);
  if (dias <= 0) return null;
  return Math.ceil(restante / Math.max(Math.ceil(dias / 30), 1));
}
