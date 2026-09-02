"use client";

import { usePrivacy } from "@/lib/privacy-context";
import { formatGuaranies } from "@/lib/format";

type Tono = "neutro" | "positivo" | "negativo" | "tenue";

const colores: Record<Tono, string> = {
  neutro: "text-slate-900",
  positivo: "text-green-600",
  negativo: "text-red-600",
  tenue: "text-slate-400",
};

/**
 * Muestra un monto en guaraníes. Con el modo privacidad activo -> "Gs. ••••••".
 */
export default function Money({
  value,
  tono = "neutro",
  className = "",
}: {
  value: number;
  tono?: Tono;
  className?: string;
}) {
  const { oculto } = usePrivacy();
  return (
    <span className={`tabular-nums ${colores[tono]} ${className}`}>
      {oculto ? "Gs. ••••••" : formatGuaranies(value)}
    </span>
  );
}
