import type {
  Movimiento,
  TarjetaMovimiento,
  DeudaAFavor,
} from "./types";

export interface ResumenPeriodo {
  ingreso: number;
  /** SUMA de Inicial de todos los movimientos del período. */
  presupuestado: number;
  /** SUMA de Pagado de todos los movimientos del período. */
  pagado: number;
  /** Presupuestado - Pagado (equivale a la SUMA de Sobrante si los datos son consistentes). */
  faltaPorGastar: number;
  /** Ingreso - Pagado. NO es lo mismo que "Falta por gastar". */
  disponibleReal: number;
}

const suma = (nums: number[]) => nums.reduce((acc, n) => acc + (n || 0), 0);

export function calcularResumen(
  movimientos: Movimiento[],
  ingreso: number,
): ResumenPeriodo {
  const presupuestado = suma(movimientos.map((m) => m.inicial));
  const pagado = suma(movimientos.map((m) => m.pagado));
  return {
    ingreso,
    presupuestado,
    pagado,
    faltaPorGastar: presupuestado - pagado,
    disponibleReal: ingreso - pagado,
  };
}

/** true si el disponible real alcanza para cubrir lo que falta por gastar. */
export function dentroDeLoPlanificado(r: ResumenPeriodo): boolean {
  return r.disponibleReal >= r.faltaPorGastar;
}

export type EstadoMovimiento = "pendiente" | "parcial" | "pagado";

/**
 * Estado implícito de un ítem del período (no se guarda en DB, se infiere):
 *  - Pagado = 0            -> "pendiente"
 *  - 0 < Pagado < Inicial  -> "parcial"
 *  - Pagado >= Inicial     -> "pagado"
 */
export function estadoMovimiento(mov: {
  inicial: number;
  pagado: number;
}): EstadoMovimiento {
  if (mov.pagado <= 0) return "pendiente";
  if (mov.pagado >= mov.inicial) return "pagado";
  return "parcial";
}

// ===== Tarjetas de crédito ===============================================

/** Deuda de una tarjeta = SUMA(cargos) - SUMA(descuentos). */
export function deudaTarjeta(
  movimientos: Pick<TarjetaMovimiento, "monto" | "tipo">[],
): number {
  return movimientos.reduce(
    (acc, m) => acc + (m.tipo === "descuento" ? -m.monto : m.monto),
    0,
  );
}

/** Disponible de una tarjeta = línea de crédito - deuda. */
export function disponibleTarjeta(linea: number, deuda: number): number {
  return linea - deuda;
}

// ===== Ahorros / Me deben ==============================================

export function totalAhorros(ahorros: { saldo: number }[]): number {
  return suma(ahorros.map((a) => a.saldo));
}

/** Total "Me deben" = SUMA(monto) de las deudas con estado "pendiente". */
export function totalMeDeben(
  deudas: Pick<DeudaAFavor, "monto" | "estado">[],
): number {
  return suma(
    deudas.filter((d) => d.estado === "pendiente").map((d) => d.monto),
  );
}

/** SUMA de los montos de un detalle de gastos. */
export function sumaDetalles(detalles: { monto: number }[]): number {
  return suma(detalles.map((d) => d.monto));
}
