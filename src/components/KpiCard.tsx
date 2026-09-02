import Money from "./Money";

/** Card de KPI: etiqueta chica arriba, valor monetario grande abajo. */
export default function KpiCard({
  label,
  value,
  tono = "neutro",
}: {
  label: string;
  value: number;
  tono?: "neutro" | "positivo" | "negativo";
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">
      <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
        {label}
      </p>
      <Money
        value={value}
        tono={tono}
        className="mt-1 block text-lg font-semibold"
      />
    </div>
  );
}
