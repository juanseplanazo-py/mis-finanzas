import { fetchMetas, fetchAhorros, fetchFondoMovimientos } from "./queries";
import { resumenFondo } from "./calc";
import { construirMetas, type MetaConProgreso } from "./analisis";

/**
 * Metas con su progreso actual. Si las tablas de metas/fondo todavía no
 * existen (migración pendiente) devuelve [] en vez de romper la pantalla.
 */
export async function fetchMetasConProgreso(): Promise<MetaConProgreso[]> {
  const [metas, ahorros, fondo] = await Promise.all([
    fetchMetas().catch(() => []),
    fetchAhorros().catch(() => []),
    fetchFondoMovimientos().catch(() => []),
  ]);
  return construirMetas(metas, ahorros, resumenFondo(fondo).saldo);
}
