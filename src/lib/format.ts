const MESES = [
  "Enero",
  "Febrero",
  "Marzo",
  "Abril",
  "Mayo",
  "Junio",
  "Julio",
  "Agosto",
  "Septiembre",
  "Octubre",
  "Noviembre",
  "Diciembre",
];

/** Agrupa los digitos de miles con punto: 157000 -> "157.000" */
function agruparMiles(digits: string): string {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

/** Formatea un entero como guaranies: 157000 -> "Gs. 157.000" */
export function formatGuaranies(value: number | null | undefined): string {
  const n = Math.trunc(Number(value) || 0);
  const signo = n < 0 ? "-" : "";
  return `${signo}Gs. ${agruparMiles(Math.abs(n).toString())}`;
}

/** Deja solo digitos y devuelve el entero. "Gs. 157.000" -> 157000 */
export function parseMonto(input: string): number {
  const digits = input.replace(/\D/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

/** Para mostrar mientras se escribe en el input: "157000" -> "157.000" */
export function formatMontoInput(input: string): string {
  const digits = input.replace(/\D/g, "");
  return digits ? agruparMiles(digits) : "";
}

/** "2026-08-31" -> "31/08/2026". null / vacío -> "—" */
export function formatFecha(iso: string | null | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${d}/${m}/${y}`;
}

/** Fecha de hoy en formato ISO "YYYY-MM-DD" (hora local). */
export function hoyISO(): string {
  const d = new Date();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
}

/** Periodo actual legible: "Agosto 2026" */
export function periodoActual(date: Date = new Date()): string {
  return `${MESES[date.getMonth()]} ${date.getFullYear()}`;
}

/** Suma dias a una fecha ISO y devuelve otra fecha ISO (sin zona horaria). */
export function sumarDiasISO(iso: string, dias: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1, d));
  base.setUTCDate(base.getUTCDate() + dias);
  return base.toISOString().slice(0, 10);
}

/** Suma meses a una fecha ISO (mismo dia del mes). */
export function sumarMesesISO(iso: string, meses: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const base = new Date(Date.UTC(y, m - 1 + meses, d));
  return base.toISOString().slice(0, 10);
}

/**
 * Nombre sugerido para un periodo a partir de su fecha de inicio:
 * "2026-08-25" -> "Agosto - Septiembre 2026"
 */
export function nombrePeriodoSugerido(fechaInicioISO: string): string {
  const [y, m] = fechaInicioISO.split("-").map(Number);
  const mesInicio = MESES[m - 1];
  const mesFin = MESES[m % 12];
  const anio = m === 12 ? y + 1 : y;
  return `${mesInicio} - ${mesFin} ${anio}`;
}
