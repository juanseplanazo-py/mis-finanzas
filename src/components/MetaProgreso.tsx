import { aporteNecesario, estimarMeta, type MetaConProgreso } from "@/lib/analisis";
import Money from "./Money";

function mesAnio(iso: string): string {
  return new Date(iso + "T00:00:00").toLocaleDateString("es-PY", {
    month: "long",
    year: "numeric",
  });
}

/** Barra de progreso + estado de una meta (solo lectura). */
export default function MetaProgreso({
  item,
  reservado,
  finPeriodo,
}: {
  item: MetaConProgreso;
  /** Ahorro reservado por período (base para estimar cuándo se alcanza). */
  reservado: number;
  finPeriodo: string | null;
}) {
  const { meta, actual, pct, restante } = item;
  const alcanzada = meta.monto_meta > 0 && restante === 0;
  const est = finPeriodo ? estimarMeta(restante, reservado, finPeriodo) : null;
  const necesario =
    finPeriodo && meta.fecha_objetivo
      ? aporteNecesario(restante, finPeriodo, meta.fecha_objetivo)
      : null;

  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <p className="truncate text-sm font-semibold text-slate-900">
          {meta.nombre}
        </p>
        <p className="shrink-0 text-sm font-semibold text-slate-900">
          {Math.round(pct)}%
        </p>
      </div>

      <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-slate-100">
        <div
          className={`h-full rounded-full ${
            alcanzada ? "bg-green-500" : "bg-blue-600"
          }`}
          style={{ width: `${Math.min(Math.max(pct, 0), 100)}%` }}
        />
      </div>

      <p className="mt-1.5 text-xs text-slate-500">
        {actual === null ? (
          "La cuenta vinculada ya no existe."
        ) : (
          <>
            <Money value={actual} tono="tenue" className="text-xs" /> de{" "}
            <Money value={meta.monto_meta} tono="tenue" className="text-xs" />
          </>
        )}
      </p>

      <p className="mt-1 text-xs text-slate-500">
        {alcanzada ? (
          <span className="font-medium text-green-600">¡Meta alcanzada!</span>
        ) : est ? (
          <>
            Al ritmo de <Money value={reservado} tono="tenue" className="text-xs" />{" "}
            por período la alcanzás en ~{est.periodos}{" "}
            {est.periodos === 1 ? "período" : "períodos"} ({mesAnio(est.fechaISO)}).
          </>
        ) : (
          "Definí un ahorro reservado para estimar cuándo llegás."
        )}
      </p>

      {necesario !== null && meta.fecha_objetivo && !alcanzada && (
        <p className="mt-1 text-xs text-slate-500">
          Para llegar en {mesAnio(meta.fecha_objetivo)} necesitás apartar{" "}
          <Money value={necesario} tono="tenue" className="text-xs" /> por período.
        </p>
      )}
    </div>
  );
}
