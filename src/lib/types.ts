export interface Periodo {
  id: string;
  nombre: string; // "Agosto - Septiembre 2026"
  fecha_inicio: string; // ISO "YYYY-MM-DD"
  fecha_fin: string; // ISO "YYYY-MM-DD"
  ingreso: number; // guaraníes, entero
  /** Monto que se aparta para ahorrar al inicio del período (default 0). */
  ahorro_reservado: number;
  created_at: string;
}

export type NuevoPeriodo = Omit<
  Periodo,
  "id" | "created_at" | "ahorro_reservado"
> & { ahorro_reservado?: number };

export interface Movimiento {
  id: string;
  periodo_id: string | null;
  razon: string;
  concepto: string;
  categoria: string;
  subcategoria: string;
  inicial: number;
  pagado: number;
  sobrante: number;
  metodo_pago: string;
  fecha: string | null; // ISO date "YYYY-MM-DD" o null (gasto previsto sin fecha)
  /** Si true, `pagado` se deriva de la suma de movimiento_detalles (opt-in). */
  usar_detalles: boolean;
  created_at: string;
}

// Datos que el usuario carga en el formulario + el período asociado.
// `usar_detalles` no se toca desde el form de alta (default false en la DB).
export type NuevoMovimiento = Omit<
  Movimiento,
  "id" | "created_at" | "usar_detalles"
>;

// --- Detalle opcional de un movimiento (desglose de gastos) ----------------
export interface MovimientoDetalle {
  id: string;
  movimiento_id: string;
  concepto: string;
  monto: number;
  fecha: string | null;
  created_at: string;
  updated_at: string;
}

export type NuevoMovimientoDetalle = Pick<
  MovimientoDetalle,
  "movimiento_id" | "concepto" | "monto" | "fecha"
>;

export type EstadoDeuda = "pendiente" | "pagado";

export interface DeudaAFavor {
  id: string;
  persona: string;
  concepto: string;
  monto: number;
  estado: EstadoDeuda;
  periodo_id: string | null;
  created_at: string;
}

export type NuevaDeudaAFavor = Pick<
  DeudaAFavor,
  "persona" | "concepto" | "monto" | "estado"
>;

// --- Yo debo (deudas mías con otras personas; misma forma que "Me deben") ---
export type DeudaMia = Omit<DeudaAFavor, "periodo_id">;
export type NuevaDeudaMia = NuevaDeudaAFavor;

// --- Metas de ahorro (el progreso se lee del saldo vinculado) --------------
export type OrigenMeta = "fondo" | "cuenta";

export interface MetaAhorro {
  id: string;
  nombre: string;
  monto_meta: number;
  fecha_objetivo: string | null; // ISO "YYYY-MM-DD"
  origen: OrigenMeta;
  ahorro_id: string | null; // cuenta de Ahorros (si origen = "cuenta")
  archivada: boolean;
  created_at: string;
  updated_at: string;
}

export type NuevaMetaAhorro = Pick<
  MetaAhorro,
  "nombre" | "monto_meta" | "fecha_objetivo" | "origen" | "ahorro_id"
>;

// --- Fondo de emergencia (aportes + gastos; saldo = aportes - gastos) ------
export type TipoFondo = "aporte" | "gasto";

export interface FondoMovimiento {
  id: string;
  tipo: TipoFondo;
  concepto: string;
  monto: number;
  fecha: string; // ISO "YYYY-MM-DD"
  created_at: string;
  updated_at: string;
}

export type NuevoFondoMovimiento = Pick<
  FondoMovimiento,
  "tipo" | "concepto" | "monto" | "fecha"
>;

// --- Ahorros (cuentas de ahorro / inversión, saldo acumulado real) ---------
export interface Ahorro {
  id: string;
  nombre: string;
  saldo: number;
  created_at: string;
  updated_at: string;
}

export type NuevoAhorro = Pick<Ahorro, "nombre" | "saldo">;

// --- Tarjetas de crédito --------------------------------------------------
export interface TarjetaCredito {
  id: string;
  nombre: string;
  linea_credito: number;
  created_at: string;
  updated_at: string;
}

export type NuevaTarjeta = Pick<TarjetaCredito, "nombre" | "linea_credito">;

export type TipoTarjetaMovimiento = "cargo" | "descuento";

export interface TarjetaMovimiento {
  id: string;
  tarjeta_id: string;
  concepto: string;
  monto: number;
  tipo: TipoTarjetaMovimiento;
  created_at: string;
  updated_at: string;
}

export type NuevoTarjetaMovimiento = Pick<
  TarjetaMovimiento,
  "tarjeta_id" | "concepto" | "monto" | "tipo"
>;
