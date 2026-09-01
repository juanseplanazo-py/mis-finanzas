import { formatGuaranies } from "@/lib/format";

type Tono = "neutro" | "positivo" | "negativo";

const colores: Record<Tono, string> = {
  neutro: "text-slate-900",
  positivo: "text-green-600",
  negativo: "text-red-600",
};

/** Muestra un monto en guaraníes con tono opcional. */
export default function MoneyValue({
  value,
  tono = "neutro",
  className = "",
}: {
  value: number;
  tono?: Tono;
  className?: string;
}) {
  return (
    <span className={`${colores[tono]} tabular-nums ${className}`}>
      {formatGuaranies(value)}
    </span>
  );
}
