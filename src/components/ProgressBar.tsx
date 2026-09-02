import Money from "./Money";

/**
 * Barra Pagado / Inicial. La barra se limita a 100% pero si hay exceso
 * se muestra en rojo y con el texto correspondiente.
 */
export default function ProgressBar({
  pagado,
  inicial,
  className = "",
}: {
  pagado: number;
  inicial: number;
  className?: string;
}) {
  if (inicial <= 0) return null;

  const ratio = pagado / inicial;
  const pct = Math.round(ratio * 100);
  const exceso = pagado > inicial;
  const ancho = Math.min(Math.max(ratio, 0), 1) * 100;

  return (
    <div className={className}>
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${exceso ? "bg-red-500" : "bg-blue-600"}`}
          style={{ width: `${ancho}%` }}
        />
      </div>
      <div className="mt-1 flex items-center justify-between text-xs text-slate-500">
        <span>
          <Money value={pagado} className="text-xs" /> /{" "}
          <Money value={inicial} className="text-xs" />
        </span>
        <span
          className={`font-medium tabular-nums ${
            exceso ? "text-red-600" : "text-slate-600"
          }`}
        >
          {pct}%{exceso ? " · excedido" : ""}
        </span>
      </div>
    </div>
  );
}
