import { supabase } from "./supabase";
import type {
  Periodo,
  NuevoPeriodo,
  Movimiento,
  NuevoMovimiento,
  MovimientoDetalle,
  NuevoMovimientoDetalle,
  DeudaAFavor,
  NuevaDeudaAFavor,
  Ahorro,
  NuevoAhorro,
  TarjetaCredito,
  NuevaTarjeta,
  TarjetaMovimiento,
  NuevoTarjetaMovimiento,
} from "./types";

// ===== Períodos ============================================================

export async function fetchPeriodos(): Promise<Periodo[]> {
  const { data, error } = await supabase
    .from("periodos")
    .select("*")
    .order("fecha_inicio", { ascending: false });
  if (error) throw error;
  return (data as Periodo[]) ?? [];
}

export async function updateIngreso(
  periodoId: string,
  ingreso: number,
): Promise<void> {
  const { error } = await supabase
    .from("periodos")
    .update({ ingreso })
    .eq("id", periodoId);
  if (error) throw error;
}

export async function insertPeriodo(p: NuevoPeriodo): Promise<Periodo> {
  const { data, error } = await supabase
    .from("periodos")
    .insert(p)
    .select()
    .single();
  if (error) throw error;
  return data as Periodo;
}

// ===== Movimientos ========================================================

export async function fetchMovimientos(periodoId: string): Promise<Movimiento[]> {
  const { data, error } = await supabase
    .from("movimientos")
    .select("*")
    .eq("periodo_id", periodoId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true }); // desempate estable
  if (error) throw error;
  return (data as Movimiento[]) ?? [];
}

export async function fetchMovimiento(id: string): Promise<Movimiento | null> {
  const { data, error } = await supabase
    .from("movimientos")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return (data as Movimiento) ?? null;
}

/** Campos editables de un movimiento (los 8 del formulario + el sobrante calculado). */
export type CamposMovimiento = Pick<
  Movimiento,
  | "razon"
  | "concepto"
  | "categoria"
  | "subcategoria"
  | "inicial"
  | "pagado"
  | "sobrante"
  | "metodo_pago"
  | "fecha"
>;

export async function insertMovimiento(
  mov: NuevoMovimiento,
): Promise<Movimiento> {
  const { data, error } = await supabase
    .from("movimientos")
    .insert(mov)
    .select()
    .single();
  if (error) throw error;
  return data as Movimiento;
}

/** Actualiza la MISMA fila. No crea una nueva. No toca periodo_id. */
export async function updateMovimiento(
  id: string,
  campos: CamposMovimiento,
): Promise<void> {
  const { error } = await supabase
    .from("movimientos")
    .update(campos)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteMovimiento(id: string): Promise<void> {
  const { error } = await supabase.from("movimientos").delete().eq("id", id);
  if (error) throw error;
}

// ===== Detalle de gastos (movimiento_detalles) ===========================

export async function fetchDetalles(
  movimientoId: string,
): Promise<MovimientoDetalle[]> {
  const { data, error } = await supabase
    .from("movimiento_detalles")
    .select("*")
    .eq("movimiento_id", movimientoId)
    .order("created_at", { ascending: true })
    .order("id", { ascending: true });
  if (error) throw error;
  return (data as MovimientoDetalle[]) ?? [];
}

export async function insertDetalle(d: NuevoMovimientoDetalle): Promise<void> {
  const { error } = await supabase.from("movimiento_detalles").insert(d);
  if (error) throw error;
}

export type CamposDetalle = Pick<
  MovimientoDetalle,
  "concepto" | "monto" | "fecha"
>;

export async function updateDetalle(
  id: string,
  campos: CamposDetalle,
): Promise<void> {
  const { error } = await supabase
    .from("movimiento_detalles")
    .update(campos)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteDetalle(id: string): Promise<void> {
  const { error } = await supabase
    .from("movimiento_detalles")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

/**
 * Activa/desactiva el modo detallado de un movimiento.
 * Al activar, `pagado` pasa a `nuevoPagado` (= suma de detalles) — decisión explícita.
 * Al desactivar, `pagado` queda como está (se pasa el valor actual).
 */
export async function setUsarDetalles(
  movimientoId: string,
  usar: boolean,
  pagado: number,
  sobrante: number,
): Promise<void> {
  const { error } = await supabase
    .from("movimientos")
    .update({ usar_detalles: usar, pagado, sobrante })
    .eq("id", movimientoId);
  if (error) throw error;
}

/** Escribe pagado/sobrante derivados (para movimientos con usar_detalles=true). */
export async function guardarPagadoDerivado(
  movimientoId: string,
  pagado: number,
  sobrante: number,
): Promise<void> {
  const { error } = await supabase
    .from("movimientos")
    .update({ pagado, sobrante })
    .eq("id", movimientoId);
  if (error) throw error;
}

// ===== Ahorros ============================================================

export async function fetchAhorros(): Promise<Ahorro[]> {
  const { data, error } = await supabase
    .from("ahorros")
    .select("*")
    .order("nombre", { ascending: true });
  if (error) throw error;
  return (data as Ahorro[]) ?? [];
}

export async function insertAhorro(a: NuevoAhorro): Promise<void> {
  const { error } = await supabase.from("ahorros").insert(a);
  if (error) throw error;
}

export async function updateAhorro(id: string, a: NuevoAhorro): Promise<void> {
  const { error } = await supabase.from("ahorros").update(a).eq("id", id);
  if (error) throw error;
}

export async function deleteAhorro(id: string): Promise<void> {
  const { error } = await supabase.from("ahorros").delete().eq("id", id);
  if (error) throw error;
}

// ===== Tarjetas de crédito ===============================================

export async function fetchTarjetas(): Promise<TarjetaCredito[]> {
  const { data, error } = await supabase
    .from("tarjetas_credito")
    .select("*")
    .order("nombre", { ascending: true });
  if (error) throw error;
  return (data as TarjetaCredito[]) ?? [];
}

export async function insertTarjeta(t: NuevaTarjeta): Promise<void> {
  const { error } = await supabase.from("tarjetas_credito").insert(t);
  if (error) throw error;
}

export async function updateTarjeta(id: string, t: NuevaTarjeta): Promise<void> {
  const { error } = await supabase
    .from("tarjetas_credito")
    .update(t)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteTarjeta(id: string): Promise<void> {
  // Los conceptos asociados se borran por FK (on delete cascade).
  const { error } = await supabase
    .from("tarjetas_credito")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ===== Conceptos de tarjeta =============================================

export async function fetchTarjetaMovimientos(): Promise<TarjetaMovimiento[]> {
  const { data, error } = await supabase
    .from("tarjeta_movimientos")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as TarjetaMovimiento[]) ?? [];
}

export async function insertTarjetaMovimiento(
  m: NuevoTarjetaMovimiento,
): Promise<void> {
  const { error } = await supabase.from("tarjeta_movimientos").insert(m);
  if (error) throw error;
}

export type CamposTarjetaMovimiento = Pick<
  TarjetaMovimiento,
  "concepto" | "monto" | "tipo"
>;

export async function updateTarjetaMovimiento(
  id: string,
  m: CamposTarjetaMovimiento,
): Promise<void> {
  const { error } = await supabase
    .from("tarjeta_movimientos")
    .update(m)
    .eq("id", id);
  if (error) throw error;
}

export async function deleteTarjetaMovimiento(id: string): Promise<void> {
  const { error } = await supabase
    .from("tarjeta_movimientos")
    .delete()
    .eq("id", id);
  if (error) throw error;
}

// ===== Me deben (deudas a favor) =========================================

export async function fetchDeudas(): Promise<DeudaAFavor[]> {
  const { data, error } = await supabase
    .from("deudas_a_favor")
    .select("*")
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data as DeudaAFavor[]) ?? [];
}

export async function insertDeuda(d: NuevaDeudaAFavor): Promise<void> {
  const { error } = await supabase.from("deudas_a_favor").insert(d);
  if (error) throw error;
}

export async function updateDeuda(
  id: string,
  d: NuevaDeudaAFavor,
): Promise<void> {
  const { error } = await supabase.from("deudas_a_favor").update(d).eq("id", id);
  if (error) throw error;
}

export async function deleteDeuda(id: string): Promise<void> {
  const { error } = await supabase.from("deudas_a_favor").delete().eq("id", id);
  if (error) throw error;
}
