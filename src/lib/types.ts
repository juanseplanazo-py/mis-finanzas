export interface Periodo {
  id: string;
  nombre: string; // "Agosto - Septiembre 2026"
  fecha_inicio: string; // ISO "YYYY-MM-DD"
  fecha_fin: string; // ISO "YYYY-MM-DD"
  ingreso: number; // guaraníes, entero
  created_at: string;
}

export type NuevoPeriodo = Omit<Periodo, "id" | "created_at">;

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
  created_at: string;
}

// Datos que el usuario carga en el formulario + el período asociado.
export type NuevoMovimiento = Omit<Movimiento, "id" | "created_at">;

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
